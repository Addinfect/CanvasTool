import { Stage, Layer, Rect, Text } from 'react-konva'
import { useRef, useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { useCanvasStore } from '../store/useCanvasStore'
import Grid from './Grid'
import NodeRenderer from './NodeRenderer'
import EdgeRenderer from './EdgeRenderer'
import ConnectionCreator from './ConnectionCreator'
import WheelMenu from './WheelMenu'
import { NodeType } from '../types'
import './Canvas.css'

const Canvas = () => {
  const stageRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })
  const [wheelMenu, setWheelMenu] = useState<{x: number, y: number} | null>(null)

  const {
    zoom,
    pan,
    connectionStart,
    nodes,
    startConnection,
    updateTempConnection,
    finishConnection,
    cancelConnection,
    addNode,
    updateNode,
    setZoom,
    setPan
  } = useCanvasStore()

  // Inline editing state
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [inputStyle, setInputStyle] = useState({ left: 0, top: 0, width: 200, height: 30 })
  const inputRef = useRef<HTMLInputElement>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)

  // Get overlay element
  useEffect(() => {
    overlayRef.current = document.getElementById('editing-overlay') as HTMLDivElement | null
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
    const screenWidth = node.width * zoom
    const screenHeight = node.height * zoom

    // Calculate position for input (centered)
    const inputWidth = Math.max(screenWidth - 40, 100)
    const inputHeight = 30
    const inputX = screenX + 20
    const inputY = screenY + (screenHeight - inputHeight) / 2

    setInputStyle({
      left: inputX,
      top: inputY,
      width: inputWidth,
      height: inputHeight
    })
  }, [editingNodeId, nodes, zoom, pan])

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

  // Handle container resize
  useEffect(() => {
    if (!containerRef.current) return

    const updateSize = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      console.log('Canvas container size:', rect.width, rect.height)

      setStageSize({ width: rect.width, height: rect.height })
    }
    updateSize()
    
    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(containerRef.current)
    
    window.addEventListener('resize', updateSize)
    
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateSize)
    }
  }, [])

  // Log stage size changes
  useEffect(() => {
    console.log('Stage size updated:', stageSize.width, stageSize.height)
  }, [stageSize])

  // Pan and zoom handlers
  const handleWheel = (e: any) => {
    e.evt.preventDefault()
    
    const stage = e.target.getStage()
    if (!stage) {
      console.error('No stage found')
      return
    }
    
    const pointerPos = stage.getPointerPosition()
    if (!pointerPos) {
      console.error('No pointer position')
      return
    }
    
    const scaleBy = 1.1
    const oldScale = stage.scaleX()
    
    const mousePointTo = {
      x: pointerPos.x / oldScale - stage.x() / oldScale,
      y: pointerPos.y / oldScale - stage.y() / oldScale
    }
    
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
    setZoom(newScale)
    
    const newPos = {
      x: -(mousePointTo.x - pointerPos.x / newScale) * newScale,
      y: -(mousePointTo.y - pointerPos.y / newScale) * newScale
    }
    setPan(newPos.x, newPos.y)
  }
  const handleMouseDown = (e: any) => {
    // Middle mouse button (button 1) or left button (button 0) for panning
    if ((e.evt.button === 0 || e.evt.button === 1) && !connectionStart) {
      const stage = e.target.getStage()
      stage.draggable(true)
      // Prevent default middle button behavior (scroll)
      if (e.evt.button === 1) {
        e.evt.preventDefault()
      }
    }
  }

  const handleMouseUp = (e: any) => {
    const stage = e.target.getStage()
    stage.draggable(false)
    
    // Handle connection finish/cancel
    if (connectionStart) {
      const pos = stage.getPointerPosition()
      if (!pos) {
        cancelConnection()
        return
      }
      
      // Find target node under pointer
      const targetNode = nodes.find(node => {
        const nodeX = node.x * zoom + pan.x
        const nodeY = node.y * zoom + pan.y
        const nodeWidth = node.width * zoom
        const nodeHeight = node.height * zoom
        
        return (
          pos.x >= nodeX &&
          pos.x <= nodeX + nodeWidth &&
          pos.y >= nodeY &&
          pos.y <= nodeY + nodeHeight
        )
      })
      
      if (targetNode && targetNode.id !== connectionStart.nodeId) {
        finishConnection(targetNode.id)
      } else {
        cancelConnection()
      }
      
      // Restore cursor
      stage.container().style.cursor = 'grab'
    }
  }

  const handleMouseMove = (e: any) => {
    // Handle connection drawing if in connection mode
    if (connectionStart) {
      const stage = e.target.getStage()
      const pos = stage.getPointerPosition()
      if (!pos) return
      
      // Convert to canvas coordinates (adjust for pan and zoom)
      const canvasX = (pos.x - pan.x) / zoom
      const canvasY = (pos.y - pan.y) / zoom
      updateTempConnection(canvasX, canvasY)
    }
  }

  const handleDoubleClick = (e: any) => {
    console.log('Canvas double-click detected, target:', e.target)
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

  const handleWheelMenuSelect = (nodeType: NodeType) => {
    if (!wheelMenu) return
    
    // Create node based on type
    const nodeId = `node-${Date.now()}`
    const newNode = {
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
          />
          <Grid stageWidth={stageSize.width} stageHeight={stageSize.height} />
          {/* Test rectangle to verify Konva rendering */}
          <Rect
            x={50}
            y={50}
            width={100}
            height={60}
            fill="#ff0000"
            stroke="#ffffff"
            strokeWidth={2}
          />
          <Text
            x={10}
            y={10}
            text={`Stage: ${stageSize.width}x${stageSize.height} Zoom: ${zoom}`}
            fill="#ffffff"
            fontSize={12}
          />
          <EdgeRenderer />
          <NodeRenderer onNodeDoubleClick={handleNodeDoubleClick} />
          <ConnectionCreator />
          {wheelMenu && (
            <WheelMenu
              x={wheelMenu.x}
              y={wheelMenu.y}
              zoom={zoom}
              onSelect={handleWheelMenuSelect}
              onClose={() => setWheelMenu(null)}
            />
          )}

          {/* Debug info */}
          <Text
            x={10}
            y={10}
            text={`Canvas: ${stageSize.width}x${stageSize.height}`}
            fill="#ffffff"
            fontSize={12}
            fontFamily="monospace"
          />
          <Text
            x={10}
            y={30}
            text={`Zoom: ${zoom.toFixed(2)}`}
            fill="#ffffff"
            fontSize={12}
            fontFamily="monospace"
          />
          <Text
            x={10}
            y={50}
            text={`Nodes: ${nodes.length}`}
            fill="#ffffff"
            fontSize={12}
            fontFamily="monospace"
          />
        </Layer>
      </Stage>
      <div id="editing-overlay" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }} />
      {editingNodeId && overlayRef.current && ReactDOM.createPortal(
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
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
            padding: '4px 8px',
            border: '2px solid #4a9eff',
            borderRadius: '4px',
            outline: 'none',
            pointerEvents: 'auto',
            zIndex: 1000,
            background: '#fff',
            color: '#000'
          }}
        />,
        overlayRef.current
      )}
    </div>
  )
}

export default Canvas