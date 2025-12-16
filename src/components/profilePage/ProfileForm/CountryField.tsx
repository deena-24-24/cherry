import React from "react"
import { FormField } from "../../ui/FormField/FormField"

interface CountryFieldProps {
  value: string;
  isEditing: boolean;
  onChange: (value: string) => void;
}

export const CountryField: React.FC<CountryFieldProps> = ({
  value,
  isEditing,
  onChange,
}) => {
  return (
    <FormField
      label="СТРАНА (НЕОБЯЗАТЕЛЬНО)"
      value={value}
      isEditing={isEditing}
      onChange={onChange}
      placeholder="Введите страну"
      styleProps={{
        width: '100%',
      }}
    />
  )
}
