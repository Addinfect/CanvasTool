import { Stage, Layer, Rect, Text, Group, Circle, Line } from 'react-konva'
import { useRef, useEffect, useState } from 'react'

import { useCanvasStore } from '../store/useCanvasStore'
import { NodeType, CanvasNode, CanvasEdge } from '../types'
import WheelMenu from './WheelMenu'
import './Canvas.css'

const Canvas = () => {
  const stageRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })
  const [wheelMenu, setWheelMenu] = useState<{ x: number; y: number } | null>(null)
  const [draggingEdge, setDraggingEdge] = useState<{
    nodeId: string
    side: 'top' | 'right' | 'bottom' | 'left'
    startX: number
    startY: number
    currentX: number
    currentY: number
  } | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [inputStyle, setInputStyle] = useState({ left: 0, top: 0, width: 200, height: 30, backgroundColor: '#ff9900' })
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    nodes,
    edges,
    zoom,
    pan,
    selectedNodeIds,
    addNode,
    updateNode,
    setSelectedNodeIds,
    addEdge,
    setZoom,
    setPan,
  } = useCanvasStore()
  console.log('Canvas nodes:', nodes.length, nodes)
  console.log('Pan:', pan.x, pan.y, 'Zoom:', zoom)
  // Inline editing handlers
  const handleNodeDoubleClick = (nodeId: string) => {
    setEditingNodeId(nodeId)

    const node = nodes.find(n => n.id === nodeId)
    if (!node) return

    console.log('Starting edit for node:', nodeId, node.type)
    
    // Set initial value based on node type
    switch (node.type) {
      case 'text':
        setEditValue(node.text || '')
        break
      case 'link':
        setEditValue(node.url || '')
        break
      case 'file':
        setEditValue(node.file || '')
        break
      case 'group':
        setEditValue(node.label || '')
        break
    }
  }

  const handleSaveEdit = () => {
    if (!editingNodeId) return

    const node = nodes.find(n => n.id === editingNodeId)
    if (!node) return

    const updates: any = {}
    switch (node.type) {
      case 'text':
        updates.text = editValue
        break
      case 'link':
        updates.url = editValue
        break
      case 'file':
        updates.file = editValue
        break
      case 'group':
        updates.label = editValue
        break
    }

    updateNode(editingNodeId, updates)
    setEditingNodeId(null)
    setEditValue('')
  }

  const handleCancelEdit = () => {
    setEditingNodeId(null)
    setEditValue('')
  }

  useEffect(() => {
    console.log('Canvas mounted, nodes:', nodes.length, 'edges:', edges.length)
  }, [])

  // Initialize stage size from container
  useEffect(() => {
    if (!containerRef.current) return

    const updateSize = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      console.log('Canvas container size:', rect.width, rect.height)
      setStageSize({ width: rect.width, height: rect.height })
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])


  // Focus input when editing starts
  useEffect(() => {
    if (editingNodeId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingNodeId])

  // Handle Enter/Escape keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editingNodeId) return

      if (e.key === 'Enter') {
        handleSaveEdit()
      } else if (e.key === 'Escape') {
        handleCancelEdit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editingNodeId, editValue])



  // Update input position when editing node changes
  useEffect(() => {
    if (!editingNodeId) return

    const node = nodes.find(n => n.id === editingNodeId)
    if (!node) return

    // Convert canvas coordinates to screen coordinates
    const screenX = node.x * zoom + pan.x
    const screenY = node.y * zoom + pan.y

    // Input should be positioned over the text area (10px padding)
    const inputX = screenX + 10 * zoom
    const inputY = screenY + 10 * zoom
    const inputWidth = Math.max(100, (node.width - 20) * zoom)
    const inputHeight = Math.max(30, (node.height - 20) * zoom)

    setInputStyle({
      left: inputX,
      top: inputY,
      width: inputWidth,
      height: inputHeight,
      backgroundColor: node.color || '#ff9900'
    })
  }, [editingNodeId, nodes, zoom, pan])

  // Pan and zoom handlers
  const handleWheel = (e: any) => {
    e.evt.preventDefault()
    const scaleBy = 1.1
    const stage = e.target.getStage()
    const oldScale = zoom
    const pointer = stage.getPointerPosition()

    if (!pointer) return

    const mousePointTo = {
      x: (pointer.x - pan.x) / oldScale,
      y: (pointer.y - pan.y) / oldScale,
    }

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy
    setZoom(newScale)

    const newPan = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    }
    setPan(newPan.x, newPan.y)
  }

  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const handleMouseDown = (e: any) => {
    // Save edit if clicking stage while editing
    if (editingNodeId && e.target === e.target.getStage()) {
      handleSaveEdit()
    }
    
    // Only pan when clicking background (stage)
    if (e.target === e.target.getStage()) {
      // Allow left (0) or middle (1) mouse button for panning
      if (e.evt.button === 0 || e.evt.button === 1) {
        e.evt.preventDefault()
        setIsDragging(true)
        setDragStart({ x: e.evt.clientX, y: e.evt.clientY })
      }
    }
  }

  const handleMouseMove = (e: any) => {
    if (!isDragging) return

    const dx = e.evt.clientX - dragStart.x
    const dy = e.evt.clientY - dragStart.y

    setPan(pan.x + dx, pan.y + dy)
    setDragStart({ x: e.evt.clientX, y: e.evt.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Double-click to show wheel menu
  const handleDoubleClick = (e: any) => {
    const stage = e.target.getStage()
    // Only show wheel menu when clicking on background (stage)
    if (e.target !== stage) return

    const pos = stage.getPointerPosition()
    if (!stage || !pos) return

    // Convert to canvas coordinates (adjust for pan and zoom)
    const canvasX = (pos.x - pan.x) / zoom
    const canvasY = (pos.y - pan.y) / zoom
    console.log('Wheel menu position:', canvasX, canvasY)

    // Show wheel menu at click position
    setWheelMenu({ x: canvasX, y: canvasY })
  }

  // Handle wheel menu selection
  const handleWheelMenuSelect = (nodeType: NodeType) => {
    if (!wheelMenu) return

    // Create node based on type
    const nodeId = `node-${Date.now()}`
    const newNode: CanvasNode = {
      id: nodeId,
      type: nodeType,
      x: wheelMenu.x,
      y: wheelMenu.y,
      width: nodeType === 'group' ? 300 : 200,
      height: nodeType === 'group' ? 200 : 150,
      text: nodeType === 'text' ? 'New Text Node' : undefined,
      url: nodeType === 'link' ? 'https://example.com' : undefined,
      file: nodeType === 'file' ? 'document.pdf' : undefined,
      label: nodeType === 'group' ? 'New Group' : undefined,
      color: nodeType === 'text' ? '#ff9900' :
             nodeType === 'link' ? '#0066ff' :
             nodeType === 'file' ? '#00cc66' :
             'rgba(59, 130, 246, 0.5)'
    }
    addNode(newNode)
    setWheelMenu(null)
  }

  // Close wheel menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && wheelMenu) {
        setWheelMenu(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [wheelMenu])

  // Node rendering
  const renderNode = (node: CanvasNode) => {
    console.log('Rendering node:', node.id, node.type, node.x, node.y)
    const isSelected = selectedNodeIds.includes(node.id)
    const fill = node.color || '#ff9900'
    const stroke = isSelected ? '#4a9eff' : '#666'
    const strokeWidth = isSelected ? 2 : 1

    return (
      <Group
        key={node.id}
        x={node.x}
        y={node.y}
        draggable
        onDragMove={(e) => {
          const newX = e.target.x()
          const newY = e.target.y()
          updateNode(node.id, { x: newX, y: newY })
        }}
        onClick={(e) => {
          if (e.evt.ctrlKey || e.evt.metaKey) {
            // Multi-select
            const isSelected = selectedNodeIds.includes(node.id)
            if (isSelected) {
              setSelectedNodeIds(selectedNodeIds.filter(id => id !== node.id))
            } else {
              setSelectedNodeIds([...selectedNodeIds, node.id])
            }
          } else {
            // Single select
            setSelectedNodeIds([node.id])
          }
        }}
        onDblClick={(e) => {
          e.cancelBubble = true
          console.log('Node double-click:', node.id)
          handleNodeDoubleClick(node.id)
        }}
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
        {editingNodeId !== node.id && (
          <Text
            text={node.text || node.url || node.file || node.label || node.type}
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
        )}
        {/* Connection handles */}
        {renderConnectionHandles(node, isSelected || node.id === hoveredNodeId)}
      </Group>
    )
  }

  const renderConnectionHandles = (node: CanvasNode, showHandles: boolean) => {
    if (!showHandles) return null

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

          const canvasX = (pointerPos.x - pan.x) / zoom
          const canvasY = (pointerPos.y - pan.y) / zoom

          setDraggingEdge({
            nodeId: node.id,
            side: pos.side,
            startX: canvasX,
            startY: canvasY,
            currentX: canvasX,
            currentY: canvasY
          })

          // Change cursor to crosshair
          stage.container().style.cursor = 'crosshair'
        }}
        onMouseEnter={(e) => {
          e.target.getStage().container().style.cursor = 'crosshair'
        }}
        onMouseLeave={(e) => {
          if (!draggingEdge) {
            e.target.getStage().container().style.cursor = 'grab'
          }
        }}
      />
    ))
  }

  // Edge rendering
  const renderEdge = (edge: CanvasEdge) => {
    const fromNode = nodes.find(n => n.id === edge.fromNode)
    const toNode = nodes.find(n => n.id === edge.toNode)
    
    if (!fromNode || !toNode) return null

    // Calculate connection points (center for now)
    const fromX = fromNode.x + fromNode.width / 2
    const fromY = fromNode.y + fromNode.height / 2
    const toX = toNode.x + toNode.width / 2
    const toY = toNode.y + toNode.height / 2

    return (
      <Line
        key={edge.id}
        points={[fromX, fromY, toX, toY]}
        stroke={edge.color || '#666'}
        strokeWidth={2}
        dash={edge.style === 'dashed' ? [10, 5] : edge.style === 'dotted' ? [2, 5] : undefined}
      />
    )
  }

  // Handle edge dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingEdge || !stageRef.current) return

      const stage = stageRef.current
      const pointerPos = stage.getPointerPosition()
      if (!pointerPos) return

      const canvasX = (pointerPos.x - pan.x) / zoom
      const canvasY = (pointerPos.y - pan.y) / zoom

      setDraggingEdge({
        ...draggingEdge,
        currentX: canvasX,
        currentY: canvasY
      })
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (!draggingEdge || !stageRef.current) return

      const stage = stageRef.current
      const pointerPos = stage.getPointerPosition()
      if (!pointerPos) return

      const canvasX = (pointerPos.x - pan.x) / zoom
      const canvasY = (pointerPos.y - pan.y) / zoom

      // Find node under cursor
      const targetNode = nodes.find(node => {
        return canvasX >= node.x && canvasX <= node.x + node.width &&
               canvasY >= node.y && canvasY <= node.y + node.height &&
               node.id !== draggingEdge.nodeId
      })

      if (targetNode) {
        // Create edge
        const edgeId = `edge-${Date.now()}`
        const newEdge: CanvasEdge = {
          id: edgeId,
          fromNode: draggingEdge.nodeId,
          toNode: targetNode.id,
          fromSide: draggingEdge.side,
          style: 'solid',
          color: '#666'
        }
        addEdge(newEdge)
      }

      setDraggingEdge(null)
      stage.container().style.cursor = 'grab'
    }

    if (draggingEdge) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [draggingEdge, zoom, pan, nodes, addEdge])

  // Generate grid lines for visible area
  const generateGridLines = () => {
    const gridSize = 50
    
    // Calculate visible area in canvas coordinates
    const visibleLeft = -pan.x / zoom
    const visibleTop = -pan.y / zoom
    const visibleRight = (stageSize.width - pan.x) / zoom
    const visibleBottom = (stageSize.height - pan.y) / zoom
    
    // Add some padding to ensure coverage
    const padding = gridSize * 2
    const startX = Math.floor((visibleLeft - padding) / gridSize) * gridSize
    const endX = Math.ceil((visibleRight + padding) / gridSize) * gridSize
    const startY = Math.floor((visibleTop - padding) / gridSize) * gridSize
    const endY = Math.ceil((visibleBottom + padding) / gridSize) * gridSize
    
    const verticalLines = []
    const horizontalLines = []
    
    // Generate vertical lines
    for (let x = startX; x <= endX; x += gridSize) {
      verticalLines.push({
        key: `v-${x}`,
        points: [x, startY, x, endY]
      })
    }
    
    // Generate horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
      horizontalLines.push({
        key: `h-${y}`,
        points: [startX, y, endX, y]
      })
    }
    
    return { verticalLines, horizontalLines }
  }

  // Debug overlay
  const debugInfo = `Stage: ${Math.round(stageSize.width)}x${Math.round(stageSize.height)} Zoom: ${zoom.toFixed(2)} Pan: ${Math.round(pan.x)},${Math.round(pan.y)} Nodes: ${nodes.length} Edges: ${edges.length}`

  return (
    <div className="canvas-container" ref={containerRef}>
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={zoom}
        scaleY={zoom}
        x={pan.x}
        y={pan.y}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDblClick={handleDoubleClick}
      >
        <Layer>
          {/* Full stage background */}
          <Rect
            x={0}
            y={0}
            width={stageSize.width}
            height={stageSize.height}
            fill="#333333"
            listening={false}
          />
          
          {/* Debug info */}
          <Text
            x={10}
            y={10}
            text={debugInfo}
            fill="#ffffff"
            fontSize={12}
            listening={false}
          />
          
          {/* Test rectangle */}
          <Rect
            x={50}
            y={50}
            width={100}
            height={60}
            fill="#00ff00"
            stroke="#ffffff"
            strokeWidth={2}
            listening={false}
          />

          {/* Grid lines (infinite) */}
          {(() => {
            const { verticalLines, horizontalLines } = generateGridLines()
            return (
              <>
                {verticalLines.map(line => (
                  <Line
                    key={line.key}
                    points={line.points}
                    stroke="#444"
                    strokeWidth={1}
                    listening={false}
                  />
                ))}
                {horizontalLines.map(line => (
                  <Line
                    key={line.key}
                    points={line.points}
                    stroke="#444"
                    strokeWidth={1}
                    listening={false}
                  />
                ))}
              </>
            )
          })()}

          {/* Edges */}
          {edges.map(renderEdge)}

          {/* Dragging edge preview */}
          {draggingEdge && (
            <Line
              points={[
                draggingEdge.startX,
                draggingEdge.startY,
                draggingEdge.currentX,
                draggingEdge.currentY
              ]}
              stroke="#4a9eff"
              strokeWidth={2}
              dash={[5, 5]}
              listening={false}
            />
          )}

          {/* Nodes */}
          {console.log('Rendering nodes count:', nodes.length)}
          {nodes.map(renderNode)}

          {/* Wheel menu */}
          {wheelMenu && (
            <WheelMenu
              x={wheelMenu.x}
              y={wheelMenu.y}
              zoom={zoom}
              onSelect={handleWheelMenuSelect}
              onClose={() => setWheelMenu(null)}
            />
          )}
        </Layer>
      </Stage>
      {editingNodeId && (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSaveEdit}
          style={{
            position: 'absolute',
            left: inputStyle.left + 'px',
            top: inputStyle.top + 'px',
            width: inputStyle.width + 'px',
            height: inputStyle.height + 'px',
            fontSize: 14 * zoom + 'px',
            fontFamily: 'Inter, sans-serif',
            textAlign: 'left',
            lineHeight: `${Math.max(16, inputStyle.height - 10)}px`,
            background: inputStyle.backgroundColor,
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '4px',
            outline: 'none',
            padding: '5px',
            boxSizing: 'border-box',
            pointerEvents: 'auto',
            zIndex: 100
          }}
        />
      )}    </div>
  )
}

export default Canvas