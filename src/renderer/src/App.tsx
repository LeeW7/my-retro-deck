import { useState, useEffect, useCallback } from 'react'
import type { CompanionState, GameInfo } from '../../shared/types'

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

function IdleView(): React.JSX.Element {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-6">
      <h1 className="text-cyan-400 text-3xl font-bold tracking-widest uppercase">Retro Deck</h1>
      <div className="w-16 h-0.5 bg-cyan-400/30 rounded-full" />
      <span className="text-slate-500 text-lg font-medium tracking-wider uppercase animate-pulse">
        Waiting for game...
      </span>
    </div>
  )
}

function ActiveGameView({
  game,
  onCloseGame
}: {
  game: GameInfo
  onCloseGame: () => void
}): React.JSX.Element {
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
  const hasAnyImage = hasBoxArt || hasClearLogo

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Background — fanart if available, otherwise subtle gradient */}
      {game.images.fanartBackground ? (
        <div
          className="absolute inset-0 bg-cover bg-center blur-sm opacity-20 scale-105"
          style={{ backgroundImage: `url("${game.images.fanartBackground}")` }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-800/50 via-slate-900 to-slate-900" />
      )}

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col h-full p-6">
        {/* Header */}
        <div className="text-center mb-3">
          <span className="text-cyan-400/60 text-xs font-bold tracking-widest uppercase">
            Now Playing
          </span>
        </div>

        {/* Box Art / Title Display */}
        <div className="flex-1 flex items-center justify-center min-h-0 mb-4">
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
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-0.5 bg-cyan-400/20 rounded-full" />
              <h2 className="text-cyan-400 text-3xl font-bold text-center tracking-wide leading-snug px-8">
                {game.title}
              </h2>
              <span className="text-slate-400 text-sm font-medium tracking-wider uppercase">
                {game.platform}
              </span>
              <div className="w-20 h-0.5 bg-cyan-400/20 rounded-full" />
            </div>
          )}
        </div>

        {/* Game Info — only show title/platform here if we have an image above */}
        {hasAnyImage && (
          <div className="text-center space-y-1 mb-3">
            <h2 className="text-cyan-400 text-xl font-bold tracking-wide">{game.title}</h2>
            <span className="text-slate-400 text-sm font-medium tracking-wider uppercase">
              {game.platform}
            </span>
          </div>
        )}

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
          <div className="flex justify-center gap-4 mb-4 text-xs text-slate-400">
            {game.playCount > 0 && (
              <span>
                Played {game.playCount} time{game.playCount !== 1 ? 's' : ''}
              </span>
            )}
            {playTime && <span>{playTime} total</span>}
          </div>
        )}

        {/* Action Bar */}
        <div className="flex justify-center pt-1">
          <button
            onClick={onCloseGame}
            className="
              px-6 py-2.5 rounded-full text-sm font-bold tracking-wider uppercase
              transition-all duration-200 cursor-pointer
              border-2 border-red-500/50 bg-slate-800 text-red-400
              hover:border-red-400 hover:shadow-md hover:shadow-red-500/30
              active:bg-red-500/20
            "
          >
            Close Game
          </button>
        </div>
      </div>
    </div>
  )
}

function DevControls(): React.JSX.Element {
  const [mockGames, setMockGames] = useState<GameInfo[]>([])
  const [mockIndex, setMockIndex] = useState(0)

  useEffect(() => {
    window.api.getMockGames().then(setMockGames)
  }, [])

  return (
    <div className="absolute bottom-3 right-3 z-50 flex gap-2">
      <button
        onClick={() => {
          if (mockGames.length > 0) {
            window.api.simulateGame(mockGames[mockIndex])
            setMockIndex((i) => (i + 1) % mockGames.length)
          }
        }}
        className="
          px-3 py-1.5 rounded text-xs font-medium
          bg-cyan-900/60 text-cyan-300 border border-cyan-700/50
          hover:bg-cyan-800/60 cursor-pointer
        "
      >
        Sim Game
      </button>
      <button
        onClick={() => window.api.simulateGame(null)}
        className="
          px-3 py-1.5 rounded text-xs font-medium
          bg-slate-800/60 text-slate-400 border border-slate-700/50
          hover:bg-slate-700/60 cursor-pointer
        "
      >
        Sim Idle
      </button>
    </div>
  )
}

function App(): React.JSX.Element {
  const [state, setState] = useState<CompanionState>({ status: 'idle' })
  const [hideCursor, setHideCursor] = useState(true)
  const [devMode, setDevMode] = useState(false)

  useEffect(() => {
    window.api.getDevMode().then((dm) => {
      setHideCursor(!dm)
      setDevMode(dm)
    })
  }, [])

  // Get initial state
  useEffect(() => {
    window.api.getCompanionState().then(setState)
  }, [])

  // Subscribe to state changes
  useEffect(() => {
    const cleanup = window.api.onCompanionStateChanged((newState) => {
      setState(newState)
    })
    return cleanup
  }, [])

  const handleCloseGame = useCallback(() => {
    window.api.closeGame()
  }, [])

  return (
    <div className={`h-screen w-screen bg-slate-900 ${hideCursor ? 'hide-cursor' : ''}`}>
      {state.status === 'idle' && <IdleView />}
      {state.status === 'game-active' && (
        <ActiveGameView game={state.game} onCloseGame={handleCloseGame} />
      )}
      {state.status === 'error' && (
        <div className="h-full flex items-center justify-center">
          <span className="text-red-400 text-xl font-bold tracking-widest">{state.message}</span>
        </div>
      )}
      {devMode && <DevControls />}
    </div>
  )
}

export default App
