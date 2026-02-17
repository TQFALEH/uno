import { createDeck, shuffleCards } from './cards'
import { DEFAULT_CONFIG } from './config'
import { calculateRoundScore, canPlayerPlayAnyCard, drawCards, isCardPlayable, nextTurnIndex, randomColor } from './rules'
import type { Card, GameAction, GameState, Player } from './types'

const PLAYER_NAMES = ['اللاعب 1', 'اللاعب 2', 'اللاعب 3', 'اللاعب 4']
const COLOR_LABEL_AR: Record<GameState['currentColor'], string> = {
  red: 'أحمر',
  yellow: 'أصفر',
  green: 'أخضر',
  blue: 'أزرق',
}

export const createInitialState = (): GameState => ({
  phase: 'idle',
  config: DEFAULT_CONFIG,
  players: [],
  drawPile: [],
  discardPile: [],
  turnIndex: 0,
  turnStartedAt: Date.now(),
  clockMs: Date.now(),
  direction: 1,
  currentColor: 'red',
  winnerIndex: null,
  unoWindow: null,
  awaitingWildChoice: null,
  drawnCardId: null,
  lastInvalidMove: null,
  announcement: 'ابدأ جولة UNO جديدة.',
  scoreBoard: {},
})

const clearInvalidMove = (state: GameState): GameState => ({
  ...state,
  lastInvalidMove: null,
})

const withAnnouncement = (state: GameState, announcement: string): GameState => ({
  ...state,
  announcement,
})

const markInvalid = (state: GameState, playerIndex: number, cardId: string, reason: string): GameState => ({
  ...state,
  lastInvalidMove: { playerIndex, cardId, reason },
  announcement: reason,
})

const applyUnoPenaltyIfNeeded = (state: GameState, now: number): GameState => {
  if (!state.unoWindow) return state
  if (state.unoWindow.called) {
    return { ...state, unoWindow: null }
  }
  if (now <= state.unoWindow.deadlineAt) return state

  const playerIndex = state.unoWindow.playerIndex
  const penalizedPlayer = state.players[playerIndex]
  let penalizedState = state
  const [drawnState, penaltyCards] = drawCards(penalizedState, 2)
  penalizedState = drawnState

  const players = penalizedState.players.map((player, index) =>
    index === playerIndex ? { ...player, hand: [...player.hand, ...penaltyCards] } : player,
  )

  return {
    ...penalizedState,
    players,
    unoWindow: null,
    announcement: `${penalizedPlayer.name} نسي قول UNO ويسحب بطاقتين.`,
  }
}

const setUnoWindow = (state: GameState, playerIndex: number, now: number): GameState => {
  const cardsLeft = state.players[playerIndex].hand.length
  if (cardsLeft !== 1) return { ...state, unoWindow: null }

  return {
    ...state,
    unoWindow: {
      playerIndex,
      deadlineAt: now + state.config.unoWindowMs,
      called: false,
    },
  }
}

const isCurrentPlayer = (state: GameState, playerIndex: number): boolean => state.turnIndex === playerIndex

const advanceTurn = (state: GameState, fromPlayer: number, steps = 1): number => {
  let idx = fromPlayer
  for (let i = 0; i < steps; i += 1) {
    idx = nextTurnIndex(idx, state.direction, state.players.length)
  }
  return idx
}

const finalizeWinner = (state: GameState, winnerIndex: number): GameState => {
  const winner = state.players[winnerIndex]
  const roundScore = calculateRoundScore(state.players, winnerIndex)

  return {
    ...state,
    phase: 'gameOver',
    winnerIndex,
    awaitingWildChoice: null,
    unoWindow: null,
    drawnCardId: null,
    announcement: `${winner.name} فاز بالجولة (+${roundScore} نقطة)!`,
    scoreBoard: {
      ...state.scoreBoard,
      [winner.id]: (state.scoreBoard[winner.id] ?? 0) + roundScore,
    },
  }
}

const applyCardEffect = (
  state: GameState,
  card: Card,
  playerIndex: number,
  chosenColor: GameState['currentColor'] | null,
  now: number,
): GameState => {
  const playerName = state.players[playerIndex].name

  if (card.kind === 'wild' || card.kind === 'wildDrawFour') {
    const pickedColor = chosenColor ?? randomColor()
    let next = {
      ...state,
      currentColor: pickedColor,
    }

    if (card.kind === 'wildDrawFour') {
      const target = advanceTurn(next, playerIndex)
      const [drawnState, cards] = drawCards(next, 4)
      const players = drawnState.players.map((player, index) =>
        index === target ? { ...player, hand: [...player.hand, ...cards] } : player,
      )

      next = {
        ...drawnState,
        players,
        turnIndex: advanceTurn(drawnState, target),
        turnStartedAt: now,
        announcement: `${playerName} لعب وايلد +4 (${COLOR_LABEL_AR[pickedColor]}).`,
      }
      return next
    }

    return {
      ...next,
      turnIndex: advanceTurn(next, playerIndex),
      turnStartedAt: now,
      announcement: `${playerName} غيّر اللون إلى ${COLOR_LABEL_AR[pickedColor]}.`,
    }
  }

  if (card.kind === 'number') {
    return {
      ...state,
      currentColor: card.color as GameState['currentColor'],
      turnIndex: advanceTurn(state, playerIndex),
      turnStartedAt: now,
      announcement: `${playerName} لعب ${COLOR_LABEL_AR[card.color]} ${card.value}.`,
    }
  }

  if (card.kind === 'reverse') {
    if (state.players.length === 2) {
      return {
        ...state,
        currentColor: card.color as GameState['currentColor'],
        turnIndex: playerIndex,
        turnStartedAt: now,
        announcement: `${playerName} لعب عكس الاتجاه (تُحسب تخطّي في وضع لاعبين).`,
      }
    }

    const flipped: GameState = {
      ...state,
      currentColor: card.color as GameState['currentColor'],
      direction: state.direction === 1 ? -1 : 1,
    }

    return {
      ...flipped,
      turnIndex: advanceTurn(flipped, playerIndex),
      turnStartedAt: now,
      announcement: `${playerName} عكس اتجاه اللعب.`,
    }
  }

  if (card.kind === 'skip') {
    return {
      ...state,
      currentColor: card.color as GameState['currentColor'],
      turnIndex: advanceTurn(state, playerIndex, 2),
      turnStartedAt: now,
      announcement: `${playerName} لعب تخطّي.`,
    }
  }

  const target = advanceTurn(state, playerIndex)
  const [drawnState, cards] = drawCards(state, 2)
  const players = drawnState.players.map((player, index) =>
    index === target ? { ...player, hand: [...player.hand, ...cards] } : player,
  )

  return {
    ...drawnState,
    players,
    currentColor: card.color as GameState['currentColor'],
    turnIndex: advanceTurn(drawnState, target),
    turnStartedAt: now,
    announcement: `${playerName} لعب +2.`,
  }
}

const bootstrapRound = (playerCount: 2 | 3 | 4, state: GameState, now: number): GameState => {
  const players: Player[] = Array.from({ length: playerCount }, (_, i) => ({
    id: `p${i + 1}`,
    name: PLAYER_NAMES[i],
    hand: [],
  }))

  const deck = shuffleCards(createDeck())
  let cursor = deck.length

  for (let dealRound = 0; dealRound < 7; dealRound += 1) {
    for (let i = 0; i < players.length; i += 1) {
      cursor -= 1
      players[i].hand.push(deck[cursor])
    }
  }

  const drawPile = deck.slice(0, cursor)
  let topCard = drawPile[drawPile.length - 1]
  let nextDrawPile = drawPile.slice(0, -1)

  while (topCard.kind === 'wildDrawFour') {
    nextDrawPile = shuffleCards([topCard, ...nextDrawPile])
    topCard = nextDrawPile[nextDrawPile.length - 1]
    nextDrawPile = nextDrawPile.slice(0, -1)
  }

  let nextState: GameState = {
    ...state,
    phase: 'inProgress',
    players,
    drawPile: nextDrawPile,
    discardPile: [topCard],
    turnIndex: 0,
    turnStartedAt: now,
    clockMs: now,
    direction: 1,
    currentColor: topCard.color === 'wild' ? randomColor() : (topCard.color as GameState['currentColor']),
    winnerIndex: null,
    awaitingWildChoice: null,
    drawnCardId: null,
    unoWindow: null,
    lastInvalidMove: null,
    announcement: 'بدأت الجولة.',
  }

  if (topCard.kind !== 'number') {
    nextState = applyCardEffect(nextState, topCard, players.length - 1, nextState.currentColor, now)
  }

  return nextState
}

export const reduceGameState = (prev: GameState, action: GameAction): GameState => {
  if (action.type === 'RESET') {
    return createInitialState()
  }

  if (action.type === 'START_GAME') {
    const initialized = bootstrapRound(action.playerCount, {
      ...createInitialState(),
      config: prev.config,
      scoreBoard: prev.scoreBoard,
    }, action.now)
    return withAnnouncement(initialized, initialized.announcement)
  }

  let state = applyUnoPenaltyIfNeeded(clearInvalidMove(prev), action.now)
  state = { ...state, clockMs: action.now }

  switch (action.type) {
    case 'PLAY_CARD': {
      if (state.phase === 'gameOver' || state.phase === 'idle') return state
      if (state.phase === 'choosingColor') return state
      if (!isCurrentPlayer(state, action.playerIndex)) {
        return withAnnouncement(state, 'ليس دورك الآن.')
      }

      const player = state.players[action.playerIndex]
      const cardIndex = player.hand.findIndex((card) => card.id === action.cardId)
      if (cardIndex < 0) {
        return withAnnouncement(state, 'البطاقة غير موجودة.')
      }

      if (state.drawnCardId && action.cardId !== state.drawnCardId) {
        return markInvalid(state, action.playerIndex, action.cardId, 'يمكنك لعب البطاقة المسحوبة فقط الآن.')
      }

      const card = player.hand[cardIndex]
      const topCard = state.discardPile[state.discardPile.length - 1]
      const legal = isCardPlayable(
        card,
        topCard,
        state.currentColor,
        player.hand,
        state.config.enforceWildDrawFourLegality,
      )

      if (!legal) {
        return markInvalid(state, action.playerIndex, action.cardId, 'حركة غير صالحة حسب اللون/الرمز الحالي.')
      }

      const nextPlayers = state.players.map((p, index) =>
        index === action.playerIndex ? { ...p, hand: p.hand.filter((c) => c.id !== action.cardId) } : p,
      )

      state = {
        ...state,
        players: nextPlayers,
        discardPile: [...state.discardPile, card],
        drawnCardId: null,
      }

      state = setUnoWindow(state, action.playerIndex, action.now)

      if (state.players[action.playerIndex].hand.length === 0) {
        return finalizeWinner(state, action.playerIndex)
      }

      if ((card.kind === 'wild' || card.kind === 'wildDrawFour') && !action.chosenColor) {
        return {
          ...state,
          phase: 'choosingColor',
          awaitingWildChoice: { card, playerIndex: action.playerIndex },
          announcement: 'اختر لونًا لبطاقة الوايلد.',
        }
      }

      return applyCardEffect(state, card, action.playerIndex, action.chosenColor ?? null, action.now)
    }

    case 'DRAW_CARD': {
      if (state.phase !== 'inProgress') return state
      if (!isCurrentPlayer(state, action.playerIndex)) return withAnnouncement(state, 'ليس دورك الآن.')
      if (state.drawnCardId) return withAnnouncement(state, 'العب البطاقة المسحوبة أو مرّر أولًا.')

      if (canPlayerPlayAnyCard(state, action.playerIndex)) {
        return withAnnouncement(state, 'السحب متاح فقط إذا لم تكن لديك حركة صالحة.')
      }

      const [drawnState, cards] = drawCards(state, 1)
      const drawnCard = cards[0]

      if (!drawnCard) {
        return withAnnouncement(drawnState, 'لا توجد بطاقات متاحة للسحب.')
      }

      const players = drawnState.players.map((player, index) =>
        index === action.playerIndex ? { ...player, hand: [...player.hand, drawnCard] } : player,
      )

      const withDrawnCard = {
        ...drawnState,
        players,
      }

      const nowPlayerHand = withDrawnCard.players[action.playerIndex].hand
      const topCard = withDrawnCard.discardPile[withDrawnCard.discardPile.length - 1]
      const isImmediatelyPlayable =
        withDrawnCard.config.drawThenPlayAllowed &&
        isCardPlayable(
          drawnCard,
          topCard,
          withDrawnCard.currentColor,
          nowPlayerHand,
          withDrawnCard.config.enforceWildDrawFourLegality,
        )

      if (isImmediatelyPlayable) {
        return {
          ...withDrawnCard,
          drawnCardId: drawnCard.id,
          announcement: 'تم سحب بطاقة. يمكنك لعبها الآن أو التمرير.',
        }
      }

      return {
        ...withDrawnCard,
        turnIndex: advanceTurn(withDrawnCard, action.playerIndex),
        turnStartedAt: action.now,
        announcement: 'تم سحب بطاقة وانتهى الدور.',
      }
    }

    case 'PASS_AFTER_DRAW': {
      if (state.phase !== 'inProgress') return state
      if (!isCurrentPlayer(state, action.playerIndex)) return state
      if (!state.drawnCardId) return state

      return {
        ...state,
        drawnCardId: null,
        turnIndex: advanceTurn(state, action.playerIndex),
        turnStartedAt: action.now,
        announcement: `${state.players[action.playerIndex].name} مرّر الدور.`,
      }
    }

    case 'CHOOSE_WILD_COLOR': {
      if (state.phase !== 'choosingColor' || !state.awaitingWildChoice) return state
      if (state.awaitingWildChoice.playerIndex !== action.playerIndex) return state

      const wildCard = state.awaitingWildChoice.card
      const resumed: GameState = {
        ...state,
        phase: 'inProgress',
        awaitingWildChoice: null,
      }

      return applyCardEffect(resumed, wildCard, action.playerIndex, action.color, action.now)
    }

    case 'CALL_UNO': {
      if (!state.unoWindow) return withAnnouncement(state, 'لا يوجد نداء UNO مطلوب الآن.')
      if (state.unoWindow.playerIndex !== action.playerIndex) {
        return withAnnouncement(state, 'فقط اللاعب الذي لديه بطاقة واحدة يمكنه قول UNO.')
      }
      if (action.now > state.unoWindow.deadlineAt) {
        return applyUnoPenaltyIfNeeded(state, action.now)
      }

      return {
        ...state,
        unoWindow: null,
        announcement: `${state.players[action.playerIndex].name} قال UNO!`,
      }
    }

    case 'TICK': {
      if (state.phase === 'inProgress') {
        const elapsed = action.now - state.turnStartedAt
        if (elapsed >= state.config.turnDurationMs) {
          const timedOutPlayer = state.players[state.turnIndex]
          return {
            ...state,
            drawnCardId: null,
            turnIndex: advanceTurn(state, state.turnIndex),
            turnStartedAt: action.now,
            announcement: `${timedOutPlayer.name} انتهى وقته. انتقل الدور.`,
          }
        }
      }
      return applyUnoPenaltyIfNeeded(state, action.now)
    }

    default:
      return state
  }
}
