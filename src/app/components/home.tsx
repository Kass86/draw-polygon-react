/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useCallback, useMemo, useState } from "react";
import styles from "./home.module.css";
import { Box, Button, Stack, Chip } from "@mui/material";
import LineChartComponent from "./LineChartComponent";
import ViewPolygonComponent from "./ViewPolygonComponent";

const HomeComponent: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isDrawMode, setIsDrawMode] = useState(false);

  const handlePolygonChange = useCallback(
    (newPolygons: any) => {
      const newHistory = history.slice(0, currentIndex + 1);
      const updatedHistory = [...newHistory, newPolygons];
      setHistory(updatedHistory);
      setCurrentIndex(updatedHistory.length - 1);
    },
    [history, currentIndex]
  );

  const listPolygonsPresent = useMemo(() => {
    return history[currentIndex] || [];
  }, [history, currentIndex]);

  const handleDeletePolygon = (polygonId: number) => {
    const newPolygons = listPolygonsPresent.filter(
      (p: any) => p.id !== polygonId
    );
    handlePolygonChange(newPolygons);
  };

  const handleBack = () => {
    if (currentIndex >= 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <div className={styles.container} style={{ backgroundColor: "white" }}>
      <Box sx={{ height: "300px" }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Button
            variant="contained"
            onClick={handleBack}
            disabled={currentIndex < 0 || !isDrawMode}
            size="small"
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={currentIndex >= history.length - 1 || !isDrawMode}
            size="small"
          >
            Next
          </Button>
          <Button
            variant="contained"
            onClick={() => setIsDrawMode(!isDrawMode)}
            color={isDrawMode ? "error" : "success"}
            size="small"
          >
            {isDrawMode ? "Cancel Draw" : "Draw"}
          </Button>
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}
        >
          {listPolygonsPresent.map((polygon: any, index: number) => (
            <Chip
              key={polygon.id}
              label={`Đa giác ${index + 1}`}
              onDelete={() => handleDeletePolygon(polygon.id)}
              color="primary"
              variant="outlined"
              size="small"
              disabled={!isDrawMode}
            />
          ))}
        </Stack>
      </Box>

      <Box sx={{ width: 800, height: 450, backgroundColor: "white" }}>
        <Box sx={{ display: isDrawMode ? "block" : "none" }}>
          <LineChartComponent
            polygonState={listPolygonsPresent}
            onPolygonChange={handlePolygonChange}
          />
        </Box>

        <Box sx={{ display: isDrawMode ? "none" : "block" }}>
          <ViewPolygonComponent polygons={listPolygonsPresent} />
        </Box>
      </Box>
    </div>
  );
};

export default HomeComponent;
