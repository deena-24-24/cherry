import React from "react"
import { HrMenuItem } from "../../types"
import { Menu } from "../../../../components/ui/Menu/Menu"

interface HrMenuProps {
  activeMenuItem: HrMenuItem;
  onMenuItemChange: (item: HrMenuItem) => void;
}

const menuItems = [
  { id: 'about', label: 'Личный кабинет' },
  { id: 'candidates', label: 'Избранные кандидаты' },
]

export const HrMenu: React.FC<HrMenuProps> = ({
  activeMenuItem,
  onMenuItemChange,
}) => {
  return (
    <Menu
      items={menuItems}
      activeItemId={activeMenuItem}
      onItemChange={onMenuItemChange}
    />
  )
}

