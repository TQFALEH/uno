import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { canPlayerPlayAnyCard, isCardPlayable } from './engine'
import { GameTable } from './components/GameTable'
import { useGameStore } from './store/useGameStore'

gsap.registerPlugin(useGSAP)

function App() {
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(4)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const rootRef = useRef<HTMLElement>(null)

  const { state, startGame, playCard, drawCard, passAfterDraw, callUno, chooseWildColor, tick, updateConfig } = useGameStore()

  const activePlayer = state.players[state.turnIndex]
  const topCard = state.discardPile[state.discardPile.length - 1]

  useEffect(() => {
    if (state.phase === 'idle') {
      startGame(playerCount)
    }
  }, [playerCount, startGame, state.phase])

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })
      tl.fromTo('.table-wrap', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.36 })
      tl.fromTo('.bottom-bar', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.26 }, '-=0.16')
    },
    { scope: rootRef },
  )

  const playableByIndex = useMemo(() => {
    if (!activePlayer || !topCard || state.phase !== 'inProgress') return []
    return activePlayer.hand
      .map((card, index) => ({
        index,
        playable: isCardPlayable(
          card,
          topCard,
          state.currentColor,
          activePlayer.hand,
          state.config.enforceWildDrawFourLegality,
        ),
      }))
      .filter((entry) => entry.playable)
  }, [activePlayer, topCard, state.phase, state.currentColor, state.config.enforceWildDrawFourLegality])

  useEffect(() => {
    const timer = window.setInterval(() => {
      tick()
    }, 200)

    return () => window.clearInterval(timer)
  }, [tick])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (state.phase !== 'inProgress') return
      if (!activePlayer) return
      const key = event.key.toLowerCase()

      if (key === 'd' && !canPlayerPlayAnyCard(state, state.turnIndex) && !state.drawnCardId) {
        drawCard(state.turnIndex)
      }

      if (key === 'u' && state.unoWindow?.playerIndex === state.turnIndex) {
        callUno(state.turnIndex)
      }

      const n = Number(key)
      if (!Number.isNaN(n) && n >= 1 && n <= 9) {
        const playable = playableByIndex[n - 1]
        if (playable) {
          const card = activePlayer.hand[playable.index]
          playCard(state.turnIndex, card.id)
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    activePlayer,
    callUno,
    drawCard,
    playableByIndex,
    playCard,
    state,
    state.phase,
    state.turnIndex,
    state.unoWindow,
  ])

  return (
    <main ref={rootRef} className="app-shell" dir="ltr" lang="en">
      <GameTable
        state={state}
        onPlayCard={playCard}
        onDraw={drawCard}
        onPassAfterDraw={passAfterDraw}
        onCallUno={callUno}
        onChooseWildColor={chooseWildColor}
      />

      <footer className="bottom-bar">
        <div className="bottom-bar__left">
          <button type="button" onClick={() => setSettingsOpen(true)}>
            Settings
          </button>
          <button type="button">How to Play</button>
        </div>
        <span className="bottom-bar__version">UNO Digital v1.0.4</span>
      </footer>

      {settingsOpen ? (
        <div className="settings-overlay" role="dialog" aria-modal>
          <div className="settings-panel">
            <h2>Round Settings</h2>
            <label>
              Players
              <select value={playerCount} onChange={(e) => setPlayerCount(Number(e.target.value) as 2 | 3 | 4)}>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </label>
            <label className="switch-row">
              <input
                type="checkbox"
                checked={state.config.drawThenPlayAllowed}
                onChange={(e) => updateConfig({ drawThenPlayAllowed: e.target.checked })}
              />
              Allow playing drawn card
            </label>
            <div className="settings-actions">
              <button
                type="button"
                onClick={() => {
                  startGame(playerCount)
                  setSettingsOpen(false)
                }}
              >
                Start New Round
              </button>
              <button type="button" className="ghost" onClick={() => setSettingsOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}

export default App
