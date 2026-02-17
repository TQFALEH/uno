import clsx from 'clsx'
import type { CSSProperties } from 'react'
import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import type { Card } from '../engine'
import { CardView } from './CardView'

gsap.registerPlugin(useGSAP)

interface HandFanProps {
  cards: Card[]
  playableIds: Set<string>
  invalidCardId?: string
  active?: boolean
  onPlayCard: (cardId: string) => void
}

export function HandFan({ cards, playableIds, invalidCardId, active, onPlayCard }: HandFanProps) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!ref.current) return
      gsap.fromTo(
        ref.current.querySelectorAll('.hand-fan__card'),
        { y: 58, opacity: 0, rotate: -4 },
        { y: 0, opacity: 1, rotate: 0, duration: 0.34, stagger: 0.03, ease: 'power2.out' },
      )
    },
    { dependencies: [cards.map((c) => c.id).join(',')], scope: ref },
  )

  return (
    <div ref={ref} className={clsx('hand-fan', { 'hand-fan--active': active })}>
      {cards.map((card, index) => {
        const angle = cards.length > 1 ? (index / (cards.length - 1) - 0.5) * 26 : 0
        const offsetY = Math.abs(angle) * 0.6

        return (
          <div
            key={card.id}
            className="hand-fan__card"
            style={{ '--angle': `${angle}deg`, '--raise': `${offsetY}px` } as CSSProperties}
          >
            <CardView
              card={card}
              selectable={playableIds.has(card.id)}
              isInvalid={invalidCardId === card.id}
              isActive={playableIds.has(card.id)}
              onClick={playableIds.has(card.id) ? () => onPlayCard(card.id) : undefined}
            />
          </div>
        )
      })}
    </div>
  )
}
