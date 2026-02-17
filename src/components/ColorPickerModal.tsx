import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { COLORS } from '../engine'
import type { CardColor } from '../engine'

gsap.registerPlugin(useGSAP)

interface ColorPickerModalProps {
  open: boolean
  onPick: (color: Exclude<CardColor, 'wild'>) => void
}

export function ColorPickerModal({ open, onPick }: ColorPickerModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const colorLabel = {
    red: 'أحمر',
    yellow: 'أصفر',
    green: 'أخضر',
    blue: 'أزرق',
  } as const

  useGSAP(
    () => {
      if (!overlayRef.current) return
      const panel = overlayRef.current.querySelector('.color-picker')
      if (!panel) return

      if (open) {
        gsap.set(overlayRef.current, { display: 'grid' })
        gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.18 })
        gsap.fromTo(panel, { y: 24, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.24, ease: 'power2.out' })
      } else {
        gsap.to(panel, { y: 18, opacity: 0, scale: 0.96, duration: 0.16, ease: 'power1.in' })
        gsap.to(overlayRef.current, {
          opacity: 0,
          duration: 0.16,
          onComplete: () => {
            if (overlayRef.current) gsap.set(overlayRef.current, { display: 'none' })
          },
        })
      }
    },
    { dependencies: [open], scope: overlayRef },
  )

  return (
    <div ref={overlayRef} className="color-picker-overlay" style={{ display: open ? 'grid' : 'none' }}>
      <div className="color-picker" role="dialog" aria-modal aria-label="اختر لونًا">
        <h3>اختيار اللون</h3>
        <div className="color-picker__grid">
          {COLORS.map((color) => (
            <button key={color} type="button" className="color-pill" data-color={color} onClick={() => onPick(color)}>
              {colorLabel[color]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
