import React from "react"
import { FormField } from "../../../../components/ui/FormField/FormField"

interface TextareaFieldProps {
  label: string;
  value: string;
  isEditing: boolean;
  onChange: (value: string) => void;
}

export const TextareaField: React.FC<TextareaFieldProps> = ({
  label,
  value,
  isEditing,
  onChange,
}) => {
  return (
    <FormField
      label={label}
      value={value}
      isEditing={isEditing}
      onChange={onChange}
      multiline={true}
      minHeight="100px"
      styleProps={{
        width: '155%',
      }}
    />
  )
}

