import React, { useState } from 'react'
import { useResumeStore } from '../../store/useResumeStore'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button/Button'

export const ResumePage: React.FC = () => {
  const { resume, setResume, addExperience, addEducation } = useResumeStore()
  const [isEditing, setIsEditing] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setResume({ ...resume, [name]: value })
  }

  return (
    <div className="container pd-lg d-flex flex-column gap-lg">
      <div className="d-flex justify-between align-center mb-md">
        <h1>{isEditing ? 'Edit Your Resume' : 'Your Resume'}</h1>
        <Button onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? 'View Mode' : 'Edit Mode'}
        </Button>
      </div>

      <h2>Main Information</h2>

      {isEditing ? (
        <form className="d-grid grid-cols-2 gap-md mt-md">
          <Input label="Full Name" name="fullName" value={resume.fullName} onChange={handleChange} />
          <Input label="Job Title" name="jobTitle" value={resume.jobTitle} onChange={handleChange} />
          <Input label="Email" name="email" type="email" value={resume.email} onChange={handleChange} />
          <Input label="Phone" name="phone" type="tel" value={resume.phone} onChange={handleChange} />
        </form>
      ) : (
        <header className="text-center mb-lg">
          <h1>{resume.fullName || 'Your Name'}</h1>
          <p>{resume.jobTitle || 'Your Job Title'}</p>
          <p>{resume.email} | {resume.phone}</p>
        </header>
      )}

      <h2>Video Interview</h2>
      <div className="bg-light rounded pd-md text-center">
        <p className="mb-md">A short video introduction from the candidate.</p>
        <video
          width="100%"
          controls
          style={{ maxWidth: '400px', margin: '0 auto', display: 'block' }}
          src={resume.videoUrl || ''}
        >
          Your browser does not support the video tag.
        </video>
      </div>

      <h2>Experience</h2>
      {resume.experience.map((exp, index: number) => (
        <div key={index} className="mb-md pd-md border rounded">
          {isEditing ? (
            <>
              <Input
                label="Title"
                name={`experience[${index}].title`}
                value={exp.title}
                onChange={(e) => {
                  const updated = [...resume.experience]
                  updated[index].title = e.target.value
                  setResume({ ...resume, experience: updated })
                }}
              />
              <Input
                label="Company"
                name={`experience[${index}].company`}
                value={exp.company}
                onChange={(e) => {
                  const updated = [...resume.experience]
                  updated[index].company = e.target.value
                  setResume({ ...resume, experience: updated })
                }}
              />
              <Input
                label="Period"
                name={`experience[${index}].period`}
                value={exp.period}
                onChange={(e) => {
                  const updated = [...resume.experience]
                  updated[index].period = e.target.value
                  setResume({ ...resume, experience: updated })
                }}
              />
            </>
          ) : (
            <>
              <h3>{exp.title}</h3>
              <p className="text-bold">{exp.company} | {exp.period}</p>
            </>
          )}
        </div>
      ))}

      {isEditing && (
        <Button onClick={addExperience} variant="secondary">Add Experience</Button>
      )}

      <h2>Education</h2>
      {resume.education.map((edu, index: number) => (
        <div key={index} className="mb-md pd-md border rounded">
          {isEditing ? (
            <>
              <Input
                label="Institution"
                name={`education[${index}].institution`}
                value={edu.institution}
                onChange={(e) => {
                  const updated = [...resume.education]
                  updated[index].institution = e.target.value
                  setResume({ ...resume, education: updated })
                }}
              />
              <Input
                label="Degree"
                name={`education[${index}].degree`}
                value={edu.degree}
                onChange={(e) => {
                  const updated = [...resume.education]
                  updated[index].degree = e.target.value
                  setResume({ ...resume, education: updated })
                }}
              />
              <Input
                label="Year"
                name={`education[${index}].year`}
                value={edu.year}
                onChange={(e) => {
                  const updated = [...resume.education]
                  updated[index].year = e.target.value
                  setResume({ ...resume, education: updated })
                }}
              />
            </>
          ) : (
            <>
              <h3>{edu.institution}</h3>
              <p className="text-bold">{edu.degree} | {edu.year}</p>
            </>
          )}
        </div>
      ))}

      {isEditing && (
        <Button onClick={addEducation} variant="secondary">Add Education</Button>
      )}
    </div>
  )
}
