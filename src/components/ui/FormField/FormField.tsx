import React from "react"
import * as styles from "./FormField.module.css"

export interface FormFieldStyleProps {
  labelColor?: string;
  labelFontSize?: string;
  labelFontFamily?: string;
  inputBackground?: string;
  inputBorderColor?: string;
  inputBorderRadius?: string;
  inputHeight?: string;
  inputFontSize?: string;
  inputColor?: string;
  inputFontFamily?: string;
  errorColor?: string;
  errorFontSize?: string;
  width?: string;
  paddingLeft?: string;
}

interface FormFieldProps {
  label: string;
  value: string;
  isEditing: boolean;
  type?: string;
  error?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  minHeight?: string;
  styleProps?: FormFieldStyleProps;
  className?: string;
  inputClassName?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  isEditing,
  type = "text",
  error,
  onChange,
  placeholder,
  multiline = false,
  minHeight,
  styleProps,
  className = '',
  inputClassName = '',
}) => {
  const fieldStyles: React.CSSProperties = styleProps ? {
    width: styleProps.width,
  } : {}

  const labelStyles: React.CSSProperties = styleProps ? {
    color: styleProps.labelColor,
    fontSize: styleProps.labelFontSize,
    fontFamily: styleProps.labelFontFamily,
    paddingLeft: styleProps.paddingLeft,
  } : {}

  const inputStyles: React.CSSProperties = styleProps ? {
    background: styleProps.inputBackground,
    borderColor: styleProps.inputBorderColor,
    borderRadius: styleProps.inputBorderRadius,
    height: styleProps.inputHeight,
    fontSize: styleProps.inputFontSize,
    color: styleProps.inputColor,
    fontFamily: styleProps.inputFontFamily,
  } : {}

  const errorStyles: React.CSSProperties = styleProps ? {
    color: styleProps.errorColor,
    fontSize: styleProps.errorFontSize,
  } : {}

  return (
    <div className={`${styles["fieldGroup"]} ${className}`} style={fieldStyles}>
      <div className={styles["fieldLabel"]} style={labelStyles}>
        {label}
      </div>
      {isEditing ? (
        <>
          {multiline ? (
            <textarea
              className={`${styles["inputField"]} ${styles["textareaField"]} ${error ? styles["inputFieldError"] : ''} ${inputClassName}`}
              style={{ ...inputStyles, minHeight }}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
            />
          ) : (
            <input
              type={type}
              className={`${styles["inputField"]} ${error ? styles["inputFieldError"] : ''} ${inputClassName}`}
              style={inputStyles}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
            />
          )}
          {error && (
            <div className={styles["errorMessage"]} style={errorStyles}>
              {error}
            </div>
          )}
        </>
      ) : (
        <div className={`${styles["inputField"]} ${styles["inputFieldView"]} ${multiline ? styles["textareaField"] : ''} ${inputClassName}`} style={{ ...inputStyles, minHeight }}>
          {value}
        </div>
      )}
    </div>
  )
}

