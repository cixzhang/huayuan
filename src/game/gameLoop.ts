import type { GameState, GameAction } from '../types.js';
import { GameActionType, ToolType, InputMode, WeatherType } from '../types.js';
import { Renderer } from '../render/renderer.js';
import { RENDER_INTERVAL_MS, GROWTH_TICK_MS, JUMP_DISTANCE, WATER_DECAY_PER_TICK, MESSAGE_DURATION_TICKS, RIVER_WATER_RADIUS, RIVER_WATER_AMOUNT, WATER_MAX, WEATHER_MIN_DURATION, WEATHER_MAX_DURATION, WEATHER_TRANSITION_TICKS, RAIN_WATER_PER_TICK, NIGHT_GROWTH_PENALTY, DAY_DURATION_TICKS, NIGHT_DURATION_TICKS } from '../constants.js';
import { clampPosition } from './grid.js';
import { growPlant } from './plant.js';
import { useTool, useToolOnArea } from './tools.js';
import { SEED_ORDER, getSpecies } from '../data/plants.js';

export class GameLoop {
  private renderTimer: ReturnType<typeof setInterval> | null = null;
  private growthTimer: ReturnType<typeof setInterval> | null = null;
  private renderer: Renderer;
  private state: GameState;
  private onQuit: () => void;

  constructor(state: GameState, onQuit: () => void) {
    this.state = state;
    this.onQuit = onQuit;
    this.renderer = new Renderer(state.gridRows, state.gridCols);
  }

  start(): void {
    // Initial render
    this.renderer.render(this.state);

    // Render loop at 20fps
    this.renderTimer = setInterval(() => {
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

      case GameActionType.UseTool:
        useTool(s, s.cursor);
        break;

      case GameActionType.UseToolOnSelection:
        if (s.selection) {
          const sel = s.selection;
          const minR = Math.min(sel.anchor.row, sel.cursor.row);
          const maxR = Math.max(sel.anchor.row, sel.cursor.row);
          const minC = Math.min(sel.anchor.col, sel.cursor.col);
          const maxC = Math.max(sel.anchor.col, sel.cursor.col);
          useToolOnArea(s, minR, maxR, minC, maxC);
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
        const idx = SEED_ORDER.indexOf(s.selectedSeed);
        s.selectedSeed = SEED_ORDER[(idx + 1) % SEED_ORDER.length];
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
        s.showHelp = !s.showHelp;
        break;
    }
  }

  private nextWeatherState(current: WeatherType): WeatherType {
    const roll = Math.random();
    switch (current) {
      case WeatherType.Clear:
        if (roll < 0.6) return WeatherType.Cloudy;
        if (roll < 0.9) return WeatherType.Wind;
        return WeatherType.Clear;
      case WeatherType.Cloudy:
        if (roll < 0.5) return WeatherType.Rain;
        if (roll < 0.8) return WeatherType.Clear;
        return WeatherType.Cloudy;
      case WeatherType.Rain:
        if (roll < 0.6) return WeatherType.Cloudy;
        if (roll < 0.9) return WeatherType.Rain;
        return WeatherType.Clear;
      case WeatherType.Wind:
        if (roll < 0.5) return WeatherType.Clear;
        if (roll < 0.9) return WeatherType.Cloudy;
        return WeatherType.Wind;
    }
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
        if (cell.waterLevel > 0 && !cell.river) {
          cell.waterLevel = Math.max(0, cell.waterLevel - WATER_DECAY_PER_TICK);
        }

        // Plant growth (night slows growth — skip half the ticks)
        if (cell.plant) {
          const skipGrowth = s.weather.isNight && s.weather.nightPhase > 0.5 && s.tickCount % 2 === 0;
          if (!skipGrowth) {
            growPlant(cell);
          }
        }
      }
    }
  }

  resizeRenderer(gridRows: number, gridCols: number): void {
    this.renderer.resize(gridRows, gridCols);
  }
}
