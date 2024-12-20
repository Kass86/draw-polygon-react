/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useCallback, useMemo, useState } from "react";
import styles from "./home.module.css";
import { Box, Button, Stack, Chip, Popover, TextField } from "@mui/material";
import LineChartComponent from "./polygon/LineChartComponent";
import ViewPolygonComponent from "./polygon/ViewPolygonComponent";

const HomeComponent: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [selectedPolygonId, setSelectedPolygonId] = useState<number | null>(
    null
  );
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [newName, setNewName] = useState<string>("");
  const [showLabels, setShowLabels] = useState(true);

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
    setSelectedPolygonId(null);
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

  const handleChipClick = (polygonId: number) => {
    setSelectedPolygonId(polygonId === selectedPolygonId ? null : polygonId);
  };

  const handleOpenReId = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    if (selectedPolygonId) {
      setNewName(
        listPolygonsPresent.find((p: any) => p.id === selectedPolygonId)?.name
      );
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleReId = () => {
    const updatedPolygons = listPolygonsPresent.map((polygon: any) => {
      if (polygon.id === selectedPolygonId) {
        return { ...polygon, name: newName };
      }
      return polygon;
    });

    const newHistory = [...history];
    newHistory[currentIndex] = updatedPolygons;
    setHistory(newHistory);
    handleClose();
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
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={() => {
              setSelectedPolygonId(null);
              handlePolygonChange([]);
            }}
            disabled={!isDrawMode || listPolygonsPresent.length === 0}
          >
            Delete All
          </Button>
          <Button
            variant="contained"
            color="info"
            size="small"
            onClick={() => setShowLabels(!showLabels)}
          >
            {showLabels ? "Ẩn tên" : "Hiện tên"}
          </Button>
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}
        >
          {listPolygonsPresent.map((polygon: any) => (
            <Chip
              key={polygon.id}
              label={`Đa giác ${polygon.name}`}
              onDelete={() => handleDeletePolygon(polygon.id)}
              onClick={() => handleChipClick(polygon.id)}
              color={selectedPolygonId === polygon.id ? "primary" : "default"}
              variant={selectedPolygonId === polygon.id ? "filled" : "outlined"}
              size="small"
              disabled={!isDrawMode}
            />
          ))}
        </Stack>

        {selectedPolygonId !== null && (
          <Button
            variant="outlined"
            onClick={handleOpenReId}
            size="small"
            sx={{ mb: 2 }}
          >
            Đổi tên đa giác
          </Button>
        )}

        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: "center",
            horizontal: "center",
          }}
          transformOrigin={{
            vertical: "center",
            horizontal: "center",
          }}
        >
          <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
            <TextField
              label="Tên mới"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              size="small"
              autoFocus
            />
            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
              <Button size="small" onClick={handleClose}>
                Hủy
              </Button>
              <Button size="small" variant="contained" onClick={handleReId}>
                Đổi ID
              </Button>
            </Box>
          </Box>
        </Popover>
      </Box>

      <Box sx={{ width: 800, height: 450, backgroundColor: "white" }}>
        <Box sx={{ display: isDrawMode ? "block" : "none" }}>
          <LineChartComponent
            polygonState={listPolygonsPresent}
            onPolygonChange={handlePolygonChange}
            selectedPolygonId={selectedPolygonId}
            showLabels={showLabels}
          />
        </Box>

        <Box sx={{ display: isDrawMode ? "none" : "block" }}>
          <ViewPolygonComponent
            polygons={listPolygonsPresent}
            showLabels={showLabels}
          />
        </Box>
      </Box>
    </div>
  );
};

export default HomeComponent;
