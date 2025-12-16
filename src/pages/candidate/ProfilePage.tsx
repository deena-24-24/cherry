import React, { useState, useEffect } from "react"
import { FormData, MenuItem } from "../../types"
import { compressAvatarImage } from "../../utils"
import { ProfileForm } from "../../components/profilePage/ProfileForm/ProfileForm"
import { ProfileMenu } from "../../components/profilePage/ProfileMenu/ProfileMenu"
import { ProgressContent } from "../../components/profilePage/ProgressContent/ProgressContent"
import { ResumeContent } from "../../components/profilePage/ResumeContent/ResumeContent"
import { useAuthStore } from "../../store"
import { fetchUserProfile, updateUserProfile } from "../../service/auth/profileService"
import * as styles from "./ProfilePage.module.css"

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
    country: '',
    about: ''
  })

  // Функция загрузки данных профиля
  const loadProfile = async () => {
    if (!user) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const profileData = await fetchUserProfile()
      setFormData({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        email: profileData.email || user.email || '',
        phone: profileData.phone || '',
        phoneCode: '',
        country: profileData.country || '',
        about: profileData.about || ''
      })
      if (profileData.avatar) {
        setAvatarUrl(profileData.avatar)
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error)

      // Если API не доступен, используем данные из store как fallback
      setFormData({
        firstName: (user as any).firstName || '',
        lastName: (user as any).lastName || '',
        email: user.email || '',
        phone: (user as any).phone || '',
        phoneCode: '',
        country: (user as any).country || '',
        about: (user as any).about || ''
      })

      // Устанавливаем аватар из store, если он есть
      if ((user as any).avatar) {
        setAvatarUrl((user as any).avatar)
      }
    } finally {
      setLoading(false)
    }
  }

  // Загрузка данных профиля при монтировании компонента
  useEffect(() => {
    loadProfile().then()
  }, [user])

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const compressedImage = await compressAvatarImage(file)
        setAvatarUrl(compressedImage)
      } catch (error) {
        console.error('Error processing image:', error)
      }
    }
  }

  const handleEditToggle = () => {
    if (isEditing) {
      // handleSave logic implementation
      updateUserProfile({ ...formData, avatar: avatarUrl }).then(updated => {
        if(updated) updateUser({ ...updated })
        setIsEditing(false)
      })
    } else {
      setIsEditing(true)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    loadProfile()
  }


  if (loading) return <div>Загрузка...</div>

  const getPageTitle = () => {
    switch (activeMenuItem) {
      case 'about': return 'ЛИЧНЫЙ КАБИНЕТ'
      case 'progress': return 'ПРОГРЕСС'
      case 'resume': return 'РЕЗЮМЕ'
      default: return 'ЛИЧНЫЙ КАБИНЕТ'
    }
  }

  return (
    <div className={styles["page"]}>
      <div className={styles["title"]}>
        {getPageTitle()}
      </div>

      <div className={styles["container"]}>

        {/* ЛЕВАЯ КОЛОНКА: Контент */}
        <div className={styles["contentColumn"]}>
          {activeMenuItem === 'about' && (
            <ProfileForm
              formData={formData}
              isEditing={isEditing}
              emailError={emailError}
              // Передаем аватар внутрь формы
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

        {/* ПРАВАЯ КОЛОНКА: Только меню */}
        <div className={styles["menuColumn"]}>
          <ProfileMenu
            activeMenuItem={activeMenuItem}
            onMenuItemChange={setActiveMenuItem}
          />
        </div>

      </div>
    </div>
  )
}