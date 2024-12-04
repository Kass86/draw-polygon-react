"use client";
import { useCallback, useMemo, useState } from "react";
import { Box, Button } from "@mui/material";
import CanvasDrawing from "./Boxbox";

const BoxContainer = () => {
  const GRID_SIZE = 64;
  const [history, setHistory] = useState<number[][][]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const handleDataChange = useCallback(
    (newData: number[][]) => {
      const newHistory = history.slice(0, currentIndex + 1);
      const updatedHistory = [...newHistory, newData];
      setHistory(updatedHistory);
      setCurrentIndex(updatedHistory.length - 1);
    },
    [history, currentIndex]
  );

  const rectanglePresent = useMemo(() => {
    return (
      history[currentIndex] ||
      Array(64)
        .fill(0)
        .map(() => Array(64).fill(0))
    );
  }, [history, currentIndex]);

  const handleUndo = () => {
    if (currentIndex >= 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleRedo = () => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleClearAll = () => {
    const newGrid = Array(GRID_SIZE)
      .fill(0)
      .map(() => Array(GRID_SIZE).fill(0));
    handleDataChange(newGrid);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
      }}
    >
      <CanvasDrawing
        onDataChange={handleDataChange}
        rectState={rectanglePresent}
      />
      <Box sx={{ display: "flex", gap: 2 }}>
        <Button variant="contained" onClick={handleUndo}>
          Undo
        </Button>
        <Button
          variant="contained"
          onClick={handleRedo}
          disabled={currentIndex >= history.length - 1}
        >
          Redo
        </Button>
        <Button variant="contained" onClick={handleClearAll}>
          Clear
        </Button>
      </Box>
    </Box>
  );
};
export default BoxContainer;
