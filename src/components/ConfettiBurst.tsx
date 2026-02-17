import { useMemo, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

interface ConfettiBurstProps {
  show: boolean
}

const colors = ['var(--uno-red)', 'var(--uno-yellow)', 'var(--uno-green)', 'var(--uno-blue)', 'var(--accent)']

export function ConfettiBurst({ show }: ConfettiBurstProps) {
  const ref = useRef<HTMLDivElement>(null)
  const pieces = useMemo(() => Array.from({ length: 28 }, (_, i) => i), [])

  useGSAP(
    () => {
      if (!ref.current) return
      const nodes = ref.current.querySelectorAll<HTMLElement>('.confetti-piece')
      if (!show) {
        gsap.set(nodes, { opacity: 0 })
        return
      }

      gsap.fromTo(
        nodes,
        { opacity: 0, x: 0, y: 0, rotate: 0 },
        {
          opacity: 1,
          x: () => (Math.random() - 0.5) * 950,
          y: () => Math.random() * -550,
          rotate: () => Math.random() * 760,
          duration: 1.8,
          stagger: 0.02,
          ease: 'power2.out',
        },
      )
      gsap.to(nodes, { opacity: 0, duration: 0.4, delay: 1.35, stagger: 0.015 })
    },
    { dependencies: [show], scope: ref },
  )

  return (
    <div ref={ref} className="confetti-layer" aria-hidden>
      {pieces.map((piece) => (
        <span key={piece} className="confetti-piece" style={{ background: colors[piece % colors.length] }} />
      ))}
    </div>
  )
}
