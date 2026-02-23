import { useState, useEffect, useCallback } from 'react'
import type { CompanionState, ControllerPositionMap, GameInfo } from '../../shared/types'
import GameInfoView from './components/GameInfoView'
import ControllerReferenceView from './components/ControllerReferenceView'
import ActionBar from './components/ActionBar'

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

type ActiveTab = 'info' | 'controls'

function ActiveGameView({
  game,
  emulatorProcess,
  controllerMap,
  onCloseGame,
  onSaveState,
  onLoadState
}: {
  game: GameInfo
  emulatorProcess: string
  controllerMap?: ControllerPositionMap
  onCloseGame: () => void
  onSaveState: () => void
  onLoadState: () => void
}): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<ActiveTab>('info')
  const isRetroArch = emulatorProcess.toLowerCase().includes('retroarch')

  const tabs: { id: ActiveTab; label: string }[] = [
    { id: 'info', label: 'Info' },
    { id: 'controls', label: 'Controls' }
  ]

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
      <div className="relative z-10 flex flex-col h-full p-4">
        {/* Compact Header */}
        <div className="text-center mb-2">
          <span className="text-cyan-400/60 text-xs font-bold tracking-widest uppercase">
            Now Playing
          </span>
          <h2 className="text-cyan-400 text-lg font-bold tracking-wide truncate mt-0.5">
            {game.title}
          </h2>
          <span className="text-slate-400 text-xs font-medium tracking-wider uppercase">
            {game.platform}
          </span>
        </div>

        {/* Tab Bar */}
        <div className="flex justify-center gap-1 mb-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase
                transition-all duration-200 cursor-pointer border-2
                ${
                  activeTab === tab.id
                    ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400'
                    : 'border-slate-600/50 bg-slate-800/50 text-slate-400 hover:border-slate-500'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-h-0">
          {activeTab === 'info' && <GameInfoView game={game} />}
          {activeTab === 'controls' && (
            <ControllerReferenceView platformName={game.platform} controllerMap={controllerMap} />
          )}
        </div>

        {/* Persistent Action Bar */}
        <ActionBar
          isRetroArchGame={isRetroArch}
          onSaveState={onSaveState}
          onLoadState={onLoadState}
          onCloseGame={onCloseGame}
        />
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

  const handleSaveState = useCallback(() => {
    window.api.saveState()
  }, [])

  const handleLoadState = useCallback(() => {
    window.api.loadState()
  }, [])

  return (
    <div className={`h-screen w-screen bg-slate-900 ${hideCursor ? 'hide-cursor' : ''}`}>
      {state.status === 'idle' && <IdleView />}
      {state.status === 'game-active' && (
        <ActiveGameView
          game={state.game}
          emulatorProcess={state.emulatorProcess}
          controllerMap={state.controllerMap}
          onCloseGame={handleCloseGame}
          onSaveState={handleSaveState}
          onLoadState={handleLoadState}
        />
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
