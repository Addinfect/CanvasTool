import { Line, Arrow, Text, Group } from 'react-konva'
import { useCanvasStore } from '../store/useCanvasStore'
import { CanvasEdge, CanvasNode } from '../types'

const EdgeRenderer = () => {
  const { nodes, edges, selectedEdgeIds, setSelectedEdgeIds } = useCanvasStore()

  const getNodeCenter = (nodeId: string): { x: number; y: number } | null => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return null
    return {
      x: node.x + node.width / 2,
      y: node.y + node.height / 2
    }
  }

  const handleEdgeClick = (edgeId: string, e: any) => {
    if (e.evt.ctrlKey || e.evt.metaKey) {
      // Multi-select
      const isSelected = selectedEdgeIds.includes(edgeId)
      if (isSelected) {
        setSelectedEdgeIds(selectedEdgeIds.filter(id => id !== edgeId))
      } else {
        setSelectedEdgeIds([...selectedEdgeIds, edgeId])
      }
    } else {
      // Single select
      setSelectedEdgeIds([edgeId])
    }
  }

  const renderEdge = (edge: CanvasEdge) => {
    const fromCenter = getNodeCenter(edge.fromNode)
    const toCenter = getNodeCenter(edge.toNode)
    
    if (!fromCenter || !toCenter) return null

    const isSelected = selectedEdgeIds.includes(edge.id)
    const stroke = edge.color || (isSelected ? '#4a9eff' : '#666')
    const strokeWidth = isSelected ? 3 : 2
    const dash = edge.style === 'dashed' ? [10, 5] : 
                 edge.style === 'dotted' ? [2, 5] : 
                 undefined

    // Calculate direction for arrow
    const dx = toCenter.x - fromCenter.x
    const dy = toCenter.y - fromCenter.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const unitX = dx / distance
    const unitY = dy / distance

    // Offset from node edges (so arrow doesn't overlap node)
    const offset = 10
    const startX = fromCenter.x + unitX * offset
    const startY = fromCenter.y + unitY * offset
    const endX = toCenter.x - unitX * offset
    const endY = toCenter.y - unitY * offset

    // Bezier curve control points for curved edges
    const midX = (startX + endX) / 2
    const midY = (startY + endY) / 2
    const cp1x = midX + unitY * 30 // perpendicular offset
    const cp1y = midY - unitX * 30

    return (
      <Group
        key={edge.id}
        onClick={(e) => handleEdgeClick(edge.id, e)}
        onTap={(e) => handleEdgeClick(edge.id, e)}
      >
        <Line
          points={[startX, startY, cp1x, cp1y, endX, endY]}
          stroke={stroke}
          strokeWidth={strokeWidth}
          dash={dash}
          lineCap="round"
          lineJoin="round"
          tension={0.5}
          bezier
        />
        <Arrow
          points={[endX - unitX * 5, endY - unitY * 5, endX, endY]}
          stroke={stroke}
          fill={stroke}
          strokeWidth={strokeWidth}
          pointerLength={10}
          pointerWidth={10}
        />
        {edge.label && (
          <Text
            text={edge.label}
            x={midX + unitY * 20}
            y={midY - unitX * 20}
            fill="#ffffff"
            fontSize={12}
            fontFamily="Inter, sans-serif"
            padding={5}
            background="#2d2d2d"
            cornerRadius={3}
          />
        )}
      </Group>
    )
  }

  return <>{edges.map(renderEdge)}</>
}

export default EdgeRenderer