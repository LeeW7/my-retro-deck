import { useState, useEffect } from 'react'
import type { GameImages } from '../../../shared/types'

interface ArtworkEntry {
  url: string
  label: string
}

/** Collect gallery-worthy images — prioritize screenshots & fanart over identity images */
function collectArtwork(images: GameImages): ArtworkEntry[] {
  const entries: ArtworkEntry[] = []

  // Primary gallery content: screenshots and fanart
  if (images.screenshot) entries.push({ url: images.screenshot, label: 'Screenshot' })
  if (images.fanartBackground) entries.push({ url: images.fanartBackground, label: 'Fan Art' })

  // Fallback: if no screenshot/fanart, show box art so the tab isn't empty
  if (entries.length === 0) {
    if (images.boxFront) entries.push({ url: images.boxFront, label: 'Box Art' })
    if (images.clearLogo) entries.push({ url: images.clearLogo, label: 'Logo' })
  }

  return entries
}

function ArtworkView({ images, title }: { images: GameImages; title: string }): React.JSX.Element {
  const artworks = collectArtwork(images)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [imgError, setImgError] = useState(false)

  // Cycle through available artworks within this view
  useEffect(() => {
    if (artworks.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % artworks.length)
      setImgError(false)
    }, 6000)
    return () => clearInterval(timer)
  }, [artworks.length])

  if (artworks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="text-slate-500 text-sm tracking-wider uppercase">
          No artwork available
        </span>
      </div>
    )
  }

  const current = artworks[currentIndex % artworks.length]

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-0 relative">
      {/* Image */}
      <div className="flex-1 flex items-center justify-center min-h-0 w-full px-2">
        {!imgError ? (
          <img
            key={current.url}
            src={current.url}
            alt={`${title} — ${current.label}`}
            className="max-h-full max-w-full object-contain rounded-lg shadow-2xl shadow-cyan-500/20 animate-fade-in"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-slate-500 text-sm tracking-wider">Image unavailable</span>
        )}
      </div>

      {/* Image label + indicator dots */}
      <div className="flex flex-col items-center gap-1 mt-2">
        <span className="text-slate-500 text-[10px] font-medium tracking-widest uppercase">
          {current.label}
        </span>
        {artworks.length > 1 && (
          <div className="flex justify-center gap-1.5">
            {artworks.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex % artworks.length ? 'bg-cyan-400 scale-125' : 'bg-slate-600'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ArtworkView
