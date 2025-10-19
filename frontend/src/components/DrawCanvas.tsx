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
  Label,
  Tag,
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
import { useAuth } from "@/hooks/useAuth";
import { useParams } from "react-router";
import { useSocket } from "@/hooks/useSocket";

export interface ShapeLine {
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

interface DrawCanvasProps {
  lines: ShapeLine[];
  onLinesChange: (lines: ShapeLine[]) => void;
  onCursorMove?: (x: number, y: number) => void;
  remoteCursors?: Record<
    string,
    { x: number; y: number; name: string; color: string }
  >;
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

export default function DrawCanvas({
  lines,
  onLinesChange,
  onCursorMove,
  remoteCursors,
}: DrawCanvasProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>("brush");
  const [color, setColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [fontSize, setFontSize] = useState(24);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [history, setHistory] = useState<ShapeLine[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const { user } = useAuth();
  const { boardId } = useParams<{ boardId: string }>();
  const socket = useSocket(user?.id ?? "", {});

  useEffect(() => {
    if (history.length === 1 && history[0].length === 0 && lines.length > 0) {
      setHistory([lines]);
    }
  }, [lines]);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === "z" &&
        !e.shiftKey &&
        historyIndex > 0
      ) {
        e.preventDefault();
        undo();
      }
      if (
        ((e.ctrlKey || e.metaKey) && e.key === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z")
      ) {
        if (historyIndex < history.length - 1) {
          e.preventDefault();
          redo();
        }
      }
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

  const updateLines = (newLines: ShapeLine[]) => {
    onLinesChange(newLines);
  };

  const updateHistory = (newLines: ShapeLine[]) => {
    const newHistory = [...history.slice(0, historyIndex + 1), newLines];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const startDrawing = (e: any) => {
    if (tool === "select") return;
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;
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
    updateLines([...lines, newShape]);
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
    const newLines = [...lines];
    const last = newLines[newLines.length - 1];
    if (!last) return;
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
    updateLines(newLines);
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

  const handleStageClick = (e: any) => {
    if (tool !== "select" || e.target !== e.target.getStage()) return;
    setSelectedId(null);
    setTextInput("");
  };

  const handleShapeClick = (id: string, e?: any) => {
    if (tool !== "select") return;
    if (e) e.cancelBubble = true;
    const wasSelected = selectedId === id;
    setSelectedId(wasSelected ? null : id);
    const shape = lines.find((l) => l.id === id);
    if (shape && shape.type === "text" && !wasSelected) {
      setTextInput(shape.text || "");
    } else {
      setTextInput("");
    }
  };

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
    updateLines(newLines);
  };

  const handleDragEnd = (id: string, e: any) => {
    const node = e.target;
    const newLines = lines.map((l) => {
      if (l.id !== id) return l;
      const newX = node.x();
      const newY = node.y();
      if (l.type === "circle" || l.type === "triangle") {
        return { ...l, x: newX - (l.radius || 0), y: newY - (l.radius || 0) };
      }
      return { ...l, x: newX, y: newY };
    });
    updateLines(newLines);
    updateHistory(newLines);
  };

  const handleTextSubmit = () => {
    if (!selectedId) return;
    const newLines = lines.map((l) =>
      l.id === selectedId
        ? { ...l, text: textInput || "Text", fontSize: fontSize / zoom }
        : l
    );
    updateLines(newLines);
    updateHistory(newLines);
  };

  const undo = () => {
    if (historyIndex <= 0) return;
    setHistoryIndex(historyIndex - 1);
    updateLines([...history[historyIndex - 1]]);
    setSelectedId(null);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    setHistoryIndex(historyIndex + 1);
    updateLines([...history[historyIndex + 1]]);
    setSelectedId(null);
  };

  const clear = () => {
    if (!confirm("Clear canvas?")) return;
    updateLines([]);
    updateHistory([]);
    setSelectedId(null);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    const newLines = lines.filter((l) => l.id !== selectedId);
    updateLines(newLines);
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

  const handleZoomIn = () =>
    setZoom((prev) => Math.min(MAX_ZOOM, prev + ZOOM_STEP));
  const handleZoomOut = () =>
    setZoom((prev) => Math.max(MIN_ZOOM, prev - ZOOM_STEP));
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

  const getCursor = () =>
    tool === "select" ? "default" : tool === "text" ? "text" : "crosshair";
  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;
    if (onCursorMove) {
      onCursorMove(pos.x, pos.y);
    }
    drawing(e);
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
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-card/95 
        backdrop-blur px-4 py-3 rounded-2xl shadow-2xl border border-border"
      >
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
      <div
        className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-card/95 backdrop-blur p-3 
        rounded-2xl shadow-2xl border border-border flex flex-col gap-3"
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
      <div
        className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-card/95 backdrop-blur 
        p-3 rounded-2xl shadow-2xl border border-border flex flex-col gap-2"
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
      {selectedId &&
        lines.find((l) => l.id === selectedId)?.type === "text" && (
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-card/95 backdrop-blur 
            p-4 rounded-2xl shadow-2xl border border-border w-[600px]"
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
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        ref={stageRef}
        scaleX={zoom}
        scaleY={zoom}
        x={stagePos.x}
        y={stagePos.y}
        onMouseDown={startDrawing}
        onMouseUp={endDrawing}
        onClick={handleStageClick}
        onWheel={handleWheel}
        draggable={tool === "select" && !selectedId}
        style={{ cursor: getCursor() }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          if (boardId && socket && user) {
            socket.emit("cursor-leave", { boardId, userId: user.id });
          }
        }}
      >
        <Layer>
          {lines.map(renderShape)}
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
        <Layer>
          {remoteCursors &&
            Object.entries(remoteCursors).map(([userId, cursor]) => (
              <div key={userId}>
                <RegularPolygon
                  x={cursor.x}
                  y={cursor.y}
                  sides={3}
                  radius={10}
                  fill={cursor.color}
                  rotation={90}
                  shadowBlur={4}
                  shadowColor="rgba(0,0,0,0.3)"
                />
                <Label x={cursor.x + 20} y={cursor.y - 0}>
                  <Tag
                    fill={cursor.color}
                    cornerRadius={4}
                    shadowColor="rgba(0,0,0,0.3)"
                    shadowBlur={2}
                    shadowOffset={{ x: 1, y: 1 }}
                  />
                  <Text
                    text={cursor.name}
                    fontSize={12}
                    fill="white"
                    padding={6}
                  />
                </Label>
              </div>
            ))}
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
