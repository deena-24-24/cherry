import React from "react"
import * as styles from "./Button.module.css"

export interface ButtonStyleProps {
  width?: string;
  height?: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderRadius?: string;
  fontSize?: string;
  fontFamily?: string;
  padding?: string;
  gap?: string;
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'custom';
  styleProps?: ButtonStyleProps;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  styleProps,
  className = '',
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return styles["buttonPrimary"]
      case 'secondary':
        return styles["buttonSecondary"]
      default:
        return ''
    }
  }

  const inlineStyles: React.CSSProperties = styleProps ? {
    width: styleProps.width,
    height: styleProps.height,
    backgroundColor: styleProps.backgroundColor,
    color: styleProps.textColor,
    borderColor: styleProps.borderColor,
    borderRadius: styleProps.borderRadius,
    fontSize: styleProps.fontSize,
    fontFamily: styleProps.fontFamily,
    padding: styleProps.padding,
    gap: styleProps.gap,
  } : {}

  return (
    <button
      className={`${getVariantClass()} ${className}`}
      style={inlineStyles}
      {...props}
    >
      <div className={styles["buttonText"]}>
        {children}
      </div>
    </button>
  )
}

