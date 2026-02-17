export type CardColor = 'red' | 'yellow' | 'green' | 'blue' | 'wild'

export type ActionKind = 'skip' | 'reverse' | 'drawTwo' | 'wild' | 'wildDrawFour'

export type Card =
  | {
      id: string
      color: Exclude<CardColor, 'wild'>
      kind: 'number'
      value: number
    }
  | {
      id: string
      color: Exclude<CardColor, 'wild'>
      kind: Exclude<ActionKind, 'wild' | 'wildDrawFour'>
    }
  | {
      id: string
      color: 'wild'
      kind: Extract<ActionKind, 'wild' | 'wildDrawFour'>
    }

export interface Player {
  id: string
  name: string
  hand: Card[]
}

export interface UnoWindow {
  playerIndex: number
  deadlineAt: number
  called: boolean
}

export interface AwaitingWildChoice {
  card: Card & { kind: 'wild' | 'wildDrawFour' }
  playerIndex: number
}

export interface GameConfig {
  drawThenPlayAllowed: boolean
  unoWindowMs: number
  enforceWildDrawFourLegality: boolean
  turnDurationMs: number
}

export type GamePhase = 'idle' | 'inProgress' | 'choosingColor' | 'gameOver'

export interface GameState {
  phase: GamePhase
  config: GameConfig
  players: Player[]
  drawPile: Card[]
  discardPile: Card[]
  turnIndex: number
  turnStartedAt: number
  clockMs: number
  direction: 1 | -1
  currentColor: Exclude<CardColor, 'wild'>
  winnerIndex: number | null
  unoWindow: UnoWindow | null
  awaitingWildChoice: AwaitingWildChoice | null
  drawnCardId: string | null
  lastInvalidMove: { playerIndex: number; cardId: string; reason: string } | null
  announcement: string
  scoreBoard: Record<string, number>
}

export type GameAction =
  | { type: 'START_GAME'; playerCount: 2 | 3 | 4; now: number }
  | { type: 'PLAY_CARD'; playerIndex: number; cardId: string; chosenColor?: Exclude<CardColor, 'wild'>; now: number }
  | { type: 'DRAW_CARD'; playerIndex: number; now: number }
  | { type: 'PASS_AFTER_DRAW'; playerIndex: number; now: number }
  | { type: 'CALL_UNO'; playerIndex: number; now: number }
  | { type: 'CHOOSE_WILD_COLOR'; playerIndex: number; color: Exclude<CardColor, 'wild'>; now: number }
  | { type: 'TICK'; now: number }
  | { type: 'RESET' }
