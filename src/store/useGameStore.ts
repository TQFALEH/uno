import { create } from 'zustand'
import { DEFAULT_CONFIG, createInitialState, reduceGameState } from '../engine'
import type { CardColor, GameState } from '../engine'

interface GameStore {
  state: GameState
  startGame: (playerCount: 2 | 3 | 4) => void
  playCard: (playerIndex: number, cardId: string, chosenColor?: Exclude<CardColor, 'wild'>) => void
  drawCard: (playerIndex: number) => void
  passAfterDraw: (playerIndex: number) => void
  callUno: (playerIndex: number) => void
  chooseWildColor: (playerIndex: number, color: Exclude<CardColor, 'wild'>) => void
  tick: () => void
  reset: () => void
  updateConfig: (config: Partial<GameState['config']>) => void
}

const now = () => Date.now()

export const useGameStore = create<GameStore>((set) => ({
  state: { ...createInitialState(), config: DEFAULT_CONFIG },

  startGame: (playerCount) =>
    set((store) => ({
      state: reduceGameState(store.state, { type: 'START_GAME', playerCount, now: now() }),
    })),

  playCard: (playerIndex, cardId, chosenColor) =>
    set((store) => ({
      state: reduceGameState(store.state, { type: 'PLAY_CARD', playerIndex, cardId, chosenColor, now: now() }),
    })),

  drawCard: (playerIndex) =>
    set((store) => ({
      state: reduceGameState(store.state, { type: 'DRAW_CARD', playerIndex, now: now() }),
    })),

  passAfterDraw: (playerIndex) =>
    set((store) => ({
      state: reduceGameState(store.state, { type: 'PASS_AFTER_DRAW', playerIndex, now: now() }),
    })),

  callUno: (playerIndex) =>
    set((store) => ({
      state: reduceGameState(store.state, { type: 'CALL_UNO', playerIndex, now: now() }),
    })),

  chooseWildColor: (playerIndex, color) =>
    set((store) => ({
      state: reduceGameState(store.state, { type: 'CHOOSE_WILD_COLOR', playerIndex, color, now: now() }),
    })),

  tick: () =>
    set((store) => ({
      state: reduceGameState(store.state, { type: 'TICK', now: now() }),
    })),

  reset: () =>
    set(() => ({
      state: createInitialState(),
    })),

  updateConfig: (config) =>
    set((store) => ({
      state: {
        ...store.state,
        config: {
          ...store.state.config,
          ...config,
        },
      },
    })),
}))
