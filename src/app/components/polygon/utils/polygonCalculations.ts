// Thêm hàm tính toán tâm của đa giác
export const calculatePolygonCenter = (
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

export const clamp = (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
  };