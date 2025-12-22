import React from "react"
import { FormData } from "../../../types"
import { validateEmail } from "../../../utils"
import { ProfileField } from "./ProfileField"
import { Button } from "../../ui/Button/Button"
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
    if (field === 'phone') {
      onInputChange('phoneCode', '')
    }
  }

  return (
    <div className={styles["formContainer"]}>

      {/* ВЕРХНЯЯ ЧАСТЬ */}
      <div className={styles["topSection"]}>
        <div className={styles["mainFields"]}>
          <ProfileField
            label="ИМЯ"
            value={formData.firstName}
            isEditing={isEditing}
            onChange={(val) => handleInputChange('firstName', val)}
          />

          <ProfileField
            label="ФАМИЛИЯ"
            value={formData.lastName}
            isEditing={isEditing}
            onChange={(val) => handleInputChange('lastName', val)}
          />

          <ProfileField
            type="email"
            label="ЭЛЕКТРОННАЯ ПОЧТА"
            value={formData.email}
            isEditing={isEditing}
            error={emailError}
            onChange={(val) => handleInputChange('email', val)}
          />

          <ProfileField
            type="phone"
            label="ТЕЛЕФОН"
            value={formData.phone || ''}
            isEditing={isEditing}
            placeholder="+7-999-999-99-99"
            onChange={(val) => handleInputChange('phone', val)}
          />
        </div>

        <div className={styles["avatarSection"]}>
          <ProfileAvatar
            avatarUrl={avatarUrl}
            isEditing={isEditing}
            onAvatarChange={onAvatarChange}
          />
        </div>
      </div>

      {/* НИЖНЯЯ ЧАСТЬ */}
      <div className={styles["bottomSection"]}>
        <ProfileField
          type="city"
          label="ГОРОД"
          value={formData.city}
          isEditing={isEditing}
          placeholder="Введите страну"
          onChange={(val) => handleInputChange('city', val)}
        />

        <ProfileField
          type="textarea"
          label="О СЕБЕ"
          value={formData.about}
          isEditing={isEditing}
          onChange={(val) => handleInputChange('about', val)}
        />
      </div>

      {/* КНОПКИ */}
      <div className={styles["actions"]}>
        {isEditing ? (
          <>
            <Button variant="primary" onClick={onEditToggle} className={styles["saveButton"]} styleProps={{ textColor: '#fffcf5' }}>
              СОХРАНИТЬ
            </Button>
            <Button variant="secondary" onClick={onCancel} className={styles["cancelButton"]}>
              Отмена
            </Button>
          </>
        ) : (
          <Button variant="primary" onClick={onEditToggle} styleProps={{ textColor: '#fffcf5' }}>
            РЕДАКТИРОВАТЬ
          </Button>
        )}
      </div>
    </div>
  )
}