"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Box } from "@mui/material";
import React, { useRef, useState, useEffect } from "react";
import useMousePosition from "../../hook/useMousePosition";
import {
  doLinesIntersect,
  doPolygonsIntersect,
  isPointInPolygon,
  isPolygonInBounds,
  isPolygonInsidePolygon,
} from "./utils/polygonValidations";
import { calculatePolygonCenter, clamp } from "./utils/polygonCalculations";

// Định nghĩa kiểu dữ liệu cho một đa giác
interface Polygon {
  id: number;
  name: string;
  lines: { x1: number; y1: number; x2: number; y2: number }[];
}

interface Props {
  polygonState: any;
  onPolygonChange: (newPolygons: any) => void;
  selectedPolygonId: number | null;
  showLabels: boolean;
}

const LineChartComponent = ({
  polygonState,
  onPolygonChange,
  selectedPolygonId,
  showLabels,
}: Props) => {
  const divRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { xCord, yCord } = useMousePosition({
    divRef,
    size: [0, 0],
    scrollXOffset: 0,
    scrollYOffset: 0,
  });

  // Thay đổi state lines thành polygons
  const [polygons, setPolygons] = useState<Polygon[]>([]);
  const [currentPolygonId, setCurrentPolygonId] = useState<number>(0);
  const [draggingPolygon, setDraggingPolygon] = useState<{
    polygonId: number;
    lineIndex: number;
  } | null>(null);

  useEffect(() => {
    if (polygonState) {
      setPolygons(polygonState);
    }
  }, [polygonState]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const [firstPoint, setFirstPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const [currentLine, setCurrentLine] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const [draggingPoint, setDraggingPoint] = useState<{
    polygonId: number;
    lineIndex: number;
    point: "start" | "end";
  } | null>(null);

  const [prevMousePosition, setPrevMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Thêm state để theo dõi số line đã vẽ
  const [lineCount, setLineCount] = useState<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (isDrawing && startPoint && firstPoint) {
          const currentPolygon = polygons.find(
            (p) => p.id === currentPolygonId
          );

          if (currentPolygon) {
            if (currentPolygon.lines.length >= 2) {
              // Tạo đường thẳng nối điểm đầu-cuối
              const lastPoint =
                currentPolygon.lines[currentPolygon.lines.length - 1];
              const closingLine = {
                x1: lastPoint.x2,
                y1: lastPoint.y2,
                x2: firstPoint.x,
                y2: firstPoint.y,
              };

              // Kiểm tra va chạm với tất cả các đa giác khác
              let hasIntersection = false;
              let hasPolygonInside = false;

              // Tạo đa giác hoàn chỉnh để kiểm tra
              const completePolygon = {
                id: currentPolygonId,
                lines: [...currentPolygon.lines, closingLine],
              };

              for (const polygon of polygons) {
                if (polygon.id !== currentPolygonId) {
                  // Kiểm tra va chạm
                  if (
                    doPolygonsIntersect(completePolygon.lines, polygon.lines)
                  ) {
                    hasIntersection = true;
                    break;
                  }

                  // Kiểm tra đa giác nằm bên trong
                  if (
                    isPolygonInsidePolygon(polygon.lines, completePolygon.lines)
                  ) {
                    hasPolygonInside = true;
                    break;
                  }
                }
              }

              // Kiểm tra self-intersection
              if (!hasIntersection && currentPolygon.lines.length > 2) {
                for (let i = 1; i < currentPolygon.lines.length - 1; i++) {
                  if (doLinesIntersect(closingLine, currentPolygon.lines[i])) {
                    hasIntersection = true;
                    break;
                  }
                }
              }

              if (hasIntersection || hasPolygonInside) {
                // Nếu có va chạm hoặc có đa giác nằm bên trong, xóa polygon
                setPolygons((prevPolygons) =>
                  prevPolygons.filter(
                    (polygon) => polygon.id !== currentPolygonId
                  )
                );
              } else {
                // Tạo popup để nhập tên
                const polygonName = prompt("Vui lòng nhập tên cho đa giác:");
                if (polygonName === null) {
                  // Nếu người dùng bấm Cancel, xóa polygon
                  setPolygons((prevPolygons) =>
                    prevPolygons.filter(
                      (polygon) => polygon.id !== currentPolygonId
                    )
                  );
                  return;
                }
                // Nếu không có va chạm, đóng polygon và thêm tên
                setPolygons((prevPolygons) => {
                  const data = prevPolygons.map((polygon) => {
                    if (polygon.id === currentPolygonId) {
                      return {
                        ...polygon,
                        name: polygonName,
                        lines: [...polygon.lines, closingLine],
                      };
                    }
                    return polygon;
                  });
                  onPolygonChange([...data]);
                  return data;
                });
              }
            } else {
              // Nếu chỉ có 1 hoặc 2 line, xóa polygon
              setPolygons((prevPolygons) =>
                prevPolygons.filter(
                  (polygon) => polygon.id !== currentPolygonId
                )
              );
            }
          }

          // Reset các state
          setIsDrawing(false);
          setStartPoint(null);
          setFirstPoint(null);
          setCurrentLine(null);
          setCurrentPolygonId((prev) => prev + 1);
          setLineCount(0);
        }
      } else if (e.code === "Escape") {
        if (isDrawing) {
          // Xóa polygon đang vẽ dang dở
          setPolygons((prevPolygons) =>
            prevPolygons.filter((polygon) => polygon.id !== currentPolygonId)
          );
          // Reset các state
          setIsDrawing(false);
          setStartPoint(null);
          setFirstPoint(null);
          setCurrentLine(null);
          setLineCount(0);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isDrawing,
    startPoint,
    firstPoint,
    currentPolygonId,
    polygons,
    lineCount,
    onPolygonChange,
  ]);

  const mouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const targetElement = e.target as SVGElement;
    const isCircle = targetElement.tagName.toLowerCase() === "circle";
    const isLine = targetElement.tagName.toLowerCase() === "line";

    if (isCircle) return;

    if (isLine) {
      const polygonId = parseInt(
        targetElement.getAttribute("data-polygon-id") || "-1",
        10
      );
      const lineIndex = parseInt(
        targetElement.getAttribute("data-line-index") || "-1",
        10
      );
      setDraggingPolygon({ polygonId, lineIndex });
      setPrevMousePosition({ x: xCord, y: yCord });
    } else {
      const newPoint = { x: xCord, y: yCord };

      // Kiểm tra điểm bắt đầu có nằm trong đa giác nào không
      for (const polygon of polygons) {
        if (isPointInPolygon(newPoint, polygon.lines)) {
          return; // Không cho phép bắt đầu vẽ từ trong đa giác
        }
      }

      if (!startPoint) {
        setStartPoint(newPoint);
        setFirstPoint(newPoint);
        if (!polygons.find((p) => p.id === currentPolygonId)) {
          setPolygons((prev) => [
            ...prev,
            { id: currentPolygonId, name: "", lines: [] },
          ]);
        }
      }
      setIsDrawing(true);
    }
  };

  const mouseMove = () => {
    if (draggingPoint) {
      const { polygonId, lineIndex, point } = draggingPoint;
      const clampedX = clamp(xCord, 0, 800);
      const clampedY = clamp(yCord, 0, 450);

      setPolygons((prevPolygons) => {
        return prevPolygons.map((polygon) => {
          if (polygon.id === polygonId) {
            const newLines = [...polygon.lines];
            const testLines = [...newLines];

            if (point === "start") {
              testLines[lineIndex] = {
                ...testLines[lineIndex],
                x1: clampedX,
                y1: clampedY,
              };

              if (lineIndex > 0) {
                testLines[lineIndex - 1] = {
                  ...testLines[lineIndex - 1],
                  x2: clampedX,
                  y2: clampedY,
                };
              } else if (testLines.length > 1) {
                testLines[testLines.length - 1] = {
                  ...testLines[testLines.length - 1],
                  x2: clampedX,
                  y2: clampedY,
                };
              }

              // Kiểm tra va chạm với các đa giác khác
              const otherPolygons = prevPolygons.filter(
                (p) => p.id !== polygonId
              );
              let hasCollision = false;

              // Kiểm tra va chạm với đa giác khác
              for (const otherPolygon of otherPolygons) {
                if (doPolygonsIntersect(testLines, otherPolygon.lines)) {
                  hasCollision = true;
                  break;
                }
              }

              // Kiểm tra self-intersection
              if (!hasCollision) {
                for (let i = 0; i < testLines.length; i++) {
                  for (let j = i + 2; j < testLines.length; j++) {
                    // Bỏ qua kiểm tra với các đường thẳng liền kề
                    if (i === 0 && j === testLines.length - 1) continue;
                    if (doLinesIntersect(testLines[i], testLines[j])) {
                      hasCollision = true;
                      break;
                    }
                  }
                  if (hasCollision) break;
                }
              }

              // Nếu có va chạm, giữ nguyên vị trí cũ
              if (hasCollision) {
                return polygon;
              }

              // Nếu không có va chạm, cập nhật vị trí mới
              return {
                ...polygon,
                lines: testLines,
              };
            }
            return polygon;
          }
          return polygon;
        });
      });
    } else if (draggingPolygon && prevMousePosition) {
      const deltaX = xCord - prevMousePosition.x;
      const deltaY = yCord - prevMousePosition.y;

      setPolygons((prevPolygons) => {
        return prevPolygons.map((polygon) => {
          if (polygon.id === draggingPolygon.polygonId) {
            // Tính toán vị trí mới cho đa giác
            const newLines = polygon.lines.map((line) => ({
              x1: line.x1 + deltaX,
              y1: line.y1 + deltaY,
              x2: line.x2 + deltaX,
              y2: line.y2 + deltaY,
            }));

            // Kiểm tra giới hạn khung
            if (!isPolygonInBounds(newLines)) {
              return polygon;
            }

            // Kiểm tra va chạm với các đa giác khác
            const otherPolygons = prevPolygons.filter(
              (p) => p.id !== draggingPolygon.polygonId
            );

            for (const otherPolygon of otherPolygons) {
              if (doPolygonsIntersect(newLines, otherPolygon.lines)) {
                return polygon; // Giữ nguyên vị trí nếu có va chạm
              }
            }

            return {
              ...polygon,
              lines: newLines,
            };
          }
          return polygon;
        });
      });

      setPrevMousePosition({ x: xCord, y: yCord });
    } else if (isDrawing && startPoint) {
      const clampedX = clamp(xCord, 0, 800);
      const clampedY = clamp(yCord, 0, 450);

      // Kiểm tra điểm mới có nằm trong bất kỳ đa giác nào không
      const newPoint = { x: clampedX, y: clampedY };
      for (const polygon of polygons) {
        if (
          polygon.id !== currentPolygonId &&
          isPointInPolygon(newPoint, polygon.lines)
        ) {
          return; // Chỉ dừng lại, không xóa đường đang vẽ
        }
      }

      const newLine = {
        x1: startPoint.x,
        y1: startPoint.y,
        x2: clampedX,
        y2: clampedY,
      };

      // Kiểm tra va chạm với các đa giác khác
      let hasCollision = false;
      for (const polygon of polygons) {
        if (polygon.id !== currentPolygonId) {
          for (const line of polygon.lines) {
            if (doLinesIntersect(newLine, line)) {
              hasCollision = true;
              break;
            }
          }
        }
      }

      if (hasCollision) {
        return; // Chỉ dừng lại, không xóa đường đang vẽ
      }

      setCurrentLine(newLine);
    }
  };

  // Thêm useEffect mới để xử lý mouseup toàn cục
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDrawing && startPoint && currentLine) {
        const currentPolygon = polygons.find((p) => p.id === currentPolygonId);

        if (currentPolygon) {
          // Tạo mảng lines mới bao gồm line hiện tại
          const newLines = [...currentPolygon.lines];
          const newLine = {
            x1: currentLine.x1,
            y1: currentLine.y1,
            x2: currentLine.x2,
            y2: currentLine.y2,
          };

          // Kiểm tra line mới có cắt với các line cũ trong cùng polygon không
          let hasSelfIntersection = false;
          for (let i = 0; i < newLines.length - 1; i++) {
            if (doLinesIntersect(newLine, newLines[i])) {
              hasSelfIntersection = true;
              break;
            }
          }

          if (hasSelfIntersection) {
            // Nếu có self-intersection, xóa toàn bộ polygon
            setPolygons((prevPolygons) =>
              prevPolygons.filter((polygon) => polygon.id !== currentPolygonId)
            );
            setIsDrawing(false);
            setStartPoint(null);
            setFirstPoint(null);
            setCurrentLine(null);
            setLineCount(0);
          } else {
            // Nếu không có self-intersection, thêm line mới vào polygon
            setPolygons((prevPolygons) =>
              prevPolygons.map((polygon) => {
                if (polygon.id === currentPolygonId) {
                  return {
                    ...polygon,
                    lines: [...polygon.lines, newLine],
                  };
                }
                return polygon;
              })
            );
            setStartPoint({ x: currentLine.x2, y: currentLine.y2 });
            setLineCount((prev) => prev + 1);
          }
        }
      }

      // Thêm điều kiện kiểm tra khi kết thúc drag hoặc resize
      if (draggingPolygon || draggingPoint) {
        onPolygonChange([...polygons]);
      }

      setDraggingPolygon(null);
      setDraggingPoint(null);
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [
    isDrawing,
    startPoint,
    currentLine,
    currentPolygonId,
    polygons,
    draggingPolygon,
    draggingPoint,
    onPolygonChange,
  ]);

  const mouseUp = () => {
    // Có thể xóa vì đã được xử lý bởi global mouseup
  };

  const handleCircleMouseDown = (
    polygonId: number,
    lineIndex: number,
    point: "start" | "end"
  ) => {
    setDraggingPoint({ polygonId, lineIndex, point });
  };

  return (
    <Box
      sx={{
        width: "800px",
        height: "450px",
        position: "relative",
        backgroundColor: "burlywood",
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: "100%",
          margin: 0,
          padding: 0,
          boxSizing: "border-box",
          userSelect: "none",
          position: "absolute",
          zIndex: 2,
          backgroundColor: "transparent",
          left: "50%",
          top: "50%",
          transform: "translate(-50%,-50%)",
        }}
        ref={divRef}
      >
        <svg
          id="svg"
          ref={svgRef}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            cursor: draggingPoint ? "pointer" : "crosshair",
            fill: "transparent",
          }}
          onMouseDown={mouseDown}
          onMouseUp={mouseUp}
          onMouseMove={mouseMove}
        >
          {polygons.map((polygon) => {
            const isSelected = selectedPolygonId === polygon.id;
            const center = calculatePolygonCenter(polygon.lines);

            return (
              <g key={polygon.id}>
                {polygon.lines.map((line, lineIndex) => (
                  <React.Fragment key={lineIndex}>
                    {/* Invisible line for better interaction */}
                    <line
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      stroke="transparent"
                      strokeWidth="15"
                      data-polygon-id={polygon.id}
                      data-line-index={lineIndex}
                      style={{ cursor: "move" }}
                    />
                    {/* Visible line */}
                    <line
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      stroke={isSelected ? "#ff4081" : "black"}
                      strokeWidth={isSelected ? 3 : 2}
                      pointerEvents="none"
                    />
                    {/* Invisible circle for better interaction */}
                    <circle
                      cx={line.x1}
                      cy={line.y1}
                      r={8}
                      fill="transparent"
                      onMouseDown={() =>
                        handleCircleMouseDown(polygon.id, lineIndex, "start")
                      }
                      style={{ cursor: "pointer" }}
                    />
                    {/* Visible circle */}
                    <circle
                      cx={line.x1}
                      cy={line.y1}
                      r={3}
                      fill="red"
                      pointerEvents="none"
                    />
                  </React.Fragment>
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
                    {polygon.name}
                  </text>
                )}
              </g>
            );
          })}
          {currentLine && (
            <React.Fragment>
              <line
                x1={currentLine.x1}
                y1={currentLine.y1}
                x2={currentLine.x2}
                y2={currentLine.y2}
                stroke="black"
                strokeWidth="2"
              />
              <circle
                cx={currentLine.x1}
                cy={currentLine.y1}
                r={3}
                fill="red"
              />
              <circle
                cx={currentLine.x2}
                cy={currentLine.y2}
                r={3}
                fill="red"
              />
              {isDrawing &&
                firstPoint &&
                currentLine &&
                (polygons.find((p) => p.id === currentPolygonId)?.lines
                  .length ??
                  0 >= 1) && (
                  <line
                    x1={currentLine.x2}
                    y1={currentLine.y2}
                    x2={firstPoint.x}
                    y2={firstPoint.y}
                    stroke="gray"
                    strokeWidth="1.5"
                    strokeDasharray="5,5"
                    pointerEvents="none"
                  />
                )}
            </React.Fragment>
          )}
        </svg>
      </Box>
    </Box>
  );
};

export default LineChartComponent;
