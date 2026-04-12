import { Line, Arrow } from 'react-konva'
import { useCanvasStore } from '../store/useCanvasStore'
import { CanvasNode } from '../types'

const ConnectionCreator = () => {
  const { connectionStart, connectionTempEnd, nodes } = useCanvasStore()

  if (!connectionStart || !connectionTempEnd) return null

  // Find the starting node
  const startNode = nodes.find(n => n.id === connectionStart.nodeId)
  if (!startNode) return null

  // Calculate start point based on side
  let startX: number
  let startY: number
  
  switch (connectionStart.side) {
    case 'top':
      startX = startNode.x + startNode.width / 2
      startY = startNode.y
      break
    case 'right':
      startX = startNode.x + startNode.width
      startY = startNode.y + startNode.height / 2
      break
    case 'bottom':
      startX = startNode.x + startNode.width / 2
      startY = startNode.y + startNode.height
      break
    case 'left':
      startX = startNode.x
      startY = startNode.y + startNode.height / 2
      break
    default:
      startX = startNode.x + startNode.width / 2
      startY = startNode.y + startNode.height / 2
  }

  // Add small offset from node edge based on side
  const offset = 5
  let offsetStartX = startX
  let offsetStartY = startY
  
  switch (connectionStart.side) {
    case 'top':
      offsetStartY -= offset
      break
    case 'right':
      offsetStartX += offset
      break
    case 'bottom':
      offsetStartY += offset
      break
    case 'left':
      offsetStartX -= offset
      break
  }

  // Calculate direction vector
  const dx = connectionTempEnd.x - offsetStartX
  const dy = connectionTempEnd.y - offsetStartY
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  if (distance === 0) return null

  const unitX = dx / distance
  const unitY = dy / distance

  const adjustedStartX = offsetStartX
  const adjustedStartY = offsetStartY
  const adjustedEndX = connectionTempEnd.x
  const adjustedEndY = connectionTempEnd.y

  // Bezier control point for curved line
  const midX = (adjustedStartX + adjustedEndX) / 2
  const midY = (adjustedStartY + adjustedEndY) / 2
  const cp1x = midX + unitY * 30
  const cp1y = midY - unitX * 30

  return (
    <>
      <Line
        points={[adjustedStartX, adjustedStartY, cp1x, cp1y, adjustedEndX, adjustedEndY]}
        stroke="#4a9eff"
        strokeWidth={3}
        dash={[5, 5]}
        lineCap="round"
        lineJoin="round"
        tension={0.5}
        bezier
      />
      <Arrow
        points={[adjustedEndX - unitX * 5, adjustedEndY - unitY * 5, adjustedEndX, adjustedEndY]}
        stroke="#4a9eff"
        fill="#4a9eff"
        strokeWidth={3}
        pointerLength={10}
        pointerWidth={10}
      />
    </>
  )
}

export default ConnectionCreator