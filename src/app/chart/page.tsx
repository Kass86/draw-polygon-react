"use client";
import { Box } from "@mui/material";
import ChartComponent from "../components/ChartComponent";
import { useState, FormEvent } from "react";
import styles from "./chart.module.css";

export default function Home() {
  const [chartData, setChartData] = useState([1, 100, 1]);
  const [inputValues, setInputValues] = useState({
    regular: 1,
    vip: 100,
    new: 1,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setChartData([inputValues.regular, inputValues.vip, inputValues.new]);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Thống kê khách hàng</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <div className={styles.inputWrapper}>
              <label>Khách quen</label>
              <input
                type="number"
                value={inputValues.regular}
                onChange={(e) =>
                  setInputValues((prev) => ({
                    ...prev,
                    regular: Number(e.target.value),
                  }))
                }
                min="0"
              />
            </div>
            <div className={styles.inputWrapper}>
              <label>Khách VIP</label>
              <input
                type="number"
                value={inputValues.vip}
                onChange={(e) =>
                  setInputValues((prev) => ({
                    ...prev,
                    vip: Number(e.target.value),
                  }))
                }
                min="0"
              />
            </div>
            <div className={styles.inputWrapper}>
              <label>Khách mới</label>
              <input
                type="number"
                value={inputValues.new}
                onChange={(e) =>
                  setInputValues((prev) => ({
                    ...prev,
                    new: Number(e.target.value),
                  }))
                }
                min="0"
              />
            </div>
          </div>

          <button type="submit" className={styles.button}>
            Cập nhật biểu đồ
          </button>
        </form>

        <div className={styles.chartWrapper}>
          <Box
            sx={{
              backgroundColor: "white",
              height: "276px",
              width: "470px",
              padding: "14px",
              boxSizing: "content-box",
              margin: "0 auto",
            }}
          >
            <ChartComponent chartData={chartData} />
          </Box>
        </div>
      </div>
    </div>
  );
}
