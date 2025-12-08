import React from "react"
import * as styles from "./ProfileMenu.module.css"

interface MenuDividerProps {
  top: string;
}

export const MenuDivider: React.FC<MenuDividerProps> = ({ top }) => {
  return (
    <div className={styles["menuDivider"]} style={{ top }}>
      <div className={styles["menuDividerLine"]} />
    </div>
  )
}

