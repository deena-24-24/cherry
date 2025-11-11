import React from "react";
import { FormData } from "../../types";
import { validateEmail } from "../../utils";
import { FormField } from "../../../../components/ui/FormField/FormField";
import { Button } from "../../../../components/ui/Button/Button";
import { PhoneField } from "./PhoneField";
import { CountryField } from "./CountryField";
import { TextareaField } from "./TextareaField";
import * as styles from "./ProfileForm.module.css";

interface ProfileFormProps {
  formData: FormData;
  isEditing: boolean;
  emailError: string;
  onInputChange: (field: keyof FormData, value: string) => void;
  onEmailErrorChange: (error: string) => void;
  onEditToggle: () => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  formData,
  isEditing,
  emailError,
  onInputChange,
  onEmailErrorChange,
  onEditToggle,
}) => {
  const handleInputChange = (field: keyof FormData, value: string) => {
    onInputChange(field, value);
    
    // Валидация email
    if (field === 'email') {
      if (value && !validateEmail(value)) {
        onEmailErrorChange('Введите корректный email адрес');
      } else {
        onEmailErrorChange('');
      }
    }
  };

  return (
    <div className={styles["formSection"]}>
      {/* Поле "Имя" */}
      <FormField
        label="ИМЯ"
        value={formData.name}
        isEditing={isEditing}
        onChange={(value) => handleInputChange('name', value)}
      />

      {/* Поле "Электронная почта" */}
      <FormField
        label="ЭЛЕКТРОННАЯ ПОЧТА"
        value={formData.email}
        isEditing={isEditing}
        type="email"
        error={emailError}
        onChange={(value) => handleInputChange('email', value)}
      />

      {/* Поле "Телефон" */}
      <PhoneField
        value={formData.phone || ''}
        isEditing={isEditing}
        onChange={(value) => {
          // Сохраняем как одно поле phone, очищаем phoneCode
          handleInputChange('phone', value);
          handleInputChange('phoneCode', '');
        }}
      />

      {/* Поле "Страна" */}
      <CountryField
        value={formData.country}
        isEditing={isEditing}
        onChange={(value) => handleInputChange('country', value)}
      />

      {/* Поле "О себе" */}
      <TextareaField
        label="О СЕБЕ"
        value={formData.about}
        isEditing={isEditing}
        onChange={(value) => handleInputChange('about', value)}
      />

      {/* Кнопка "Редактировать" / "Сохранить" */}
      <Button
        variant="primary"
        onClick={onEditToggle}
      >
        {isEditing ? 'СОХРАНИТЬ' : 'РЕДАКТИРОВАТЬ'}
      </Button>
    </div>
  );
};

