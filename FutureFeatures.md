# CanvasTool 2.0 - Feature Roadmap

*Dokument erstellt: 16. April 2026*
*Version: 1.0*

## Status der Implementierung

✅ **Bereits implementiert (Stand 15. April 2026):**
- Canvas mit Pan & Zoom
- Vier Node-Typen: Text, Link, File, Group
- Node-Drag & Drop
- Inline-Text-Editing (Doppelklick auf Node)
- Resize-Handles an allen vier Ecken
- Connection-Handles für Edges
- Edge-Erstellung durch Ziehen von Handles
- Node-Auswahl (Single/Multi mit Ctrl)
- Abwählen durch Klick auf leeren Bereich
- Wheel-Menu für neue Nodes
- Basic Grid

## Geplante Features - Nach Phasen sortiert

### Phase 1: Kern-Funktionalitäten (Nächste Schritte)

1. **Farbauswahl-Menü**
   - Kontextmenü oder Overlay für Farbauswahl direkt über Node
   - Farbrad oder Palette, erscheint bei Hover/Klick
   - Ändert `node.color` im Store
   - Positionierung über/neben Node (abhängig von Zoom)

2. **Schriftgröße anpassen**
   - Schriftgröße für Text-Nodes anpassbar
   - UI: Slider oder +/- Buttons im Kontextmenü
   - Neues Feld: `fontSize` zu `CanvasNode` Typ
   - Text-Komponente nutzt `fontSize` statt fixer 14px

3. **Canvas als JSON speichern/laden**
   - Komplette Canvas-Daten (Nodes, Edges, Pan, Zoom) als JSON-Datei
   - Features: Save Button (Ctrl+S), Load Dialog
   - Dateiformat mit Versionierung
   - Export/Import Funktion

4. **Properties-Menü rechts entfernen**
   - Rechte Sidebar-Panel entfernen (PropertiesPanel.tsx)
   - Alle Funktionen inline via Kontextmenü oder Overlay
   - CSS-Anpassungen für volle Canvas-Breite

5. **Automatisches Laden der letzten Canvas**
   - Beim App-Start automatisch letzte Canvas laden
   - Implementierung: `localStorage` für letzte Session
   - Fallback: Sample-Daten bei erstem Start

### Phase 2: Erweiterte Bearbeitungsfunktionen

6. **Undo/Redo (History)**
   - Vollständige History für alle Aktionen
   - Implementierung: History-Store mit Actions (addNode, updateNode, etc.)
   - UI: Undo/Redo Buttons oder `Ctrl+Z`/`Ctrl+Y`

7. **Copy/Paste von Nodes**
   - Nodes kopieren und einfügen (inkl. Styles, Text)
   - Shortcuts: `Ctrl+C`, `Ctrl+V`
   - Integration: System Clipboard oder interner Buffer

8. **Tastaturkürzel (Shortcuts)**
   - `Del`/`Backspace`: Selektion löschen
   - `Ctrl+A`: Alle Nodes selektieren
   - `Ctrl+D`: Duplizieren
   - `Ctrl+G`: Gruppieren
   - `Ctrl+Shift+G`: Gruppierung auflösen
   - `Arrow Keys`: Nodes leicht verschieben

9. **Node-Typen erweitern**
   - Bild-Nodes: PNG/JPG Upload, skalierbare Vorschau
   - Form-Nodes: Kreise, Dreiecke, Pfeile
   - Code-Nodes: Syntax-Highlighting für Code-Snippets
   - Checkbox-Nodes: To-do Listen, Checkboxen

### Phase 3: Organisatorische Features

10. **Gruppierung von Nodes**
    - Mehrere Nodes zusammenfassen und als Gruppe bewegen/resizen
    - Gruppierungs-Tool im Wheel-Menu
    - Datenstruktur: `parentGroupId` in Nodes

11. **Z-Order (Ebenenverwaltung)**
    - Nodes in Vorder-/Hintergrund verschieben
    - Shortcuts: `Ctrl+[` (nach hinten), `Ctrl+]` (nach vorne)
    - Store: `zIndex` Feld in Nodes

12. **Node-Alignment-Tools**
    - Ausgerichtete Nodes links/rechts/oben/unten/zentriert ausrichten
    - Alignment-Toolbar beim Multi-Select
    - Algorithmen basierend auf Bounding Box

13. **Grid-Snap**
    - Nodes am Grid ausrichten lassen
    - Toggle: Snap ein/ausschalten
    - Grid-Einstellungen: Größe (10px, 20px, 50px), Sichtbarkeit

### Phase 4: Export und Erweiterungen

14. **Export als Bild**
    - Canvas als PNG/JPEG exportieren
    - Implementierung: Konva Stage zu Canvas, dann toDataURL
    - Optionen: Auflösung, Hintergrund, nur selektierte Nodes

15. **Templates für Node-Typen**
    - Vordefinierte Node-Stile speichern und anwenden
    - Beispiele: "Title", "Note", "Warning", "Quote"
    - UI: Template-Bibliothek im Wheel-Menu

16. **Plug-in System**
    - Erweiterbare Node-Typen und Tools
    - Plugin-API für Entwickler
    - Beispiele: Custom Shapes, Import/Export-Format

## Technische Verbesserungen (Parallel)

### Performance-Optimierung
- Virtualisierung: Nur sichtbare Nodes rendern
- Batch-Updates: Mehrere Updates in einem Redux-Dispatch
- Memoization: React.memo für Node-Komponenten

### Responsive Design
- Mobile: Touch-Gesten für Pan/Zoom
- Tablet: Stylus-Support
- Multi-Touch: Zwei-Finger-Gesten

## Dokumentationsbedarf

- [ ] User Guide
- [ ] Keyboard Shortcuts Cheat Sheet
- [ ] API Dokumentation (für Plugins)
- [ ] JSON Format Spezifikation

---

## Implementierungsdetails (für Phase 1)

### Farbauswahl-Menü
**Technische Umsetzung:**
1. Neue Komponente: `ColorPicker.tsx`
2. Position: Absolut über selektiertem Node
3. Trigger: Rechte Maustaste oder spezielles Icon auf Node
4. Farben: Vordefinierte Palette + Custom Farbauswahl

**Store-Änderungen:**
- `updateNode` Action erweitern für `color` Updates
- Eventuell neue `setNodeColor` Action

### Schriftgröße
**Technische Umsetzung:**
1. `CanvasNode` Typ erweitern: `fontSize?: number`
2. Default: `14` (bisher hardcoded)
3. Text-Komponente: `fontSize={node.fontSize || 14}`
4. UI: Kontextmenü mit Slider (8-32px)

### JSON Speichern/Laden
**Dateiformat (Entwurf):**
```json
{
  "version": "1.0",
  "canvas": {
    "pan": { "x": 0, "y": 0 },
    "zoom": 1,
    "gridSize": 20
  },
  "nodes": [
    {
      "id": "node-1",
      "type": "text",
      "x": 100,
      "y": 100,
      "width": 200,
      "height": 100,
      "color": "#3B82F6",
      "fontSize": 16,
      "text": "Hello World"
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "sourceId": "node-1",
      "targetId": "node-2",
      "type": "default"
    }
  ]
}
```

**API-Funktionen:**
- `exportCanvas(): CanvasExportData`
- `importCanvas(data: CanvasExportData): void`
- `saveToFile(filename: string): void`
- `loadFromFile(file: File): Promise<void>`

---

## Priorisierungskriterien

1. **User Value**: Direkter Nutzen für Benutzer
2. **Komplexität**: Implementierungsaufwand
3. **Abhängigkeiten**: Notwendige Vorarbeiten
4. **Testbarkeit**: Einfache Validierung
5. **Risiko**: Potenzielle Breaking Changes

---

**Hinweis**: Diese Roadmap ist dynamisch und kann je nach Feedback und Prioritäten angepasst werden. Features können zwischen Phasen verschoben werden.