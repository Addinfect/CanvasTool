import React from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import styles from './NodeContextMenu.module.css';

interface NodeContextMenuProps {
  nodeId?: string;
  position: { x: number; y: number };
  onClose: () => void;
}

const NodeContextMenu: React.FC<NodeContextMenuProps> = ({ nodeId, position, onClose }) => {
  const {
    duplicateNode,
    deleteNode,
    bringToFront,
    sendToBack,
    updateNode,
    alignSelectedNodes,
    distributeSelectedNodes,
    groupSelectedNodes,
    ungroupSelectedNodes,
    selectedNodeIds,
    nodes,
    hiddenTags,
    addHiddenTag,
    removeHiddenTag,
    clearHiddenTags
  } = useCanvasStore();

  const handleColorChange = (color: string) => {
    if (nodeId) {
      updateNode(nodeId, { color });
    }
    onClose();
  };

  // Bulk action handlers
  const handleAlign = (alignment: 'left' | 'right' | 'top' | 'bottom' | 'centerX' | 'centerY') => {
    alignSelectedNodes(alignment);
    onClose();
  };

  const handleDistribute = (direction: 'horizontal' | 'vertical') => {
    distributeSelectedNodes(direction);
    onClose();
  };

  const handleGroup = () => {
    groupSelectedNodes();
    onClose();
  };

  const handleUngroup = () => {
    ungroupSelectedNodes();
    onClose();
  };

  const handleDuplicate = () => {
    if (nodeId) {
      duplicateNode(nodeId);
    }
    onClose();
  };

  const handleDelete = () => {
    if (nodeId) {
      deleteNode(nodeId);
    } else if (selectedNodeIds.length > 0) {
      // Delete all selected nodes
      selectedNodeIds.forEach(id => deleteNode(id));
    }
    onClose();
  };

  const handleBringToFront = () => {
    if (nodeId) {
      bringToFront(nodeId);
    } else if (selectedNodeIds.length > 0) {
      // Bring all selected nodes to front
      selectedNodeIds.forEach(id => bringToFront(id));
    }
    onClose();
  };

  const handleSendToBack = () => {
    if (nodeId) {
      sendToBack(nodeId);
    } else if (selectedNodeIds.length > 0) {
      // Send all selected nodes to back
      selectedNodeIds.forEach(id => sendToBack(id));
    }
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

  // Collect all unique tags from all nodes
  const allTags = Array.from(new Set(nodes.flatMap(node => node.tags || []))).sort();

  const toggleTag = (tag: string) => {
    if (hiddenTags.includes(tag)) {
      removeHiddenTag(tag);
    } else {
      addHiddenTag(tag);
    }
  };

  const isSingleNode = !!nodeId;
  const selectedCount = isSingleNode ? 1 : selectedNodeIds.length;
  const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id));
  const hasGroupSelected = selectedNodes.some(n => n.type === 'group');

  return (
    <div
      className={styles.contextMenu}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onClick={handleMenuClick}
      onContextMenu={(e) => e.preventDefault()}
    >
      {isSingleNode ? (
        // Single node menu
        <>
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
        </>
      ) : (
        // Canvas/selection menu (Bulk Actions)
        <>
          <div className={styles.menuSection}>
            <div className={styles.sectionTitle}>
              {selectedCount === 0 ? 'Canvas Actions' : `Selection (${selectedCount})`}
            </div>
          </div>

          {selectedCount > 0 && (
            <>
              <div className={styles.menuSection}>
                <div className={styles.sectionTitle}>Align</div>
                <div className={styles.buttonGrid}>
                  <button className={styles.smallButton} onClick={() => handleAlign('left')} disabled={selectedCount < 2}>
                    ↶ Left
                  </button>
                  <button className={styles.smallButton} onClick={() => handleAlign('centerX')} disabled={selectedCount < 2}>
                    ○ Center X
                  </button>
                  <button className={styles.smallButton} onClick={() => handleAlign('right')} disabled={selectedCount < 2}>
                    ↷ Right
                  </button>
                  <button className={styles.smallButton} onClick={() => handleAlign('top')} disabled={selectedCount < 2}>
                    ↑ Top
                  </button>
                  <button className={styles.smallButton} onClick={() => handleAlign('centerY')} disabled={selectedCount < 2}>
                    ○ Center Y
                  </button>
                  <button className={styles.smallButton} onClick={() => handleAlign('bottom')} disabled={selectedCount < 2}>
                    ↓ Bottom
                  </button>
                </div>
              </div>

              <div className={styles.menuSection}>
                <div className={styles.sectionTitle}>Distribute</div>
                <div className={styles.buttonRow}>
                  <button className={styles.smallButton} onClick={() => handleDistribute('horizontal')} disabled={selectedCount < 3}>
                    ↔ Horizontal
                  </button>
                  <button className={styles.smallButton} onClick={() => handleDistribute('vertical')} disabled={selectedCount < 3}>
                    ↕ Vertical
                  </button>
                </div>
              </div>

              <div className={styles.divider} />

              <button className={styles.menuItem} onClick={handleGroup} disabled={selectedCount < 2}>
                <span className={styles.menuIcon}>⧉</span> Group
              </button>
              <button className={styles.menuItem} onClick={handleUngroup} disabled={!hasGroupSelected}>
                <span className={styles.menuIcon}>⧈</span> Ungroup
              </button>

              <div className={styles.divider} />

              <button className={styles.menuItem} onClick={handleDuplicate} disabled={selectedCount === 0}>
                <span className={styles.menuIcon}>⎘</span> Duplicate All
              </button>
              <button className={styles.menuItem} onClick={handleDelete} disabled={selectedCount === 0}>
                <span className={styles.menuIcon}>🗑</span> Delete All
              </button>

              <div className={styles.divider} />

              <button className={styles.menuItem} onClick={handleBringToFront} disabled={selectedCount === 0}>
                <span className={styles.menuIcon}>↑</span> Bring All to Front
              </button>
              <button className={styles.menuItem} onClick={handleSendToBack} disabled={selectedCount === 0}>
                <span className={styles.menuIcon}>↓</span> Send All to Back
              </button>
            </>
          )}

          {selectedCount === 0 && (
            <>
              {allTags.length > 0 && (
                <>
                  <div className={styles.menuSection}>
                    <div className={styles.sectionTitle}>Tag Filter</div>
                    <div className={styles.buttonGrid}>
                      {allTags.map((tag) => {
                        const isHidden = hiddenTags.includes(tag);
                        return (
                          <button 
                            key={tag}
                            className={styles.smallButton}
                            onClick={() => toggleTag(tag)}
                            style={{
                              backgroundColor: isHidden ? '#ef4444' : '#10b981',
                              color: 'white',
                              opacity: isHidden ? 0.7 : 1
                            }}
                            title={isHidden ? `Show ${tag}` : `Hide ${tag}`}
                          >
                            {isHidden ? '👁️‍🗨️' : '👁️'} {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {hiddenTags.length > 0 && (
                    <button 
                      className={styles.menuItem} 
                      onClick={() => {
                        // Clear all hidden tags
                        clearHiddenTags();
                      }}
                    >
                      <span className={styles.menuIcon}>👁️</span> Show All Tags
                    </button>
                  )}
                  <div className={styles.divider} />
                </>
              )}
              <button className={styles.menuItem} onClick={() => {}} disabled>
                <span className={styles.menuIcon}>🖱️</span> Right-click on nodes for actions
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default NodeContextMenu;