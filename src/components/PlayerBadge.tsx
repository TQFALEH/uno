import clsx from 'clsx'

interface PlayerBadgeProps {
  name: string
  cardsCount: number
  isCurrent: boolean
  isUnoRisk: boolean
}

export function PlayerBadge({ name, cardsCount, isCurrent, isUnoRisk }: PlayerBadgeProps) {
  return (
    <div className={clsx('player-badge', { 'player-badge--current': isCurrent, 'player-badge--danger': isUnoRisk })}>
      <p className="player-badge__name">{name}</p>
      <p className="player-badge__count">{cardsCount} بطاقة</p>
    </div>
  )
}
