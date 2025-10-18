import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Line, Rect, Circle, RegularPolygon } from "react-konva";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Undo, Redo, Trash2, Brush, Square, Triangle, Eraser } from "lucide-react";

interface DrawCanvasProps {
  defaultData?: string;
  onChange?: (data: string) => void;
}

type Tool = "brush" | "eraser" | "rect" | "circle" | "triangle";

interface ShapeLine {
  type: Tool;
  points?: number[];
  color: string;
  strokeWidth: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
}

export default function DrawCanvas({ defaultData, onChange }: DrawCanvasProps) {
  const [lines, setLines] = useState<ShapeLine[]>([]);
  const [tool, setTool] = useState<Tool>("brush");
  const [color, setColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const stageRef = useRef<any>(null);
  const historyRef = useRef<ShapeLine[][]>([[]]);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isInitialMount = useRef(true);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (defaultData) {
        try {
          const parsed: ShapeLine[] = JSON.parse(defaultData);
          if (Array.isArray(parsed)) {
            setLines(parsed);
            historyRef.current = [parsed];
            setHistoryIndex(0);
          }
        } catch {
          console.warn("Invalid defaultData");
        }
      }
    }
  }, [defaultData]);

  const startDrawing = (e: any) => {
    const pos = e.target.getStage().getPointerPosition();
    if (!pos) return;
    setIsDrawing(true);

    const newShape: ShapeLine = {
      type: tool,
      color: tool === "eraser" ? "#ffffff" : color,
      strokeWidth,
      ...(tool === "brush" || tool === "eraser"
        ? { points: [pos.x, pos.y] }
        : { x: pos.x, y: pos.y, width: 0, height: 0, radius: 0 }),
    };

    setLines((prev) => {
      const newLines = [...prev, newShape];
      if (onChange) {
        onChange(JSON.stringify(newLines));
      }
      return newLines;
    });
  };

  const drawing = (e: any) => {
    if (!isDrawing) return;
    const pos = e.target.getStage().getPointerPosition();
    if (!pos) return;

    setLines((prev) => {
      const newLines = [...prev];
      const last = newLines[newLines.length - 1];
      if (!last) return prev;

      if (tool === "brush" || tool === "eraser") {
        last.points = last.points!.concat([pos.x, pos.y]);
      } else if (tool === "rect") {
        last.width = pos.x - last.x!;
        last.height = pos.y - last.y!;
      } else if (tool === "circle") {
        const dx = pos.x - last.x!;
        const dy = pos.y - last.y!;
        last.radius = Math.sqrt(dx * dx + dy * dy);
      } else if (tool === "triangle") {
        const dx = pos.x - last.x!;
        const dy = pos.y - last.y!;
        last.radius = Math.sqrt(dx * dx + dy * dy);
      }

      if (onChange) {
        onChange(JSON.stringify(newLines));
      }
      return newLines;
    });
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    setLines((currentLines) => {
      historyRef.current = [
        ...historyRef.current.slice(0, historyIndex + 1),
        currentLines,
      ];
      setHistoryIndex(historyRef.current.length - 1);
      if (onChange) {
        onChange(JSON.stringify(currentLines));
      }
      return currentLines;
    });
  };

  const undo = () => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    const newLines = [...historyRef.current[newIndex]];
    setHistoryIndex(newIndex);
    setLines(newLines);
    if (onChange) {
      onChange(JSON.stringify(newLines));
    }
  };

  const redo = () => {
    if (historyIndex >= historyRef.current.length - 1) return;
    const newIndex = historyIndex + 1;
    const newLines = [...historyRef.current[newIndex]];
    setHistoryIndex(newIndex);
    setLines(newLines);
    if (onChange) {
      onChange(JSON.stringify(newLines));
    }
  };

  const clear = () => {
    const emptyLines: ShapeLine[] = [];
    setLines(emptyLines);
    historyRef.current = [
      ...historyRef.current.slice(0, historyIndex + 1),
      emptyLines,
    ];
    setHistoryIndex(historyRef.current.length - 1);
    if (onChange) {
      onChange(JSON.stringify(emptyLines));
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-white">
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        className="cursor-crosshair"
        ref={stageRef}
        onMouseDown={startDrawing}
        onMouseMove={drawing}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
        onTouchStart={startDrawing}
        onTouchMove={drawing}
        onTouchEnd={endDrawing}
      >
        <Layer>
          {lines.map((line, i) => {
            if (line.type === "brush" || line.type === "eraser") {
              return (
                <Line
                  key={i}
                  points={line.points!}
                  stroke={line.color}
                  strokeWidth={line.strokeWidth}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  globalCompositeOperation={
                    line.type === "eraser" ? "destination-out" : "source-over"
                  }
                />
              );
            }
            if (line.type === "rect") {
              return (
                <Rect
                  key={i}
                  x={line.x}
                  y={line.y}
                  width={line.width}
                  height={line.height}
                  stroke={line.color}
                  strokeWidth={line.strokeWidth}
                />
              );
            }
            if (line.type === "circle") {
              return (
                <Circle
                  key={i}
                  x={line.x}
                  y={line.y}
                  radius={line.radius}
                  stroke={line.color}
                  strokeWidth={line.strokeWidth}
                />
              );
            }
            if (line.type === "triangle") {
              return (
                <RegularPolygon
                  key={i}
                  x={line.x}
                  y={line.y}
                  sides={3}
                  radius={line.radius}
                  stroke={line.color}
                  strokeWidth={line.strokeWidth}
                />
              );
            }
            return null;
          })}
        </Layer>
      </Stage>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-white p-3 rounded-full shadow-lg border border-gray-200">
        <Button
          variant={tool === "brush" ? "default" : "outline"}
          size="icon"
          onClick={() => setTool("brush")}
          className="rounded-full hover:bg-blue-100"
        >
          <Brush size={20} />
        </Button>
        <Button
          variant={tool === "eraser" ? "default" : "outline"}
          size="icon"
          onClick={() => setTool("eraser")}
          className="rounded-full hover:bg-blue-100"
        >
          <Eraser size={20} />
        </Button>
        <Button
          variant={tool === "rect" ? "default" : "outline"}
          size="icon"
          onClick={() => setTool("rect")}
          className="rounded-full hover:bg-blue-100"
        >
          <Square size={20} />
        </Button>
        <Button
          variant={tool === "circle" ? "default" : "outline"}
          size="icon"
          onClick={() => setTool("circle")}
          className="rounded-full hover:bg-blue-100"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
          </svg>
        </Button>
        <Button
          variant={tool === "triangle" ? "default" : "outline"}
          size="icon"
          onClick={() => setTool("triangle")}
          className="rounded-full hover:bg-blue-100"
        >
          <Triangle size={20} />
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full hover:bg-blue-100"
            >
              <div
                className="w-5 h-5 rounded-full"
                style={{ backgroundColor: color }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-10 cursor-pointer"
            />
          </PopoverContent>
        </Popover>
        <div className="w-32">
          <Slider
            value={[strokeWidth]}
            min={1}
            max={20}
            step={1}
            onValueChange={(value) => setStrokeWidth(value[0])}
            className="w-full"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={undo}
          disabled={historyIndex <= 0}
          className="rounded-full hover:bg-blue-100"
        >
          <Undo size={20} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={redo}
          disabled={historyIndex >= historyRef.current.length - 1}
          className="rounded-full hover:bg-blue-100"
        >
          <Redo size={20} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={clear}
          className="rounded-full hover:bg-red-100"
        >
          <Trash2 size={20} />
        </Button>
      </div>
    </div>
  );
}