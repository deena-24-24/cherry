import React from "react";
import { formatPhoneNumber } from "../../utils";
import { FormField } from "../../../../components/ui/FormField/FormField";

interface PhoneFieldProps {
  value: string;
  isEditing: boolean;
  onChange: (value: string) => void;
}

export const PhoneField: React.FC<PhoneFieldProps> = ({
  value,
  isEditing,
  onChange,
}) => {
  const handleChange = (inputValue: string) => {
    const formatted = formatPhoneNumber(inputValue);
    onChange(formatted);
  };

  return (
    <FormField
      label="ТЕЛЕФОН (НЕОБЯЗАТЕЛЬНО)"
      value={value}
      isEditing={isEditing}
      type="tel"
      onChange={handleChange}
      placeholder="+7-887-87-98-77"
    />
  );
};

