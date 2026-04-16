import { useState, useRef } from 'react'
import { useCanvasStore } from '../store/useCanvasStore'
import { downloadCanvasAsFile, readCanvasFromFile, clearSavedCanvas } from '../utils/canvasExport'

const FileMenu = () => {
  const [isOpen, setIsOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { exportCanvasData, importCanvasData, clearCanvas, resetCanvas, autoSaveEnabled, setAutoSaveEnabled } = useCanvasStore()

  const handleSave = () => {
    const data = exportCanvasData()
    const name = data.metadata?.name || 'canvas'
    const date = new Date().toISOString().split('T')[0]
    downloadCanvasAsFile(data, `${name}_${date}.json`)
    setIsOpen(false)
  }

  const handleLoad = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
      setIsOpen(false)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const data = await readCanvasFromFile(file)
      importCanvasData(data)
      // Clear file input to allow re-selecting same file
      event.target.value = ''
    } catch (error) {
      alert(`Failed to load file: ${error}`)
    }
  }

  const handleNew = () => {
    if (window.confirm('Create new canvas? Current work will be saved automatically if auto-save is enabled.')) {
      clearCanvas()
      setIsOpen(false)
    }
  }

  const handleReset = () => {
    if (window.confirm('Reset to default canvas? This will replace all nodes and edges.')) {
      resetCanvas()
      setIsOpen(false)
    }
  }

  const handleToggleAutoSave = () => {
    setAutoSaveEnabled(!autoSaveEnabled)
  }

  const handleClearStorage = () => {
    if (window.confirm('Clear all saved canvas data from browser storage? This cannot be undone.')) {
      clearSavedCanvas()
      resetCanvas() // Reset to initial state
      alert('Saved canvas data cleared. Canvas reset to empty.')
    }
    setIsOpen(false)
  }

  return (
    <div className="file-menu">
      <button 
        className="file-menu-toggle"
        onClick={() => setIsOpen(!isOpen)}
        onBlur={(e) => {
          // Close when clicking outside, but allow time for child clicks
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setTimeout(() => setIsOpen(false), 100)
          }
        }}
      >
        File
      </button>
      
      {isOpen && (
        <div className="file-menu-dropdown">
          <button onClick={handleNew} className="menu-item">
            New Canvas
          </button>
          <button onClick={handleSave} className="menu-item">
            Save As...
          </button>
          <button onClick={handleLoad} className="menu-item">
            Load From File
          </button>
          <div className="menu-divider" />
          <button onClick={handleReset} className="menu-item">
            Reset to Default
          </button>
          <button onClick={handleToggleAutoSave} className="menu-item">
            {autoSaveEnabled ? '✓ Auto-Save: ON' : 'Auto-Save: OFF'}
          </button>
          <div className="menu-divider" />
          <button onClick={handleClearStorage} className="menu-item destructive">
            Clear Browser Storage
          </button>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".json,application/json"
        style={{ display: 'none' }}
      />
    </div>
  )
}

export default FileMenu