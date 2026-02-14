import type { GameState, GameAction } from '../types.js';
import { GameActionType, ToolType, InputMode, WeatherType, PlantStage, BirdType } from '../types.js';
import { Renderer } from '../render/renderer.js';
import { RENDER_INTERVAL_MS, GROWTH_TICK_MS, JUMP_DISTANCE, WATER_DECAY_PER_TICK, BARE_WATER_DECAY_PER_TICK, MESSAGE_DURATION_TICKS, RIVER_WATER_RADIUS, RIVER_WATER_AMOUNT, WATER_MAX, WEATHER_MIN_DURATION, WEATHER_MAX_DURATION, WEATHER_TRANSITION_TICKS, RAIN_WATER_PER_TICK, NIGHT_GROWTH_PENALTY, DAY_DURATION_TICKS, NIGHT_DURATION_TICKS } from '../constants.js';
import { clampPosition } from './grid.js';
import { growPlant } from './plant.js';
import { useTool, useToolOnArea } from './tools.js';
import { SEED_ORDER, getSpecies, PLANT_SPECIES } from '../data/plants.js';
import { propagationTick, waterDonationTick, specialPropagationTick } from './propagation.js';
import { birdTick, birdFlyTick, startDialog, advanceDialog, selectDialogOption, exitDialog, getBirdAtPosition, forceBirdSpawn } from './birds.js';
import type { AudioSystem } from '../audio/audioSystem.js';
import { yankSelection, pasteClipboard, deletePlants, deletePlantAtCursor, findChar, terraform } from './magic.js';
import { saveGame } from './save.js';

export class GameLoop {
  private renderTimer: ReturnType<typeof setInterval> | null = null;
  private growthTimer: ReturnType<typeof setInterval> | null = null;
  private renderer: Renderer;
  private state: GameState;
  private onQuit: () => void;
  private audioSystem: AudioSystem | null;

  constructor(state: GameState, onQuit: () => void, viewRows?: number, viewCols?: number, audioSystem?: AudioSystem) {
    this.state = state;
    this.onQuit = onQuit;
    this.audioSystem = audioSystem ?? null;
    this.renderer = new Renderer(viewRows ?? state.gridRows, viewCols ?? state.gridCols);
  }

  start(): void {
    // Initial render
    this.renderer.render(this.state);

    // Render loop at 20fps
    this.renderTimer = setInterval(() => {
      const landed = birdFlyTick(this.state);
      if (this.audioSystem && landed.length > 0) {
        for (const birdType of landed) {
          this.audioSystem.playChirp(birdType);
        }
      }
      this.audioSystem?.tick(this.state);
      this.renderer.render(this.state);
    }, RENDER_INTERVAL_MS);

    // Growth tick every 3s
    this.growthTimer = setInterval(() => {
      this.growthTick();
    }, GROWTH_TICK_MS);
  }

  stop(): void {
    if (this.renderTimer) {
      clearInterval(this.renderTimer);
      this.renderTimer = null;
    }
    if (this.growthTimer) {
      clearInterval(this.growthTimer);
      this.growthTimer = null;
    }
  }

  processActions(actions: GameAction[]): void {
    for (const action of actions) {
      this.processAction(action);
    }
  }

  private processAction(action: GameAction): void {
    const s = this.state;

    switch (action.type) {
      case GameActionType.Quit:
        this.stop();
        this.onQuit();
        return;

      case GameActionType.MoveUp:
        s.cursor = clampPosition(s, { row: s.cursor.row - 1, col: s.cursor.col });
        if (s.mode === InputMode.Visual && s.selection) {
          s.selection.cursor = { ...s.cursor };
        }
        break;

      case GameActionType.MoveDown:
        s.cursor = clampPosition(s, { row: s.cursor.row + 1, col: s.cursor.col });
        if (s.mode === InputMode.Visual && s.selection) {
          s.selection.cursor = { ...s.cursor };
        }
        break;

      case GameActionType.MoveLeft:
        s.cursor = clampPosition(s, { row: s.cursor.row, col: s.cursor.col - 1 });
        if (s.mode === InputMode.Visual && s.selection) {
          s.selection.cursor = { ...s.cursor };
        }
        break;

      case GameActionType.MoveRight:
        s.cursor = clampPosition(s, { row: s.cursor.row, col: s.cursor.col + 1 });
        if (s.mode === InputMode.Visual && s.selection) {
          s.selection.cursor = { ...s.cursor };
        }
        break;

      case GameActionType.JumpRight:
        s.cursor = clampPosition(s, { row: s.cursor.row, col: s.cursor.col + JUMP_DISTANCE });
        if (s.mode === InputMode.Visual && s.selection) {
          s.selection.cursor = { ...s.cursor };
        }
        break;

      case GameActionType.JumpLeft:
        s.cursor = clampPosition(s, { row: s.cursor.row, col: s.cursor.col - JUMP_DISTANCE });
        if (s.mode === InputMode.Visual && s.selection) {
          s.selection.cursor = { ...s.cursor };
        }
        break;

      case GameActionType.UseTool: {
        const prevMsg = s.message;
        useTool(s, s.cursor);
        if (s.message !== prevMsg) {
          this.audioSystem?.playSfx(s.tool);
        }
        break;
      }

      case GameActionType.UseToolOnSelection:
        if (s.selection) {
          const sel = s.selection;
          const minR = Math.min(sel.anchor.row, sel.cursor.row);
          const maxR = Math.max(sel.anchor.row, sel.cursor.row);
          const minC = Math.min(sel.anchor.col, sel.cursor.col);
          const maxC = Math.max(sel.anchor.col, sel.cursor.col);
          useToolOnArea(s, minR, maxR, minC, maxC);
          this.audioSystem?.playSfx(s.tool);
          // Exit visual mode after applying
          s.mode = InputMode.Normal;
          s.selection = null;
        }
        break;

      case GameActionType.CycleTool: {
        const tools = [ToolType.Plant, ToolType.Water, ToolType.Harvest];
        const idx = tools.indexOf(s.tool);
        s.tool = tools[(idx + 1) % tools.length];
        break;
      }

      case GameActionType.SelectTool1:
        s.tool = ToolType.Plant;
        break;

      case GameActionType.SelectTool2:
        s.tool = ToolType.Water;
        break;

      case GameActionType.SelectTool3:
        s.tool = ToolType.Harvest;
        break;

      case GameActionType.CycleSeed: {
        // Build available seed list from inventory (count > 0)
        const available: string[] = [];
        // Start with SEED_ORDER (base + special), then add any hybrid IDs
        const allKnown = [...SEED_ORDER];
        for (const id of Object.keys(s.inventory.seeds)) {
          if (!allKnown.includes(id)) allKnown.push(id);
        }
        for (const id of allKnown) {
          if ((s.inventory.seeds[id] || 0) > 0) available.push(id);
        }
        if (available.length === 0) {
          s.message = 'No seeds!';
          s.messageExpiry = s.tickCount + MESSAGE_DURATION_TICKS;
          break;
        }
        const idx = available.indexOf(s.selectedSeed);
        s.selectedSeed = available[(idx + 1) % available.length];
        const species = getSpecies(s.selectedSeed);
        s.message = `Seed: ${species?.hanzi || ''} ${species?.name || ''}`;
        s.messageExpiry = s.tickCount + MESSAGE_DURATION_TICKS;
        break;
      }

      case GameActionType.EnterVisual:
        s.mode = InputMode.Visual;
        s.selection = {
          anchor: { ...s.cursor },
          cursor: { ...s.cursor },
        };
        break;

      case GameActionType.ExitVisual:
        s.mode = InputMode.Normal;
        s.selection = null;
        break;

      case GameActionType.EnterCommand:
        s.mode = InputMode.Command;
        s.commandBuffer = '';
        break;

      case GameActionType.ExitCommand:
        s.mode = InputMode.Normal;
        s.commandBuffer = '';
        break;

      case GameActionType.UpdateCommand:
        s.commandBuffer = (action.payload as string) || '';
        break;

      case GameActionType.ToggleHelp:
        if (!s.showHelp) {
          s.showHelp = true;
          s.mode = InputMode.Help;
          s.helpScroll = 0;
        } else {
          s.showHelp = false;
          s.mode = InputMode.Normal;
        }
        break;

      case GameActionType.HelpScrollUp:
        s.helpScroll = Math.max(0, s.helpScroll - 1);
        break;

      case GameActionType.HelpScrollDown:
        // Max is set dynamically during render; just increment here (renderer clamps)
        s.helpScroll++;
        break;

      case GameActionType.HelpExit:
        s.showHelp = false;
        s.mode = InputMode.Normal;
        break;

      case GameActionType.Talk: {
        const bird = getBirdAtPosition(s, s.cursor.row, s.cursor.col);
        if (bird && startDialog(s, bird.id)) {
          this.audioSystem?.playChirp(bird.type);
        }
        break;
      }

      case GameActionType.DialogAdvance:
        advanceDialog(s);
        break;

      case GameActionType.DialogSelect1:
        selectDialogOption(s, 0);
        break;

      case GameActionType.DialogSelect2:
        selectDialogOption(s, 1);
        break;

      case GameActionType.DialogSelect3:
        selectDialogOption(s, 2);
        break;

      case GameActionType.DialogExit:
        exitDialog(s);
        break;

      case GameActionType.DialogScrollUp:
        s.dialog.pinyinScroll = Math.max(0, s.dialog.pinyinScroll - 1);
        break;

      case GameActionType.DialogScrollDown:
        s.dialog.pinyinScroll++;
        break;

      case GameActionType.Yank: {
        const count = yankSelection(s);
        if (count > 0) {
          s.message = `Yanked ${count} plant${count > 1 ? 's' : ''}`;
          s.messageExpiry = s.tickCount + MESSAGE_DURATION_TICKS;
        }
        s.mode = InputMode.Normal;
        break;
      }

      case GameActionType.Paste: {
        const count = pasteClipboard(s);
        if (count > 0) {
          s.message = `Pasted ${count} plant${count > 1 ? 's' : ''}`;
          s.messageExpiry = s.tickCount + MESSAGE_DURATION_TICKS;
        } else if (!s.clipboard) {
          s.message = 'Nothing to paste';
          s.messageExpiry = s.tickCount + MESSAGE_DURATION_TICKS;
        }
        break;
      }

      case GameActionType.DeletePlants: {
        const count = deletePlants(s);
        if (count > 0) {
          s.message = `Harvested ${count} plant${count > 1 ? 's' : ''} → seeds`;
          s.messageExpiry = s.tickCount + MESSAGE_DURATION_TICKS;
        }
        s.mode = InputMode.Normal;
        break;
      }

      case GameActionType.DeletePlantAtCursor: {
        const ok = deletePlantAtCursor(s);
        if (ok) {
          s.message = 'Plant removed → +1 seed';
          s.messageExpiry = s.tickCount + MESSAGE_DURATION_TICKS;
        }
        break;
      }

      case GameActionType.FindChar: {
        const ch = action.payload as string;
        if (!findChar(s, ch)) {
          s.message = `'${ch}' not found`;
          s.messageExpiry = s.tickCount + MESSAGE_DURATION_TICKS;
        }
        break;
      }

      case GameActionType.JumpTop:
        s.cursor = clampPosition(s, { row: 0, col: s.cursor.col });
        break;

      case GameActionType.JumpBottom:
        s.cursor = clampPosition(s, { row: s.gridRows - 1, col: s.cursor.col });
        break;

      case GameActionType.OpenLog:
        s.mode = InputMode.Log;
        s.logScroll = 0;
        break;

      case GameActionType.LogScrollDown:
        s.logScroll = Math.min(s.logScroll + 1, Math.max(0, s.dialogLog.length - 1));
        break;

      case GameActionType.LogScrollUp:
        s.logScroll = Math.max(0, s.logScroll - 1);
        break;

      case GameActionType.LogExit:
        s.mode = InputMode.Normal;
        break;

      case GameActionType.ExecuteCommand:
        this.handleExecuteCommand(s, action.payload as Record<string, string>);
        break;
    }
  }

  private handleExecuteCommand(s: GameState, payload: Record<string, string>): void {
    const { command } = payload;

    switch (command) {
      case 'save': {
        const ok = saveGame(s);
        s.message = ok ? 'Game saved' : 'Save failed';
        s.messageExpiry = s.tickCount + MESSAGE_DURATION_TICKS;
        break;
      }

      case 'tool': {
        const arg = payload.arg;
        const toolMap: Record<string, ToolType> = {
          plant: ToolType.Plant, p: ToolType.Plant,
          water: ToolType.Water, w: ToolType.Water,
          harvest: ToolType.Harvest, h: ToolType.Harvest,
        };
        const tool = toolMap[arg];
        if (tool) {
          s.tool = tool;
          s.message = `Tool: ${tool}`;
          s.messageExpiry = s.tickCount + MESSAGE_DURATION_TICKS;
        } else {
          s.message = `Unknown tool: ${arg}`;
          s.messageExpiry = s.tickCount + MESSAGE_DURATION_TICKS;
        }
        break;
      }

      case 'seed': {
        const arg = payload.arg;
        // Find species by name or id
        let found: string | null = null;
        for (const [id, species] of Object.entries(PLANT_SPECIES)) {
          if (id === arg || species.name.toLowerCase() === arg.toLowerCase()) {
            found = id;
            break;
          }
        }
        if (found) {
          s.selectedSeed = found;
          s.tool = ToolType.Plant;
          const species = getSpecies(found);
          s.message = `Seed: ${species?.hanzi || ''} ${species?.name || found}`;
          s.messageExpiry = s.tickCount + MESSAGE_DURATION_TICKS;
        } else {
          s.message = `Unknown seed: ${arg}`;
          s.messageExpiry = s.tickCount + MESSAGE_DURATION_TICKS;
        }
        break;
      }

      case 'summon': {
        const arg = payload.arg.toLowerCase();
        const birdMap: Record<string, BirdType> = {
          robin: BirdType.Robin,
          sparrow: BirdType.Sparrow,
          duck: BirdType.Duck,
          goose: BirdType.Goose,
        };
        const birdType = birdMap[arg];
        if (birdType !== undefined) {
          forceBirdSpawn(s, birdType);
          s.message = `Summoned ${arg}`;
          s.messageExpiry = s.tickCount + MESSAGE_DURATION_TICKS;
        } else {
          s.message = `Unknown bird: ${arg}`;
          s.messageExpiry = s.tickCount + MESSAGE_DURATION_TICKS;
        }
        break;
      }

      case 'weather': {
        const arg = payload.arg.toLowerCase();
        const weatherMap: Record<string, WeatherType> = {
          neutral: WeatherType.Neutral, calm: WeatherType.Neutral,
          clear: WeatherType.Clear, sun: WeatherType.Clear, sunny: WeatherType.Clear,
          cloudy: WeatherType.Cloudy, cloud: WeatherType.Cloudy,
          rain: WeatherType.Rain, rainy: WeatherType.Rain,
          wind: WeatherType.Wind, windy: WeatherType.Wind,
        };
        const weather = weatherMap[arg];
        if (weather !== undefined) {
          s.weather.current = weather;
          s.weather.ticksInState = 0;
          s.weather.intensity = 1.0;
          s.message = `Weather: ${weather}`;
          s.messageExpiry = s.tickCount + MESSAGE_DURATION_TICKS;
        } else {
          s.message = `Unknown weather: ${arg}`;
          s.messageExpiry = s.tickCount + MESSAGE_DURATION_TICKS;
        }
        break;
      }

      case 'play': {
        const arg = payload.arg.toLowerCase();
        const birdSounds: Record<string, BirdType> = {
          robin: BirdType.Robin,
          sparrow: BirdType.Sparrow,
          duck: BirdType.Duck,
          goose: BirdType.Goose,
        };
        const birdType = birdSounds[arg];
        if (birdType !== undefined) {
          this.audioSystem?.playChirp(birdType);
          s.message = `Playing: ${arg}`;
          s.messageExpiry = s.tickCount + MESSAGE_DURATION_TICKS;
        } else {
          this.audioSystem?.playSfx(arg);
          s.message = `Playing: ${arg}`;
          s.messageExpiry = s.tickCount + MESSAGE_DURATION_TICKS;
        }
        break;
      }

      case 'terraform':
        terraform(s);
        s.message = s.grid[s.cursor.row][s.cursor.col].river ? 'Terraformed → river' : 'Terraformed → land';
        s.messageExpiry = s.tickCount + MESSAGE_DURATION_TICKS;
        break;

      case 'expand': {
        const dir = payload.dir;
        const amount = parseInt(payload.amount || '1', 10) || 1;
        this.expandGrid(s, dir, amount);
        break;
      }
    }
  }

  private expandGrid(s: GameState, dir: string, amount: number): void {
    switch (dir) {
      case 'n': {
        // Add rows to top
        for (let i = 0; i < amount; i++) {
          const row = Array.from({ length: s.gridCols }, () => ({
            waterLevel: 0, plant: null, river: false, wildChar: null,
          }));
          s.grid.unshift(row);
        }
        s.gridRows += amount;
        s.cursor.row += amount;
        break;
      }
      case 's': {
        // Add rows to bottom
        for (let i = 0; i < amount; i++) {
          const row = Array.from({ length: s.gridCols }, () => ({
            waterLevel: 0, plant: null, river: false, wildChar: null,
          }));
          s.grid.push(row);
        }
        s.gridRows += amount;
        break;
      }
      case 'e': {
        // Add columns to right
        for (const row of s.grid) {
          for (let i = 0; i < amount; i++) {
            row.push({ waterLevel: 0, plant: null, river: false, wildChar: null });
          }
        }
        s.gridCols += amount;
        break;
      }
      case 'w': {
        // Add columns to left
        for (const row of s.grid) {
          for (let i = 0; i < amount; i++) {
            row.unshift({ waterLevel: 0, plant: null, river: false, wildChar: null });
          }
        }
        s.gridCols += amount;
        s.cursor.col += amount;
        break;
      }
      default:
        s.message = `Unknown direction: ${dir}`;
        s.messageExpiry = s.tickCount + MESSAGE_DURATION_TICKS;
        return;
    }
    s.message = `Expanded ${dir} by ${amount}`;
    s.messageExpiry = s.tickCount + MESSAGE_DURATION_TICKS;
    this.renderer.resize(s.gridRows, s.gridCols);
  }

  private nextWeatherState(current: WeatherType): WeatherType {
    if (current === WeatherType.Neutral) {
      const roll = Math.random();
      if (roll < 0.25) return WeatherType.Clear;
      if (roll < 0.5) return WeatherType.Cloudy;
      if (roll < 0.75) return WeatherType.Rain;
      return WeatherType.Wind;
    }
    return WeatherType.Neutral;
  }

  private weatherTick(): void {
    const w = this.state.weather;

    // Advance ticks in current state
    w.ticksInState++;

    // Intensity ramp: first TRANSITION ticks ramp up, last TRANSITION ramp down
    const ticksLeft = w.stateDuration - w.ticksInState;
    if (w.ticksInState <= WEATHER_TRANSITION_TICKS) {
      w.intensity = Math.min(1, w.ticksInState / WEATHER_TRANSITION_TICKS);
    } else if (ticksLeft <= WEATHER_TRANSITION_TICKS) {
      w.intensity = Math.max(0, ticksLeft / WEATHER_TRANSITION_TICKS);
    } else {
      w.intensity = 1.0;
    }

    // Transition to next state
    if (w.ticksInState >= w.stateDuration) {
      w.current = this.nextWeatherState(w.current);
      w.ticksInState = 0;
      w.stateDuration = WEATHER_MIN_DURATION + Math.floor(Math.random() * (WEATHER_MAX_DURATION - WEATHER_MIN_DURATION + 1));
      w.intensity = 0;
    }

    // Day/night cycle
    w.dayNightTimer++;
    if (w.isNight) {
      w.nightPhase = Math.min(1, w.dayNightTimer / 3); // ramp to full night over 3 ticks
      if (w.dayNightTimer >= NIGHT_DURATION_TICKS) {
        w.isNight = false;
        w.dayNightTimer = 0;
      }
    } else {
      // Dawn ramp-down: nightPhase fades out over first 3 ticks of day
      if (w.dayNightTimer <= 3) {
        w.nightPhase = Math.max(0, 1 - w.dayNightTimer / 3);
      } else {
        w.nightPhase = 0;
      }
      if (w.dayNightTimer >= DAY_DURATION_TICKS) {
        w.isNight = true;
        w.dayNightTimer = 0;
      }
    }

    // Rain effect: water all non-river cells
    if (w.current === WeatherType.Rain) {
      const waterAdd = Math.round(RAIN_WATER_PER_TICK * w.intensity);
      if (waterAdd > 0) {
        const s = this.state;
        for (let r = 0; r < s.gridRows; r++) {
          for (let c = 0; c < s.gridCols; c++) {
            const cell = s.grid[r][c];
            if (!cell.river) {
              cell.waterLevel = Math.min(WATER_MAX, cell.waterLevel + waterAdd);
            }
          }
        }
      }
    }
  }

  private growthTick(): void {
    const s = this.state;
    s.tickCount++;

    // Weather update
    this.weatherTick();

    // Clear expired messages
    if (s.message && s.tickCount >= s.messageExpiry) {
      s.message = '';
    }

    // River irrigation: water tiles near river
    for (let r = 0; r < s.gridRows; r++) {
      for (let c = 0; c < s.gridCols; c++) {
        if (!s.grid[r][c].river) continue;
        // Keep river cells fully watered
        s.grid[r][c].waterLevel = 100;
        // Water nearby soil cells
        for (let dr = -RIVER_WATER_RADIUS; dr <= RIVER_WATER_RADIUS; dr++) {
          for (let dc = -RIVER_WATER_RADIUS; dc <= RIVER_WATER_RADIUS; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < s.gridRows && nc >= 0 && nc < s.gridCols) {
              const neighbor = s.grid[nr][nc];
              if (!neighbor.river) {
                neighbor.waterLevel = Math.min(WATER_MAX, neighbor.waterLevel + RIVER_WATER_AMOUNT);
              }
            }
          }
        }
      }
    }

    // Process each cell
    for (let r = 0; r < s.gridRows; r++) {
      for (let c = 0; c < s.gridCols; c++) {
        const cell = s.grid[r][c];

        // Water decay (skip river cells — they stay full)
        // Bare ground dries faster than planted ground
        if (cell.waterLevel > 0 && !cell.river) {
          const decay = cell.plant ? WATER_DECAY_PER_TICK : BARE_WATER_DECAY_PER_TICK;
          cell.waterLevel = Math.max(0, cell.waterLevel - decay);
        }

        // Plant growth (night slows growth — skip half the ticks)
        if (cell.plant) {
          const skipGrowth = s.weather.isNight && s.weather.nightPhase > 0.5 && s.tickCount % 2 === 0;
          if (!skipGrowth) {
            // Moss requires an adjacent tree (stage >= Mature) to grow
            const plantSpecies = getSpecies(cell.plant.speciesId);
            if (plantSpecies?.special === 'moss') {
              let hasTree = false;
              for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]] as const) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr < 0 || nr >= s.gridRows || nc < 0 || nc >= s.gridCols) continue;
                const neighbor = s.grid[nr][nc];
                if (neighbor.plant) {
                  const nSpecies = getSpecies(neighbor.plant.speciesId);
                  if (nSpecies?.id === 'tree' && neighbor.plant.stage >= PlantStage.Mature) {
                    hasTree = true;
                    break;
                  }
                }
              }
              if (!hasTree) {
                cell.plant.age++;
                continue;
              }
            }
            growPlant(cell);
          }
        }
      }
    }

    // Water donation then propagation (after plant growth)
    waterDonationTick(s);
    propagationTick(s);
    specialPropagationTick(s);

    // Bird spawning and resting updates
    birdTick(s);
  }

  drawBorder(termRows: number, termCols: number): void {
    this.renderer.drawBorder(termRows, termCols);
  }

  setOffset(row: number, col: number): void {
    this.renderer.setOffset(row, col);
  }

  resizeRenderer(gridRows: number, gridCols: number): void {
    this.renderer.resize(gridRows, gridCols);
  }
}
