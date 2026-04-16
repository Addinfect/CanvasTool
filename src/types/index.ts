export type NodeType = 'text' | 'file' | 'link' | 'group' | 'canvas'

export interface CanvasNode {
  id: string
  type: NodeType
  x: number
  y: number
  width: number
  height: number
  text?: string        // For text nodes
  file?: string        // For file nodes
  url?: string         // For link nodes
  label?: string       // For group nodes
  canvasId?: string    // For canvas nodes
  color?: string       // Custom styling
  tags?: string[]      // Extended metadata
  aiMetadata?: {       // AI-generated data
    summary?: string
    embedding?: number[]
  }
}

export interface CanvasEdge {
  id: string
  fromNode: string
  toNode: string
  fromSide?: 'top' | 'right' | 'bottom' | 'left'
  toSide?: 'top' | 'right' | 'bottom' | 'left'
  label?: string
  style?: 'solid' | 'dashed' | 'dotted'
  color?: string
}

export interface CanvasFile {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

// Canvas export/import format
export interface CanvasExportData {
  version: string
  metadata?: {
    name?: string
    description?: string
    created?: string
    modified?: string
    author?: string
  }
  canvas: {
    pan: { x: number; y: number }
    zoom: number
    gridSize: number
    gridVisible: boolean
    snapToGrid: boolean
  }
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

// Local storage keys
export const LOCAL_STORAGE_KEYS = {
  CANVAS_DATA: 'canvasTool_canvasData',
  LAST_SAVED: 'canvasTool_lastSaved',
  AUTO_SAVE_ENABLED: 'canvasTool_autoSaveEnabled'
} as const

// State management types
export interface CanvasState {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  selectedNodeIds: string[]
  selectedEdgeIds: string[]
  zoom: number
  pan: { x: number; y: number }
  gridSize: number
  gridVisible: boolean
  snapToGrid: boolean
  connectionStart: { nodeId: string; side: 'top' | 'right' | 'bottom' | 'left'; x: number; y: number } | null
  connectionTempEnd: { x: number; y: number } | null
  autoSaveEnabled?: boolean
}