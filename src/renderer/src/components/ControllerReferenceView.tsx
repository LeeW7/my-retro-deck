import { useState, useRef, useEffect } from 'react'
import { getControllerLayout } from '../../../shared/controller-layouts'
import type { ControllerPositionMap } from '../../../shared/types'

// --- Colors ---
const CYAN = '#22d3ee'
const DIM = '#374151'
const DIM_FILL = '#1F2937'

// Face button colors (Switch style — kids love these)
const FACE_COLORS = {
  faceTop: '#3B82F6', // X = blue
  faceLeft: '#FBBF24', // Y = yellow
  faceRight: '#10B981', // A = green
  faceBottom: '#EF4444' // B = red
}

type PositionKey = keyof ControllerPositionMap

// --- SVG helpers ---

function ButtonLabel({
  x,
  y,
  label,
  fontSize = 13,
  color = '#FFFFFF',
  onClick
}: {
  x: number
  y: number
  label: string
  fontSize?: number
  color?: string
  onClick?: () => void
}): React.JSX.Element {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fill={color}
      fontSize={fontSize}
      fontWeight="bold"
      fontFamily="system-ui, sans-serif"
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      {label}
    </text>
  )
}

function InlineEdit({
  x,
  y,
  width,
  initialValue,
  fontSize,
  onSave,
  onCancel
}: {
  x: number
  y: number
  width: number
  initialValue: string
  fontSize: number
  onSave: (value: string) => void
  onCancel: () => void
}): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Auto-focus and select all text when edit opens
    const input = inputRef.current
    if (input) {
      input.focus()
      input.select()
    }
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      const val = inputRef.current?.value.trim()
      if (val) onSave(val)
      else onCancel()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  const handleBlur = (): void => {
    const val = inputRef.current?.value.trim()
    if (val && val !== initialValue) onSave(val)
    else onCancel()
  }

  return (
    <foreignObject x={x - width / 2} y={y - fontSize} width={width} height={fontSize * 2.2}>
      <input
        ref={inputRef}
        defaultValue={initialValue}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        style={{
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.8)',
          border: `1px solid ${CYAN}`,
          borderRadius: 4,
          color: CYAN,
          fontSize: fontSize,
          fontWeight: 'bold',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: 0,
          outline: 'none'
        }}
      />
    </foreignObject>
  )
}

function EditableLabel({
  x,
  y,
  label,
  positionKey,
  fontSize = 13,
  color = '#FFFFFF',
  editWidth = 80,
  editing,
  onStartEdit,
  onSave,
  onCancel
}: {
  x: number
  y: number
  label: string
  positionKey: PositionKey
  fontSize?: number
  color?: string
  editWidth?: number
  editing: boolean
  onStartEdit: (key: PositionKey) => void
  onSave: (key: PositionKey, value: string) => void
  onCancel: () => void
}): React.JSX.Element {
  if (editing) {
    return (
      <InlineEdit
        x={x}
        y={y}
        width={editWidth}
        initialValue={label}
        fontSize={fontSize}
        onSave={(val) => onSave(positionKey, val)}
        onCancel={onCancel}
      />
    )
  }

  return (
    <ButtonLabel
      x={x}
      y={y}
      label={label}
      fontSize={fontSize}
      color={color}
      onClick={() => onStartEdit(positionKey)}
    />
  )
}

// --- Controller SVG ---

function ControllerSvg({
  positions,
  editingKey,
  onStartEdit,
  onSave,
  onCancel
}: {
  positions: ControllerPositionMap
  editingKey: PositionKey | null
  onStartEdit: (key: PositionKey) => void
  onSave: (key: PositionKey, value: string) => void
  onCancel: () => void
}): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 600 450"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(75, 75)">
        {/* Controller body */}
        <path
          d="M 120 25 C 60 25, 20 65, 20 125 V 200 C 20 240, 45 265, 70 280 C 90 292, 105 300, 105 300 L 130 250 C 130 250, 110 240, 95 230 C 75 215, 60 190, 60 160 V 125 C 60 85, 90 55, 130 55 H 320 C 360 55, 390 85, 390 125 V 160 C 390 190, 375 215, 355 230 C 340 240, 320 250, 320 250 L 345 300 C 345 300, 360 292, 380 280 C 405 265, 430 240, 430 200 V 125 C 430 65, 390 25, 330 25 H 120 Z"
          fill="#1F2937"
          stroke="#374151"
          strokeWidth={3}
        />

        {/* Shoulder grooves */}
        <path
          d="M 60 100 C 60 80, 75 65, 95 65 H 130"
          fill="none"
          stroke="#374151"
          strokeWidth={3}
        />
        <path
          d="M 390 100 C 390 80, 375 65, 355 65 H 320"
          fill="none"
          stroke="#374151"
          strokeWidth={3}
        />

        {/* === ZL / ZR Triggers (above the body) === */}
        <rect
          x={70}
          y={5}
          width={75}
          height={22}
          rx={11}
          fill={positions.triggerL ? 'rgba(34,211,238,0.15)' : DIM_FILL}
          stroke={positions.triggerL ? CYAN : DIM}
          strokeWidth={2}
        />
        {positions.triggerL && (
          <EditableLabel
            x={107}
            y={16}
            label={positions.triggerL}
            positionKey="triggerL"
            fontSize={11}
            color={CYAN}
            editing={editingKey === 'triggerL'}
            onStartEdit={onStartEdit}
            onSave={onSave}
            onCancel={onCancel}
          />
        )}

        <rect
          x={305}
          y={5}
          width={75}
          height={22}
          rx={11}
          fill={positions.triggerR ? 'rgba(34,211,238,0.15)' : DIM_FILL}
          stroke={positions.triggerR ? CYAN : DIM}
          strokeWidth={2}
        />
        {positions.triggerR && (
          <EditableLabel
            x={342}
            y={16}
            label={positions.triggerR}
            positionKey="triggerR"
            fontSize={11}
            color={CYAN}
            editing={editingKey === 'triggerR'}
            onStartEdit={onStartEdit}
            onSave={onSave}
            onCancel={onCancel}
          />
        )}

        {/* === L / R Shoulders === */}
        <rect
          x={75}
          y={32}
          width={65}
          height={18}
          rx={9}
          fill={positions.shoulderL ? 'rgba(34,211,238,0.15)' : DIM_FILL}
          stroke={positions.shoulderL ? CYAN : DIM}
          strokeWidth={2}
        />
        {positions.shoulderL && (
          <EditableLabel
            x={107}
            y={41}
            label={positions.shoulderL}
            positionKey="shoulderL"
            fontSize={10}
            color={CYAN}
            editing={editingKey === 'shoulderL'}
            onStartEdit={onStartEdit}
            onSave={onSave}
            onCancel={onCancel}
          />
        )}

        <rect
          x={310}
          y={32}
          width={65}
          height={18}
          rx={9}
          fill={positions.shoulderR ? 'rgba(34,211,238,0.15)' : DIM_FILL}
          stroke={positions.shoulderR ? CYAN : DIM}
          strokeWidth={2}
        />
        {positions.shoulderR && (
          <EditableLabel
            x={342}
            y={41}
            label={positions.shoulderR}
            positionKey="shoulderR"
            fontSize={10}
            color={CYAN}
            editing={editingKey === 'shoulderR'}
            onStartEdit={onStartEdit}
            onSave={onSave}
            onCancel={onCancel}
          />
        )}

        {/* === D-Pad === */}
        <g transform="translate(100, 125)">
          {positions.dpad ? (
            <>
              <rect x={-15} y={-45} width={30} height={90} fill="#94A3B8" rx={4} />
              <rect x={-45} y={-15} width={90} height={30} fill="#94A3B8" rx={4} />
              <circle cx={0} cy={0} r={10} fill="#64748B" />
              <path d="M 0 -35 L -8 -25 H 8 Z" fill="#64748B" />
              <path d="M 0 35 L 8 25 H -8 Z" fill="#64748B" />
              <path d="M -35 0 L -25 8 V -8 Z" fill="#64748B" />
              <path d="M 35 0 L 25 -8 V 8 Z" fill="#64748B" />
              <EditableLabel
                x={0}
                y={58}
                label={positions.dpad}
                positionKey="dpad"
                fontSize={11}
                color={CYAN}
                editing={editingKey === 'dpad'}
                onStartEdit={onStartEdit}
                onSave={onSave}
                onCancel={onCancel}
              />
            </>
          ) : (
            <>
              <rect x={-15} y={-45} width={30} height={90} fill="#334155" rx={4} opacity={0.4} />
              <rect x={-45} y={-15} width={90} height={30} fill="#334155" rx={4} opacity={0.4} />
            </>
          )}
        </g>

        {/* === Left Stick === */}
        <g transform="translate(165, 185)">
          <circle
            cx={0}
            cy={0}
            r={38}
            fill={DIM_FILL}
            stroke={positions.leftStick ? CYAN : DIM}
            strokeWidth={3}
          />
          <circle cx={0} cy={0} r={25} fill={positions.leftStick ? '#CBD5E1' : '#475569'} />
          <circle cx={0} cy={0} r={18} fill={positions.leftStick ? '#E2E8F0' : '#64748B'} />
          {positions.leftStick && (
            <EditableLabel
              x={0}
              y={50}
              label={positions.leftStick}
              positionKey="leftStick"
              fontSize={11}
              color={CYAN}
              editing={editingKey === 'leftStick'}
              onStartEdit={onStartEdit}
              onSave={onSave}
              onCancel={onCancel}
            />
          )}
          {positions.l3 && (
            <EditableLabel
              x={0}
              y={65}
              label={`click: ${positions.l3}`}
              positionKey="l3"
              fontSize={8}
              color={CYAN}
              editing={editingKey === 'l3'}
              onStartEdit={onStartEdit}
              onSave={onSave}
              onCancel={onCancel}
            />
          )}
        </g>

        {/* === Right Stick === */}
        <g transform="translate(285, 185)">
          <circle
            cx={0}
            cy={0}
            r={38}
            fill={DIM_FILL}
            stroke={positions.rightStick ? CYAN : DIM}
            strokeWidth={3}
          />
          <circle cx={0} cy={0} r={25} fill={positions.rightStick ? '#CBD5E1' : '#475569'} />
          <circle cx={0} cy={0} r={18} fill={positions.rightStick ? '#E2E8F0' : '#64748B'} />
          {positions.rightStick && (
            <EditableLabel
              x={0}
              y={50}
              label={positions.rightStick}
              positionKey="rightStick"
              fontSize={11}
              color={CYAN}
              editing={editingKey === 'rightStick'}
              onStartEdit={onStartEdit}
              onSave={onSave}
              onCancel={onCancel}
            />
          )}
          {positions.r3 && (
            <EditableLabel
              x={0}
              y={65}
              label={`click: ${positions.r3}`}
              positionKey="r3"
              fontSize={8}
              color={CYAN}
              editing={editingKey === 'r3'}
              onStartEdit={onStartEdit}
              onSave={onSave}
              onCancel={onCancel}
            />
          )}
        </g>

        {/* === Select (−) / Start (+) === */}
        <g transform="translate(225, 120)">
          <rect
            x={-35}
            y={-10}
            width={30}
            height={12}
            fill={positions.select ? '#94A3B8' : '#4B5563'}
            rx={6}
          />
          {positions.select && (
            <EditableLabel
              x={-20}
              y={15}
              label={positions.select}
              positionKey="select"
              fontSize={9}
              color={CYAN}
              editWidth={60}
              editing={editingKey === 'select'}
              onStartEdit={onStartEdit}
              onSave={onSave}
              onCancel={onCancel}
            />
          )}

          <rect
            x={5}
            y={-10}
            width={30}
            height={12}
            fill={positions.start ? '#94A3B8' : '#4B5563'}
            rx={6}
          />
          {positions.start && (
            <EditableLabel
              x={20}
              y={15}
              label={positions.start}
              positionKey="start"
              fontSize={9}
              color={CYAN}
              editWidth={60}
              editing={editingKey === 'start'}
              onStartEdit={onStartEdit}
              onSave={onSave}
              onCancel={onCancel}
            />
          )}
        </g>

        {/* Home LED bar */}
        <rect
          x={220}
          y={180}
          width={10}
          height={6}
          fill={DIM_FILL}
          stroke={DIM}
          strokeWidth={2}
          rx={3}
        />

        {/* === Face Buttons (colored, Switch style) === */}
        <g transform="translate(350, 125)">
          {/* Y — left — yellow */}
          <g transform="translate(-30, 0)">
            <circle
              cx={0}
              cy={0}
              r={18}
              fill={positions.faceLeft ? FACE_COLORS.faceLeft : '#4B5563'}
              opacity={positions.faceLeft ? 1 : 0.3}
            />
            {positions.faceLeft && (
              <EditableLabel
                x={0}
                y={0}
                label={positions.faceLeft}
                positionKey="faceLeft"
                fontSize={13}
                editing={editingKey === 'faceLeft'}
                onStartEdit={onStartEdit}
                onSave={onSave}
                onCancel={onCancel}
              />
            )}
          </g>

          {/* X — top — blue */}
          <g transform="translate(0, -30)">
            <circle
              cx={0}
              cy={0}
              r={18}
              fill={positions.faceTop ? FACE_COLORS.faceTop : '#4B5563'}
              opacity={positions.faceTop ? 1 : 0.3}
            />
            {positions.faceTop && (
              <EditableLabel
                x={0}
                y={0}
                label={positions.faceTop}
                positionKey="faceTop"
                fontSize={13}
                editing={editingKey === 'faceTop'}
                onStartEdit={onStartEdit}
                onSave={onSave}
                onCancel={onCancel}
              />
            )}
          </g>

          {/* A — right — green */}
          <g transform="translate(30, 0)">
            <circle
              cx={0}
              cy={0}
              r={18}
              fill={positions.faceRight ? FACE_COLORS.faceRight : '#4B5563'}
              opacity={positions.faceRight ? 1 : 0.3}
            />
            {positions.faceRight && (
              <EditableLabel
                x={0}
                y={0}
                label={positions.faceRight}
                positionKey="faceRight"
                fontSize={13}
                editing={editingKey === 'faceRight'}
                onStartEdit={onStartEdit}
                onSave={onSave}
                onCancel={onCancel}
              />
            )}
          </g>

          {/* B — bottom — red */}
          <g transform="translate(0, 30)">
            <circle
              cx={0}
              cy={0}
              r={18}
              fill={positions.faceBottom ? FACE_COLORS.faceBottom : '#4B5563'}
              opacity={positions.faceBottom ? 1 : 0.3}
            />
            {positions.faceBottom && (
              <EditableLabel
                x={0}
                y={0}
                label={positions.faceBottom}
                positionKey="faceBottom"
                fontSize={13}
                editing={editingKey === 'faceBottom'}
                onStartEdit={onStartEdit}
                onSave={onSave}
                onCancel={onCancel}
              />
            )}
          </g>
        </g>
      </g>
    </svg>
  )
}

// --- Main component ---

function ControllerReferenceView({
  platformName,
  controllerMap,
  gameTitle,
  onOverride
}: {
  platformName: string
  controllerMap?: ControllerPositionMap
  gameTitle?: string
  onOverride?: (positionKey: PositionKey, label: string) => void
}): React.JSX.Element {
  const [editingKey, setEditingKey] = useState<PositionKey | null>(null)
  const positions = controllerMap ?? getControllerLayout(platformName)?.positions

  if (!positions) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="text-slate-500 text-sm tracking-wider">
          No controller mapping available for {platformName}
        </span>
      </div>
    )
  }

  const handleStartEdit = (key: PositionKey): void => {
    if (gameTitle && onOverride) setEditingKey(key)
  }

  const handleSave = (key: PositionKey, value: string): void => {
    setEditingKey(null)
    onOverride?.(key, value)
  }

  const handleCancel = (): void => {
    setEditingKey(null)
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-0 px-2 py-2">
      <div className="w-full max-w-xl flex-1 min-h-0">
        <ControllerSvg
          positions={positions}
          editingKey={editingKey}
          onStartEdit={handleStartEdit}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
      {controllerMap && (
        <span className="text-cyan-400/40 text-[10px] tracking-wider uppercase mt-1">
          Game-specific controls{gameTitle && onOverride ? ' — tap label to edit' : ''}
        </span>
      )}
      {!controllerMap && (
        <span className="text-slate-500/50 text-[10px] tracking-wider uppercase mt-1">
          Platform default layout
        </span>
      )}
    </div>
  )
}

export default ControllerReferenceView
