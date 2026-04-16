import { CanvasExportData, CanvasState, LOCAL_STORAGE_KEYS } from '../types/index'

// Current version of the canvas format
export const CANVAS_VERSION = '1.0'

/**
 * Export current canvas state to CanvasExportData
 */
export function exportCanvas(state: CanvasState): CanvasExportData {
  return {
    version: CANVAS_VERSION,
    metadata: {
      modified: new Date().toISOString(),
    },
    canvas: {
      pan: state.pan,
      zoom: state.zoom,
      gridSize: state.gridSize,
      gridVisible: state.gridVisible,
      snapToGrid: state.snapToGrid,
    },
    nodes: state.nodes,
    edges: state.edges,
  }
}

/**
 * Import canvas data into state (returns partial state updates)
 */
export function importCanvas(data: CanvasExportData): Partial<CanvasState> {
  // Validate version (for future compatibility)
  if (data.version !== CANVAS_VERSION) {
    console.warn(`Canvas version mismatch: ${data.version} vs ${CANVAS_VERSION}. Attempting to load anyway.`)
  }

  return {
    nodes: data.nodes || [],
    edges: data.edges || [],
    pan: data.canvas?.pan || { x: 0, y: 0 },
    zoom: data.canvas?.zoom || 1,
    gridSize: data.canvas?.gridSize || 20,
    gridVisible: data.canvas?.gridVisible ?? true,
    snapToGrid: data.canvas?.snapToGrid ?? false,
  }
}

/**
 * Save canvas to localStorage (for auto-save)
 */
export function saveCanvasToLocalStorage(state: CanvasState): boolean {
  try {
    const exportData = exportCanvas(state)
    localStorage.setItem(LOCAL_STORAGE_KEYS.CANVAS_DATA, JSON.stringify(exportData))
    localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_SAVED, new Date().toISOString())
    return true
  } catch (error) {
    console.error('Failed to save canvas to localStorage:', error)
    return false
  }
}

/**
 * Load canvas from localStorage
 */
export function loadCanvasFromLocalStorage(): CanvasExportData | null {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.CANVAS_DATA)
    if (!saved) return null
    
    const data = JSON.parse(saved) as CanvasExportData
    return data
  } catch (error) {
    console.error('Failed to load canvas from localStorage:', error)
    return null
  }
}

/**
 * Check if there's saved canvas data in localStorage
 */
export function hasSavedCanvas(): boolean {
  return localStorage.getItem(LOCAL_STORAGE_KEYS.CANVAS_DATA) !== null
}

/**
 * Clear saved canvas from localStorage
 */
export function clearSavedCanvas(): void {
  localStorage.removeItem(LOCAL_STORAGE_KEYS.CANVAS_DATA)
  localStorage.removeItem(LOCAL_STORAGE_KEYS.LAST_SAVED)
}

/**
 * Get last save timestamp
 */
export function getLastSaveTime(): Date | null {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_SAVED)
  return saved ? new Date(saved) : null
}

/**
 * Download canvas as JSON file
 * Accepts either CanvasState (from store) or CanvasExportData (already exported)
 */
export function downloadCanvasAsFile(data: CanvasState | CanvasExportData, filename: string = 'canvas.json'): void {
  let exportData: CanvasExportData
  
  // Check if data is already in export format (has version field)
  if ('version' in data && 'canvas' in data) {
    exportData = data as CanvasExportData
  } else {
    // It's CanvasState, need to export it
    exportData = exportCanvas(data as CanvasState)
  }
  
  const dataStr = JSON.stringify(exportData, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })

  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
/**
 * Read canvas from uploaded file
 */
export async function readCanvasFromFile(file: File): Promise<CanvasExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const data = JSON.parse(content) as CanvasExportData
        
        // Basic validation
        if (!data.version || !data.nodes || !Array.isArray(data.nodes)) {
          throw new Error('Invalid canvas file format')
        }
        
        resolve(data)
      } catch (error) {
        reject(new Error(`Failed to parse canvas file: ${error}`))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsText(file)
  })
}

/**
 * Create empty canvas data
 */
export function createEmptyCanvas(): CanvasExportData {
  return {
    version: CANVAS_VERSION,
    metadata: {
      created: new Date().toISOString(),
      name: 'New Canvas',
    },
    canvas: {
      pan: { x: 0, y: 0 },
      zoom: 1,
      gridSize: 20,
      gridVisible: true,
      snapToGrid: false,
    },
    nodes: [],
    edges: [],
  }
}

/**
 * Check if auto-save is enabled
 */
export function isAutoSaveEnabled(): boolean {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTO_SAVE_ENABLED)
    return saved === null || saved === 'true' // Default to enabled
  } catch {
    return true // Default to enabled if localStorage fails
  }
}

/**
 * Set auto-save enabled/disabled
 */
export function setAutoSaveEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.AUTO_SAVE_ENABLED, enabled.toString())
  } catch (error) {
    console.error('Failed to set auto-save preference:', error)
  }
}