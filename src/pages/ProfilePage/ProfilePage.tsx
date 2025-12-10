import React, { useState, useEffect } from "react";
import { FormData, MenuItem } from "./types";
import { compressAvatarImage } from "./utils";
import { ProfileForm } from "./components/ProfileForm/ProfileForm";
import { ProfileAvatar } from "./components/ProfileAvatar/ProfileAvatar";
import { ProfileMenu } from "./components/ProfileMenu/ProfileMenu";
import { ProgressContent } from "./components/ProgressContent/ProgressContent";
import { ResumeContent } from "./components/ResumeContent/ResumeContent";
import { useAuthStore } from "../../store";
import { fetchUserProfile, updateUserProfile } from "../../service/auth/profileService";
import "./styles/variables.css";
import * as styles from "./ProfilePage.module.css";

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [activeMenuItem, setActiveMenuItem] = useState<MenuItem>('about');
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    phoneCode: '',
    country: '',
    about: ''
  });

  // Функция загрузки данных профиля
  const loadProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Загружаем данные из API (это источник истины)
      const profileData = await fetchUserProfile();
      
      // Устанавливаем данные из API
      setFormData({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        email: profileData.email || user.email || '',
        phone: profileData.phone || '',
        phoneCode: '',
        country: profileData.country || '',
        about: profileData.about || ''
      });
      
      // Устанавливаем аватар, если он есть
      if (profileData.avatar) {
        setAvatarUrl(profileData.avatar);
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
      
      // Если API не доступен, используем данные из store как fallback
      setFormData({
        firstName: (user as any).firstName || '',
        lastName: (user as any).lastName || '',
        email: user.email || '',
        phone: (user as any).phone || '',
        phoneCode: '',
        country: (user as any).country || '',
        about: (user as any).about || ''
      });
      
      // Устанавливаем аватар из store, если он есть
      if ((user as any).avatar) {
        setAvatarUrl((user as any).avatar);
      }
    } finally {
      setLoading(false);
    }
  };

  // Загрузка данных профиля при монтировании компонента
  useEffect(() => {
    loadProfile();
  }, [user]);

  // Перезагрузка данных при переключении разделов
  useEffect(() => {
    // Перезагружаем данные профиля при переходе в раздел "Обо мне"
    if (activeMenuItem === 'about') {
      loadProfile();
    }
    // Для резюме данные загружаются внутри ResumeContent при монтировании
    // Но мы можем добавить ключ, чтобы компонент перезагружался
  }, [activeMenuItem]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedImage = await compressAvatarImage(file);
        setAvatarUrl(compressedImage);
      } catch (error) {
        console.error('Ошибка обработки изображения:', error);
      }
    }
  };

  const handleSave = async () => {
    try {
      setIsEditing(false);
      
      // Подготавливаем данные для отправки
      const profileData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        country: formData.country,
        about: formData.about,
        avatar: avatarUrl || ''
      };

      const updatedProfile = await updateUserProfile(profileData);
      console.log('Профиль успешно обновлен');
      
      // Обновляем данные в store
      if (updatedProfile) {
        updateUser({
          firstName: updatedProfile.firstName || formData.firstName,
          lastName: updatedProfile.lastName || formData.lastName,
          email: updatedProfile.email || formData.email,
          phone: updatedProfile.phone || formData.phone,
          country: updatedProfile.country || formData.country,
          about: updatedProfile.about || formData.about,
          avatar: updatedProfile.avatar || avatarUrl || '',
        } as Partial<typeof user>);
      }
      
      // Перезагружаем данные профиля из API для получения всех обновленных данных
      try {
        const freshProfileData = await fetchUserProfile();
        setFormData(prev => ({
          ...prev,
          firstName: freshProfileData.firstName || prev.firstName,
          lastName: freshProfileData.lastName || prev.lastName,
          email: freshProfileData.email || prev.email,
          phone: freshProfileData.phone || prev.phone,
          country: freshProfileData.country || prev.country,
          about: freshProfileData.about || prev.about
        }));
        
        // Обновляем аватар, если он есть
        if (freshProfileData.avatar) {
          setAvatarUrl(freshProfileData.avatar);
        }
      } catch (error) {
        console.error('Ошибка перезагрузки профиля:', error);
      }
    } catch (error) {
      console.error('Ошибка сохранения профиля:', error);
      // Можно добавить уведомление об ошибке
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleEditToggle = () => {
    if (isEditing) {
      handleSave();
    } else {
      handleEdit();
    }
  };

  const handleCancel = async () => {
    setIsEditing(false);
    // Загружаем свежие данные с сервера для отмены изменений
    try {
      const freshProfileData = await fetchUserProfile();
      setFormData(prev => ({
        ...prev,
        firstName: freshProfileData.firstName || prev.firstName,
        lastName: freshProfileData.lastName || prev.lastName,
        email: freshProfileData.email || prev.email,
        phone: freshProfileData.phone || prev.phone,
        country: freshProfileData.country || prev.country,
        about: freshProfileData.about || prev.about
      }));
      
      // Восстанавливаем аватар
      if (freshProfileData.avatar) {
        setAvatarUrl(freshProfileData.avatar);
      }
    } catch (error) {
      console.error('Ошибка отмены изменений:', error);
    }
  };

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
    );
  }

  const getPageTitle = () => {
    switch (activeMenuItem) {
      case 'about':
        return 'ЛИЧНЫЙ КАБИНЕТ';
      case 'progress':
        return 'ПРОГРЕСС';
      case 'resume':
        return 'РЕЗЮМЕ';
      default:
        return 'ЛИЧНЫЙ КАБИНЕТ';
    }
  };

  return (
    <div className={styles["page"]}>
      {/* Заголовок */}
      <div className={styles["title"]}>
        {getPageTitle()}
      </div>

      {/* Основной контейнер с формой и правой панелью */}
      <div className={styles["container"]}>
        {/* Левая часть - контент в зависимости от выбранного пункта меню */}
        <div className={
          activeMenuItem === 'about' ? styles["contentContainerAbout"] :
          activeMenuItem === 'progress' ? styles["contentContainerProgress"] :
          styles["contentContainerResume"]
        }>
          {activeMenuItem === 'about' && (
            <ProfileForm
              formData={formData}
              isEditing={isEditing}
              emailError={emailError}
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

        {/* Правая часть - аватар и меню */}
        <div className={styles["rightPanel"]}>
          {/* Аватар - в разделах "Обо мне" и "Резюме" */}
          {(activeMenuItem === 'about' || activeMenuItem === 'resume') && (
            <ProfileAvatar
              avatarUrl={avatarUrl}
              isEditing={isEditing}
              onAvatarChange={handleAvatarChange}
            />
          )}

          {/* Меню */}
          <div className={activeMenuItem === 'progress' ? styles["menuWrapper"] : ''}>
            <ProfileMenu
              activeMenuItem={activeMenuItem}
              onMenuItemChange={setActiveMenuItem}
            />
          </div>
        </div>

      </div>
      
    </div>
  );
};
