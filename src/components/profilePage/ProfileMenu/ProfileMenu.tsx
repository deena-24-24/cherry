import React from "react"
import * as styles from "./ProfileMenu.module.css"

export interface TabItem {
  id: string;
  label: string;
}

interface ProfileMenuProps {
  items: TabItem[];
  activeItemId: string;
  onItemChange: (id: string) => void;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({
  items,
  activeItemId,
  onItemChange,
}) => {
  return (
    <div className={styles["tabsContainer"]}>
      {items.map((item) => {
        const isActive = activeItemId === item.id
        return (
          <button
            key={item.id}
            className={`${styles["tab"]} ${isActive ? styles["active"] : ''}`}
            onClick={() => onItemChange(item.id)}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}