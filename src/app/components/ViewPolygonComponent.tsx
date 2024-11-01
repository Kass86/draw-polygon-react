import React from "react";
import { Box } from "@mui/material";

interface Polygon {
  id: number;
  lines: { x1: number; y1: number; x2: number; y2: number }[];
}

interface Props {
  polygons: Polygon[];
}

const ViewPolygonComponent: React.FC<Props> = ({ polygons }) => {
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
        {polygons.map((polygon) => (
          <g key={polygon.id}>
            {polygon.lines.map((line, index) => (
              <line
                key={index}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="black"
                strokeWidth="2"
              />
            ))}
          </g>
        ))}
      </svg>
    </Box>
  );
};

export default ViewPolygonComponent;
