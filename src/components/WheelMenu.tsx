import { Group, Circle, Text, Rect } from 'react-konva'
import { NodeType } from '../types'

interface WheelMenuProps {
  x: number
  y: number
  onSelect: (nodeType: NodeType) => void
  onClose: () => void
  zoom?: number
}

const WheelMenu = ({ x, y, onSelect, onClose, zoom = 1 }: WheelMenuProps) => {
  const baseRadius = 80
  const baseOptionRadius = 30
  const radius = baseRadius / zoom
  const optionRadius = baseOptionRadius / zoom
  
  // Four node types with icons and colors
  const options: { type: NodeType; label: string; icon: string; color: string }[] = [
    { type: 'text', label: 'Text', icon: '📝', color: '#ff9900' },
    { type: 'link', label: 'Link', icon: '🔗', color: '#0066ff' },
    { type: 'file', label: 'File', icon: '📁', color: '#00cc66' },
    { type: 'group', label: 'Group', icon: '📦', color: 'rgba(59, 130, 246, 0.5)' },
  ]
  
  // Calculate positions around the circle (0°, 90°, 180°, 270°)
  const positions = options.map((_, index) => {
    const angle = (index * Math.PI) / 2 // 0, π/2, π, 3π/2
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    }
  })

  return (
    <Group>
      {/* Semi-transparent backdrop to capture clicks and dim the background */}
      <Rect
        x={-10000}
        y={-10000}
        width={20000}
        height={20000}
        fill="rgba(0, 0, 0, 0.3)"
        onClick={onClose}
        onTap={onClose}
      />
      
      {/* Central circle */}
      <Circle
        x={x}
        y={y}
        radius={radius * 0.3}
        fill="#2d2d2d"
        stroke="#4a9eff"
        strokeWidth={2}
      />
      
      {/* Options around the circle */}
      {options.map((option, index) => {
        const pos = positions[index]
        const centerX = x + pos.x
        const centerY = y + pos.y
        
        // Scalable dimensions
        const iconOffset = optionRadius * 0.4
        const iconFontSize = optionRadius * 0.8
        const labelFontSize = optionRadius * 0.4
        const labelWidth = optionRadius * 1.3

        return (
          <Group
            key={option.type}
            onClick={() => onSelect(option.type)}
            onTap={() => onSelect(option.type)}
            onMouseEnter={(e) => {
              const stage = e.target.getStage()
              if (stage) stage.container().style.cursor = 'pointer'
            }}
            onMouseLeave={(e) => {
              const stage = e.target.getStage()
              if (stage) stage.container().style.cursor = 'default'
            }}
          >
            {/* Background circle */}
            <Circle
              x={centerX}
              y={centerY}
              radius={optionRadius}
              fill={option.color}
              stroke="#ffffff"
              strokeWidth={2}
            />

            {/* Icon */}
            <Text
              x={centerX - iconOffset}
              y={centerY - iconOffset}
              text={option.icon}
              fontSize={iconFontSize}
              fill="#ffffff"
            />

            {/* Label */}
            <Text
              x={centerX - labelWidth/2}
              y={centerY + optionRadius + 5}
              text={option.label}
              fontSize={labelFontSize}
              fill="#ffffff"
              width={labelWidth}
              align="center"
            />
          </Group>
        )
      })}      
      {/* Instruction text in center */}
      <Text
        x={x - 30}
        y={y - 8}
        text="Add Node"
        fontSize={12 / zoom}
        fill="#ffffff"
        width={60}
        align="center"
      />
    </Group>
  )
}

export default WheelMenu