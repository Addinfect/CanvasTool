# CanvasTool 2.0

A lightweight, web-based canvas editor compatible with the JSON Canvas format (.canvas files), supporting CRUD operations, visual connections, and extensible features like AI integration and markdown rendering.

## 🚀 Phase 1 Implementation Complete

We have successfully implemented Phase 1 of the development roadmap:

### ✅ **Completed Features**
1. **Project Setup**
   - Vite + React + TypeScript project structure
   - Zustand state management with Immer
   - Konva.js for canvas rendering

2. **Core Canvas System**
   - Infinite grid background with customizable size/color
   - Smooth pan & zoom with mouse wheel
   - Middle-click/Ctrl+drag for panning

3. **Node Management (MVP)**
   - Text, Link, File, and Group node types
   - Drag & drop nodes to reposition
   - Visual selection with multi-select support (Ctrl+click)
   - Node properties editing

4. **Connection System**
   - Curved bezier edges between nodes
   - Edge labels and styling (solid/dashed/dotted)
   - Selection and deletion

5. **User Interface**
   - Toolbar with node creation tools
   - Properties panel for editing selected items
   - Grid visibility and snap-to-grid controls
   - Responsive layout

### 🛠️ **Technology Stack**
- **Frontend**: React 18 + TypeScript
- **Canvas**: Konva.js + React-Konva
- **State Management**: Zustand + Immer
- **Build Tool**: Vite
- **Styling**: CSS Modules

### 📁 **Project Structure**
```
src/
├── types/           # TypeScript interfaces
├── store/           # Zustand state management
├── components/      # React components
│   ├── Canvas.tsx   # Main canvas component
│   ├── Grid.tsx     # Grid rendering
│   ├── NodeRenderer.tsx
│   ├── EdgeRenderer.tsx
│   ├── Toolbar.tsx
│   └── PropertiesPanel.tsx
├── utils/           # Utilities and sample data
└── App.tsx          # Main application
```

## 🚦 **Getting Started**

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

## 🎯 **Usage**

1. **Pan & Zoom**
   - Mouse wheel: Zoom in/out
   - Middle-click or Ctrl+drag: Pan around canvas
   - Smooth zoom with pivot point preservation

2. **Create Nodes**
   - Use toolbar buttons to add Text, Link, File, or Group nodes
   - Nodes appear at default position (100, 100)

3. **Select & Edit**
   - Click on node to select
   - Ctrl+click for multi-select
   - Edit properties in right panel
   - Delete using delete button

4. **Grid Controls**
   - Toggle grid visibility
   - Adjust grid size (10-100px)
   - Enable/disable snap-to-grid

## 📊 **Sample Data**
The application loads with sample canvas data including:
- Text node with markdown content
- Link node pointing to GitHub
- File node reference
- Group container with nested node
- Connected edges with different styles

## 🔄 **Next Phases (Roadmap)**

### **Phase 2: Interactivity (Weeks 3-4)**
- Resize nodes with drag handles
- Create connections by dragging between nodes
- Context menu for node/edge operations
- Undo/Redo system

### **Phase 3: Markdown Editor (Weeks 5-6)**
- Rich text editing with toolbar
- Live markdown preview
- Syntax highlighting for code blocks
- Mermaid diagram support

### **Phase 4: Advanced UI (Weeks 7-8)**
- Node styling (colors, borders, opacity)
- Multiple selection & batch operations
- Copy/paste between canvases
- Search & filter panel

## 📈 **Performance Metrics**
- Target FPS during pan/zoom: > 60fps
- Load time for 100 nodes: < 500ms
- Bundle size: < 500KB (initial)

## 🐛 **Known Issues**
- Edge selection needs improvement
- No connection creation UI yet
- Limited undo/redo functionality
- Mobile responsiveness pending

## 📄 **License**
MIT

## 🤝 **Contributing**
Contributions welcome! Please see the roadmap for planned features and submit pull requests.