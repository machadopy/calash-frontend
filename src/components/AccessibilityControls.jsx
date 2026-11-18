import { useEffect, useState } from 'react'
import api from '../services/api'
import './AccessibilityControls.css'

const HIGH_CONTRAST_KEY = 'calash.highContrast'
const FONT_SCALE_KEY = 'calash.fontScale'

const readStoredScale = () => {
  const stored = Number(localStorage.getItem(FONT_SCALE_KEY))
  return [100, 110, 120, 130, 140, 150].includes(stored) ? stored : 100
}

const applyPreferences = (highContrast, fontScale) => {
  const root = document.documentElement
  root.classList.toggle('high-contrast', highContrast)
  root.style.setProperty('--font-scale', String(fontScale / 100))
  root.dataset.fontScale = String(fontScale)
}

export default function AccessibilityControls() {
  const [highContrast, setHighContrast] = useState(
    () => localStorage.getItem(HIGH_CONTRAST_KEY) === 'true'
  )
  const [fontScale, setFontScale] = useState(readStoredScale)

  useEffect(() => {
    applyPreferences(highContrast, fontScale)
  }, [highContrast, fontScale])

  useEffect(() => {
    const syncFromApi = () => {
      if (!localStorage.getItem('accessToken')) return

      api.get('/users/me/accessibility/')
        .then(({ data }) => {
          const nextContrast = Boolean(data.high_contrast)
          const nextScale = [100, 110, 120, 130, 140, 150].includes(data.font_scale)
            ? data.font_scale
            : 100
          setHighContrast(nextContrast)
          setFontScale(nextScale)
          localStorage.setItem(HIGH_CONTRAST_KEY, String(nextContrast))
          localStorage.setItem(FONT_SCALE_KEY, String(nextScale))
        })
        .catch(() => {})
    }

    syncFromApi()
    window.addEventListener('calash:auth-changed', syncFromApi)
    return () => window.removeEventListener('calash:auth-changed', syncFromApi)
  }, [])

  const savePreferences = (nextContrast, nextScale) => {
    localStorage.setItem(HIGH_CONTRAST_KEY, String(nextContrast))
    localStorage.setItem(FONT_SCALE_KEY, String(nextScale))

    if (localStorage.getItem('accessToken')) {
      api.patch('/users/me/accessibility/', {
        high_contrast: nextContrast,
        font_scale: nextScale,
      }).catch(() => {})
    }
  }

  const toggleContrast = () => {
    const next = !highContrast
    setHighContrast(next)
    savePreferences(next, fontScale)
  }

  const changeFontScale = (delta) => {
    const next = Math.min(150, Math.max(100, fontScale + delta))
    setFontScale(next)
    savePreferences(highContrast, next)
  }

  return (
    <div className="accessibility-controls" aria-label="Controles de acessibilidade">
      <button
        type="button"
        className="accessibility-button accessibility-contrast"
        onClick={toggleContrast}
        aria-label="Alternar modo de alto contraste"
        aria-pressed={highContrast}
      >
        Contraste
      </button>
      <button
        type="button"
        className="accessibility-button"
        onClick={() => changeFontScale(-10)}
        disabled={fontScale === 100}
        aria-label="Diminuir tamanho da fonte"
      >
        A-
      </button>
      <button
        type="button"
        className="accessibility-button"
        onClick={() => changeFontScale(10)}
        disabled={fontScale === 150}
        aria-label="Aumentar tamanho da fonte"
      >
        A+
      </button>
    </div>
  )
}
