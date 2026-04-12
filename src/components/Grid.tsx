import { Line } from 'react-konva'
import { useCanvasStore } from '../store/useCanvasStore'

interface GridProps {
  stageWidth: number
  stageHeight: number
}

const Grid = ({ stageWidth, stageHeight }: GridProps) => {
  const { gridSize, gridVisible, zoom, pan } = useCanvasStore()

  if (!gridVisible) return null

  // Add padding around stage for panning (1.5x stage size in each direction)
  const padding = Math.max(stageWidth, stageHeight) * 1.5
  const totalWidth = stageWidth + padding * 2
  const totalHeight = stageHeight + padding * 2
  
  // Offset grid to center on stage
  const offsetX = pan.x % (gridSize * zoom)
  const offsetY = pan.y % (gridSize * zoom)
  const startX = -padding + offsetX
  const startY = -padding + offsetY

  const lines = []
  const strokeWidth = 1 / zoom

  // Vertical lines
  for (let x = startX; x < totalWidth; x += gridSize * zoom) {
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, -padding, x, totalHeight]}
        stroke="#555"
        strokeWidth={strokeWidth}
        dash={[2, 2]}
      />
    )
  }

  // Horizontal lines
  for (let y = startY; y < totalHeight; y += gridSize * zoom) {
    lines.push(
      <Line
        key={`h-${y}`}
        points={[-padding, y, totalWidth, y]}
        stroke="#555"
        strokeWidth={strokeWidth}
        dash={[2, 2]}
      />
    )
  }

  return <>{lines}</>
}
export default Grid