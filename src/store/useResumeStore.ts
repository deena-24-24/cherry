import { create } from 'zustand'
import { Resume, Experience, Education } from '../types/resume'

interface ResumeState {
  resume: Resume;
  setResume: (resume: Resume) => void;
  addExperience: () => void;
  addEducation: () => void;
}

const initialResume: Resume = {
  fullName: 'Jane Doe',
  jobTitle: 'Software Developer',
  email: 'jane.doe@example.com',
  phone: '123-456-7890',
  experience: [
    { title: 'Frontend Developer', company: 'Tech Corp', period: '2020 - Present', description: 'Developing web applications.' }
  ],
  education: [
    { institution: 'State University', degree: 'B.S. in Computer Science', year: '2020' }
  ]
}


export const useResumeStore = create<ResumeState>((set: any) => ({
  resume: initialResume,
  setResume: (resume: any) => set({ resume }),
  addExperience: () => set((state: any) => ({
    resume: {
      ...state.resume,
      experience: [...state.resume.experience, { title: 'New Role', company: 'New Company', period: 'YYYY - YYYY', description: '...' } as Experience]
    }
  })),
  addEducation: () => set((state: any) => ({
    resume: {
      ...state.resume,
      education: [...state.resume.education, { institution: 'New University', degree: 'New Degree', year: 'YYYY' } as Education]
    }
  })),
}))