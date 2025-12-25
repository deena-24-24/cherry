import React, { useState, useEffect } from "react"
import { FormData, MenuItem } from "../../types"
import { compressAvatarImage } from "../../utils"
import { ProfileForm } from "../../components/profilePage/ProfileForm/ProfileForm"
import { ProfileMenu, TabItem } from "../../components/profilePage/ProfileMenu/ProfileMenu"
import { ProgressContent } from "../../components/profilePage/ProgressContent/ProgressContent"
import { ResumeContent } from "../../components/profilePage/ResumeContent/ResumeContent"
import { useAuthStore } from "../../store"
import { fetchUserProfile, updateUserProfile } from "../../service/api/profileService"
import * as styles from "./ProfilePage.module.css"
import { Loader } from '../../components/ui/Loader/Loader'

const MENU_ITEMS: TabItem[] = [
  { id: 'about', label: 'Обо мне' },
  { id: 'progress', label: 'Прогресс' },
  { id: 'resume', label: 'Резюме' },
]

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore()
  const [activeMenuItem, setActiveMenuItem] = useState<MenuItem>('about')
  const [isEditing, setIsEditing] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [emailError, setEmailError] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    phoneCode: '',
    city: '',
    about: ''
  })

  const loadProfile = async () => {
    if (!user) { setLoading(false); return }
    try {
      setLoading(true)
      const profileData = await fetchUserProfile()
      setFormData({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        email: profileData.email || user.email || '',
        phone: profileData.phone || '',
        phoneCode: '',
        city: profileData.city || '',
        about: profileData.about || ''
      })
      if (profileData.avatar) setAvatarUrl(profileData.avatar)
    } catch (error) {
      console.error(error)
      // Фолбэк на данные из user (из localStorage/токена), если API упал
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        phoneCode: '',
        city: user.city || '',
        about: user.about || ''
      })
      if (user.avatar) setAvatarUrl(user.avatar)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProfile().then() }, [user])

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const compressedImage = await compressAvatarImage(file)
        setAvatarUrl(compressedImage)
      } catch (error) { console.error(error) }
    }
  }

  const handleEditToggle = async () => {
    if (isEditing) {
      // Проверяем валидацию email перед сохранением
      if (emailError) {
        console.error('Ошибка валидации email:', emailError)
        return
      }

      try {
        const updated = await updateUserProfile({ ...formData, avatar: avatarUrl })
        if (updated) {
          updateUser({ ...updated })
          setIsEditing(false)
        }
      } catch (error) {
        console.error('Ошибка сохранения профиля:', error)
        alert(error instanceof Error ? error.message : 'Не удалось сохранить профиль')
      }
    } else {
      setIsEditing(true)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    loadProfile()
  }

  if (loading) return <Loader />

  return (
    <div className={styles["page"]}>
      <div className={styles["container"]}>
        <div className={styles["title"]}>ЛИЧНЫЙ КАБИНЕТ</div>

        {/* 1. Меню (Вкладки) сверху */}
        <ProfileMenu
          items={MENU_ITEMS}
          activeItemId={activeMenuItem}
          onItemChange={(id) => setActiveMenuItem(id as MenuItem)}
        />

        {/* 2. Контент снизу (как содержимое вкладки) */}
        <div className={styles["tabContent"]}>
          {activeMenuItem === 'about' && (
            <ProfileForm
              formData={formData}
              isEditing={isEditing}
              emailError={emailError}
              avatarUrl={avatarUrl}
              onAvatarChange={handleAvatarChange}
              onInputChange={handleInputChange}
              onEmailErrorChange={setEmailError}
              onEditToggle={handleEditToggle}
              onCancel={handleCancel}
            />
          )}
          {activeMenuItem === 'progress' && (
            <ProgressContent />
          )}
          {activeMenuItem === 'resume' && (
            <ResumeContent key={`resume-${activeMenuItem}`} />
          )}
        </div>
      </div>
    </div>
  )
}