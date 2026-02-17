import type { Card, CardColor } from './types'

const UNO_COLORS: Exclude<CardColor, 'wild'>[] = ['red', 'yellow', 'green', 'blue']

let cardCounter = 0

const nextId = (): string => `c_${cardCounter++}`

const makeNumber = (color: Exclude<CardColor, 'wild'>, value: number): Card => ({
  id: nextId(),
  color,
  kind: 'number',
  value,
})

const makeColorAction = (
  color: Exclude<CardColor, 'wild'>,
  kind: Extract<Card['kind'], 'skip' | 'reverse' | 'drawTwo'>,
): Card => ({
  id: nextId(),
  color,
  kind,
})

const makeWild = (kind: Extract<Card['kind'], 'wild' | 'wildDrawFour'>): Card => ({
  id: nextId(),
  color: 'wild',
  kind,
})

export const createDeck = (): Card[] => {
  cardCounter = 0
  const deck: Card[] = []

  for (const color of UNO_COLORS) {
    deck.push(makeNumber(color, 0))

    for (let n = 1; n <= 9; n += 1) {
      deck.push(makeNumber(color, n))
      deck.push(makeNumber(color, n))
    }

    for (let i = 0; i < 2; i += 1) {
      deck.push(makeColorAction(color, 'skip'))
      deck.push(makeColorAction(color, 'reverse'))
      deck.push(makeColorAction(color, 'drawTwo'))
    }
  }

  for (let i = 0; i < 4; i += 1) {
    deck.push(makeWild('wild'))
    deck.push(makeWild('wildDrawFour'))
  }

  return deck
}

export const shuffleCards = <T>(cards: T[]): T[] => {
  const copy = [...cards]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export const getCardLabel = (card: Card): string => {
  if (card.kind === 'number') return `${card.value}`
  if (card.kind === 'drawTwo') return '+2'
  if (card.kind === 'wildDrawFour') return '+4'
  if (card.kind === 'reverse') return 'REV'
  if (card.kind === 'skip') return 'SKIP'
  return 'WILD'
}

export const getActionScore = (card: Card): number => {
  if (card.kind === 'number') return card.value
  if (card.kind === 'wild' || card.kind === 'wildDrawFour') return 50
  return 20
}

export const COLORS = UNO_COLORS
