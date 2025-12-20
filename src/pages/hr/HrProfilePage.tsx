import React, { useState, useEffect } from "react"
import { FormData as ProfileFormData, HrMenuItem } from "../../types"
import { compressAvatarImage } from "../../utils"
import { ProfileAvatar } from "../../components/profilePage/ProfileAvatar/ProfileAvatar"
import { ProfileMenu, TabItem } from "../../components/profilePage/ProfileMenu/ProfileMenu"
import { FavoritesContent } from "../../components/profilePage/FavoritesContent/FavoritesContent"
import { Button } from "../../components/ui/Button/Button"
import { validateEmail } from "../../utils"
import { useAuthStore } from "../../store"
import { fetchHr, updateHr } from "../../service/api/hrService"
import "../../styles/variables.css"
import * as styles from "../candidate/ProfilePage.module.css"
import * as formStyles from "../../components/profilePage/ProfileForm/ProfileForm.module.css"

import { ProfileField } from "../../components/profilePage/ProfileForm/ProfileField"

const HR_MENU_ITEMS: TabItem[] = [
  { id: 'about', label: 'Обо мне' },
  { id: 'candidates', label: 'Избранные кандидаты' },
]

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
    city: '',
    about: ''
  })
  const [companyName, setCompanyName] = useState<string>('')

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
        city: hrData.city || '',
        about: hrData.about || ''
      })
      setCompanyName(hrData.companyName || '')
      if (hrData.avatar) setAvatarUrl(hrData.avatar)
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }

  useEffect(() => { loadProfile().then() }, [user])

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (field === 'email') setEmailError(value && !validateEmail(value) ? 'Некорректный email' : '')
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
      if (updatedHr) updateUser({ ...updatedHr })
      setIsEditing(false)
    } catch (error) { console.error(error) }
  }

  const handleEditToggle = () => isEditing ? handleSave() : setIsEditing(true)
  const handleCancel = async () => { setIsEditing(false); loadProfile() }

  if (loading) return <div>Загрузка...</div>

  return (
    <div className={styles["page"]}>
      <div className={styles["container"]}>
        <div className={styles["title"]}>КАБИНЕТ HR</div>

        <ProfileMenu
          items={HR_MENU_ITEMS}
          activeItemId={activeMenuItem}
          onItemChange={(id) => setActiveMenuItem(id as HrMenuItem)}
        />

        <div className={styles["tabContent"]}>
          {activeMenuItem === 'about' && (
            <div className={formStyles["formContainer"]}>

              <div className={formStyles["topSection"]}>
                <div className={formStyles["mainFields"]}>
                  <ProfileField
                    label="ИМЯ"
                    value={formData.firstName}
                    isEditing={isEditing}
                    onChange={(v) => handleInputChange('firstName', v)}
                  />
                  <ProfileField
                    label="ФАМИЛИЯ"
                    value={formData.lastName}
                    isEditing={isEditing}
                    onChange={(v) => handleInputChange('lastName', v)}
                  />
                  <ProfileField
                    label="НАЗВАНИЕ КОМПАНИИ"
                    value={companyName}
                    isEditing={isEditing}
                    onChange={setCompanyName}
                  />
                  <ProfileField
                    type="email"
                    label="ЭЛЕКТРОННАЯ ПОЧТА"
                    value={formData.email}
                    isEditing={isEditing}
                    error={emailError}
                    onChange={(v) => handleInputChange('email', v)}
                  />
                  <ProfileField
                    type="phone"
                    label="ТЕЛЕФОН"
                    value={formData.phone || ''}
                    isEditing={isEditing}
                    placeholder="+7-999-999-99-99"
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

              <div className={formStyles["bottomSection"]}>
                <ProfileField
                  type="city"
                  label="ГОРОД"
                  value={formData.city}
                  isEditing={isEditing}
                  placeholder="Введите страну"
                  onChange={(v) => handleInputChange('city', v)}
                />
                <ProfileField
                  type="textarea"
                  label="О СЕБЕ"
                  value={formData.about}
                  isEditing={isEditing}
                  onChange={(v) => handleInputChange('about', v)}
                />
              </div>

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
      </div>
    </div>
  )
}