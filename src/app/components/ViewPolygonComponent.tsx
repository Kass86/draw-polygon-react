import React from "react";
import { Box } from "@mui/material";

interface Polygon {
  id: number;
  lines: { x1: number; y1: number; x2: number; y2: number }[];
}

interface Props {
  polygons: Polygon[];
  showLabels: boolean;
  selectedPolygonId?: number | null;
}

const calculatePolygonCenter = (
  lines: { x1: number; y1: number; x2: number; y2: number }[]
) => {
  let sumX = 0;
  let sumY = 0;
  const points = lines.map((line) => ({ x: line.x1, y: line.y1 }));
  points.forEach((point) => {
    sumX += point.x;
    sumY += point.y;
  });
  return {
    x: sumX / points.length,
    y: sumY / points.length,
  };
};

const ViewPolygonComponent: React.FC<Props> = ({
  polygons,
  showLabels,
  selectedPolygonId,
}) => {
  return (
    <Box
      sx={{
        width: "800px",
        height: "450px",
        position: "relative",
        backgroundColor: "burlywood",
      }}
    >
      <svg
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          cursor: "default",
          fill: "transparent",
        }}
      >
        {polygons.map((polygon) => {
          const isSelected = selectedPolygonId === polygon.id;
          const center = calculatePolygonCenter(polygon.lines);

          return (
            <g key={polygon.id}>
              {polygon.lines.map((line, index) => (
                <line
                  key={index}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke={isSelected ? "#ff4081" : "black"}
                  strokeWidth={isSelected ? 3 : 2}
                />
              ))}
              {showLabels && (
                <text
                  x={center.x}
                  y={center.y}
                  textAnchor="middle"
                  fill={isSelected ? "#ff4081" : "black"}
                  fontSize="14"
                  fontWeight={isSelected ? "bold" : "normal"}
                  pointerEvents="none"
                >
                  {polygon.id}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </Box>
  );
};

export default ViewPolygonComponent;
