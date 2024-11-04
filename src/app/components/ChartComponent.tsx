"use client";

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);
const options = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "70%",
  layout: {
    padding: "60",
  },
  plugins: {
    legend: {
      display: false,
    },
    // tooltip: {
    //   callbacks: {
    //     label: (tooltipItem) => {
    //       const data = tooltipItem.raw;
    //       return `${data}%`;
    //     },
    //   },
    // },
  },
};

interface LabelPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  originalX: number;
}
const customLegend = {
  id: "customLegend",
  afterDraw: (chart: ChartJS) => {
    const {
      ctx,
      chartArea: { width, height },
    } = chart;
    chart.data.datasets.forEach((dataset, i) => {
      const meta = chart.getDatasetMeta(i);

      // Mảng lưu thông tin vị trí các label
      const labelPositions: LabelPosition[] = [];

      meta.data.forEach((datapoint, index) => {
        const label = chart.data.labels?.[index];
        const value = dataset.data?.[index];

        //@ts-expect-error dont neeđ param
        const { x, y } = datapoint.tooltipPosition();

        const color = (dataset.backgroundColor as string[])[index];

        const cx = (width + 100) / 2;
        const cy = (height + 100) / 2;

        const padding = 10;

        let newX = x,
          newY = y;

        if (y <= cy) {
          if (x <= cx) {
            newX = newX - (cx - x) - padding;
            newY = newY - (cy - y) / 2 + padding - 10;
          } else {
            newX = newX + (x - cx) - padding;
            newY = newY - (cy - y) / 2 + padding - 10;
          }
        } else {
          if (x <= cx) {
            newX = newX - (cx - x) - padding;
            newY = newY + (y - cy) / 2 + padding + 5;
          } else {
            newX = newX + (x - cx) - padding;
            newY = newY + (y - cy) / 2 + padding + 5;
          }
        }

        ctx.fillStyle = color; // Sử dụng màu từ dataset
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Tính kích thước của text
        const labelMetrics = ctx.measureText(label as string);
        const valueMetrics = ctx.measureText(`${value}%`);

        let hasCollision = true;
        let attempts = 0;
        const offsetStep = 20; // Bước nhảy mỗi lần tăng newX

        while (hasCollision && attempts < 10) {
          // Giới hạn số lần thử để tránh vòng lặp vô hạn
          const labelBox = {
            x: newX - Math.max(labelMetrics.width, valueMetrics.width) / 2,
            y: newY - 30,
            width: Math.max(labelMetrics.width, valueMetrics.width),
            height: 40,
            originalX: x,
          };

          //@ts-expect-error dont care
          hasCollision = labelPositions.find((existingBox) => {
            return !(
              labelBox.x + labelBox.width < existingBox.x ||
              labelBox.x > existingBox.x + existingBox.width ||
              labelBox.y + labelBox.height < existingBox.y ||
              labelBox.y > existingBox.y + existingBox.height
            );
          });

          if (hasCollision) {
            //@ts-expect-error dont care
            if (x > hasCollision.originalX) {
              newX += offsetStep; // Tăng newX lên khi phát hiện va chạm
              attempts++;
            } else {
              newX -= offsetStep; // Tăng newX lên khi phát hiện va chạm
              attempts++;
            }
          }
        }

        if (attempts > 1) {
          console.log(attempts);
          const halfwidth = width / 2 + 60;
          const halfheight = height / 2 + 60;

          const xLine = newX >= halfwidth ? x + 25 : x - 25;
          const yLine = newY >= halfheight ? y + 25 : y - 25;
          const labelSpace =
            newX >= halfwidth
              ? -2 - labelMetrics.width / 2
              : 2 + labelMetrics.width / 2;

          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(xLine, yLine + 5);

          if (
            (newX >= halfwidth && newX + labelSpace > xLine) ||
            (newX < halfwidth && newX + labelSpace < xLine)
          ) {
            ctx.lineTo(newX + labelSpace, yLine + 5);
          }

          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Vẽ label sau khi đã điều chỉnh vị trí
        //@ts-expect-error dont care
        ctx.fillText(label, newX, newY);
        ctx.fillStyle = color;
        ctx.font = "bold 26px Arial";
        ctx.fillText(`${value}%`, newX, newY - 22);

        // Lưu vị trí cuối cùng vào mảng
        labelPositions.push({
          x: newX - Math.max(labelMetrics.width, valueMetrics.width) / 2,
          y: newY - 30,
          width: Math.max(labelMetrics.width, valueMetrics.width),
          height: 40,
          originalX: x,
        });
      });
    });
  },
};
interface ChartProps {
  chartData: number[];
}
const ChartComponent = ({ chartData }: ChartProps) => {
  const data = {
    labels: ["Khách quen", "Khách VIP", "Khách mới"],
    datasets: [
      {
        data: chartData,
        backgroundColor: ["#1665C1", "#1CAC4B", "#F37227"],
        borderWidth: 0,
        borderRadius: 5,
        spacing: 5,
      },
    ],
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        margin: "0 auto",
        position: "relative",
      }}
    >
      {/* @ts-expect-error dont care*/}
      <Doughnut options={options} data={data} plugins={[customLegend]} />
      <div
        style={{
          top: "50%",
          left: "50%",
          color: "black",
          textAlign: "center",
          position: "absolute",
          transform: "translate(-50%, -50%)",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontFamily: "BeVietnamProLight",
          }}
        >
          Tổng
        </div>
        <div
          style={{
            fontSize: "2rem",
            fontFamily: "BeVietnamProBold",
          }}
        >
          2205
        </div>
      </div>
    </div>
  );
};
export default ChartComponent;
