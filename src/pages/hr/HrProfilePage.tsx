import React, { useState, useEffect } from "react"
import { FormData as ProfileFormData } from "../ProfilePage/types"
import { HrMenuItem } from "./types"
import { compressAvatarImage } from "../ProfilePage/utils"
import { ProfileAvatar } from "../ProfilePage/components/ProfileAvatar/ProfileAvatar"
import { HrMenu } from "./components/HrMenu/HrMenu"
import { FavoritesContent } from "./components/FavoritesContent/FavoritesContent"
import { FormField } from "../../components/ui/FormField/FormField"
import { PhoneField } from "../ProfilePage/components/ProfileForm/PhoneField"
import { CountryField } from "../ProfilePage/components/ProfileForm/CountryField"
import { TextareaField } from "../ProfilePage/components/ProfileForm/TextareaField"
import { Button } from "../../components/ui/Button/Button"
import { validateEmail } from "../ProfilePage/utils"
import { useAuthStore } from "../../store"
import { fetchHr, updateHr } from "../../service/hr/hrService"
import "../ProfilePage/styles/variables.css"
import * as styles from "../ProfilePage/ProfilePage.module.css"

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
  const [position, setPosition] = useState<string>('')

  // Функция загрузки данных профиля
  const loadProfile = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Загружаем данные из API (это источник истины)
      const hrData = await fetchHr()
      
      // Устанавливаем данные из API
      setFormData({
        firstName: hrData.firstName || '',
        lastName: hrData.lastName || '',
        email: hrData.email || user.email || '',
        phone: hrData.phone || '',
        phoneCode: '',
        country: hrData.country || '',
        about: hrData.about || ''
      })
      
      // Устанавливаем HR-специфичные поля
      setCompanyName(hrData.companyName || '')
      setPosition(hrData.position || '')
      
      // Устанавливаем аватар, если он есть
      if (hrData.avatar) {
        setAvatarUrl(hrData.avatar)
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
      
      setCompanyName((user as any).companyName || '')
      setPosition((user as any).position || '')
      
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

  // Перезагрузка данных при переключении разделов
  useEffect(() => {
    // Перезагружаем данные профиля при переходе в раздел "Обо мне"
    if (activeMenuItem === 'about') {
      loadProfile().then()
    }
  }, [activeMenuItem])

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Валидация email
    if (field === 'email') {
      if (value && !validateEmail(value)) {
        setEmailError('Введите корректный email адрес')
      } else {
        setEmailError('')
      }
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const compressedImage = await compressAvatarImage(file)
        setAvatarUrl(compressedImage)
      } catch (error) {
        console.error('Ошибка обработки изображения:', error)
      }
    }
  }

  const handleSave = async () => {
    try {
      setIsEditing(false)
      
      // Подготавливаем данные для отправки
      const hrData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        country: formData.country,
        about: formData.about,
        avatar: avatarUrl || '',
        companyName: companyName,
        position: position
      }

      const updatedHr = await updateHr(hrData)
      console.log('Профиль успешно обновлен')
      
      // Обновляем данные в store
      if (updatedHr) {
        updateUser({
          firstName: updatedHr.firstName || formData.firstName,
          lastName: updatedHr.lastName || formData.lastName,
          email: updatedHr.email || formData.email,
          phone: updatedHr.phone || formData.phone,
          country: updatedHr.country || formData.country,
          about: updatedHr.about || formData.about,
          avatar: updatedHr.avatar || avatarUrl || '',
          companyName: updatedHr.companyName || companyName,
          position: updatedHr.position || position,
        } as Partial<typeof user>)
      }
      
      // Перезагружаем данные профиля из API для получения всех обновленных данных
      try {
        const freshHrData = await fetchHr()
        setFormData(prev => ({
          ...prev,
          firstName: freshHrData.firstName || prev.firstName,
          lastName: freshHrData.lastName || prev.lastName,
          email: freshHrData.email || prev.email,
          phone: freshHrData.phone || prev.phone,
          country: freshHrData.country || prev.country,
          about: freshHrData.about || prev.about
        }))
        
        setCompanyName(freshHrData.companyName || '')
        setPosition(freshHrData.position || '')
        
        // Обновляем аватар, если он есть
        if (freshHrData.avatar) {
          setAvatarUrl(freshHrData.avatar)
        }
      } catch (error) {
        console.error('Ошибка перезагрузки профиля:', error)
      }
    } catch (error) {
      console.error('Ошибка сохранения профиля:', error)
      // Можно добавить уведомление об ошибке
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleEditToggle = () => {
    if (isEditing) {
      handleSave().then()
    } else {
      handleEdit()
    }
  }

  const handleCancel = async () => {
    setIsEditing(false)
    // Перезагружаем данные профиля из API для отмены локальных изменений
    try {
      const freshHrData = await fetchHr()
      setFormData(prev => ({
        ...prev,
        firstName: freshHrData.firstName || prev.firstName,
        lastName: freshHrData.lastName || prev.lastName,
        email: freshHrData.email || prev.email,
        phone: freshHrData.phone || prev.phone,
        country: freshHrData.country || prev.country,
        about: freshHrData.about || prev.about
      }))
      setCompanyName(freshHrData.companyName || '')
      setPosition(freshHrData.position || '')
      if (freshHrData.avatar) {
        setAvatarUrl(freshHrData.avatar)
      }
    } catch (error) {
      console.error('Ошибка перезагрузки профиля при отмене:', error)
    }
  }

  if (loading) {
    return (
      <div className={styles["page"]}>
        <div className={styles["title"]}>
          ЛИЧНЫЙ КАБИНЕТ
        </div>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          Загрузка данных...
        </div>
      </div>
    )
  }

  const getTitle = () => {
    switch (activeMenuItem) {
      case 'about':
        return 'ЛИЧНЫЙ КАБИНЕТ'
      case 'candidates':
        return 'ИЗБРАННЫЕ КАНДИДАТЫ'
      default:
        return 'ЛИЧНЫЙ КАБИНЕТ'
    }
  }

  return (
    <div className={styles["page"]}>
      {/* Заголовок */}
      <div className={styles["title"]}>
        {getTitle()}
      </div>

      {/* Основной контейнер с формой и правой панелью */}
      <div className={styles["container"]}>
        {/* Левая часть - контент в зависимости от выбранного пункта меню */}
        <div className={
          activeMenuItem === 'about' ? styles["contentContainerAbout"] :
            styles["contentContainerResume"]
        }>
          {activeMenuItem === 'about' && (
            <div className={styles["formSection"]}>
              {/* Поле "Имя" */}
              <FormField
                label="ИМЯ"
                value={formData.firstName}
                isEditing={isEditing}
                onChange={(value) => handleInputChange('firstName', value)}
              />

              {/* Поле "Фамилия" */}
              <FormField
                label="ФАМИЛИЯ"
                value={formData.lastName}
                isEditing={isEditing}
                onChange={(value) => handleInputChange('lastName', value)}
              />

              {/* Дополнительные поля для HR - сразу после фамилии */}
              <FormField
                label="НАЗВАНИЕ КОМПАНИИ"
                value={companyName}
                isEditing={isEditing}
                onChange={(value) => setCompanyName(value)}
              />
              
              <FormField
                label="ДОЛЖНОСТЬ"
                value={position}
                isEditing={isEditing}
                onChange={(value) => setPosition(value)}
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
                  handleInputChange('phone', value)
                  handleInputChange('phoneCode', '')
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

              {/* Кнопки управления */}
              {isEditing ? (
                <div className={styles["actions"]}>
                  <Button
                    variant="primary"
                    onClick={handleEditToggle}
                    className={styles["saveButton"]}
                  >
                    СОХРАНИТЬ
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleCancel}
                    className={styles["cancelButton"]}
                  >
                    Отмена
                  </Button>
                </div>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleEditToggle}
                >
                  РЕДАКТИРОВАТЬ
                </Button>
              )}
            </div>
          )}
          {activeMenuItem === 'candidates' && (
            <FavoritesContent />
          )}
        </div>

        {/* Правая часть - аватар и меню */}
        <div className={styles["rightPanel"]}>
          {/* Аватар - только в разделе "Обо мне" */}
          {activeMenuItem === 'about' && (
            <ProfileAvatar
              avatarUrl={avatarUrl}
              isEditing={isEditing}
              onAvatarChange={handleAvatarChange}
            />
          )}

          {/* Меню */}
          <div className={activeMenuItem === 'candidates' ? styles["menuWrapperCandidates"] : ''}>
            <HrMenu
              activeMenuItem={activeMenuItem}
              onMenuItemChange={setActiveMenuItem}
            />
          </div>
        </div>

      </div>
      
    </div>
  )
}

