import { useState, useEffect, useCallback } from 'react'
import type { Platform } from '../../shared/types'

function getGridClass(count: number): string {
  if (count <= 4) return 'grid-cols-2'
  return 'grid-cols-3'
}

function App(): React.JSX.Element {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activePlatformId, setActivePlatformId] = useState<string | null>(null)
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

  useEffect(() => {
    window.api
      .getPlatforms()
      .then((result) => {
        setPlatforms(result)
        setLoading(false)
      })
      .catch((err) => {
        console.error('[RetroDeck] Failed to load platforms:', err)
        setError('Failed to load platforms')
        setLoading(false)
      })
  }, [])

  const handleLaunch = useCallback((platform: Platform) => {
    if (activePlatformId) return

    setActivePlatformId(platform.id)
    window.api.launchPlatform(platform)

    setTimeout(() => {
      setActivePlatformId(null)
    }, 3000)
  }, [activePlatformId])

  const handleHome = useCallback(() => {
    if (activePlatformId) return

    setActivePlatformId('__home__')
    window.api.launchHome()

    setTimeout(() => {
      setActivePlatformId(null)
    }, 3000)
  }, [activePlatformId])

  const handleKillAll = useCallback(() => {
    if (activePlatformId) return
    window.api.killAll()
  }, [activePlatformId])

  const handleShutdown = useCallback(() => {
    if (activePlatformId) return
    window.api.shutdown()
  }, [activePlatformId])

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex items-center justify-center">
        <span className="text-cyan-400 text-2xl font-bold tracking-widest animate-pulse">
          SCANNING PLATFORMS...
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex items-center justify-center">
        <span className="text-red-400 text-2xl font-bold tracking-widest">{error}</span>
      </div>
    )
  }

  const gridClass = getGridClass(platforms.length)

  return (
    <div className="h-screen w-screen bg-slate-900 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handleHome}
          disabled={activePlatformId !== null}
          className={`
            px-4 py-2.5 rounded-full text-sm font-bold tracking-wider uppercase transition-all duration-200
            border-2 border-cyan-400/50
            ${activePlatformId === '__home__'
              ? 'bg-cyan-400 text-slate-900'
              : 'bg-slate-800 text-cyan-400 hover:border-cyan-400 hover:shadow-md hover:shadow-cyan-500/30'
            }
            disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer
          `}
        >
          All Games
        </button>

        <h1 className="text-cyan-400 text-2xl font-bold tracking-widest text-center uppercase">
          Retro Deck
        </h1>

        <div className="flex items-center gap-2">
          <button
            onClick={handleKillAll}
            disabled={activePlatformId !== null}
            className="
              px-4 py-2.5 rounded-full text-sm font-bold tracking-wider uppercase transition-all duration-200
              border-2 border-red-500/50 bg-slate-800 text-red-400
              hover:border-red-400 hover:shadow-md hover:shadow-red-500/30
              disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer
            "
          >
            Back
          </button>
          <button
            onClick={handleShutdown}
            disabled={activePlatformId !== null}
            className="
              px-4 py-2.5 rounded-full text-sm font-bold tracking-wider uppercase transition-all duration-200
              border-2 border-red-700/50 bg-slate-800 text-red-500
              hover:border-red-600 hover:shadow-md hover:shadow-red-700/30
              disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer
            "
          >
            Shutdown
          </button>
        </div>
      </div>

      <div className={`grid ${gridClass} gap-4 flex-1 overflow-y-auto`}>
        {platforms.map((platform) => {
          const isActive = activePlatformId === platform.id

          return (
            <button
              key={platform.id}
              onClick={() => handleLaunch(platform)}
              disabled={activePlatformId !== null}
              className={`
                relative overflow-hidden rounded-lg border-2 transition-all duration-200 min-h-[140px]
                ${isActive
                  ? 'border-cyan-300 shadow-lg shadow-cyan-500/50'
                  : 'border-cyan-400/50 hover:border-cyan-400 hover:shadow-md hover:shadow-cyan-500/30'
                }
                ${activePlatformId && !isActive ? 'opacity-40' : ''}
                bg-slate-800 cursor-pointer disabled:cursor-not-allowed
                flex items-center justify-center
              `}
            >
              {platform.imageUrl && !failedImages.has(platform.id) ? (
                <img
                  src={platform.imageUrl}
                  alt={platform.name}
                  className="max-h-full max-w-[90%] object-contain p-3"
                  onError={() => setFailedImages((prev) => new Set(prev).add(platform.id))}
                />
              ) : (
                <span className="text-white font-bold text-lg text-center px-3">
                  {platform.name}
                </span>
              )}

              <div className="absolute bottom-1 right-2">
                <span className="text-cyan-400/60 text-xs">{platform.gameCount} games</span>
              </div>

              {isActive && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <span className="text-cyan-400 text-xl font-bold tracking-widest animate-pulse">
                    LAUNCHING...
                  </span>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default App
