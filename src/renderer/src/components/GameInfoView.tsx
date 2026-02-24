import { useState } from 'react'
import type { GameInfo } from '../../../shared/types'

function formatPlayTime(seconds: number): string {
  if (seconds === 0) return ''
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function formatYear(dateStr: string): string {
  if (!dateStr) return ''
  const match = dateStr.match(/^\d{4}/)
  return match ? match[0] : ''
}

function GameInfoView({ game }: { game: GameInfo }): React.JSX.Element {
  const [imgError, setImgError] = useState(false)
  const year = formatYear(game.releaseDate)
  const playTime = formatPlayTime(game.playTime)

  const hasBoxArt = game.images.boxFront && !imgError
  const hasClearLogo = game.images.clearLogo && !imgError

  // Build structured metadata rows
  const metaRows: { label: string; value: string }[] = []
  if (game.developer) metaRows.push({ label: 'Developer', value: game.developer })
  if (game.genre) metaRows.push({ label: 'Genre', value: game.genre.split(';')[0].trim() })
  if (year) metaRows.push({ label: 'Released', value: year })
  if (game.rating) metaRows.push({ label: 'Rating', value: game.rating })

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Box Art / Logo — constrained height so metadata stays visible */}
      <div className="flex items-center justify-center min-h-0 mb-3 max-h-[55%]">
        {hasBoxArt ? (
          <img
            src={game.images.boxFront}
            alt={game.title}
            className="max-h-full max-w-[70%] object-contain rounded-lg shadow-2xl shadow-cyan-500/20"
            onError={() => setImgError(true)}
          />
        ) : hasClearLogo ? (
          <img
            src={game.images.clearLogo}
            alt={game.title}
            className="max-h-[70%] max-w-[70%] object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-0.5 bg-cyan-400/20 rounded-full" />
            <span className="text-slate-500 text-sm tracking-wider uppercase">
              No artwork available
            </span>
            <div className="w-16 h-0.5 bg-cyan-400/20 rounded-full" />
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="w-12 h-0.5 bg-cyan-400/20 rounded-full mx-auto mb-3" />

      {/* Metadata Grid */}
      {metaRows.length > 0 && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 px-4 mb-3 max-w-[320px] mx-auto">
          {metaRows.map((row) => (
            <div key={row.label} className="flex flex-col">
              <span className="text-slate-500 text-[10px] font-bold tracking-widest uppercase">
                {row.label}
              </span>
              <span className="text-slate-200 text-sm font-medium truncate">{row.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Play Stats */}
      {(game.playCount > 0 || playTime) && (
        <div className="flex justify-center gap-4 mb-2">
          {game.playCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-cyan-400/60">▶</span>
              <span>
                Played {game.playCount} time{game.playCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          {playTime && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-cyan-400/60">⏱</span>
              <span>{playTime} total</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default GameInfoView
