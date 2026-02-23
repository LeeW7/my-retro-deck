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

  const infoPills: string[] = []
  if (game.developer) infoPills.push(game.developer)
  if (game.genre) infoPills.push(game.genre.split(';')[0].trim())
  if (year) infoPills.push(year)
  if (game.rating) infoPills.push(game.rating)

  const hasBoxArt = game.images.boxFront && !imgError
  const hasClearLogo = game.images.clearLogo && !imgError

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Box Art / Logo */}
      <div className="flex-1 flex items-center justify-center min-h-0 mb-3">
        {hasBoxArt ? (
          <img
            src={game.images.boxFront}
            alt={game.title}
            className="max-h-full max-w-[80%] object-contain rounded-lg shadow-2xl shadow-cyan-500/20"
            onError={() => setImgError(true)}
          />
        ) : hasClearLogo ? (
          <img
            src={game.images.clearLogo}
            alt={game.title}
            className="max-h-[60%] max-w-[80%] object-contain"
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

      {/* Info Pills */}
      {infoPills.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-3">
          {infoPills.map((pill) => (
            <span
              key={pill}
              className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-600/50"
            >
              {pill}
            </span>
          ))}
        </div>
      )}

      {/* Play Stats */}
      {(game.playCount > 0 || playTime) && (
        <div className="flex justify-center gap-4 mb-2 text-xs text-slate-400">
          {game.playCount > 0 && (
            <span>
              Played {game.playCount} time{game.playCount !== 1 ? 's' : ''}
            </span>
          )}
          {playTime && <span>{playTime} total</span>}
        </div>
      )}
    </div>
  )
}

export default GameInfoView
