import React from 'react'
import { useResumeStore } from '../store/useResumeStore'
import { Card } from '../components/ui/Card'

export const ResumeViewPage: React.FC = () => {
  const { resume } = useResumeStore()

  return (
    <div className="container pd-lg">
      <Card>
        <header className="text-center mb-lg">
          <h1>{resume.fullName || 'Your Name'}</h1>
          <p>{resume.jobTitle || 'Your Job Title'}</p>
          <p>{resume.email} | {resume.phone}</p>
        </header>

        <section className="mb-lg">
          <h2 className="section-title">Video Interview</h2>
          <div className="bg-light rounded pd-md text-center">
            {/* Placeholder for a 2-3 minute video interview */}
            <p className="mb-md">A short video introduction from the candidate.</p>
            <video width="100%" controls style={{ maxWidth: '400px', margin: '0 auto', display: 'block' }} src="">
              Your browser does not support the video tag.
            </video>
          </div>
        </section>

        <section className="mb-lg">
          <h2 className="section-title">Experience</h2>
          {resume.experience.map((exp: any, index: any) => (
            <div key={index} className="mb-md">
              <h3>{exp.title}</h3>
              <p className="text-bold">{exp.company} | {exp.period}</p>
              <p>{exp.description}</p>
            </div>
          ))}
        </section>

        <section>
          <h2 className="section-title">Education</h2>
          {resume.education.map((edu: any, index: any) => (
            <div key={index} className="mb-md">
              <h3>{edu.institution}</h3>
              <p className="text-bold">{edu.degree} | {edu.year}</p>
            </div>
          ))}
        </section>
      </Card>
    </div>
  )
}