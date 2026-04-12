import { CanvasFile } from '../types'

export const sampleCanvas: CanvasFile = {
  nodes: [
    {
      id: 'node-1',
      type: 'text',
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      text: '# Welcome to CanvasTool 2.0!\n\nThis is a **text node** with markdown support.\n\n- Drag me around\n- Resize using handles\n- Edit my content in properties panel',
      color: '#ff9900'
    },
    {
      id: 'node-2',
      type: 'link',
      x: 400,
      y: 150,
      width: 180,
      height: 100,
      url: 'https://github.com',
      color: '#0066ff'
    },
    {
      id: 'node-3',
      type: 'file',
      x: 150,
      y: 350,
      width: 180,
      height: 100,
      file: 'document.pdf',
      color: '#00cc66'
    },
    {
      id: 'node-4',
      type: 'group',
      x: 500,
      y: 300,
      width: 300,
      height: 200,
      label: 'Project Group',
      color: 'rgba(59, 130, 246, 0.5)'
    },
    {
      id: 'node-5',
      type: 'text',
      x: 550,
      y: 350,
      width: 200,
      height: 120,
      text: 'Nested idea inside group',
      color: '#555555'
    }
  ],
  edges: [
    {
      id: 'edge-1',
      fromNode: 'node-1',
      toNode: 'node-2',
      label: 'related to',
      style: 'solid',
      color: '#666'
    },
    {
      id: 'edge-2',
      fromNode: 'node-1',
      toNode: 'node-3',
      label: 'references',
      style: 'dashed',
      color: '#666'
    },
    {
      id: 'edge-3',
      fromNode: 'node-2',
      toNode: 'node-4',
      label: 'belongs to',
      style: 'solid',
      color: '#666'
    },
    {
      id: 'edge-4',
      fromNode: 'node-5',
      toNode: 'node-4',
      label: 'contained in',
      style: 'dotted',
      color: '#888'
    }
  ]
}