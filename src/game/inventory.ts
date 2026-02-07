import type { Inventory } from '../types.js';
import { STARTING_SEEDS } from '../constants.js';

export function createInventory(): Inventory {
  return {
    seeds: { ...STARTING_SEEDS },
  };
}

export function hasSeed(inv: Inventory, speciesId: string): boolean {
  return (inv.seeds[speciesId] || 0) > 0;
}

export function removeSeed(inv: Inventory, speciesId: string): boolean {
  if (!hasSeed(inv, speciesId)) return false;
  inv.seeds[speciesId]--;
  return true;
}

export function addSeed(inv: Inventory, speciesId: string, count = 1): void {
  inv.seeds[speciesId] = (inv.seeds[speciesId] || 0) + count;
}
