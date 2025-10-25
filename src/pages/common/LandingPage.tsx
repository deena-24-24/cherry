import React from 'react'
import { Button } from '../../components/ui/Button'

export const LandingPage: React.FC = () => {
  return (
    <div className="container pd-lg">
      <h1 className="mb-md">Welcome to CareerUp</h1>
      <p className="mb-lg" style={{ fontSize: '1.2rem', color: '#6c757d' }}>
        Your personal AI-powered career assistant to help you build a resume, practice interviews, and ace technical challenges.
      </p>
      <Button>Get Started</Button>

      <div className="mt-md pd-lg">
        <h2 className="text-center section-title" style={{ display: 'inline-block', width: '100%' }}>Our Features</h2>
        <div className="d-grid grid-cols-2 gap-lg mt-md">

          <h3>Resume Builder</h3>
          <p>Easily create and update a professional resume with our intuitive editor.</p>

          <h3>AI-Powered Interview</h3>
          <p>Practice your interview skills with an animated AI assistant that asks relevant questions.</p>

          <h3>Technical Chat</h3>
          <p>Hone your knowledge by answering technical questions in a chat with our AI expert.</p>

          <h3>Online Compiler</h3>
          <p>Solve coding problems in real-time with our integrated compiler for popular languages.</p>
        </div>
      </div>
    </div>
  )
}