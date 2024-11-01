"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Box } from "@mui/material";
import React, { useRef, useState, useEffect } from "react";
import useMousePosition from "../hook/useMousePosition";

// Định nghĩa kiểu dữ liệu cho một đa giác
interface Polygon {
  id: number;
  lines: { x1: number; y1: number; x2: number; y2: number }[];
}

interface Props {
  polygonState: any;
  onPolygonChange: (newPolygons: any) => void;
  selectedPolygonId: number | null;
  showLabels: boolean;
}

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

const isPolygonInBounds = (
  lines: { x1: number; y1: number; x2: number; y2: number }[]
): boolean => {
  return lines.every(
    (line) =>
      line.x1 >= 0 &&
      line.x1 <= 800 &&
      line.y1 >= 0 &&
      line.y1 <= 450 &&
      line.x2 >= 0 &&
      line.x2 <= 800 &&
      line.y2 >= 0 &&
      line.y2 <= 450
  );
};

// Thêm các hàm helper mới
const doLinesIntersect = (
  line1: { x1: number; y1: number; x2: number; y2: number },
  line2: { x1: number; y1: number; x2: number; y2: number }
): boolean => {
  // Tính toán hướng của ba điểm
  const direction = (
    { x: x1, y: y1 }: { x: number; y: number },
    { x: x2, y: y2 }: { x: number; y: number },
    { x: x3, y: y3 }: { x: number; y: number }
  ) => {
    return (x3 - x1) * (y2 - y1) - (x2 - x1) * (y3 - y1);
  };

  // Kiểm tra xem hai đoạn thẳng có giao nhau không
  const onSegment = (
    p: { x: number; y: number },
    q: { x: number; y: number },
    r: { x: number; y: number }
  ) => {
    return (
      q.x <= Math.max(p.x, r.x) &&
      q.x >= Math.min(p.x, r.x) &&
      q.y <= Math.max(p.y, r.y) &&
      q.y >= Math.min(p.y, r.y)
    );
  };

  const p1 = { x: line1.x1, y: line1.y1 };
  const q1 = { x: line1.x2, y: line1.y2 };
  const p2 = { x: line2.x1, y: line2.y1 };
  const q2 = { x: line2.x2, y: line2.y2 };

  const d1 = direction(p1, q1, p2);
  const d2 = direction(p1, q1, q2);
  const d3 = direction(p2, q2, p1);
  const d4 = direction(p2, q2, q1);

  if (
    ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
  )
    return true;

  if (d1 === 0 && onSegment(p1, p2, q1)) return true;
  if (d2 === 0 && onSegment(p1, q2, q1)) return true;
  if (d3 === 0 && onSegment(p2, p1, q2)) return true;
  if (d4 === 0 && onSegment(p2, q1, q2)) return true;

  return false;
};

const doPolygonsIntersect = (
  polygon1: { x1: number; y1: number; x2: number; y2: number }[],
  polygon2: { x1: number; y1: number; x2: number; y2: number }[]
): boolean => {
  for (const line1 of polygon1) {
    for (const line2 of polygon2) {
      if (doLinesIntersect(line1, line2)) {
        return true;
      }
    }
  }
  return false;
};

// Thêm hàm kiểm tra điểm có nằm trong đa giác không
const isPointInPolygon = (
  point: { x: number; y: number },
  polygon: { x1: number; y1: number; x2: number; y2: number }[]
): boolean => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x1,
      yi = polygon[i].y1;
    const xj = polygon[j].x1,
      yj = polygon[j].y1;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

// Thêm hàm mới để kiểm tra đa giác có nằm hoàn toàn trong đa giác khác không
const isPolygonInsidePolygon = (
  innerPolygon: { x1: number; y1: number; x2: number; y2: number }[],
  outerPolygon: { x1: number; y1: number; x2: number; y2: number }[]
): boolean => {
  // Kiểm tra tất cả các đỉnh của đa giác bên trong
  for (const line of innerPolygon) {
    const point = { x: line.x1, y: line.y1 };
    if (!isPointInPolygon(point, outerPolygon)) {
      return false;
    }
  }
  return true;
};

// Thêm hàm tính toán tâm của đa giác
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
                // Tạo popup để nhập ID
                const polygonId = prompt("Vui lòng nhập ID cho đa giác:");
                if (polygonId === null) {
                  // Nếu người dùng bấm Cancel, xóa polygon
                  setPolygons((prevPolygons) =>
                    prevPolygons.filter(
                      (polygon) => polygon.id !== currentPolygonId
                    )
                  );
                  return;
                }
                // Nếu không có va chạm, đóng polygon
                setPolygons((prevPolygons) => {
                  const data = prevPolygons.map((polygon) => {
                    if (polygon.id === currentPolygonId) {
                      return {
                        id: +polygonId,
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
          setPolygons((prev) => [...prev, { id: currentPolygonId, lines: [] }]);
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
                    <line
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      stroke={isSelected ? "#ff4081" : "black"}
                      strokeWidth={isSelected ? 3 : 2}
                      data-polygon-id={polygon.id}
                      data-line-index={lineIndex}
                      style={{ cursor: "move" }}
                    />
                    <circle
                      cx={line.x1}
                      cy={line.y1}
                      r={3}
                      fill="red"
                      onMouseDown={() =>
                        handleCircleMouseDown(polygon.id, lineIndex, "start")
                      }
                      style={{ cursor: "pointer" }}
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
                    {polygon.id > 10 ? polygon.id : ""}
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
