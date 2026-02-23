interface ActionBarProps {
  isRetroArchGame: boolean
  onSaveState: () => void
  onLoadState: () => void
  onCloseGame: () => void
}

function ActionBar({
  isRetroArchGame,
  onSaveState,
  onLoadState,
  onCloseGame
}: ActionBarProps): React.JSX.Element {
  return (
    <div className="flex justify-center gap-3 pt-2 pb-1">
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
    </div>
  )
}

export default ActionBar
