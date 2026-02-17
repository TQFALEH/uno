import { describe, expect, it } from 'vitest'
import { createInitialState, reduceGameState } from './reducer'
import { drawCards, isCardPlayable } from './rules'
import type { Card, GameState, Player } from './types'

const num = (id: string, color: 'red' | 'yellow' | 'green' | 'blue', value: number): Card => ({
  id,
  color,
  kind: 'number',
  value,
})

const action = (
  id: string,
  color: 'red' | 'yellow' | 'green' | 'blue',
  kind: 'skip' | 'reverse' | 'drawTwo',
): Card => ({
  id,
  color,
  kind,
})

const wild = (id: string, kind: 'wild' | 'wildDrawFour'): Card => ({
  id,
  color: 'wild',
  kind,
})

const makeState = (players: Player[], topCard: Card, currentColor: GameState['currentColor']): GameState => ({
  ...createInitialState(),
  phase: 'inProgress',
  players,
  drawPile: [num('draw-1', 'blue', 2), num('draw-2', 'green', 3), num('draw-3', 'yellow', 6)],
  discardPile: [topCard],
  turnIndex: 0,
  direction: 1,
  currentColor,
  announcement: 'test',
})

describe('UNO rules', () => {
  it('valid move checking matches color/number/symbol and wild', () => {
    const top = num('top', 'red', 5)
    const hand = [num('h1', 'blue', 5), num('h2', 'red', 7), action('h3', 'red', 'skip')]

    expect(isCardPlayable(hand[0], top, 'red', hand, true)).toBe(true)
    expect(isCardPlayable(hand[1], top, 'red', hand, true)).toBe(true)
    expect(isCardPlayable(hand[2], top, 'red', hand, true)).toBe(true)
    expect(isCardPlayable(wild('w', 'wild'), top, 'red', hand, true)).toBe(true)
    expect(isCardPlayable(action('x', 'green', 'skip'), top, 'red', hand, true)).toBe(false)
  })

  it('reshuffles discard pile into draw pile when draw pile is empty', () => {
    const state = makeState(
      [
        { id: 'p1', name: 'P1', hand: [num('a', 'red', 1)] },
        { id: 'p2', name: 'P2', hand: [num('b', 'blue', 3)] },
      ],
      num('top', 'green', 4),
      'green',
    )

    const withEmptyDraw = {
      ...state,
      drawPile: [],
      discardPile: [num('d1', 'yellow', 9), num('d2', 'blue', 6), num('top', 'green', 4)],
    }

    const [next, cards] = drawCards(withEmptyDraw, 1)

    expect(cards.length).toBe(1)
    expect(next.discardPile).toHaveLength(1)
    expect(next.discardPile[0].id).toBe('top')
  })

  it('enforces Wild Draw 4 legality if player has current color', () => {
    const top = num('top', 'yellow', 1)
    const hand = [wild('w4', 'wildDrawFour'), num('y2', 'yellow', 2)]

    expect(isCardPlayable(hand[0], top, 'yellow', hand, true)).toBe(false)
    expect(isCardPlayable(hand[0], top, 'yellow', hand, false)).toBe(true)
  })

  it('handles reverse and skip turn order behavior', () => {
    const state = makeState(
      [
        { id: 'p1', name: 'P1', hand: [action('rev', 'red', 'reverse'), num('keep', 'yellow', 8)] },
        { id: 'p2', name: 'P2', hand: [num('p2n', 'blue', 1)] },
        { id: 'p3', name: 'P3', hand: [num('p3n', 'blue', 2)] },
      ],
      num('top', 'red', 9),
      'red',
    )

    const afterReverse = reduceGameState(state, {
      type: 'PLAY_CARD',
      playerIndex: 0,
      cardId: 'rev',
      now: Date.now(),
    })

    expect(afterReverse.direction).toBe(-1)
    expect(afterReverse.turnIndex).toBe(2)

    const afterSkipSetup = {
      ...afterReverse,
      players: [
        { id: 'p1', name: 'P1', hand: [num('p1n', 'blue', 5)] },
        { id: 'p2', name: 'P2', hand: [num('p2n2', 'blue', 6)] },
        { id: 'p3', name: 'P3', hand: [action('skip', 'blue', 'skip'), num('hold', 'yellow', 2)] },
      ],
      discardPile: [num('top2', 'blue', 3)],
      currentColor: 'blue' as const,
      turnIndex: 2,
    }

    const afterSkip = reduceGameState(afterSkipSetup, {
      type: 'PLAY_CARD',
      playerIndex: 2,
      cardId: 'skip',
      now: Date.now(),
    })

    expect(afterSkip.turnIndex).toBe(0)
  })
})
