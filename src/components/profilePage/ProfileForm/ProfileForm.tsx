import React from "react"
import { FormData } from "../../../types"
import { validateEmail } from "../../../utils"
import { FormField } from "../../ui/FormField/FormField"
import { Button } from "../../ui/Button/Button"
import { PhoneField } from "./PhoneField"
import { CountryField } from "./CountryField"
import { TextareaField } from "./TextareaField"
import { ProfileAvatar } from "../ProfileAvatar/ProfileAvatar"
import * as styles from "./ProfileForm.module.css"

interface ProfileFormProps {
  formData: FormData;
  isEditing: boolean;
  emailError: string;
  avatarUrl: string;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onInputChange: (field: keyof FormData, value: string) => void;
  onEmailErrorChange: (error: string) => void;
  onEditToggle: () => void;
  onCancel: () => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  formData,
  isEditing,
  emailError,
  avatarUrl,
  onAvatarChange,
  onInputChange,
  onEmailErrorChange,
  onEditToggle,
  onCancel,
}) => {
  const handleInputChange = (field: keyof FormData, value: string) => {
    onInputChange(field, value)
    if (field === 'email') {
      if (value && !validateEmail(value)) {
        onEmailErrorChange('Введите корректный email адрес')
      } else {
        onEmailErrorChange('')
      }
    }
  }

  const fullWidthStyle = { width: '100%' }

  return (
    <div className={styles["formContainer"]}>

      {/* ВЕРХНЯЯ ЧАСТЬ: Поля + Аватар */}
      <div className={styles["topSection"]}>

        {/* Левая колонка с основными полями */}
        <div className={styles["mainFields"]}>
          <FormField
            label="ИМЯ"
            value={formData.firstName}
            isEditing={isEditing}
            onChange={(value) => handleInputChange('firstName', value)}
            styleProps={fullWidthStyle}
          />

          <FormField
            label="ФАМИЛИЯ"
            value={formData.lastName}
            isEditing={isEditing}
            onChange={(value) => handleInputChange('lastName', value)}
            styleProps={fullWidthStyle}
          />

          <FormField
            label="ЭЛЕКТРОННАЯ ПОЧТА"
            value={formData.email}
            isEditing={isEditing}
            type="email"
            error={emailError}
            onChange={(value) => handleInputChange('email', value)}
            styleProps={fullWidthStyle}
          />

          <PhoneField
            value={formData.phone || ''}
            isEditing={isEditing}
            onChange={(value) => {
              handleInputChange('phone', value)
              handleInputChange('phoneCode', '')
            }}
          />
        </div>

        {/* Правая колонка с аватаром */}
        <div className={styles["avatarSection"]}>
          <ProfileAvatar
            avatarUrl={avatarUrl}
            isEditing={isEditing}
            onAvatarChange={onAvatarChange}
          />
        </div>
      </div>

      {/* НИЖНЯЯ ЧАСТЬ: Поля во всю ширину */}
      <div className={styles["bottomSection"]}>
        <CountryField
          value={formData.country}
          isEditing={isEditing}
          onChange={(value) => handleInputChange('country', value)}
        />

        <TextareaField
          label="О СЕБЕ"
          value={formData.about}
          isEditing={isEditing}
          onChange={(value) => handleInputChange('about', value)}
        />
      </div>

      {/* Кнопки */}
      <div className={styles["actions"]}>
        {isEditing ? (
          <>
            <Button
              variant="primary"
              onClick={onEditToggle}
              className={styles["saveButton"]}
            >
              СОХРАНИТЬ
            </Button>
            <Button
              variant="secondary"
              onClick={onCancel}
              className={styles["cancelButton"]}
            >
              Отмена
            </Button>
          </>
        ) : (
          <Button
            variant="primary"
            onClick={onEditToggle}
          >
            РЕДАКТИРОВАТЬ
          </Button>
        )}
      </div>
    </div>
  )
}