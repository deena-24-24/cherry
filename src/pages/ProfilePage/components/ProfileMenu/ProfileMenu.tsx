import React from "react"
import { MenuItem } from "../../types"
import { Menu } from "../../../../components/ui/Menu/Menu"

interface ProfileMenuProps {
  activeMenuItem: MenuItem;
  onMenuItemChange: (item: MenuItem) => void;
}

const menuItems = [
  { id: 'about', label: 'Обо мне' },
  { id: 'progress', label: 'Прогресс' },
  { id: 'resume', label: 'Резюме' },
]

export const ProfileMenu: React.FC<ProfileMenuProps> = ({
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

