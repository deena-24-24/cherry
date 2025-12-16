export interface Experience {
  title: string
  company: string
  period: string
  description?: string
}

export interface Education {
  institution: string
  degree: string
  year: string
}

export interface Resume {
  id: string; // Важно: ID резюме
  userId?: string;
  title: string; // Название резюме (например, "Мое основное", "Frontend")
  position: string; // Искомая должность

  // Данные из профиля пользователя (для отображения, приходят с бэка)
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  country?: string;

  skills: string[];
  experience: Experience[];
  education: Education[];
  about?: string;

  resumeFileName?: string;
  resumeFileData?: string;
}