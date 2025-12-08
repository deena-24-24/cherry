import React from "react"
import { MenuItem } from "../../types"
import * as styles from "./ProfileMenu.module.css"

interface MenuButtonProps {
  item: MenuItem;
  label: string;
  activeMenuItem: MenuItem;
  positionClass: string;
  onClick: (item: MenuItem) => void;
}

export const MenuButton: React.FC<MenuButtonProps> = ({
  item,
  label,
  activeMenuItem,
  positionClass,
  onClick,
}) => {
  const isActive = activeMenuItem === item
  
  return (
    <button
      className={`${styles["menuButton"]} ${styles[positionClass]}`}
      style={{
        left: isActive ? '13px' : '36px'
      }}
      onClick={() => onClick(item)}
    >
      {label}
    </button>
  )
}

