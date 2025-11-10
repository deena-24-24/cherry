import React from "react";
import * as styles from "./Sidebar.module.css";

export const Sidebar: React.FC = () => {
  return (
    <aside className={styles["sidebar"]}>
      <div className={styles["avatar"]}></div>
      <div className={styles["tabs"]}>
        <button>Обо мне</button>
        <button>Прогресс</button>
        <button>Резюме?</button>
      </div>
    </aside>
  );
};

