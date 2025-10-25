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
  fullName: string
  jobTitle: string
  email: string
  phone: string
  photoUrl?: string
  videoUrl?: string

  experience: Experience[]
  education: Education[]

  updatedAt?: string
  createdAt?: string
}
