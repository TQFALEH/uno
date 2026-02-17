import { COLORS, getActionScore, shuffleCards } from './cards'
import type { Card, GameState, Player } from './types'

export const nextTurnIndex = (current: number, direction: 1 | -1, playerCount: number): number =>
  (current + direction + playerCount) % playerCount

export const isCardPlayable = (
  card: Card,
  topCard: Card,
  currentColor: GameState['currentColor'],
  hand: Card[],
  enforceWildDrawFourLegality: boolean,
): boolean => {
  if (card.kind === 'wild') return true

  if (card.kind === 'wildDrawFour') {
    if (!enforceWildDrawFourLegality) return true
    return !hand.some((handCard) => handCard.color === currentColor)
  }

  if (card.color === currentColor) return true

  if (topCard.kind === 'number' && card.kind === 'number') {
    return topCard.value === card.value
  }

  if (topCard.kind !== 'number' && card.kind !== 'number') {
    return topCard.kind === card.kind
  }

  return false
}

export const canPlayerPlayAnyCard = (state: GameState, playerIndex: number): boolean => {
  const player = state.players[playerIndex]
  const topCard = state.discardPile[state.discardPile.length - 1]
  return player.hand.some((card) =>
    isCardPlayable(card, topCard, state.currentColor, player.hand, state.config.enforceWildDrawFourLegality),
  )
}

export const calculateRoundScore = (players: Player[], winnerIndex: number): number => {
  return players.reduce((sum, player, index) => {
    if (index === winnerIndex) return sum
    return sum + player.hand.reduce((cardSum, card) => cardSum + getActionScore(card), 0)
  }, 0)
}

export const refillDrawPileFromDiscard = (state: GameState): GameState => {
  if (state.drawPile.length > 0 || state.discardPile.length <= 1) return state

  const keepTop = state.discardPile[state.discardPile.length - 1]
  const recycle = state.discardPile.slice(0, -1)

  return {
    ...state,
    drawPile: shuffleCards(recycle),
    discardPile: [keepTop],
  }
}

export const drawCards = (state: GameState, amount: number): [GameState, Card[]] => {
  let next = state
  const cards: Card[] = []

  for (let i = 0; i < amount; i += 1) {
    next = refillDrawPileFromDiscard(next)
    if (next.drawPile.length === 0) break

    const drawn = next.drawPile[next.drawPile.length - 1]
    cards.push(drawn)
    next = {
      ...next,
      drawPile: next.drawPile.slice(0, -1),
    }
  }

  return [next, cards]
}

export const randomColor = (): GameState['currentColor'] => COLORS[Math.floor(Math.random() * COLORS.length)]
