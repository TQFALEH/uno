import { useRef } from 'react'
import clsx from 'clsx'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { getCardLabel } from '../engine'
import type { Card } from '../engine'

gsap.registerPlugin(useGSAP)

interface CardViewProps {
  card?: Card
  faceDown?: boolean
  selectable?: boolean
  isActive?: boolean
  isInvalid?: boolean
  onClick?: () => void
  title?: string
}

export function CardView({ card, faceDown, selectable, isActive, isInvalid, onClick, title }: CardViewProps) {
  const wrapRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!wrapRef.current) return
      gsap.fromTo(wrapRef.current, { y: 24, opacity: 0, scale: 0.92 }, { y: 0, opacity: 1, scale: 1, duration: 0.32, ease: 'power2.out' })
    },
    { dependencies: [card?.id, faceDown], scope: wrapRef },
  )

  useGSAP(
    () => {
      if (!wrapRef.current || !isInvalid) return
      gsap.fromTo(wrapRef.current, { x: -8 }, { x: 8, duration: 0.06, repeat: 4, yoyo: true, ease: 'none' })
    },
    { dependencies: [isInvalid], scope: wrapRef },
  )

  const cardClass = clsx('uno-card', {
    'uno-card--back': faceDown,
    'uno-card--selectable': selectable,
    'uno-card--active': isActive,
    'uno-card--invalid': isInvalid,
  })

  const onEnter = () => {
    if (!wrapRef.current || !selectable) return
    gsap.to(wrapRef.current, { y: -10, scale: 1.03, duration: 0.18, ease: 'power2.out' })
  }

  const onLeave = () => {
    if (!wrapRef.current) return
    gsap.to(wrapRef.current, { y: 0, scale: 1, duration: 0.18, ease: 'power2.out' })
  }

  const onDown = () => {
    if (!wrapRef.current || !selectable) return
    gsap.to(wrapRef.current, { scale: 0.97, duration: 0.08 })
  }

  const onUp = () => {
    if (!wrapRef.current || !selectable) return
    gsap.to(wrapRef.current, { scale: 1.03, duration: 0.08 })
  }

  return (
    <div ref={wrapRef}>
      {!card || faceDown ? (
        <div className={cardClass} aria-hidden>
          <div className="uno-card__back-pattern" />
        </div>
      ) : (
        <button
          type="button"
          className={cardClass}
          data-color={card.color}
          onClick={onClick}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          onMouseDown={onDown}
          onMouseUp={onUp}
          disabled={!onClick}
          title={title}
          aria-label={`${card.color} ${card.kind === 'number' ? card.value : card.kind}`}
        >
          <span className="uno-card__corner">{getCardLabel(card)}</span>
          <span className="uno-card__center">{getCardLabel(card)}</span>
          <span className="uno-card__corner uno-card__corner--bottom">{getCardLabel(card)}</span>
        </button>
      )}
    </div>
  )
}
