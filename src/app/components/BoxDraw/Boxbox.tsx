import React, { useRef, useEffect, useState } from "react";
import { Box } from "@mui/material";

const CanvasDrawing = ({
  onDataChange,
  rectState,
}: {
  onDataChange: (data: number[][]) => void;
  rectState: number[][];
}) => {
  const GRID_SIZE = 64;
  const CELL_SIZE = 10;
  const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const startPoint = useRef<{ x: number; y: number } | null>(null);
  const [grid, setGrid] = useState<number[][]>(rectState);

  // Cập nhật grid khi rectState thay đổi (cho undo/redo)
  useEffect(() => {
    setGrid(rectState);
  }, [rectState]);

  const drawCanvas = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Vẽ các ô đã chọn
    ctx.fillStyle = "red";
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (grid[i][j] === 1) {
          ctx.fillRect(j * CELL_SIZE, i * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }
    }

    // Vẽ grid lines
    ctx.strokeStyle = "#eee";
    ctx.beginPath();
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
    }
    ctx.stroke();
  };

  const getGridPosition = (
    e: React.MouseEvent<HTMLCanvasElement> | MouseEvent
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const clientX = "clientX" in e ? e.clientX : (e as MouseEvent).clientX;
    const clientY = "clientY" in e ? e.clientY : (e as MouseEvent).clientY;

    let x = Math.floor((clientX - rect.left) / CELL_SIZE);
    let y = Math.floor((clientY - rect.top) / CELL_SIZE);

    // Giới hạn tọa độ trong canvas
    x = Math.max(0, Math.min(x, GRID_SIZE - 1));
    y = Math.max(0, Math.min(y, GRID_SIZE - 1));

    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getGridPosition(e);
    if (!pos) return;

    setIsDrawing(true);
    startPoint.current = pos;

    const newGrid = rectState.map((row) => [...row]);
    newGrid[pos.y][pos.x] = 1;
    setGrid(newGrid);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint.current) return;

    const pos = getGridPosition(e);
    if (!pos) return;

    const newGrid = rectState.map((row) => [...row]); // Copy grid hiện tại
    const startX = Math.min(startPoint.current.x, pos.x);
    const endX = Math.max(startPoint.current.x, pos.x);
    const startY = Math.min(startPoint.current.y, pos.y);
    const endY = Math.max(startPoint.current.y, pos.y);

    // Fill rectangle và giữ lại các ô đã vẽ trước đó
    for (let i = startY; i <= endY; i++) {
      for (let j = startX; j <= endX; j++) {
        newGrid[i][j] = 1;
      }
    }
    setGrid(newGrid);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDrawing || !startPoint.current) return;

      const pos = getGridPosition(e);
      if (!pos) return;

      const newGrid = rectState.map((row) => [...row]);
      const startX = Math.min(startPoint.current.x, pos.x);
      const endX = Math.max(startPoint.current.x, pos.x);
      const startY = Math.min(startPoint.current.y, pos.y);
      const endY = Math.max(startPoint.current.y, pos.y);

      for (let i = startY; i <= endY; i++) {
        for (let j = startX; j <= endX; j++) {
          newGrid[i][j] = 1;
        }
      }
      setGrid(newGrid);
    };

    const handleGlobalMouseUp = () => {
      if (isDrawing) {
        onDataChange(grid);
        setIsDrawing(false);
        startPoint.current = null;
      }
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDrawing, grid, onDataChange, rectState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawCanvas(ctx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid]);

  return (
    <Box sx={{ position: "relative" }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        style={{
          border: "1px solid #ccc",
          cursor: "pointer",
        }}
      />
    </Box>
  );
};

export default CanvasDrawing;
