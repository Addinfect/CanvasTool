import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { CanvasState, CanvasNode, CanvasEdge, CanvasExportData, CanvasSnapshot } from '../types'
import { importCanvas, exportCanvas, saveCanvasToLocalStorage, loadCanvasFromLocalStorage, isAutoSaveEnabled, setAutoSaveEnabled } from '../utils/canvasExport'

// Helper function to generate a default title for a node
function generateDefaultTitle(node: CanvasNode): string {
  if (node.title && node.title.trim()) {
    return node.title.trim()
  }
  
  switch (node.type) {
    case 'text':
      return node.text?.substring(0, 20).trim() || 'Text Node';
    case 'link':
      if (node.url) {
        try {
          const url = new URL(node.url);
          return url.hostname.replace('www.', '');
        } catch {
          return node.url.substring(0, 20);
        }
      }
      return 'Link';
    case 'file':
      if (node.file) {
        // Extract filename from path
        const filename = node.file.split(/[\\/]/).pop() || node.file;
        return filename.substring(0, 20);
      }
      return 'File';
    case 'group':
      return node.label?.substring(0, 20).trim() || 'Group';
    case 'canvas':
      return node.canvasId?.substring(0, 20) || 'Canvas';
    default:
      return 'Node';
  }
}

// Extract references from text using [[title]] or @title syntax
function extractReferences(text: string): string[] {
  if (!text) return []
  
  const references: string[] = []
  
  // Match [[title]]
  const bracketRegex = /\[\[([^\[\]]+)\]\]/g
  let match
  while ((match = bracketRegex.exec(text)) !== null) {
    references.push(match[1].trim())
  }
  
  // Match @title
  const atRegex = /@([a-zA-Z0-9\s_-]+)/g
  while ((match = atRegex.exec(text)) !== null) {
    references.push(match[1].trim())
  }
  
  return references
}

// Update smart connections for a node based on its text content
function updateSmartConnections(state: CanvasState, nodeId: string, newText: string) {
  const node = state.nodes.find(n => n.id === nodeId)
  if (!node) return
  
  // Remove existing smart-connect edges from this node
  state.edges = state.edges.filter(edge => !(edge.fromNode === nodeId && edge.smartConnect))
  
  // Extract references from new text
  const references = extractReferences(newText)
  
  // For each reference, find target node with matching title
  references.forEach(ref => {
    const targetNode = state.nodes.find(n => n.title === ref && n.id !== nodeId)
    if (targetNode) {
      // Create edge
      const edgeId = `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      state.edges.push({
        id: edgeId,
        fromNode: nodeId,
        toNode: targetNode.id,
        label: ref,
        style: 'dashed', // Mark as smart-connect edge
        color: '#666',
        smartConnect: true
      })
    }
  })
}

interface CanvasActions {
  setNodes: (nodes: CanvasNode[]) => void
  addNode: (node: CanvasNode) => void
  updateNode: (id: string, updates: Partial<CanvasNode>) => void
  deleteNode: (id: string) => void
  duplicateNode: (id: string) => void
  bringToFront: (id: string) => void
  sendToBack: (id: string) => void
  setEdges: (edges: CanvasEdge[]) => void
  addEdge: (edge: CanvasEdge) => void
  deleteEdge: (id: string) => void
  setSelectedNodeIds: (ids: string[]) => void
  setSelectedEdgeIds: (ids: string[]) => void
  setZoom: (zoom: number) => void
  setPan: (x: number, y: number) => void
  setGridSize: (size: number) => void
  setGridVisible: (visible: boolean) => void
  setSnapToGrid: (snap: boolean) => void
  loadCanvas: (canvas: { nodes: CanvasNode[]; edges: CanvasEdge[] }) => void
  updateEdge: (id: string, updates: Partial<CanvasEdge>) => void
  startConnection: (nodeId: string, side: 'top' | 'right' | 'bottom' | 'left', x: number, y: number) => void
  updateTempConnection: (x: number, y: number) => void
  finishConnection: (targetNodeId: string) => void
  cancelConnection: () => void
  importCanvasData: (data: CanvasExportData) => void
  resetCanvas: () => void
  clearCanvas: () => void
  exportCanvasData: () => CanvasExportData
  saveToLocalStorage: () => boolean
  loadFromLocalStorage: () => boolean
  setAutoSaveEnabled: (enabled: boolean) => void
  copySelectedNodes: () => void
  pasteNodes: () => void
  fetchLinkPreview: (nodeId: string) => Promise<void>
  undo: () => void
  redo: () => void
  enterCanvas: (nodeId: string) => void
  leaveCanvas: () => void
  updateChildCanvas: (nodeId: string, newCanvasData: CanvasExportData) => void
  alignSelectedNodes: (alignment: 'left' | 'right' | 'top' | 'bottom' | 'centerX' | 'centerY') => void
  distributeSelectedNodes: (direction: 'horizontal' | 'vertical') => void
  groupSelectedNodes: () => void
  ungroupSelectedNodes: () => void
  addHiddenTag: (tag: string) => void
  removeHiddenTag: (tag: string) => void
  setHiddenTags: (tags: string[]) => void
  clearHiddenTags: () => void
  addSnapshot: (name: string) => void
  loadSnapshot: (snapshotId: string) => void
  deleteSnapshot: (snapshotId: string) => void
  renameSnapshot: (snapshotId: string, newName: string) => void
}

const initialState: CanvasState = {
  nodes: [],
  edges: [],
  selectedNodeIds: [],
  selectedEdgeIds: [],
  zoom: 1,
  pan: { x: 0, y: 0 },
  gridSize: 20,
  gridVisible: true,
  snapToGrid: true,
  connectionStart: null,
  connectionTempEnd: null,
  autoSaveEnabled: isAutoSaveEnabled(),
  __history: [],
  __historyIndex: -1,
  __isUndoingRedoing: false,
  canvasStack: [],
  currentCanvasParentNodeId: undefined,
  hiddenTags: [],
  snapshots: [],
}

// Helper to create a snapshot of state without history fields
function createSnapshot(state: CanvasState): CanvasState {
  const { __history, __historyIndex, ...snapshot } = state
  return snapshot as CanvasState
}

function saveToHistory(state: CanvasState) {
  if (state.__isUndoingRedoing) return
  const snapshot = createSnapshot(state)
  state.__history.push(snapshot)
  if (state.__history.length > 50) {
    state.__history.shift()
  }
  state.__historyIndex = state.__history.length - 1
}

// Helper to update group node bounds based on child nodes
function updateGroupBounds(state: CanvasState, groupNodeId: string) {
  const groupNode = state.nodes.find(n => n.id === groupNodeId)
  if (!groupNode || groupNode.type !== 'group') return

  const childNodes = state.nodes.filter(n => n.parentId === groupNodeId)
  if (childNodes.length === 0) return

  const padding = 10
  
  // Calculate current bounds of all child nodes (relative to group)
  const minX = Math.min(...childNodes.map(n => n.x))
  const maxX = Math.max(...childNodes.map(n => n.x + n.width))
  const minY = Math.min(...childNodes.map(n => n.y))
  const maxY = Math.max(...childNodes.map(n => n.y + n.height))
  
  // Calculate required size based on child bounds (with padding)
  const requiredContentWidth = maxX - minX
  const requiredContentHeight = maxY - minY
  const requiredWidth = Math.max(100, requiredContentWidth + padding * 2)
  const requiredHeight = Math.max(60, requiredContentHeight + padding * 2)
  
  // Group only grows, never shrinks
  groupNode.width = Math.max(groupNode.width, requiredWidth)
  groupNode.height = Math.max(groupNode.height, requiredHeight)
  
  // Now check if children are within padding after size adjustment
  // If not, we need to shift the group (not the children)
  const shiftX = minX < padding ? minX - padding : 0
  const shiftY = minY < padding ? minY - padding : 0
  
  // Also check right/bottom bounds after potential shift
  const effectiveMaxX = maxX - shiftX
  const effectiveMaxY = maxY - shiftY
  const currentWidth = groupNode.width
  const currentHeight = groupNode.height
  
  // If children would still exceed right/bottom bounds after shift, expand group
  if (effectiveMaxX > currentWidth - padding) {
    groupNode.width = Math.max(groupNode.width, effectiveMaxX + padding)
  }
  if (effectiveMaxY > currentHeight - padding) {
    groupNode.height = Math.max(groupNode.height, effectiveMaxY + padding)
  }
  
  // Apply shift if needed
  if (shiftX !== 0 || shiftY !== 0) {
    // Move group to accommodate children
    groupNode.x += shiftX
    groupNode.y += shiftY
    
    // Adjust child relative positions to maintain their absolute positions
    childNodes.forEach(child => {
      child.x -= shiftX
      child.y -= shiftY
    })
  }
}
export const useCanvasStore = create<CanvasState & CanvasActions>()(
  immer((set, get) => ({
    ...initialState,

    setNodes: (nodes) => set((state) => { saveToHistory(state); state.nodes = nodes; }),

    addNode: (node) =>
      set((state) => {
        saveToHistory(state)
        const nodeWithTitle = {
          ...node,
          title: node.title || generateDefaultTitle(node)
        }
        state.nodes.push(nodeWithTitle)
        
        // If it's a link node with URL, fetch preview
        if (nodeWithTitle.type === 'link' && nodeWithTitle.url) {
          setTimeout(() => {
            useCanvasStore.getState().fetchLinkPreview(nodeWithTitle.id)
          }, 0)
        }
      }),
    updateNode: (id, updates) =>
      set((state) => {
        saveToHistory(state)
        const node = state.nodes.find((n) => n.id === id)
        if (node) {
          const oldText = node.text
          Object.assign(node, updates)

          // If text changed, update smart connections
          if (updates.text !== undefined && updates.text !== oldText) {
            updateSmartConnections(state, id, updates.text)
          }

          // If URL changed for link node, fetch preview (async)
          if (node.type === 'link' && updates.url !== undefined && updates.url !== node.url) {
            // Trigger preview fetch after state update
            setTimeout(() => {
              useCanvasStore.getState().fetchLinkPreview(id)
            }, 0)
          }

          // Auto-generate title if not set
          if (!node.title || node.title.trim() === '') {
            node.title = generateDefaultTitle(node)
          }
          
          // Update parent group bounds if this node belongs to a group
          if (node.parentId) {
            updateGroupBounds(state, node.parentId)
          }
        }
      }),
    updateEdge: (id, updates) =>
      set((state) => {
        saveToHistory(state)
        const edge = state.edges.find((e) => e.id === id)
        if (edge) {
          Object.assign(edge, updates)
        }
      }),

    deleteNode: (id) =>
      set((state) => {
        saveToHistory(state)
        // Clear parentId for any child nodes
        state.nodes.forEach(node => {
          if (node.parentId === id) {
            node.parentId = undefined
          }
        })
        // Remove the node
        state.nodes = state.nodes.filter((n) => n.id !== id)
        // Also delete connected edges
        state.edges = state.edges.filter(
          (e) => e.fromNode !== id && e.toNode !== id
        )
      }),

    duplicateNode: (id) =>
      set((state) => {
        saveToHistory(state)
        const node = state.nodes.find((n) => n.id === id)
        if (!node) return
        const newNode = { ...node, id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, x: node.x + 20, y: node.y + 20 }
        state.nodes.push(newNode)
      }),

    bringToFront: (id) =>
      set((state) => {
        saveToHistory(state)
        const index = state.nodes.findIndex((n) => n.id === id)
        if (index === -1) return
        const node = state.nodes[index]
        state.nodes.splice(index, 1)
        state.nodes.push(node)
      }),

    sendToBack: (id) =>
      set((state) => {
        saveToHistory(state)
        const index = state.nodes.findIndex((n) => n.id === id)
        if (index === -1) return
        const node = state.nodes[index]
        state.nodes.splice(index, 1)
        state.nodes.unshift(node)
      }),

    setEdges: (edges) => set((state) => { saveToHistory(state); state.edges = edges; }),

    addEdge: (edge) =>
      set((state) => {
        saveToHistory(state)
        state.edges.push(edge)
      }),

    deleteEdge: (id) =>
      set((state) => {
        saveToHistory(state)
        state.edges = state.edges.filter((e) => e.id !== id)
      }),

    setSelectedNodeIds: (ids) => set({ selectedNodeIds: ids }),

    setSelectedEdgeIds: (ids) => set({ selectedEdgeIds: ids }),

    setZoom: (zoom) => set({ zoom }),

    setPan: (x, y) => set({ pan: { x, y } }),

    setGridSize: (size) => set({ gridSize: size }),

    setGridVisible: (visible) => set({ gridVisible: visible }),

    setSnapToGrid: (snap) => set({ snapToGrid: snap }),

    loadCanvas: (canvas) => set((state) => { saveToHistory(state); state.nodes = canvas.nodes; state.edges = canvas.edges; }),

    startConnection: (nodeId, side, x, y) =>
      set((state) => {
        state.connectionStart = { nodeId, side, x, y }
      }),

    updateTempConnection: (x, y) =>
      set((state) => {
        state.connectionTempEnd = { x, y }
      }),

    finishConnection: (targetNodeId) =>
      set((state) => {
        saveToHistory(state)
        if (state.connectionStart) {
          const edgeId = `edge-${Date.now()}`
          const newEdge: CanvasEdge = {
            id: edgeId,
            fromNode: state.connectionStart.nodeId,
            toNode: targetNodeId,
            fromSide: state.connectionStart.side,
            style: 'solid',
            color: '#666'
          }
          state.edges.push(newEdge)
          state.connectionStart = null
          state.connectionTempEnd = null
        }
      }),

    cancelConnection: () =>
      set((state) => {
        state.connectionStart = null
        state.connectionTempEnd = null
      }),

    importCanvasData: (data) =>
      set((state) => {
        saveToHistory(state)
        const updates = importCanvas(data)
        Object.assign(state, updates)
      }),

    resetCanvas: () =>
      set((state) => {
        saveToHistory(state)
        Object.assign(state, initialState)
        state.autoSaveEnabled = isAutoSaveEnabled()
      }),

    clearCanvas: () =>
      set((state) => {
        saveToHistory(state)
        state.nodes = []
        state.edges = []
        state.selectedNodeIds = []
        state.selectedEdgeIds = []
      }),

    copySelectedNodes: () =>
      set((state) => {
        const selectedNodes = state.nodes.filter(node => state.selectedNodeIds.includes(node.id))
        if (selectedNodes.length === 0) return
        
        // Find edges where both endpoints are selected
        const selectedEdges = state.edges.filter(edge => 
          state.selectedNodeIds.includes(edge.fromNode) && 
          state.selectedNodeIds.includes(edge.toNode)
        )
        
        const clipboardData = {
          nodes: selectedNodes,
          edges: selectedEdges,
          timestamp: Date.now()
        }
        
        try {
          localStorage.setItem('canvas-clipboard', JSON.stringify(clipboardData))
        } catch (error) {
          console.error('Failed to copy to clipboard:', error)
        }
      }),

    pasteNodes: () =>
      set((state) => {
        saveToHistory(state)
        try {
          const saved = localStorage.getItem('canvas-clipboard')
          if (!saved) return
          
          const clipboardData = JSON.parse(saved) as { nodes: CanvasNode[], edges: CanvasEdge[], timestamp: number }
          if (!clipboardData.nodes || !Array.isArray(clipboardData.nodes)) return
          
          // Map old IDs to new IDs
          const idMap = new Map<string, string>()
          const newNodes = clipboardData.nodes.map(node => {
            const newNodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            idMap.set(node.id, newNodeId)
            return {
              ...node,
              id: newNodeId,
              x: node.x + 30,
              y: node.y + 30
            }
          })
          
          // Create new edges with mapped IDs
          const newEdges = clipboardData.edges.map(edge => {
            const newFromId = idMap.get(edge.fromNode) || edge.fromNode
            const newToId = idMap.get(edge.toNode) || edge.toNode
            return {
              ...edge,
              id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              fromNode: newFromId,
              toNode: newToId
            }
          })
          
          // Add new nodes and edges to state
          state.nodes.push(...newNodes)
          state.edges.push(...newEdges.filter(edge => 
            state.nodes.some(n => n.id === edge.fromNode) && 
            state.nodes.some(n => n.id === edge.toNode)
          ))
          
          // Select the newly pasted nodes
          state.selectedNodeIds = newNodes.map(n => n.id)
        } catch (error) {
          console.error('Failed to paste from clipboard:', error)
        }
      }),

    fetchLinkPreview: async (nodeId) => {
      const state = useCanvasStore.getState()
      const node = state.nodes.find(n => n.id === nodeId)
      if (!node || node.type !== 'link' || !node.url) return
      
      try {
        // Use a CORS proxy to avoid CORS issues
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/'
        const targetUrl = node.url
        
        const response = await fetch(proxyUrl + targetUrl, {
          headers: {
            'Origin': window.location.origin
          }
        })
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        
        const html = await response.text()
        
        // Parse OpenGraph metadata
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')
        
        const getMetaContent = (property: string) => {
          const element = doc.querySelector(`meta[property="${property}"]`) || doc.querySelector(`meta[name="${property}"]`)
          return element?.getAttribute('content') || undefined
        }
        
        const previewData = {
          title: getMetaContent('og:title') || getMetaContent('twitter:title') || doc.title,
          description: getMetaContent('og:description') || getMetaContent('twitter:description') || getMetaContent('description'),
          image: getMetaContent('og:image') || getMetaContent('twitter:image'),
          siteName: getMetaContent('og:site_name')
        }
        
        // Update node with preview data
        useCanvasStore.getState().updateNode(nodeId, { previewData })
      } catch (error) {
        console.error('Failed to fetch link preview:', error)
      }
    },

    exportCanvasData: () => {
      return exportCanvas(useCanvasStore.getState())
    },

    saveToLocalStorage: () => {
      return saveCanvasToLocalStorage(useCanvasStore.getState())
    },

    loadFromLocalStorage: () => {
      const data = loadCanvasFromLocalStorage()
      if (data) {
        useCanvasStore.getState().importCanvasData(data)
        return true
      }
      return false
    },

    setAutoSaveEnabled: (enabled) =>
      set((state) => {
        state.autoSaveEnabled = enabled
        setAutoSaveEnabled(enabled)
      }),

    undo: () =>
      set((state) => {
        if (state.__historyIndex <= 0) return
        state.__isUndoingRedoing = true
        const snapshot = state.__history[state.__historyIndex - 1]
        Object.assign(state, snapshot)
        state.__historyIndex--
        state.__isUndoingRedoing = false
      }),

    redo: () =>
      set((state) => {
        if (state.__historyIndex >= state.__history.length - 1) return
        state.__isUndoingRedoing = true
        const snapshot = state.__history[state.__historyIndex + 1]
        Object.assign(state, snapshot)
        state.__historyIndex++
        state.__isUndoingRedoing = false
      }),

    enterCanvas: (nodeId) =>
      set((state) => {
        saveToHistory(state)
        const node = state.nodes.find(n => n.id === nodeId)
        if (!node || node.type !== 'canvas') return

        // Export current canvas to stack with parent node ID (the current canvas's parent)
        const currentCanvas = exportCanvas(state, state.currentCanvasParentNodeId)
        // Add parent node title to metadata for breadcrumb display
        currentCanvas.metadata = {
          ...currentCanvas.metadata,
          parentNodeTitle: node.title || generateDefaultTitle(node)
        }
        state.canvasStack.push(currentCanvas)

        // Set parent node ID (the node whose canvas we're entering)
        state.currentCanvasParentNodeId = nodeId

        // Load child canvas data or create empty canvas
        if (node.childCanvasData) {
          const updates = importCanvas(node.childCanvasData)
          Object.assign(state, updates)
        } else {
          // Create empty canvas
          state.nodes = []
          state.edges = []
          state.pan = { x: 0, y: 0 }
          state.zoom = 1
          state.selectedNodeIds = []
          state.selectedEdgeIds = []
        }
      }),
    leaveCanvas: () =>
      set((state) => {
        saveToHistory(state)
        if (state.canvasStack.length === 0) return
        
        // The current canvas we're leaving (with parent node ID)
        const currentCanvas = exportCanvas(state, state.currentCanvasParentNodeId)
        const parentCanvas = state.canvasStack.pop()
        
        if (parentCanvas) {
          // Restore the parent canvas
          const updates = importCanvas(parentCanvas)
          Object.assign(state, updates)

          // Update childCanvasData in the parent node that contains this canvas
          // parentCanvasId is the node ID in the parent canvas that contains the canvas we're leaving
          const parentNodeId = currentCanvas.parentCanvasId
          if (parentNodeId) {
            const parentNode = state.nodes.find(n => n.id === parentNodeId)
            if (parentNode && parentNode.type === 'canvas') {
              parentNode.childCanvasData = currentCanvas
            }
          }
        }

        // Set parent node ID to the parent of the restored canvas
        state.currentCanvasParentNodeId = parentCanvas?.parentCanvasId
      }),
    updateChildCanvas: (nodeId, newCanvasData) =>
      set((state) => {
        const node = state.nodes.find(n => n.id === nodeId)
        if (node && node.type === 'canvas') {
          node.childCanvasData = newCanvasData
        }
      }),

    alignSelectedNodes: (alignment) =>
      set((state) => {
        saveToHistory(state)
        const selectedNodes = state.nodes.filter(node => state.selectedNodeIds.includes(node.id))
        if (selectedNodes.length < 2) return
        
        let referenceValue: number
        if (alignment === 'left') {
          referenceValue = Math.min(...selectedNodes.map(n => n.x))
          selectedNodes.forEach(node => {
            node.x = referenceValue
          })
        } else if (alignment === 'right') {
          referenceValue = Math.max(...selectedNodes.map(n => n.x + n.width))
          selectedNodes.forEach(node => {
            node.x = referenceValue - node.width
          })
        } else if (alignment === 'top') {
          referenceValue = Math.min(...selectedNodes.map(n => n.y))
          selectedNodes.forEach(node => {
            node.y = referenceValue
          })
        } else if (alignment === 'bottom') {
          referenceValue = Math.max(...selectedNodes.map(n => n.y + n.height))
          selectedNodes.forEach(node => {
            node.y = referenceValue - node.height
          })
        } else if (alignment === 'centerX') {
          const minX = Math.min(...selectedNodes.map(n => n.x))
          const maxX = Math.max(...selectedNodes.map(n => n.x + n.width))
          referenceValue = (minX + maxX) / 2
          selectedNodes.forEach(node => {
            node.x = referenceValue - node.width / 2
          })
        } else if (alignment === 'centerY') {
          const minY = Math.min(...selectedNodes.map(n => n.y))
          const maxY = Math.max(...selectedNodes.map(n => n.y + n.height))
          referenceValue = (minY + maxY) / 2
          selectedNodes.forEach(node => {
            node.y = referenceValue - node.height / 2
          })
        }
      }),

    distributeSelectedNodes: (direction) =>
      set((state) => {
        saveToHistory(state)
        const selectedNodes = state.nodes.filter(node => state.selectedNodeIds.includes(node.id))
        if (selectedNodes.length < 3) return
        
        // Sort nodes by position
        const sortedNodes = [...selectedNodes].sort((a, b) => 
          direction === 'horizontal' ? a.x - b.x : a.y - b.y
        )
        
        if (direction === 'horizontal') {
          const totalWidth = sortedNodes.reduce((sum, node) => sum + node.width, 0)
          const minX = Math.min(...sortedNodes.map(n => n.x))
          const maxX = Math.max(...sortedNodes.map(n => n.x + n.width))
          const availableSpace = maxX - minX - totalWidth
          const gap = availableSpace / (sortedNodes.length - 1)
          
          let currentX = minX
          sortedNodes.forEach(node => {
            node.x = currentX
            currentX += node.width + gap
          })
        } else {
          const totalHeight = sortedNodes.reduce((sum, node) => sum + node.height, 0)
          const minY = Math.min(...sortedNodes.map(n => n.y))
          const maxY = Math.max(...sortedNodes.map(n => n.y + n.height))
          const availableSpace = maxY - minY - totalHeight
          const gap = availableSpace / (sortedNodes.length - 1)
          
          let currentY = minY
          sortedNodes.forEach(node => {
            node.y = currentY
            currentY += node.height + gap
          })
        }
      }),

    groupSelectedNodes: () =>
      set((state) => {
        saveToHistory(state)
        const selectedNodes = state.nodes.filter(node => state.selectedNodeIds.includes(node.id))
        if (selectedNodes.length < 2) return
        
        // Calculate bounds of selected nodes
        const minX = Math.min(...selectedNodes.map(n => n.x))
        const maxX = Math.max(...selectedNodes.map(n => n.x + n.width))
        const minY = Math.min(...selectedNodes.map(n => n.y))
        const maxY = Math.max(...selectedNodes.map(n => n.y + n.height))
        
        // Create group node
        const groupId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const groupNode: CanvasNode = {
          id: groupId,
          type: 'group',
          x: minX - 10,
          y: minY - 10,
          width: maxX - minX + 20,
          height: maxY - minY + 20,
          label: `Group (${selectedNodes.length} nodes)`,
          color: 'rgba(59, 130, 246, 0.5)'
        }
        
        // Add group to nodes
        state.nodes.push(groupNode)
        
        // Move selected nodes to be children of group (store their original positions relative to group)
        selectedNodes.forEach(node => {
          // Store relative positions to group
          node.x -= groupNode.x
          node.y -= groupNode.y
          // Set parent reference
          node.parentId = groupId
        })
        
        // Update group bounds based on child positions
        updateGroupBounds(state, groupId);
        
        // Clear selection
        state.selectedNodeIds = []
      }),

      addHiddenTag: (tag: string) =>
        set((state) => {
          saveToHistory(state)
          if (!state.hiddenTags.includes(tag)) {
            state.hiddenTags.push(tag)
          }
        }),

      removeHiddenTag: (tag: string) =>
        set((state) => {
          saveToHistory(state)
          state.hiddenTags = state.hiddenTags.filter(t => t !== tag)
        }),

      setHiddenTags: (tags: string[]) =>
        set((state) => {
          saveToHistory(state)
          state.hiddenTags = tags
        }),

      clearHiddenTags: () =>
        set((state) => {
          saveToHistory(state)
          state.hiddenTags = []
        }),

    ungroupSelectedNodes: () =>
      set((state) => {
        saveToHistory(state)
        const selectedNodes = state.nodes.filter(node => state.selectedNodeIds.includes(node.id))
        const groupNodes = selectedNodes.filter(node => node.type === 'group')
        if (groupNodes.length === 0) return
        
        groupNodes.forEach(groupNode => {
          // Find all child nodes of this group
          const childNodes = state.nodes.filter(node => node.parentId === groupNode.id)
          
          // Restore absolute positions for child nodes
          childNodes.forEach(child => {
            child.x += groupNode.x
            child.y += groupNode.y
            child.parentId = undefined
          })
          
          // Delete the group node
          const index = state.nodes.findIndex(n => n.id === groupNode.id)
          if (index !== -1) {
            state.nodes.splice(index, 1)
          }
        })
        
        // Clear selection
        state.selectedNodeIds = []
      }),

      addSnapshot: (name: string) =>
        set((state) => {
          saveToHistory(state);
          const snapshot: CanvasSnapshot = {
            id: `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name,
            timestamp: new Date().toISOString(),
            data: {
              nodes: [...state.nodes],
              edges: [...state.edges],
              pan: { ...state.pan },
              zoom: state.zoom,
              gridSize: state.gridSize,
              gridVisible: state.gridVisible,
              snapToGrid: state.snapToGrid,
              hiddenTags: [...state.hiddenTags],
            },
          };
          state.snapshots.push(snapshot);
        }),

      loadSnapshot: (snapshotId: string) =>
        set((state) => {
          const snapshot = state.snapshots.find(s => s.id === snapshotId);
          if (!snapshot) return;
          saveToHistory(state);
          state.nodes = [...snapshot.data.nodes];
          state.edges = [...snapshot.data.edges];
          state.pan = { ...snapshot.data.pan };
          state.zoom = snapshot.data.zoom;
          state.gridSize = snapshot.data.gridSize;
          state.gridVisible = snapshot.data.gridVisible;
          state.snapToGrid = snapshot.data.snapToGrid;
          state.hiddenTags = [...snapshot.data.hiddenTags];
          // Clear selection
          state.selectedNodeIds = [];
          state.selectedEdgeIds = [];
        }),

      deleteSnapshot: (snapshotId: string) =>
        set((state) => {
          saveToHistory(state);
          state.snapshots = state.snapshots.filter(s => s.id !== snapshotId);
        }),

      renameSnapshot: (snapshotId: string, newName: string) =>
        set((state) => {
          const snapshot = state.snapshots.find(s => s.id === snapshotId);
          if (snapshot) {
            snapshot.name = newName;
          }
        }),

  }))
)
