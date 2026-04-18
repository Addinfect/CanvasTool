import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { CanvasState, CanvasNode, CanvasEdge, CanvasExportData } from '../types'
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

  }))
)
