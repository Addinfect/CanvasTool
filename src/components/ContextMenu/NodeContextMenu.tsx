import React from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import styles from './NodeContextMenu.module.css';

interface NodeContextMenuProps {
  nodeId: string;
  position: { x: number; y: number };
  onClose: () => void;
}

const NodeContextMenu: React.FC<NodeContextMenuProps> = ({ nodeId, position, onClose }) => {
  const { duplicateNode, deleteNode, bringToFront, sendToBack, updateNode } = useCanvasStore();

  const handleColorChange = (color: string) => {
    updateNode(nodeId, { color });
    onClose();
  };

  const handleDuplicate = () => {
    duplicateNode(nodeId);
    onClose();
  };

  const handleDelete = () => {
    deleteNode(nodeId);
    onClose();
  };

  const handleBringToFront = () => {
    bringToFront(nodeId);
    onClose();
  };

  const handleSendToBack = () => {
    sendToBack(nodeId);
    onClose();
  };

  // Farbpalette
  const colorPalette = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // yellow
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#6B7280', // gray
    '#000000', // black
    '#FFFFFF', // white (mit Border)
  ];

  // Verhindere Klick-Event-Bubbling
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className={styles.contextMenu}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onClick={handleMenuClick}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className={styles.menuSection}>
        <div className={styles.sectionTitle}>Color</div>
        <div className={styles.colorGrid}>
          {colorPalette.map((color) => (
            <button
              key={color}
              className={styles.colorButton}
              style={{ backgroundColor: color, border: color === '#FFFFFF' ? '1px solid #ccc' : 'none' }}
              onClick={() => handleColorChange(color)}
              title={color}
            />
          ))}
        </div>
      </div>

      <div className={styles.divider} />

      <button className={styles.menuItem} onClick={handleDuplicate}>
        <span className={styles.menuIcon}>⎘</span> Duplicate
      </button>
      <button className={styles.menuItem} onClick={handleDelete}>
        <span className={styles.menuIcon}>🗑</span> Delete
      </button>

      <div className={styles.divider} />

      <button className={styles.menuItem} onClick={handleBringToFront}>
        <span className={styles.menuIcon}>↑</span> Bring to Front
      </button>
      <button className={styles.menuItem} onClick={handleSendToBack}>
        <span className={styles.menuIcon}>↓</span> Send to Back
      </button>
    </div>
  );
};

export default NodeContextMenu;