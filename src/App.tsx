import { useEffect, useRef } from 'react'
import Canvas from './components/Canvas'
import FileMenu from './components/FileMenu'
import { useCanvasStore } from './store/useCanvasStore'
import MiniMap from './components/MiniMap/MiniMap'
import { sampleCanvas } from './utils/sampleData'
import './App.css'

function App() {
  const { loadFromLocalStorage, loadCanvas, autoSaveEnabled, nodes, edges, pan, zoom, gridSize, gridVisible, snapToGrid, copySelectedNodes, pasteNodes, undo, redo } = useCanvasStore()
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load canvas on mount
  useEffect(() => {
    console.log('App: attempting to load canvas from localStorage')
    const loaded = loadFromLocalStorage()
    
    if (!loaded) {
      // Load sample data as fallback
      console.log('App: loading sample canvas', sampleCanvas.nodes.length, 'nodes')
      loadCanvas(sampleCanvas)
    } else {
      console.log('App: successfully loaded canvas from localStorage')
    }
  }, [loadFromLocalStorage, loadCanvas])

  // Auto-save effect
  useEffect(() => {
    if (!autoSaveEnabled) return
    
    // Debounce auto-save to avoid excessive writes
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      console.log('Auto-saving canvas...')
      useCanvasStore.getState().saveToLocalStorage()
    }, 2000) // Save 2 seconds after last change
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [nodes, edges, pan, zoom, gridSize, gridVisible, snapToGrid, autoSaveEnabled])

  // Undo/Redo keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault()
          undo()
        } else if ((e.key === 'y') || (e.key === 'Z' && e.shiftKey)) {
          e.preventDefault()
          redo()
        } else if (e.key === 'c') {
          e.preventDefault()
          copySelectedNodes()
        } else if (e.key === 'v') {
          e.preventDefault()
          pasteNodes()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, copySelectedNodes, pasteNodes])

  return (
    <div className="app">
      <header className="app-header">
        <h1>CanvasTool 2.0</h1>
        <div className="header-controls">
          <FileMenu />
          <div className="auto-save-status">
            {autoSaveEnabled ? (
              <span title="Auto-save is enabled">🔄</span>
            ) : (
              <span title="Auto-save is disabled">⏸️</span>
            )}
          </div>
        </div>
      </header>
      <div className="app-content">
        <Canvas />
      </div>
      <MiniMap />
    </div>
  )
}

export default App