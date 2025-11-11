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
  const { user } = useAuthStore();
  const [activeMenuItem, setActiveMenuItem] = useState<MenuItem>('about');
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    phoneCode: '',
    country: '',
    about: ''
  });

  // Загрузка данных профиля при монтировании компонента
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      // Сначала устанавливаем данные из user store (данные регистрации)
      const initialName = (user as any).firstName && (user as any).lastName
        ? `${(user as any).firstName} ${(user as any).lastName}`.trim()
        : user.email || '';
      
      setFormData({
        name: initialName,
        email: user.email || '',
        phone: (user as any).phone || '',
        phoneCode: '',
        country: '',
        about: ''
      });

      // Затем загружаем полные данные из API
      try {
        setLoading(true);
        const profileData = await fetchUserProfile();
        
        // Обновляем данные из API, если они есть
        setFormData(prev => ({
          ...prev,
          name: profileData.name || `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || prev.name || user.email || '',
          email: profileData.email || prev.email || user.email || '',
          phone: profileData.phone || prev.phone || (user as any).phone || '',
          country: profileData.country || prev.country || '',
          about: profileData.about || prev.about || ''
        }));
      } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
        // Данные уже установлены из user store, просто продолжаем
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

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
      
      // Разбиваем name на firstName и lastName для отправки на сервер
      const nameParts = formData.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Подготавливаем данные для отправки
      const profileData = {
        firstName,
        lastName,
        email: formData.email,
        phone: formData.phone,
        country: formData.country,
        about: formData.about
      };

      await updateUserProfile(profileData);
      console.log('Профиль успешно обновлен');
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

  return (
    <div className={styles["page"]}>
      {/* Заголовок */}
      <div className={styles["title"]}>
        ЛИЧНЫЙ КАБИНЕТ
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
            />
          )}
          {activeMenuItem === 'progress' && (
            <ProgressContent />
          )}
          {activeMenuItem === 'resume' && (
            <ResumeContent />
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
