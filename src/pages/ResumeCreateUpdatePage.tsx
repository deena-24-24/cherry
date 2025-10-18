import React from 'react'
import { useResumeStore } from '../store/useResumeStore'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

export const ResumeCreateUpdatePage: React.FC = () => {
  const { resume, setResume, addExperience, addEducation } = useResumeStore()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setResume({ ...resume, [name]: value })
  }

  return (
    <div className="container pd-lg d-flex flex-column gap-lg">
      <h1>Edit Your Resume</h1>

      <Card>
        <h2>Main Information</h2>
        <form className="d-grid grid-cols-2 gap-md mt-md">
          <Input label="Full Name" name="fullName" value={resume.fullName} onChange={handleChange} />
          <Input label="Job Title" name="jobTitle" value={resume.jobTitle} onChange={handleChange} />
          <Input label="Email" name="email" type="email" value={resume.email} onChange={handleChange} />
          <Input label="Phone" name="phone" type="tel" value={resume.phone} onChange={handleChange} />
        </form>
      </Card>

      <Card>
        <h2>Experience</h2>
        {resume.experience.map((exp: any, index: any) => (
          <div key={index} className="mb-md pd-md border rounded">
            <p><strong>{exp.title}</strong> at {exp.company}</p>
            <p>{exp.period}</p>
          </div>
        ))}
        <Button onClick={addExperience} variant="secondary">Add Experience</Button>
      </Card>

      <Card>
        <h2>Education</h2>
        {resume.education.map((edu: any, index: any) => (
          <div key={index} className="mb-md pd-md border rounded">
            <p><strong>{edu.degree}</strong> from {edu.institution}</p>
            <p>{edu.year}</p>
          </div>
        ))}
        <Button onClick={addEducation} variant="secondary">Add Education</Button>
      </Card>

    </div>
  )
}