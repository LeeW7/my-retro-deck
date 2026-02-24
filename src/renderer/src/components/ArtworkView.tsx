import { useState, useEffect } from 'react'
import type { GameImages } from '../../../shared/types'

/** Collect all non-empty image URLs from game images */
function collectImages(images: GameImages): string[] {
  const urls: string[] = []
  if (images.screenshot) urls.push(images.screenshot)
  if (images.boxFront) urls.push(images.boxFront)
  if (images.clearLogo) urls.push(images.clearLogo)
  return urls
}

function ArtworkView({ images, title }: { images: GameImages; title: string }): React.JSX.Element {
  const artworks = collectImages(images)
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

  const currentUrl = artworks[currentIndex % artworks.length]

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-0 relative">
      <div className="flex-1 flex items-center justify-center min-h-0 w-full">
        {!imgError ? (
          <img
            key={currentUrl}
            src={currentUrl}
            alt={`${title} artwork`}
            className="max-h-full max-w-[90%] object-contain rounded-lg shadow-2xl shadow-cyan-500/20 animate-fade-in"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-slate-500 text-sm tracking-wider">Image unavailable</span>
        )}
      </div>

      {/* Image indicator dots */}
      {artworks.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
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
  )
}

export default ArtworkView
