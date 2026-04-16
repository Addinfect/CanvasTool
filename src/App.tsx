import { useEffect } from 'react'
import Canvas from './components/Canvas'

import PropertiesPanel from './components/PropertiesPanel'
import { useCanvasStore } from './store/useCanvasStore'
import { sampleCanvas } from './utils/sampleData'
import './App.css'

function App() {
  const { loadCanvas } = useCanvasStore()

  useEffect(() => {
    // Load sample data on mount
    console.log('App: loading sample canvas', sampleCanvas.nodes.length, 'nodes')
    loadCanvas(sampleCanvas)
  }, [loadCanvas])

  return (
    <div className="app">
      <header className="app-header">
        <h1>CanvasTool 2.0</h1>
        <div className="zoom-controls">
          <span>100%</span>
        </div>
      </header>
      <div className="app-content">

        <Canvas />
        <PropertiesPanel />
      </div>
    </div>
  )
}

export default App