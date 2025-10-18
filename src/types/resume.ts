export interface Experience {
  title: string;
  company: string;
  period: string;
  description: string;
}

export interface Education {
  institution: string;
  degree: string;
  year: string;
}

export interface Resume {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  experience: Experience[];
  education: Education[];
}