import { useCanvasStore } from '../store/useCanvasStore'
import { CanvasNode, CanvasEdge } from '../types'
import './PropertiesPanel.css'

const PropertiesPanel = () => {
  const { 
    nodes, 
    edges, 
    selectedNodeIds, 
    selectedEdgeIds,
    updateNode,
    updateEdge,
    deleteNode,
    deleteEdge
  } = useCanvasStore()

  const selectedNode = selectedNodeIds.length === 1 
    ? nodes.find(n => n.id === selectedNodeIds[0])
    : null

  const selectedEdge = selectedEdgeIds.length === 1
    ? edges.find(e => e.id === selectedEdgeIds[0])
    : null

  const renderNodeProperties = (node: CanvasNode) => {
    return (
      <div className="properties-content">
        <h4>{node.type.charAt(0).toUpperCase() + node.type.slice(1)} Node</h4>
        
        <div className="property-group">
          <label>ID</label>
          <input type="text" value={node.id} readOnly />
        </div>

        <div className="property-group">
          <label>Position</label>
          <div className="property-row">
            <input 
              type="number" 
              value={node.x} 
              onChange={(e) => updateNode(node.id, { x: parseInt(e.target.value) || 0 })}
            />
            <input 
              type="number" 
              value={node.y} 
              onChange={(e) => updateNode(node.id, { y: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="property-group">
          <label>Size</label>
          <div className="property-row">
            <input 
              type="number" 
              value={node.width} 
              onChange={(e) => updateNode(node.id, { width: parseInt(e.target.value) || 100 })}
            />
            <input 
              type="number" 
              value={node.height} 
              onChange={(e) => updateNode(node.id, { height: parseInt(e.target.value) || 100 })}
            />
          </div>
        </div>

        {node.type === 'text' && (
          <div className="property-group">
            <label>Content</label>
            <textarea 
              value={node.text || ''}
              onChange={(e) => updateNode(node.id, { text: e.target.value })}
              rows={4}
            />
          </div>
        )}

        {node.type === 'link' && (
          <div className="property-group">
            <label>URL</label>
            <input 
              type="text" 
              value={node.url || ''}
              onChange={(e) => updateNode(node.id, { url: e.target.value })}
            />
          </div>
        )}

        {node.type === 'file' && (
          <div className="property-group">
            <label>File Path</label>
            <input 
              type="text" 
              value={node.file || ''}
              onChange={(e) => updateNode(node.id, { file: e.target.value })}
            />
          </div>
        )}

        {node.type === 'group' && (
          <div className="property-group">
            <label>Group Label</label>
            <input 
              type="text" 
              value={node.label || ''}
              onChange={(e) => updateNode(node.id, { label: e.target.value })}
            />
          </div>
        )}

        <div className="property-group">
          <label>Color</label>
          <input 
            type="color" 
            value={node.color || '#2d2d2d'}
            onChange={(e) => updateNode(node.id, { color: e.target.value })}
          />
        </div>

        <button 
          className="delete-button"
          onClick={() => deleteNode(node.id)}
        >
          Delete Node
        </button>
      </div>
    )
  }

  const renderEdgeProperties = (edge: CanvasEdge) => {
    return (
      <div className="properties-content">
        <h4>Connection</h4>
        
        <div className="property-group">
          <label>From Node</label>
          <input type="text" value={edge.fromNode} readOnly />
        </div>

        <div className="property-group">
          <label>To Node</label>
          <input type="text" value={edge.toNode} readOnly />
        </div>

        <div className="property-group">
          <label>Label</label>
          <input 
            type="text" 
            value={edge.label || ''}
            onChange={(e) => updateEdge(edge.id, { label: e.target.value })}
          />
        </div>

        <div className="property-group">
          <label>Style</label>
          <select 
            value={edge.style || 'solid'}
            onChange={(e) => updateEdge(edge.id, { style: e.target.value as any })}
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
          </select>
        </div>

        <div className="property-group">
          <label>Color</label>
          <input 
            type="color" 
            value={edge.color || '#666666'}
            onChange={(e) => updateEdge(edge.id, { color: e.target.value })}
          />
        </div>

        <button 
          className="delete-button"
          onClick={() => deleteEdge(edge.id)}
        >
          Delete Connection
        </button>
      </div>
    )
  }

  const renderEmptyState = () => {
    const selectionCount = selectedNodeIds.length + selectedEdgeIds.length
    
    if (selectionCount === 0) {
      return (
        <div className="properties-empty">
          <p>Select a node or connection to edit its properties.</p>
          <p className="hint">
            <strong>Tip:</strong> Click on a node or edge to select it.
            Use Ctrl+Click for multiple selection.
          </p>
        </div>
      )
    } else if (selectionCount > 1) {
      return (
        <div className="properties-empty">
          <p>{selectionCount} items selected</p>
          <p className="hint">
            Select a single item to view and edit its properties.
          </p>
        </div>
      )
    }
    return null
  }

  

  return (
    <div className="properties-panel">
      <h3>Properties</h3>
      
      {selectedNode ? renderNodeProperties(selectedNode) :
       selectedEdge ? renderEdgeProperties(selectedEdge) :
       renderEmptyState()}
    </div>
  )
}

export default PropertiesPanel