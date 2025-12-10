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
  id?: string
  userId?: string
  fullName?: string // Оставлено для обратной совместимости, но рекомендуется использовать firstName и lastName
  firstName?: string
  lastName?: string
  jobTitle: string
  email: string
  phone: string
  photoUrl?: string
  videoUrl?: string
  skills?: string[]
  about?: string // Информация "О себе"

  experience: Experience[]
  education: Education[]

  updatedAt?: string
  createdAt?: string
}
