import type { GameState, RenderCell } from '../../types.js';
import { fg } from '../../terminal/ansi.js';
import { soilBgForWater } from '../palette.js';
import { BIRD_COLORS } from '../palette.js';
import { birdMapChar } from '../../data/birds.js';
import { BIRD_FLAP_RATE } from '../../constants.js';

export function renderBirdLayer(state: GameState): (RenderCell | null)[][] {
  const { gridRows, gridCols } = state;
  const layer: (RenderCell | null)[][] = [];

  for (let r = 0; r < gridRows; r++) {
    const row: (RenderCell | null)[] = new Array(gridCols).fill(null);
    layer.push(row);
  }

  for (const bird of state.birds) {
    const { row, col } = bird.position;
    if (row < 0 || row >= gridRows || col < 0 || col >= gridCols) continue;

    const flapFrame = Math.floor(bird.animFrame / BIRD_FLAP_RATE);
    const char = birdMapChar(bird.state, bird.direction, flapFrame);
    const cell = state.grid[row]?.[col];
    const bgColor = cell ? soilBgForWater(cell.waterLevel) : soilBgForWater(0);

    layer[row][col] = {
      char,
      fg: fg(BIRD_COLORS[bird.type]),
      bg: bgColor,
      style: '',
    };
  }

  return layer;
}
