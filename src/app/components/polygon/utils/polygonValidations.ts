export const isPolygonInBounds = (
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
export const doLinesIntersect = (
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
  
  export const doPolygonsIntersect = (
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
  export const isPointInPolygon = (
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
  export const isPolygonInsidePolygon = (
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