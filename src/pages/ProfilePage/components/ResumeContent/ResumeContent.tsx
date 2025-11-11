import React from "react";
import * as styles from "./ResumeContent.module.css";

export const ResumeContent: React.FC = () => {
  return (
    <div className={styles["resumeContent"]}>
      <h2 className={styles["title"]}>Резюме</h2>
      <p className={styles["description"]}>
        Здесь будет отображаться ваше резюме.
      </p>
      {/* Здесь можно добавить компонент резюме */}
    </div>
  );
};

