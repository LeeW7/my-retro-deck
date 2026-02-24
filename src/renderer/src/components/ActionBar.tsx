import { useState, useEffect, useCallback } from 'react'

interface ActionBarProps {
  isRetroArchGame: boolean
  onSaveState: () => void
  onLoadState: () => void
  onCloseGame: () => void
  onKillLauncher: () => void
}

function ActionBar({
  isRetroArchGame,
  onSaveState,
  onLoadState,
  onCloseGame,
  onKillLauncher
}: ActionBarProps): React.JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false)

  // Close menu when clicking outside
  const handleBackdropClick = useCallback(() => {
    setMenuOpen(false)
  }, [])

  // Close menu on escape
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [menuOpen])

  return (
    <div className="flex justify-center gap-3 pt-2 pb-1 relative">
      {isRetroArchGame && (
        <>
          <button
            onClick={onSaveState}
            className="
              px-5 py-2.5 rounded-full text-sm font-bold tracking-wider uppercase
              transition-all duration-200 cursor-pointer
              border-2 border-cyan-500/50 bg-slate-800 text-cyan-400
              hover:border-cyan-400 hover:shadow-md hover:shadow-cyan-500/30
              active:bg-cyan-500/20
            "
          >
            Save State
          </button>
          <button
            onClick={onLoadState}
            className="
              px-5 py-2.5 rounded-full text-sm font-bold tracking-wider uppercase
              transition-all duration-200 cursor-pointer
              border-2 border-cyan-500/50 bg-slate-800 text-cyan-400
              hover:border-cyan-400 hover:shadow-md hover:shadow-cyan-500/30
              active:bg-cyan-500/20
            "
          >
            Load State
          </button>
        </>
      )}
      <button
        onClick={onCloseGame}
        className="
          px-5 py-2.5 rounded-full text-sm font-bold tracking-wider uppercase
          transition-all duration-200 cursor-pointer
          border-2 border-red-500/50 bg-slate-800 text-red-400
          hover:border-red-400 hover:shadow-md hover:shadow-red-500/30
          active:bg-red-500/20
        "
      >
        Close Game
      </button>

      {/* Overflow menu */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="
            w-10 h-10 rounded-full text-lg font-bold
            transition-all duration-200 cursor-pointer
            border-2 border-slate-600/50 bg-slate-800 text-slate-400
            hover:border-slate-500 hover:text-slate-300
            active:bg-slate-700/50
            flex items-center justify-center
          "
          aria-label="More options"
        >
          ⋯
        </button>

        {menuOpen && (
          <>
            {/* Invisible backdrop to close menu */}
            <div className="fixed inset-0 z-40" onClick={handleBackdropClick} />

            {/* Menu popover */}
            <div
              className="
                absolute bottom-full right-0 mb-2 z-50
                bg-slate-800 border-2 border-slate-600/50 rounded-lg
                shadow-xl shadow-black/30 overflow-hidden min-w-[160px]
              "
            >
              <button
                onClick={() => {
                  onKillLauncher()
                  setMenuOpen(false)
                }}
                className="
                  w-full px-4 py-2.5 text-left text-sm font-bold tracking-wider uppercase
                  text-amber-400 hover:bg-amber-500/10 cursor-pointer
                  transition-colors duration-150
                "
              >
                Kill Launcher
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ActionBar
