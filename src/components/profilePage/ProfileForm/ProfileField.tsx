import React from "react"
import { FormField, FormFieldStyleProps } from "../../ui/FormField/FormField"
import { formatPhoneNumber } from "../../../utils"

export type ProfileFieldType = 'text' | 'email' | 'phone' | 'city' | 'textarea'

interface ProfileFieldProps {
  type?: ProfileFieldType;
  label: string;
  value: string;
  isEditing: boolean;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  styleProps?: FormFieldStyleProps;
}

export const ProfileField: React.FC<ProfileFieldProps> = ({
  type = 'text',
  label,
  value,
  isEditing,
  onChange,
  error,
  placeholder,
  styleProps = { width: '100%' },
}) => {

  const handleChange = (inputValue: string) => {
    let finalValue = inputValue

    if (type === 'phone') {
      finalValue = formatPhoneNumber(inputValue)
    }

    onChange(finalValue)
  }

  const isMultilne = type === 'textarea'
  const minHeight = type === 'textarea' ? '100px' : undefined
  const inputType = type === 'email' ? 'email' : (type === 'phone' ? 'tel' : 'text')

  return (
    <FormField
      label={label}
      value={value}
      isEditing={isEditing}
      type={inputType}
      error={error}
      onChange={handleChange}
      placeholder={placeholder}
      multiline={isMultilne}
      minHeight={minHeight}
      styleProps={styleProps}
    />
  )
}