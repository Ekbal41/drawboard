import { useState, useRef, useEffect } from "react";
import {
  Stage,
  Layer,
  Line,
  Rect,
  Circle,
  RegularPolygon,
  Text,
  Transformer,
} from "react-konva";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Undo,
  Redo,
  Trash2,
  Brush,
  Square,
  Eraser,
  Type,
  Move,
  Download,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

// ============================================
// TYPES & INTERFACES
// ============================================

interface DrawCanvasProps {
  defaultData?: string;
  onChange?: (data: string) => void;
}

type Tool =
  | "brush"
  | "eraser"
  | "rect"
  | "circle"
  | "triangle"
  | "line"
  | "text"
  | "select";

interface ShapeLine {
  id: string;
  type: Tool;
  points?: number[];
  color: string;
  strokeWidth: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  fontSize?: number;
}

// ============================================
// CONSTANTS
// ============================================

const COLORS = [
  "#000000",
  "#FF0000",
  "#0000FF",
  "#00FF00",
  "#FFFF00",
  "#FF00FF",
  "#FFA500",
  "#FFFFFF",
];
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

// ============================================
// MAIN COMPONENT
// ============================================

export default function DrawCanvas({ defaultData, onChange }: DrawCanvasProps) {
  // ============================================
  // STATE MANAGEMENT
  // ============================================

  // Canvas state
  const [lines, setLines] = useState<ShapeLine[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // Tool state
  const [tool, setTool] = useState<Tool>("brush");
  const [color, setColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [fontSize, setFontSize] = useState(24);

  // Selection state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");

  // History state
  const [history, setHistory] = useState<ShapeLine[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // View state
  const [zoom, setZoom] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  // ============================================
  // REFS
  // ============================================

  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const isLoadingDefault = useRef(true);
  const prevDefaultDataRef = useRef<string | undefined>(defaultData);

  // ============================================
  // EFFECTS - DATA SYNC
  // ============================================

  // Load defaultData only when it actually changes (not from our own updates)
  useEffect(() => {
    if (!defaultData || defaultData === prevDefaultDataRef.current) return;

    try {
      const parsed = JSON.parse(defaultData);
      if (Array.isArray(parsed)) {
        const currentData = JSON.stringify(lines);
        // Only update if the data is actually different
        if (defaultData !== currentData) {
          setLines(parsed);
          if (isLoadingDefault.current) {
            setHistory([parsed]);
            setHistoryIndex(0);
            isLoadingDefault.current = false;
          }
        }
      }
    } catch (err) {
      console.warn("Invalid defaultData", err);
    }

    prevDefaultDataRef.current = defaultData;
  }, [defaultData]);

  // Call onChange whenever lines change (with ref to prevent infinite loops)
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!isLoadingDefault.current && onChangeRef.current) {
      const dataStr = JSON.stringify(lines);
      // Only call onChange if data actually changed
      if (dataStr !== prevDefaultDataRef.current) {
        onChangeRef.current(dataStr);
        prevDefaultDataRef.current = dataStr;
      }
    }
  }, [lines]);

  // ============================================
  // EFFECTS - UI SYNC
  // ============================================

  // Update transformer when selection changes
  useEffect(() => {
    if (selectedId && transformerRef.current && tool === "select") {
      const node = stageRef.current?.findOne(`#${selectedId}`);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [selectedId, tool]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === "z" &&
        !e.shiftKey &&
        historyIndex > 0
      ) {
        e.preventDefault();
        undo();
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && e.key === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z")
      ) {
        if (historyIndex < history.length - 1) {
          e.preventDefault();
          redo();
        }
      }
      // Delete: Delete or Backspace
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        if (!(e.target instanceof HTMLInputElement)) {
          e.preventDefault();
          deleteSelected();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [historyIndex, history, selectedId]);

  // ============================================
  // DRAWING HANDLERS
  // ============================================

  const startDrawing = (e: any) => {
    if (tool === "select") return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;

    // Adjust for zoom and pan
    const adjustedPos = {
      x: (pos.x - stagePos.x) / zoom,
      y: (pos.y - stagePos.y) / zoom,
    };

    setIsDrawing(true);
    setSelectedId(null);

    const newShape: ShapeLine = {
      id: `${Date.now()}_${Math.random()}`,
      type: tool,
      color: tool === "eraser" ? "#ffffff" : color,
      strokeWidth: strokeWidth / zoom,
      ...(tool === "brush" || tool === "eraser"
        ? { points: [adjustedPos.x, adjustedPos.y] }
        : tool === "text"
        ? {
            x: adjustedPos.x,
            y: adjustedPos.y,
            text: "",
            fontSize: fontSize / zoom,
          }
        : {
            x: adjustedPos.x,
            y: adjustedPos.y,
            width: 0,
            height: 0,
            radius: 0,
          }),
    };

    setLines((prev) => [...prev, newShape]);
  };

  const drawing = (e: any) => {
    if (!isDrawing || tool === "select") return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;

    const adjustedPos = {
      x: (pos.x - stagePos.x) / zoom,
      y: (pos.y - stagePos.y) / zoom,
    };

    setLines((prev) => {
      const newLines = [...prev];
      const last = newLines[newLines.length - 1];
      if (!last) return prev;

      if (tool === "brush" || tool === "eraser") {
        last.points = last.points!.concat([adjustedPos.x, adjustedPos.y]);
      } else if (tool === "rect") {
        last.width = adjustedPos.x - last.x!;
        last.height = adjustedPos.y - last.y!;
      } else if (tool === "circle" || tool === "triangle") {
        const dx = adjustedPos.x - last.x!;
        const dy = adjustedPos.y - last.y!;
        last.radius = Math.sqrt(dx * dx + dy * dy);
      } else if (tool === "line") {
        last.width = adjustedPos.x - last.x!;
        last.height = adjustedPos.y - last.y!;
      }
      return newLines;
    });
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const lastShape = lines[lines.length - 1];
    if (lastShape?.type === "text") {
      setSelectedId(lastShape.id);
      setTool("select");
    }
    updateHistory(lines);
  };

  // ============================================
  // SELECTION HANDLERS
  // ============================================

  const handleStageClick = (e: any) => {
    if (tool !== "select" || e.target !== e.target.getStage()) return;
    setSelectedId(null);
    setTextInput("");
  };

  const handleShapeClick = (id: string, e?: any) => {
    if (tool !== "select") return;
    if (e) {
      e.cancelBubble = true;
    }

    const wasSelected = selectedId === id;
    setSelectedId(wasSelected ? null : id);

    const shape = lines.find((l) => l.id === id);
    if (shape && shape.type === "text" && !wasSelected) {
      setTextInput(shape.text || "");
    } else {
      setTextInput("");
    }
  };

  // ============================================
  // TRANSFORM HANDLERS
  // ============================================

  const handleTransform = (id: string, e: any) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    const newLines = lines.map((line) => {
      if (line.id !== id) return line;

      if (line.type === "rect") {
        return {
          ...line,
          x: node.x(),
          y: node.y(),
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(5, node.height() * scaleY),
        };
      } else if (line.type === "circle" || line.type === "triangle") {
        return {
          ...line,
          x: node.x() - node.radius() * scaleX,
          y: node.y() - node.radius() * scaleY,
          radius: Math.max(5, node.radius() * Math.max(scaleX, scaleY)),
        };
      } else if (line.type === "text") {
        return {
          ...line,
          x: node.x(),
          y: node.y(),
          fontSize: Math.max(8, (line.fontSize || 24) * scaleY),
        };
      }
      return { ...line, x: node.x(), y: node.y() };
    });

    node.scaleX(1);
    node.scaleY(1);
    setLines(newLines);
  };

  const handleDragEnd = (id: string, e: any) => {
    const node = e.target;
    const newLines = lines.map((l) => {
      if (l.id !== id) return l;

      // Get the position adjusted for zoom and pan
      const newX = node.x();
      const newY = node.y();

      // For circles and triangles, we need to account for their center position
      if (l.type === "circle" || l.type === "triangle") {
        return {
          ...l,
          x: newX - (l.radius || 0),
          y: newY - (l.radius || 0),
        };
      }

      return { ...l, x: newX, y: newY };
    });
    setLines(newLines);
    updateHistory(newLines);
  };

  // ============================================
  // TEXT HANDLERS
  // ============================================

  const handleTextSubmit = () => {
    if (!selectedId) return;
    const newLines = lines.map((l) =>
      l.id === selectedId
        ? { ...l, text: textInput || "Text", fontSize: fontSize / zoom }
        : l
    );
    setLines(newLines);
    updateHistory(newLines);
  };

  // ============================================
  // HISTORY HANDLERS
  // ============================================

  const updateHistory = (newLines: ShapeLine[]) => {
    const newHistory = [...history.slice(0, historyIndex + 1), newLines];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex <= 0) return;
    setHistoryIndex(historyIndex - 1);
    setLines([...history[historyIndex - 1]]);
    setSelectedId(null);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    setHistoryIndex(historyIndex + 1);
    setLines([...history[historyIndex + 1]]);
    setSelectedId(null);
  };

  // ============================================
  // ACTION HANDLERS
  // ============================================

  const clear = () => {
    if (!confirm("Clear canvas?")) return;
    setLines([]);
    updateHistory([]);
    setSelectedId(null);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    const newLines = lines.filter((l) => l.id !== selectedId);
    setLines(newLines);
    updateHistory(newLines);
    setSelectedId(null);
  };

  const exportCanvas = () => {
    const uri = stageRef.current?.toDataURL();
    if (!uri) return;
    const link = document.createElement("a");
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = uri;
    link.click();
  };

  // ============================================
  // ZOOM HANDLERS
  // ============================================

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(MAX_ZOOM, prev + ZOOM_STEP));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(MIN_ZOOM, prev - ZOOM_STEP));
  };

  const resetZoom = () => {
    setZoom(1);
    setStagePos({ x: 0, y: 0 });
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();

    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = Math.max(
      MIN_ZOOM,
      Math.min(MAX_ZOOM, oldScale + direction * 0.05)
    );

    setZoom(newScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  const getCursor = () => {
    if (tool === "select") return "default";
    if (tool === "text") return "text";
    return "crosshair";
  };

  const renderShape = (line: ShapeLine) => {
    const isSelected = line.id === selectedId;
    const draggable = tool === "select" && isSelected;
    const commonProps = {
      key: line.id,
      id: line.id,
      onClick: (e: any) => handleShapeClick(line.id, e),
      draggable,
      onDragEnd: (e: any) => handleDragEnd(line.id, e),
      onTransformEnd: (e: any) => handleTransform(line.id, e),
      listening: tool === "select",
    };

    if (line.type === "brush" || line.type === "eraser") {
      return (
        <Line
          {...commonProps}
          points={line.points!}
          stroke={line.color}
          strokeWidth={line.strokeWidth}
          tension={0.5}
          lineCap="round"
          globalCompositeOperation={
            line.type === "eraser" ? "destination-out" : "source-over"
          }
        />
      );
    }

    if (line.type === "rect") {
      return (
        <Rect
          {...commonProps}
          x={line.x || 0}
          y={line.y || 0}
          width={line.width || 0}
          height={line.height || 0}
          stroke={line.color}
          strokeWidth={line.strokeWidth}
          fill="transparent"
        />
      );
    }

    if (line.type === "circle") {
      return (
        <Circle
          {...commonProps}
          x={(line.x || 0) + (line.radius || 0)}
          y={(line.y || 0) + (line.radius || 0)}
          radius={line.radius || 0}
          stroke={line.color}
          strokeWidth={line.strokeWidth}
          fill="transparent"
        />
      );
    }

    if (line.type === "triangle") {
      return (
        <RegularPolygon
          {...commonProps}
          x={(line.x || 0) + (line.radius || 0)}
          y={(line.y || 0) + (line.radius || 0)}
          sides={3}
          radius={line.radius || 0}
          stroke={line.color}
          strokeWidth={line.strokeWidth}
          fill="transparent"
        />
      );
    }

    if (line.type === "line") {
      return (
        <Line
          {...commonProps}
          points={[
            line.x || 0,
            line.y || 0,
            (line.x || 0) + (line.width || 50),
            (line.y || 0) + (line.height || 0),
          ]}
          stroke={line.color}
          strokeWidth={line.strokeWidth}
          lineCap="round"
        />
      );
    }

    if (line.type === "text") {
      return (
        <Text
          {...commonProps}
          x={line.x || 0}
          y={line.y || 0}
          text={line.text || "Click to edit"}
          fontSize={line.fontSize || 24}
          fill={line.color}
          width={200}
        />
      );
    }

    return null;
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-background to-muted">
      {/* Top Toolbar - Tools & Actions */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-50 
      flex items-center gap-2 bg-card/95 backdrop-blur px-4 py-3 
      rounded-2xl shadow-2xl border border-border"
      >
        {/* Drawing Tools */}
        <div className="flex gap-1 border-r border-border pr-2">
          <Button
            size="sm"
            variant={tool === "select" ? "default" : "ghost"}
            onClick={() => setTool("select")}
            title="Select (V)"
          >
            <Move size={16} />
          </Button>
          <Button
            size="sm"
            variant={tool === "brush" ? "default" : "ghost"}
            onClick={() => setTool("brush")}
            title="Brush (B)"
          >
            <Brush size={16} />
          </Button>
          <Button
            size="sm"
            variant={tool === "eraser" ? "default" : "ghost"}
            onClick={() => setTool("eraser")}
            title="Eraser (E)"
          >
            <Eraser size={16} />
          </Button>
        </div>

        {/* Shape Tools */}
        <div className="flex gap-1 border-r border-border pr-2">
          <Button
            size="sm"
            variant={tool === "rect" ? "default" : "ghost"}
            onClick={() => setTool("rect")}
            title="Rectangle"
          >
            <Square size={16} />
          </Button>
          <Button
            size="sm"
            variant={tool === "circle" ? "default" : "ghost"}
            onClick={() => setTool("circle")}
            title="Circle"
          >
            ○
          </Button>
          <Button
            size="sm"
            variant={tool === "triangle" ? "default" : "ghost"}
            onClick={() => setTool("triangle")}
            title="Triangle"
          >
            △
          </Button>
          <Button
            size="sm"
            variant={tool === "line" ? "default" : "ghost"}
            onClick={() => setTool("line")}
            title="Line"
          >
            ─
          </Button>
          <Button
            size="sm"
            variant={tool === "text" ? "default" : "ghost"}
            onClick={() => setTool("text")}
            title="Text"
          >
            <Type size={16} />
          </Button>
        </div>

        {/* History Actions */}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={undo}
            disabled={historyIndex <= 0}
            title="Undo (Ctrl+Z)"
          >
            <Undo size={16} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            title="Redo (Ctrl+Y)"
          >
            <Redo size={16} />
          </Button>
          {selectedId && (
            <Button
              size="sm"
              variant="ghost"
              onClick={deleteSelected}
              className="text-destructive hover:text-destructive"
              title="Delete (Del)"
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      </div>

      {/* Left Sidebar - Color & Stroke */}
      <div
        className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-card/95 
      backdrop-blur p-3 rounded-2xl shadow-2xl border border-border flex flex-col gap-3"
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="w-12 h-12"
              title="Color"
            >
              <div
                className="w-8 h-8 rounded-lg border-2 border-border"
                style={{ backgroundColor: color }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-56 p-3 bg-popover border-border"
            side="right"
          >
            <div className="grid grid-cols-4 gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  className={`w-10 h-10 rounded-lg border-2 border-border hover:scale-110 transition ${
                    color === c ? "ring-2 ring-primary" : ""
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-10 mt-2 rounded cursor-pointer bg-background"
            />
          </PopoverContent>
        </Popover>

        <div className="flex flex-col items-center gap-2 py-2">
          <div className="text-xs font-medium text-muted-foreground">Width</div>
          <Slider
            value={[strokeWidth]}
            min={1}
            max={20}
            step={1}
            onValueChange={(v) => setStrokeWidth(v[0])}
            orientation="vertical"
            className="h-24"
          />
          <div className="text-sm font-bold text-foreground">
            {strokeWidth}px
          </div>
        </div>
      </div>

      {/* Right Sidebar - Zoom & Actions */}
      <div
        className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-card/95 
      backdrop-blur p-3 rounded-2xl shadow-2xl border border-border flex flex-col gap-2"
      >
        <Button
          size="sm"
          variant="ghost"
          onClick={handleZoomIn}
          disabled={zoom >= MAX_ZOOM}
          title="Zoom In"
        >
          <ZoomIn size={18} />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={resetZoom}
          title="Reset Zoom"
          className="text-xs font-bold"
        >
          {Math.round(zoom * 100)}%
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleZoomOut}
          disabled={zoom <= MIN_ZOOM}
          title="Zoom Out"
        >
          <ZoomOut size={18} />
        </Button>
        <div className="border-t border-border my-1" />
        <Button
          size="sm"
          variant="ghost"
          onClick={exportCanvas}
          title="Export as PNG"
        >
          <Download size={18} />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={clear}
          className="text-destructive hover:text-destructive"
          title="Clear Canvas"
        >
          <Trash2 size={18} />
        </Button>
      </div>

      {/* Text Editor Panel */}
      {selectedId &&
        lines.find((l) => l.id === selectedId)?.type === "text" && (
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-card/95 
          backdrop-blur p-4 rounded-2xl shadow-2xl border border-border w-[600px]"
          >
            <div className="flex gap-3">
              <Input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter text..."
                className="flex-1 bg-background"
                onKeyDown={(e) => e.key === "Enter" && handleTextSubmit()}
                autoFocus
              />
              <Slider
                value={[fontSize]}
                min={12}
                max={72}
                step={4}
                onValueChange={(v) => setFontSize(v[0])}
                className="w-24"
              />
              <div className="text-xs font-medium pt-3 text-muted-foreground">
                {fontSize}px
              </div>
              <Button
                size="sm"
                onClick={handleTextSubmit}
                className="bg-primary hover:bg-primary/90"
              >
                Apply
              </Button>
            </div>
          </div>
        )}

      {/* Selection Indicator */}
      {selectedId && (
        <div
          className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-primary 
          text-primary-foreground px-4 py-2 rounded-full text-sm font-medium shadow-lg"
        >
          Selected:{" "}
          {lines.find((l) => l.id === selectedId)?.type?.toUpperCase()} • Drag
          to move, use handles to resize
        </div>
      )}

      {/* Canvas */}
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        ref={stageRef}
        scaleX={zoom}
        scaleY={zoom}
        x={stagePos.x}
        y={stagePos.y}
        onMouseDown={startDrawing}
        onMouseMove={drawing}
        onMouseUp={endDrawing}
        onClick={handleStageClick}
        onWheel={handleWheel}
        draggable={tool === "select" && !selectedId}
        style={{ cursor: getCursor() }}
      >
        <Layer>
          {lines.map(renderShape)}
          {/* Transformer for selected shape */}
          {tool === "select" && selectedId && (
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) =>
                newBox.width < 5 || newBox.height < 5 ? oldBox : newBox
              }
              borderStroke="#2563eb"
              borderStrokeWidth={2 / zoom}
              anchorFill="#2563eb"
              anchorStroke="#fff"
              anchorSize={8 / zoom}
              anchorCornerRadius={2 / zoom}
              rotateEnabled={true}
            />
          )}
        </Layer>
      </Stage>
      <div
        className="absolute bottom-4 right-4 z-40 bg-card/90 text-card-foreground 
        px-3 py-2 rounded-lg text-xs font-mono border border-border shadow-lg"
      >
        Objects: {lines.length} | History: {historyIndex + 1}/{history.length} |
        Zoom: {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
