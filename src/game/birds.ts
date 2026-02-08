import type { GameState, Bird, DialogState, Position } from '../types.js';
import { BirdType, InputMode } from '../types.js';
import { BIRD_MAX_COUNT, BIRD_SPAWN_CHANCE, BIRD_REST_DURATION, BIRD_FLY_SPEED } from '../constants.js';
import { getValidDialogs, getDialogById, resolveSeedReward, BIRD_TYPES } from '../data/birds.js';

// === Bird Spawning & Movement (growth tick) ===

function randomEdgePosition(gridRows: number, gridCols: number): { position: Position; direction: 'left' | 'right' } {
  // Spawn from a random edge (left or right)
  const fromLeft = Math.random() < 0.5;
  const row = Math.floor(Math.random() * gridRows);
  const col = fromLeft ? 0 : gridCols - 1;
  const direction: 'left' | 'right' = fromLeft ? 'right' : 'left';
  return { position: { row, col }, direction };
}

function findEmptyTarget(state: GameState, isWaterBird: boolean): Position | null {
  const candidates: Position[] = [];
  for (let r = 0; r < state.gridRows; r++) {
    for (let c = 0; c < state.gridCols; c++) {
      const cell = state.grid[r][c];
      // Water birds can land on river cells; land birds cannot
      const canLand = isWaterBird ? true : !cell.river;
      if (canLand) {
        const occupied = state.birds.some(b =>
          (b.position.row === r && b.position.col === c) ||
          (b.targetPosition?.row === r && b.targetPosition?.col === c)
        );
        if (!occupied) candidates.push({ row: r, col: c });
      }
    }
  }
  if (candidates.length === 0) return null;
  // Prefer landing near the cursor (Manhattan distance <= 5)
  const near = candidates.filter(p =>
    Math.abs(p.row - state.cursor.row) + Math.abs(p.col - state.cursor.col) <= 5
  );
  const pool = near.length > 0 ? near : candidates;
  return pool[Math.floor(Math.random() * pool.length)];
}

function findEdgeTarget(gridRows: number, gridCols: number): Position {
  const side = Math.random() < 0.5;
  const row = Math.floor(Math.random() * gridRows);
  return { row, col: side ? 0 : gridCols - 1 };
}

export function birdTick(state: GameState): void {
  // 1. Spawn new birds
  if (state.birds.length < BIRD_MAX_COUNT && Math.random() < BIRD_SPAWN_CHANCE) {
    const birdType = Math.floor(Math.random() * 4) as BirdType;
    const birdDef = BIRD_TYPES[birdType];
    const target = findEmptyTarget(state, birdDef.isWaterBird);
    if (target) {
      const { position, direction } = randomEdgePosition(state.gridRows, state.gridCols);

      // Pick a random valid dialog
      const validDialogs = getValidDialogs(state);
      const dialogId = validDialogs.length > 0
        ? validDialogs[Math.floor(Math.random() * validDialogs.length)].id
        : null;

      const bird: Bird = {
        id: state.nextBirdId++,
        type: birdType,
        position,
        state: 'flying',
        direction,
        restTimer: 0,
        animFrame: 0,
        targetPosition: target,
        dialogId,
      };
      state.birds.push(bird);
    }
  }

  // 2. Update resting birds
  for (const bird of state.birds) {
    if (bird.state === 'resting') {
      bird.restTimer++;
      // Don't leave while being talked to
      if (state.dialog.active && state.dialog.birdId === bird.id) continue;
      if (bird.restTimer >= BIRD_REST_DURATION) {
        bird.state = 'leaving';
        bird.targetPosition = findEdgeTarget(state.gridRows, state.gridCols);
        // Set direction based on target
        if (bird.targetPosition.col < bird.position.col) {
          bird.direction = 'left';
        } else {
          bird.direction = 'right';
        }
      }
    }
  }

  // 3. Remove birds that have left the grid
  state.birds = state.birds.filter(b => {
    if (b.state !== 'leaving') return true;
    // Keep if still moving
    if (b.targetPosition) return true;
    return false;
  });
}

// === Bird Flying Animation (render tick) ===

export function birdFlyTick(state: GameState): void {
  for (let i = state.birds.length - 1; i >= 0; i--) {
    const bird = state.birds[i];
    bird.animFrame++;

    if (bird.state === 'flying' || bird.state === 'leaving') {
      // Move toward target every FLY_SPEED ticks
      if (bird.animFrame % BIRD_FLY_SPEED === 0 && bird.targetPosition) {
        const dr = Math.sign(bird.targetPosition.row - bird.position.row);
        const dc = Math.sign(bird.targetPosition.col - bird.position.col);
        bird.position.row += dr;
        bird.position.col += dc;

        // Update direction based on horizontal movement
        if (dc < 0) bird.direction = 'left';
        else if (dc > 0) bird.direction = 'right';

        // Check if reached target
        if (bird.position.row === bird.targetPosition.row && bird.position.col === bird.targetPosition.col) {
          if (bird.state === 'flying') {
            bird.state = 'resting';
            bird.restTimer = 0;
            bird.targetPosition = null;
          } else {
            // Leaving bird reached edge — remove it
            state.birds.splice(i, 1);
          }
        }
      }
    }
  }
}

// === Dialog State Machine ===

function defaultDialogState(): DialogState {
  return {
    active: false,
    birdId: -1,
    treeId: '',
    phase: 'speech',
    lineIndex: 0,
    selectedOption: -1,
    answeredCorrectly: null,
    seedAwarded: null,
  };
}

export function createDefaultDialogState(): DialogState {
  return defaultDialogState();
}

export function startDialog(state: GameState, birdId: number): boolean {
  const bird = state.birds.find(b => b.id === birdId);
  if (!bird || !bird.dialogId) return false;
  if (bird.state !== 'resting') return false;

  const tree = getDialogById(bird.dialogId);
  if (!tree) return false;

  state.dialog = {
    active: true,
    birdId,
    treeId: tree.id,
    phase: 'speech',
    lineIndex: 0,
    selectedOption: -1,
    answeredCorrectly: null,
    seedAwarded: null,
  };
  state.mode = InputMode.Dialog;
  return true;
}

export function advanceDialog(state: GameState): void {
  const d = state.dialog;
  if (!d.active) return;

  const tree = getDialogById(d.treeId);
  if (!tree) {
    exitDialog(state);
    return;
  }

  if (d.phase === 'speech') {
    d.lineIndex++;
    if (d.lineIndex >= tree.lines.length) {
      d.phase = 'question';
      d.selectedOption = -1;
    }
  } else if (d.phase === 'result') {
    exitDialog(state);
  }
}

export function selectDialogOption(state: GameState, optionIndex: number): void {
  const d = state.dialog;
  if (!d.active || d.phase !== 'question') return;

  const tree = getDialogById(d.treeId);
  if (!tree || optionIndex < 0 || optionIndex >= tree.options.length) return;

  d.selectedOption = optionIndex;
  d.answeredCorrectly = tree.options[optionIndex].isCorrect;

  if (d.answeredCorrectly) {
    const seedId = resolveSeedReward(tree.seedReward, state);
    d.seedAwarded = seedId;
    // Add seed to inventory
    if (!state.inventory.seeds[seedId]) {
      state.inventory.seeds[seedId] = 0;
    }
    state.inventory.seeds[seedId]++;
  }

  d.phase = 'result';
}

export function exitDialog(state: GameState): void {
  state.dialog = defaultDialogState();
  state.mode = InputMode.Normal;
}

export function getBirdAtPosition(state: GameState, row: number, col: number): Bird | undefined {
  return state.birds.find(b => b.position.row === row && b.position.col === col);
}
