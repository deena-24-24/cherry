import React, { useState, useEffect } from "react"
import { FormData as ProfileFormData, HrMenuItem } from "../../types"
import { compressAvatarImage } from "../../utils"
import { ProfileAvatar } from "../../components/profilePage/ProfileAvatar/ProfileAvatar" // Больше не нужен здесь, если используем внутри формы, но для HR он может быть отдельным компонентом или тем же. Используем тот же подход.
import { HrMenu } from "../../components/profilePage/HrMenu/HrMenu"
import { FavoritesContent } from "../../components/profilePage/FavoritesContent/FavoritesContent"

import { FormField } from "../../components/ui/FormField/FormField"
import { PhoneField } from "../../components/profilePage/ProfileForm/PhoneField"
import { CountryField } from "../../components/profilePage/ProfileForm/CountryField"
import { TextareaField } from "../../components/profilePage/ProfileForm/TextareaField"
import { Button } from "../../components/ui/Button/Button"
import { validateEmail } from "../../utils"
import { useAuthStore } from "../../store"
import { fetchHr, updateHr } from "../../service/hr/hrService"
import "../../styles/variables.css"
import * as styles from "../candidate/ProfilePage.module.css"
import * as formStyles from "../../components/profilePage/ProfileForm/ProfileForm.module.css"

export const HrProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore()
  const [activeMenuItem, setActiveMenuItem] = useState<HrMenuItem>('about')
  const [isEditing, setIsEditing] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [emailError, setEmailError] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    phoneCode: '',
    country: '',
    about: ''
  })
  const [companyName, setCompanyName] = useState<string>('')

  // ... (логика загрузки loadProfile, handleSave, handleCancel остается прежней) ...
  const loadProfile = async () => {
    if (!user) { setLoading(false); return }
    try {
      setLoading(true)
      const hrData = await fetchHr()
      setFormData({
        firstName: hrData.firstName || '',
        lastName: hrData.lastName || '',
        email: hrData.email || user.email || '',
        phone: hrData.phone || '',
        phoneCode: '',
        country: hrData.country || '',
        about: hrData.about || ''
      })
      setCompanyName(hrData.companyName || '')
      if (hrData.avatar) setAvatarUrl(hrData.avatar)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProfile().then() }, [user])

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (field === 'email') {
      setEmailError(value && !validateEmail(value) ? 'Некорректный email' : '')
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const compressed = await compressAvatarImage(file)
        setAvatarUrl(compressed)
      } catch (error) { console.error(error) }
    }
  }

  const handleSave = async () => {
    try {
      const hrData = { ...formData, avatar: avatarUrl, companyName }
      const updatedHr = await updateHr(hrData)
      if (updatedHr) {
        updateUser({ ...updatedHr })
      }
      setIsEditing(false)
    } catch (error) { console.error(error) }
  }

  const handleEditToggle = () => isEditing ? handleSave() : setIsEditing(true)

  const handleCancel = async () => {
    setIsEditing(false)
    loadProfile()
  }

  if (loading) return <div>Загрузка...</div>

  const getTitle = () => activeMenuItem === 'about' ? 'ЛИЧНЫЙ КАБИНЕТ' : 'ИЗБРАННЫЕ КАНДИДАТЫ'
  const fullWidthStyle = { width: '100%' }

  return (
    <div className={styles["page"]}>
      <div className={styles["title"]}>{getTitle()}</div>

      <div className={styles["container"]}>

        {/* ЛЕВАЯ КОЛОНКА */}
        <div className={styles["contentColumn"]}>
          {activeMenuItem === 'about' && (
            <div className={formStyles["formContainer"]}>

              {/* Верхняя секция: Поля + Аватар */}
              <div className={formStyles["topSection"]}>
                <div className={formStyles["mainFields"]}>
                  <FormField
                    label="ИМЯ"
                    value={formData.firstName}
                    isEditing={isEditing}
                    onChange={(v) => handleInputChange('firstName', v)}
                    styleProps={fullWidthStyle}
                  />
                  <FormField
                    label="ФАМИЛИЯ"
                    value={formData.lastName}
                    isEditing={isEditing}
                    onChange={(v) => handleInputChange('lastName', v)}
                    styleProps={fullWidthStyle}
                  />
                  {/* Поле компании для HR */}
                  <FormField
                    label="НАЗВАНИЕ КОМПАНИИ"
                    value={companyName}
                    isEditing={isEditing}
                    onChange={setCompanyName}
                    styleProps={fullWidthStyle}
                  />
                  <FormField
                    label="ЭЛЕКТРОННАЯ ПОЧТА"
                    value={formData.email}
                    isEditing={isEditing}
                    type="email"
                    error={emailError}
                    onChange={(v) => handleInputChange('email', v)}
                    styleProps={fullWidthStyle}
                  />
                  <PhoneField
                    value={formData.phone || ''}
                    isEditing={isEditing}
                    onChange={(v) => handleInputChange('phone', v)}
                  />
                </div>

                <div className={formStyles["avatarSection"]}>
                  <ProfileAvatar
                    avatarUrl={avatarUrl}
                    isEditing={isEditing}
                    onAvatarChange={handleAvatarChange}
                  />
                </div>
              </div>

              {/* Нижняя секция */}
              <div className={formStyles["bottomSection"]}>
                <CountryField
                  value={formData.country}
                  isEditing={isEditing}
                  onChange={(v) => handleInputChange('country', v)}
                />
                <TextareaField
                  label="О СЕБЕ"
                  value={formData.about}
                  isEditing={isEditing}
                  onChange={(v) => handleInputChange('about', v)}
                />
              </div>

              {/* Кнопки */}
              <div className={formStyles["actions"]}>
                {isEditing ? (
                  <>
                    <Button variant="primary" onClick={handleSave} className={formStyles["saveButton"]}>СОХРАНИТЬ</Button>
                    <Button variant="secondary" onClick={handleCancel} className={formStyles["cancelButton"]}>Отмена</Button>
                  </>
                ) : (
                  <Button variant="primary" onClick={handleEditToggle}>РЕДАКТИРОВАТЬ</Button>
                )}
              </div>
            </div>
          )}

          {activeMenuItem === 'candidates' && <FavoritesContent />}
        </div>

        {/* ПРАВАЯ КОЛОНКА (Меню) */}
        <div className={styles["menuColumn"]}>
          <HrMenu
            activeMenuItem={activeMenuItem}
            onMenuItemChange={setActiveMenuItem}
          />
        </div>

      </div>
    </div>
  )
}