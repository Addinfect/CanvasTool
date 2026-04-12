import { Rect, Text, Group, Circle } from 'react-konva'
import { useCanvasStore } from '../store/useCanvasStore'
import { CanvasNode } from '../types'
import { useState, useRef, useEffect } from 'react'

interface NodeRendererProps {
  onNodeDoubleClick?: (nodeId: string) => void
}

const NodeRenderer = ({ onNodeDoubleClick }: NodeRendererProps) => {
  const { nodes, selectedNodeIds, updateNode, setSelectedNodeIds, startConnection, cancelConnection, zoom, pan } = useCanvasStore()
  
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)

  useEffect(() => {
    console.log('NodeRenderer: nodes count:', nodes.length)
  }, [nodes])

  const handleNodeDrag = (node: CanvasNode, e: any) => {
    const newX = e.target.x()
    const newY = e.target.y()
    updateNode(node.id, { x: newX, y: newY })
  }

  const handleNodeClick = (nodeId: string, e: any) => {
    if (e.evt.ctrlKey || e.evt.metaKey) {
      // Multi-select
      const isSelected = selectedNodeIds.includes(nodeId)
      if (isSelected) {
        setSelectedNodeIds(selectedNodeIds.filter(id => id !== nodeId))
      } else {
        setSelectedNodeIds([...selectedNodeIds, nodeId])
      }
    } else {
      // Single select
      setSelectedNodeIds([nodeId])
    }
  }

  const handleNodeDoubleClick = (node: CanvasNode, e: any) => {
    e.cancelBubble = true
    if (onNodeDoubleClick) {
      onNodeDoubleClick(node.id)
    }
  }

  const renderConnectionHandles = (node: CanvasNode) => {
    const handleSize = 12
    const positions = [
      { side: 'top' as const, x: node.width / 2, y: 0 },
      { side: 'right' as const, x: node.width, y: node.height / 2 },
      { side: 'bottom' as const, x: node.width / 2, y: node.height },
      { side: 'left' as const, x: 0, y: node.height / 2 }
    ]

    return positions.map((pos, index) => (
      <Circle
        key={index}
        x={pos.x}
        y={pos.y}
        radius={handleSize}
        fill="#4a9eff"
        stroke="white"
        strokeWidth={1}
        onMouseDown={(e) => {
          e.cancelBubble = true
          const stage = e.target.getStage()
          const pointerPos = stage.getPointerPosition()
          if (!pointerPos) return
          
          const { zoom, pan } = useCanvasStore.getState()
          const canvasX = (pointerPos.x - pan.x) / zoom
          const canvasY = (pointerPos.y - pan.y) / zoom
          
          startConnection(node.id, pos.side, canvasX, canvasY)
          
          // Change cursor to crosshair
          stage.container().style.cursor = 'crosshair'
        }}
        onMouseEnter={(e) => {
          e.target.getStage().container().style.cursor = 'crosshair'
        }}
        onMouseLeave={(e) => {
          if (!useCanvasStore.getState().connectionStart) {
            e.target.getStage().container().style.cursor = 'grab'
          }
        }}
        onClick={(e) => {
          e.cancelBubble = true // Prevent click from selecting the node
        }}
        onTap={(e) => {
          e.cancelBubble = true // Prevent tap from selecting the node
        }}
      />
    ))
  }

  const renderNode = (node: CanvasNode) => {
    console.log('Rendering node:', node.id, node.type, node.x, node.y)

    const isSelected = selectedNodeIds.includes(node.id)    
    // Base styling
    const fill = node.color || '#ff9900' // Bright orange for debugging
    const stroke = isSelected ? '#4a9eff' : '#666'
    const strokeWidth = isSelected ? 2 : 1
    
    switch (node.type) {
      case 'text':
        return (
          <Group
            key={node.id}
            x={node.x}
            y={node.y}
            draggable
            onDragMove={(e) => handleNodeDrag(node, e)}
            onClick={(e) => handleNodeClick(node.id, e)}
            onDblClick={(e) => handleNodeDoubleClick(node, e)}
            onTap={(e) => handleNodeClick(node.id, e)}
            onMouseEnter={() => setHoveredNodeId(node.id)}
            onMouseLeave={() => setHoveredNodeId(null)}
          >
            <Rect
              width={node.width}
              height={node.height}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              cornerRadius={4}
            />
            <Text
              text={node.text || 'Text Node'}
              width={node.width - 20}
              height={node.height - 20}
              x={10}
              y={10}
              fill="#ffffff"
              fontSize={14}
              fontFamily="Inter, sans-serif"
              align="left"
              verticalAlign="top"
              padding={5}
            />
            {hoveredNodeId === node.id && renderConnectionHandles(node)}
          </Group>
        )
      
      case 'link':
        return (
          <Group
            key={node.id}
            x={node.x}
            y={node.y}
            draggable
            onDragMove={(e) => handleNodeDrag(node, e)}
            onClick={(e) => handleNodeClick(node.id, e)}
            onDblClick={(e) => handleNodeDoubleClick(node, e)}
            onTap={(e) => handleNodeClick(node.id, e)}
            onMouseEnter={() => setHoveredNodeId(node.id)}
            onMouseLeave={() => setHoveredNodeId(null)}
          >
            <Rect
              width={node.width}
              height={node.height}               fill="#0066ff" // Brighter blue for debugging
              stroke={stroke}
              strokeWidth={strokeWidth}
              cornerRadius={4}
            />
            <Text
              text={node.url || 'Link'}
              width={node.width - 20}
              height={node.height - 20}
              x={10}
              y={10}
              fill="#ffffff"
              fontSize={14}
              fontFamily="Inter, sans-serif"
              align="center"
              verticalAlign="middle"
            />
            {hoveredNodeId === node.id && renderConnectionHandles(node)}
          </Group>
        )
      
      case 'file':
        return (
          <Group
            key={node.id}
            x={node.x}
            y={node.y}
            draggable
            onDragMove={(e) => handleNodeDrag(node, e)}
            onClick={(e) => handleNodeClick(node.id, e)}
            onDblClick={(e) => handleNodeDoubleClick(node, e)}
            onTap={(e) => handleNodeClick(node.id, e)}
            onMouseEnter={() => setHoveredNodeId(node.id)}
            onMouseLeave={() => setHoveredNodeId(null)}
          >
            <Rect
              width={node.width}
              height={node.height}               fill="#00cc66" // Brighter green for debugging
              stroke={stroke}
              strokeWidth={strokeWidth}
              cornerRadius={4}
            />
            <Text
              text={node.file || 'File'}
              width={node.width - 20}
              height={node.height - 20}
              x={10}
              y={10}
              fill="#ffffff"
              fontSize={14}
              fontFamily="Inter, sans-serif"
              align="center"
              verticalAlign="middle"
            />
            {hoveredNodeId === node.id && renderConnectionHandles(node)}
          </Group>
        )
      
      case 'group':
        return (
          <Group
            key={node.id}
            x={node.x}
            y={node.y}
            draggable
            onDragMove={(e) => handleNodeDrag(node, e)}
            onClick={(e) => handleNodeClick(node.id, e)}
            onDblClick={(e) => handleNodeDoubleClick(node, e)}
            onTap={(e) => handleNodeClick(node.id, e)}
            onMouseEnter={() => setHoveredNodeId(node.id)}
            onMouseLeave={() => setHoveredNodeId(null)}
          >
            <Rect
              width={node.width}
              height={node.height}
              fill="rgba(59, 130, 246, 0.5)"
              stroke={stroke}
              strokeWidth={strokeWidth}
              dash={[5, 5]}
              cornerRadius={8}
            />
            <Text
              text={node.label || 'Group'}
              width={node.width}
              height={30}
              x={0}
              y={10}
              fill="#ffffff"
              fontSize={16}
              fontFamily="Inter, sans-serif"
              align="center"
              fontStyle="bold"
            />
            {hoveredNodeId === node.id && renderConnectionHandles(node)}
          </Group>
        )
      
      default:
        return null
    }
  }

  return <>{nodes.map(renderNode)}</>
}

export default NodeRenderer