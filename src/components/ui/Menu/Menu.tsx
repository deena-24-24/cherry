import React from "react";
import * as styles from "./Menu.module.css";

export interface MenuItem {
  id: string;
  label: string;
}

export interface MenuStyleProps {
  width?: string;
  height?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: string;
  activeBackground?: string;
  activeBorderColor?: string;
  itemHeight?: string;
  itemFontSize?: string;
  itemColor?: string;
  itemFontFamily?: string;
}

interface MenuProps {
  items: MenuItem[];
  activeItemId: string;
  onItemChange: (itemId: string) => void;
  styleProps?: MenuStyleProps;
  className?: string;
}

export const Menu: React.FC<MenuProps> = ({
  items,
  activeItemId,
  onItemChange,
  styleProps,
  className = '',
}) => {
  const menuStyles: React.CSSProperties = styleProps ? {
    width: styleProps.width,
    height: styleProps.height,
  } : {};

  const backgroundStyles: React.CSSProperties = styleProps ? {
    width: styleProps.width,
    height: styleProps.height,
    background: styleProps.backgroundColor,
    borderColor: styleProps.borderColor,
    borderRadius: styleProps.borderRadius,
  } : {};

  const activeItemStyles: React.CSSProperties = styleProps ? {
    background: styleProps.activeBackground,
    borderColor: styleProps.activeBorderColor,
    borderRadius: styleProps.borderRadius,
  } : {};

  const itemStyles: React.CSSProperties = styleProps ? {
    height: styleProps.itemHeight,
    fontSize: styleProps.itemFontSize,
    color: styleProps.itemColor,
    fontFamily: styleProps.itemFontFamily,
  } : {};

  // Фиксированные позиции как в оригинале
  const getActiveItemTop = (index: number) => {
    const positions = ['0px', '47px', '95px'];
    return positions[index] || '0px';
  };

  const getButtonTop = (index: number) => {
    const positions = ['1px', '47px', '95px'];
    return positions[index] || '1px';
  };

  const getDividerTop = (index: number) => {
    const positions = ['40px', '88px'];
    return positions[index] || '40px';
  };

  return (
    <div className={`${styles["menu"]} ${className}`} style={menuStyles}>
      {/* Фон меню */}
      <div className={styles["menuBackground"]} style={backgroundStyles} />

      {/* Разделители */}
      {items.slice(1).map((_, index) => (
        <div
          key={`divider-${index}`}
          className={styles["menuDivider"]}
          style={{ top: getDividerTop(index) }}
        >
          <div className={styles["menuDividerLine"]} />
        </div>
      ))}

      {/* Активный пункт */}
      {items.map((item, index) => {
        if (item.id === activeItemId) {
          return (
            <div
              key={`active-${item.id}`}
              className={styles["menuActiveItem"]}
              style={{
                ...activeItemStyles,
                top: getActiveItemTop(index),
                left: '0px',
              }}
            />
          );
        }
        return null;
      })}

      {/* Кнопки меню */}
      {items.map((item, index) => {
        const isActive = item.id === activeItemId;
        return (
          <button
            key={item.id}
            className={styles["menuButton"]}
            style={{
              ...itemStyles,
              top: getButtonTop(index),
              left: isActive ? '13px' : '36px',
            }}
            onClick={() => onItemChange(item.id)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

