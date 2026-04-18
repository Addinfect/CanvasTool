import React from 'react'
import { useCanvasStore } from '../../store/useCanvasStore'
import './Breadcrumb.css'

const Breadcrumb = () => {
  const { canvasStack, currentCanvasParentNodeId, leaveCanvas, nodes } = useCanvasStore()

  // If we're at root level (no stack), don't show breadcrumb
  if (canvasStack.length === 0 && !currentCanvasParentNodeId) {
    return null
  }

  // Calculate breadcrumb items
  const items = []

  // Root level
  items.push({
    name: 'Start',
    level: 0,
    isCurrent: canvasStack.length === 0 && !currentCanvasParentNodeId
  })

  // Each level in the stack
  for (let i = 0; i < canvasStack.length; i++) {
    const canvasData = canvasStack[i]
    // Use parentNodeTitle if available, otherwise fall back to metadata name or generic
    const nodeTitle = canvasData.metadata?.parentNodeTitle || canvasData.metadata?.name || `Canvas ${i + 1}`
    items.push({
      name: nodeTitle,
      level: i + 1,
      isCurrent: i === canvasStack.length - 1 && !currentCanvasParentNodeId
    })
  }

  // Current canvas (if we're inside a canvas node)
  if (currentCanvasParentNodeId) {
    // Try to get the current node title from the parent canvas (last stack entry)
    let currentName = 'Current'
    if (canvasStack.length > 0) {
      const parentCanvasData = canvasStack[canvasStack.length - 1]
      currentName = parentCanvasData.metadata?.parentNodeTitle || 'Current'
    } else {
      // Fallback: get node title from current state (might not be accurate)
      const parentNode = nodes.find(n => n.id === currentCanvasParentNodeId)
      if (parentNode) {
        currentName = parentNode.title || parentNode.canvasId || 'Canvas'
      }
    }
    
    items.push({
      name: currentName,
      level: canvasStack.length + 1,
      isCurrent: true
    })
  }

  const handleBreadcrumbClick = (level: number) => {
    // Navigate back to the clicked level
    if (level === 0) {
      // Navigate all the way back to root
      while (canvasStack.length > 0 || currentCanvasParentNodeId) {
        leaveCanvas()
      }
    } else {
      // Navigate back to specific level
      const stepsToGoBack = items.length - level - 1
      for (let i = 0; i < stepsToGoBack; i++) {
        leaveCanvas()
      }
    }
  }

  return (
    <div className="breadcrumb">
      {items.map((item, index) => (
        <React.Fragment key={item.level}>
          <button
            className={`breadcrumb-item ${item.isCurrent ? 'current' : ''}`}
            onClick={() => handleBreadcrumbClick(item.level)}
            disabled={item.isCurrent}
          >
            {item.name}
          </button>
          {index < items.length - 1 && (
            <span className="breadcrumb-separator">/</span>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

export default Breadcrumb