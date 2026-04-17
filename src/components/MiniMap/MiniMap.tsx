import React, { useState, useRef } from 'react';
import { Stage, Layer, Rect, Group } from 'react-konva';
import { useCanvasStore } from '../../store/useCanvasStore';
import { CanvasNode } from '../../types';
import styles from './MiniMap.module.css';

const MINI_MAP_SIZE = { width: 200, height: 150 };
const SCALE = 0.1; // 10% of actual size

const MiniMap: React.FC = () => {
  const { nodes, pan, zoom, setPan } = useCanvasStore();
  const stageRef = useRef<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Calculate bounds of all nodes
  const calculateBounds = () => {
    if (nodes.length === 0) {
      return { minX: 0, maxX: 1000, minY: 0, maxY: 800 };
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    nodes.forEach(node => {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x + node.width);
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y + node.height);
    });

    // Add some padding
    const padding = 50;
    return {
      minX: minX - padding,
      maxX: maxX + padding,
      minY: minY - padding,
      maxY: maxY + padding
    };
  };

  const bounds = calculateBounds();
  const contentWidth = bounds.maxX - bounds.minX;
  const contentHeight = bounds.maxY - bounds.minY;

  // Calculate viewport rectangle in mini-map coordinates
  const viewportWidth = (MINI_MAP_SIZE.width * SCALE) / zoom;
  const viewportHeight = (MINI_MAP_SIZE.height * SCALE) / zoom;
  
  const viewportX = (-pan.x - bounds.minX) * (MINI_MAP_SIZE.width / contentWidth);
  const viewportY = (-pan.y - bounds.minY) * (MINI_MAP_SIZE.height / contentHeight);

  // Convert mini-map coordinates to canvas coordinates
  const miniMapToCanvas = (miniMapX: number, miniMapY: number) => {
    const canvasX = (miniMapX / MINI_MAP_SIZE.width) * contentWidth + bounds.minX;
    const canvasY = (miniMapY / MINI_MAP_SIZE.height) * contentHeight + bounds.minY;
    return { x: -canvasX, y: -canvasY };
  };

  const handleViewportDragStart = (e: any) => {
    setIsDragging(true);
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    setDragStart({ x: pos.x, y: pos.y });
    stage.container().style.cursor = 'grabbing';
  };

  const handleViewportDragMove = (e: any) => {
    if (!isDragging || !stageRef.current) return;

    const stage = stageRef.current;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    const deltaX = pos.x - dragStart.x;
    const deltaY = pos.y - dragStart.y;

    // Convert delta from mini-map to canvas coordinates
    const canvasDeltaX = (deltaX / MINI_MAP_SIZE.width) * contentWidth;
    const canvasDeltaY = (deltaY / MINI_MAP_SIZE.height) * contentHeight;

    // Update pan
    setPan(-canvasDeltaX - pan.x, -canvasDeltaY - pan.y);

    // Update drag start for next move
    setDragStart({ x: pos.x, y: pos.y });
  };

  const handleViewportDragEnd = () => {
    setIsDragging(false);
    if (stageRef.current) {
      stageRef.current.container().style.cursor = 'default';
    }
  };

  const handleMiniMapClick = (e: any) => {
    if (e.target !== e.currentTarget) return; // Only handle clicks on the background

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    
    // Center viewport on click position
    const newPan = miniMapToCanvas(pos.x, pos.y);
    setPan(newPan.x, newPan.y);
  };

  // Node color mapping
  const getNodeColor = (node: CanvasNode) => {
    switch (node.type) {
      case 'text': return '#3B82F6';
      case 'link': return '#10B981';
      case 'file': return '#F59E0B';
      case 'group': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  return (
    <div className={styles.miniMapContainer}>
      <Stage
        ref={stageRef}
        width={MINI_MAP_SIZE.width}
        height={MINI_MAP_SIZE.height}
        onMouseDown={handleMiniMapClick}
        onMouseMove={handleViewportDragMove}
        onMouseUp={handleViewportDragEnd}
        onMouseLeave={handleViewportDragEnd}
      >
        <Layer>
          {/* Background */}
          <Rect
            width={MINI_MAP_SIZE.width}
            height={MINI_MAP_SIZE.height}
            fill="rgba(0, 0, 0, 0.3)"
            stroke="#444"
            strokeWidth={1}
          />

          {/* Nodes */}
          {nodes.map(node => {
            const x = (node.x - bounds.minX) * (MINI_MAP_SIZE.width / contentWidth);
            const y = (node.y - bounds.minY) * (MINI_MAP_SIZE.height / contentHeight);
            const width = Math.max(2, node.width * (MINI_MAP_SIZE.width / contentWidth));
            const height = Math.max(2, node.height * (MINI_MAP_SIZE.height / contentHeight));

            return (
              <Rect
                key={node.id}
                x={x}
                y={y}
                width={width}
                height={height}
                fill={getNodeColor(node)}
                stroke={node.color || getNodeColor(node)}
                strokeWidth={0.5}
                cornerRadius={1}
              />
            );
          })}

          {/* Viewport rectangle */}
          {contentWidth > 0 && contentHeight > 0 && (
            <Group
              draggable
              onDragStart={handleViewportDragStart}
              onDragEnd={handleViewportDragEnd}
            >
              <Rect
                x={viewportX}
                y={viewportY}
                width={viewportWidth * (MINI_MAP_SIZE.width / contentWidth)}
                height={viewportHeight * (MINI_MAP_SIZE.height / contentHeight)}
                fill="rgba(59, 130, 246, 0.3)"
                stroke="#3B82F6"
                strokeWidth={1}
                cornerRadius={2}
              />
            </Group>
          )}
        </Layer>
      </Stage>
    </div>
  );
};

export default MiniMap;