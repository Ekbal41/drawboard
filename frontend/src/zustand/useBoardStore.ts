import { create } from "zustand";

// Define types for the store
interface BoardStore {
  tool: "pen" | "eraser" | "shape";
  color: string;
  lineWidth: number;
  setTool: (tool: "pen" | "eraser" | "shape") => void;
  setColor: (color: string) => void;
  setLineWidth: (lineWidth: number) => void;
}

export const useBoardStore = create<BoardStore>((set) => ({
  tool: "pen",
  color: "#000000",
  lineWidth: 2,
  setTool: (tool) => set({ tool }),
  setColor: (color) => set({ color }),
  setLineWidth: (lineWidth) => set({ lineWidth }),
}));
