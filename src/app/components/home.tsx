import React from "react";
import Image from "next/image";
import styles from "./home.module.css";
import { Box } from "@mui/material";
import LineChartComponent from "./LineChartComponent";

const HomeComponent: React.FC = () => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Image src="/logo.png" alt="Logo" width={100} height={50} priority />
        <nav>
          <ul className={styles.navList}>
            <li>
              <a href="/">Trang chủ</a>
            </li>
            <li>
              <a href="/about">Giới thiệu</a>
            </li>
            <li>
              <a href="/contact">Liên hệ</a>
            </li>
          </ul>
        </nav>
      </header>

      <Box sx={{ width: 400, height: 300, backgroundColor: "white" }}>
        {/* <AudioButtons /> */}
        <LineChartComponent />
      </Box>

      <footer className={styles.footer}>
        <p>&copy; 2024 Công ty ABC. Tất cả các quyền được bảo lưu.</p>
      </footer>
    </div>
  );
};

export default HomeComponent;
