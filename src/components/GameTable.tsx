import { useMemo, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { canPlayerPlayAnyCard, isCardPlayable } from '../engine'
import type { CardColor, GameState } from '../engine'
import { CardView } from './CardView'
import { ColorPickerModal } from './ColorPickerModal'
import { ConfettiBurst } from './ConfettiBurst'
import { HandFan } from './HandFan'

gsap.registerPlugin(useGSAP)

interface GameTableProps {
  state: GameState
  onPlayCard: (playerIndex: number, cardId: string) => void
  onDraw: (playerIndex: number) => void
  onPassAfterDraw: (playerIndex: number) => void
  onCallUno: (playerIndex: number) => void
  onChooseWildColor: (playerIndex: number, color: Exclude<CardColor, 'wild'>) => void
}

const BOT_NAMES = ['Computer Alpha', 'Bot Beta', 'Gamma Droid']

export function GameTable({ state, onPlayCard, onDraw, onPassAfterDraw, onCallUno, onChooseWildColor }: GameTableProps) {
  const activePlayer = state.players[state.turnIndex]
  const topCard = state.discardPile[state.discardPile.length - 1]
  const tableRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!tableRef.current) return
      gsap.fromTo(
        tableRef.current.querySelectorAll('.ai-node, .pile-zone, .uno-cta, .hand-zone, .turn-meter'),
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.34, stagger: 0.04, ease: 'power2.out' },
      )
    },
    { dependencies: [state.phase], scope: tableRef },
  )

  useGSAP(
    () => {
      if (!tableRef.current) return
      const discard = tableRef.current.querySelector('.pile--discard .uno-card')
      if (!discard) return
      gsap.fromTo(discard, { rotate: -6, scale: 0.88 }, { rotate: 0, scale: 1, duration: 0.24, ease: 'power2.out' })
    },
    { dependencies: [topCard?.id], scope: tableRef },
  )

  const playableIds = useMemo(() => {
    if (!activePlayer || state.phase !== 'inProgress') return new Set<string>()
    const set = new Set<string>()

    for (const card of activePlayer.hand) {
      if (
        isCardPlayable(card, topCard, state.currentColor, activePlayer.hand, state.config.enforceWildDrawFourLegality) &&
        (!state.drawnCardId || state.drawnCardId === card.id)
      ) {
        set.add(card.id)
      }
    }

    return set
  }, [activePlayer, state.phase, state.drawnCardId, state.config.enforceWildDrawFourLegality, state.currentColor, topCard])

  const canDraw =
    state.phase === 'inProgress' &&
    !!activePlayer &&
    !state.drawnCardId &&
    !canPlayerPlayAnyCard(state, state.turnIndex) &&
    state.awaitingWildChoice === null

  const canPass = state.phase === 'inProgress' && state.drawnCardId !== null

  const opponents = state.players.filter((_, index) => index !== state.turnIndex)
  const posClasses = ['ai-node--top', 'ai-node--left', 'ai-node--right']
  const elapsedMs = Math.max(0, state.clockMs - state.turnStartedAt)
  const remainingMs = Math.max(0, state.config.turnDurationMs - elapsedMs)
  const turnProgress = Math.max(0, 1 - elapsedMs / state.config.turnDurationMs) * 100

  return (
    <section ref={tableRef} className="table-wrap" aria-label="UNO table">
      <ConfettiBurst show={state.phase === 'gameOver'} />
      <div className="table-vignette" />

      <div className="opponents-layer">
        {opponents.map((player, i) => {
          const aiLabel = `AI ${i + 1}`
          return (
            <article key={player.id} className={`ai-node ${posClasses[i] ?? 'ai-node--top'}`}>
              <div className="ai-node__avatar">{aiLabel}</div>
              <div className="ai-node__count">{player.hand.length} Cards</div>
              <p className="ai-node__name">{BOT_NAMES[i] ?? player.name}</p>
            </article>
          )
        })}
      </div>

      <div className="pile-zone">
        <button type="button" className="pile pile--draw" onClick={() => onDraw(state.turnIndex)} disabled={!canDraw}>
          <div className="pile__cardback" />
          <span>DRAW DECK</span>
        </button>

        <div className="pile pile--discard">
          {topCard ? <CardView card={topCard} isActive /> : null}
          <span>DISCARD</span>
        </div>
      </div>

      <div className="table-actions">
        <button type="button" className="mini-btn" onClick={() => onPassAfterDraw(state.turnIndex)} disabled={!canPass}>
          PASS
        </button>
        <button
          type="button"
          className="uno-cta"
          onClick={() => onCallUno(state.unoWindow?.playerIndex ?? state.turnIndex)}
          disabled={!state.unoWindow || state.unoWindow.playerIndex !== state.turnIndex}
        >
          UNO!
        </button>
      </div>

      <div className="hand-zone">
        {activePlayer ? (
          <HandFan
            cards={activePlayer.hand}
            playableIds={playableIds}
            invalidCardId={
              state.lastInvalidMove?.playerIndex === state.turnIndex ? state.lastInvalidMove.cardId : undefined
            }
            active={state.phase === 'inProgress'}
            onPlayCard={(cardId) => onPlayCard(state.turnIndex, cardId)}
          />
        ) : null}
      </div>

      <div className="turn-meter">
        <p>
          {state.phase === 'gameOver'
            ? `${state.players[state.winnerIndex ?? 0]?.name ?? ''} WINS`
            : `YOUR TURN ${Math.ceil(remainingMs / 1000)}s`}
        </p>
        <div className="turn-meter__bar">
          <span style={{ width: `${turnProgress}%` }} />
        </div>
      </div>

      <ColorPickerModal
        open={state.phase === 'choosingColor'}
        onPick={(color) => onChooseWildColor(state.awaitingWildChoice?.playerIndex ?? 0, color)}
      />
    </section>
  )
}
