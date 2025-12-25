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
  id: string;
  userId?: string;
  title: string;
  position: string;

  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  city?: string;

  skills: string[];
  experience: Experience[];
  education: Education[];
  about?: string;

  resumeFileName?: string;
  resumeFileData?: string;
  // Рейтинг из интервью (средний балл)
  rating?: number | null;
}