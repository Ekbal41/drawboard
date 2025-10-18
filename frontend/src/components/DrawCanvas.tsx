import React, { useRef, useState, useEffect } from "react";

interface DrawCanvasProps {
  defaultData?: string;
  onChange?: (data: string) => void;
}

export default function DrawCanvas({ defaultData, onChange }: DrawCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lines, setLines] = useState<{ x: number; y: number }[][]>([]);

  // Load default data
  useEffect(() => {
    if (!defaultData) return;
    try {
      const parsed = JSON.parse(defaultData);
      if (Array.isArray(parsed)) setLines(parsed);
    } catch {
      console.warn("Invalid defaultData");
    }
  }, [defaultData]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setLines((prev) => [...prev, [point]]);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    setLines((prev) => {
      const newLines = [...prev];
      newLines[newLines.length - 1].push(point);
      onChange?.(JSON.stringify(newLines)); // only trigger onChange here
      return newLines;
    });
  };

  const stopDrawing = () => setIsDrawing(false);

  // Draw all lines on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    lines.forEach((line) => {
      ctx.beginPath();
      line.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    });
  }, [lines]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      className="border border-gray-300 rounded-md cursor-crosshair bg-white"
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
    />
  );
}
