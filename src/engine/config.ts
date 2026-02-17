import type { GameConfig } from './types'

export const DEFAULT_CONFIG: GameConfig = {
  drawThenPlayAllowed: true,
  unoWindowMs: 2600,
  enforceWildDrawFourLegality: true,
  turnDurationMs: 30000,
}
