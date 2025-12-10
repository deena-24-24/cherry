import React from 'react';
import * as styles from './HrChatPage.module.css';

export const HrChatPage: React.FC = () => {
  return (
    <div className={styles["page"]}>
      <div className={styles["title"]}>
        ЧАТ
      </div>
      <div className={styles["container"]}>
        <div className={styles["emptyState"]}>
          <p>Чат пока не реализован</p>
        </div>
      </div>
    </div>
  );
};


