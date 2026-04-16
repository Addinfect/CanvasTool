import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { CanvasState, CanvasNode, CanvasEdge, CanvasExportData } from '../types'
import { importCanvas, exportCanvas, saveCanvasToLocalStorage, loadCanvasFromLocalStorage, isAutoSaveEnabled, setAutoSaveEnabled } from '../utils/canvasExport'

interface CanvasActions {
  setNodes: (nodes: CanvasNode[]) => void
  addNode: (node: CanvasNode) => void
  updateNode: (id: string, updates: Partial<CanvasNode>) => void
  deleteNode: (id: string) => void
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
}

export const useCanvasStore = create<CanvasState & CanvasActions>()(
  immer((set) => ({
    ...initialState,

    setNodes: (nodes) => set({ nodes }),

    addNode: (node) =>
      set((state) => {
        state.nodes.push(node)
      }),

    updateNode: (id, updates) =>
      set((state) => {
        const node = state.nodes.find((n) => n.id === id)
        if (node) {
          Object.assign(node, updates)
        }
      }),

    updateEdge: (id, updates) =>
      set((state) => {
        const edge = state.edges.find((e) => e.id === id)
        if (edge) {
          Object.assign(edge, updates)
        }
      }),

    deleteNode: (id) =>
      set((state) => {
        state.nodes = state.nodes.filter((n) => n.id !== id)
        // Also delete connected edges
        state.edges = state.edges.filter(
          (e) => e.fromNode !== id && e.toNode !== id
        )
      }),

    setEdges: (edges) => set({ edges }),

    addEdge: (edge) =>
      set((state) => {
        state.edges.push(edge)
      }),

    deleteEdge: (id) =>
      set((state) => {
        state.edges = state.edges.filter((e) => e.id !== id)
      }),

    setSelectedNodeIds: (ids) => set({ selectedNodeIds: ids }),

    setSelectedEdgeIds: (ids) => set({ selectedEdgeIds: ids }),

    setZoom: (zoom) => set({ zoom }),

    setPan: (x, y) => set({ pan: { x, y } }),

    setGridSize: (size) => set({ gridSize: size }),

    setGridVisible: (visible) => set({ gridVisible: visible }),

    setSnapToGrid: (snap) => set({ snapToGrid: snap }),

    loadCanvas: (canvas) => set({ nodes: canvas.nodes, edges: canvas.edges }),

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
        const updates = importCanvas(data)
        Object.assign(state, updates)
      }),

    resetCanvas: () =>
      set((state) => {
        Object.assign(state, initialState)
        state.autoSaveEnabled = isAutoSaveEnabled()
      }),

    clearCanvas: () =>
      set((state) => {
        state.nodes = []
        state.edges = []
        state.selectedNodeIds = []
        state.selectedEdgeIds = []
      }),

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

  }))
)