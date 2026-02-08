import type { GameState, RenderCell } from '../../types.js';
import { PlantStage } from '../../types.js';
import { getSpecies } from '../../data/plants.js';
import { plantFg, soilBgForWater, PLANT_STYLE } from '../palette.js';
import { fg } from '../../terminal/ansi.js';

export function renderStemLayer(state: GameState): (RenderCell | null)[][] {
  const { grid, gridRows, gridCols } = state;
  const layer: (RenderCell | null)[][] = [];

  for (let r = 0; r < gridRows; r++) {
    const row: (RenderCell | null)[] = [];
    for (let c = 0; c < gridCols; c++) {
      const cell = grid[r][c];
      if (!cell.plant) {
        // Render wild plant chars if present
        if (cell.wildChar) {
          row.push({
            char: cell.wildChar,
            fg: fg(65),  // muted green-brown
            bg: soilBgForWater(cell.waterLevel),
            style: '',
          });
          continue;
        }
        row.push(null);
        continue;
      }

      const plant = cell.plant;
      const species = getSpecies(plant.speciesId);
      if (!species) {
        row.push(null);
        continue;
      }

      if (plant.stage <= PlantStage.Growing) {
        row.push({
          char: species.stages[plant.stage],
          fg: plantFg(plant.speciesId, plant.stage, plant.colorVariant),
          bg: soilBgForWater(cell.waterLevel),
          style: PLANT_STYLE,
        });
      } else {
        row.push(null);
      }
    }
    layer.push(row);
  }

  return layer;
}
