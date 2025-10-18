import React from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

import { ROUTES } from '../router/routes'

export const HomePage: React.FC = () => {
  return (
    <div className="container pd-lg">
      <Card className="text-center">
        <h1 className="mb-md">Welcome to CareerUp</h1>
        <p className="mb-lg" style={{ fontSize: '1.2rem', color: '#6c757d' }}>
          Your personal AI-powered career assistant to help you build a resume, practice interviews, and ace technical challenges.
        </p>
        <Link to={ROUTES.AUTH}>
          <Button>Get Started</Button>
        </Link>
      </Card>

      <div className="mt-md pd-lg">
        <h2 className="text-center section-title" style={{ display: 'inline-block', width: '100%' }}>Our Features</h2>
        <div className="d-grid grid-cols-2 gap-lg mt-md">
          <Card>
            <h3>Resume Builder</h3>
            <p>Easily create and update a professional resume with our intuitive editor.</p>
          </Card>
          <Card>
            <h3>AI-Powered Interview</h3>
            <p>Practice your interview skills with an animated AI assistant that asks relevant questions.</p>
          </Card>
          <Card>
            <h3>Technical Chat</h3>
            <p>Hone your knowledge by answering technical questions in a chat with our AI expert.</p>
          </Card>
          <Card>
            <h3>Online Compiler</h3>
            <p>Solve coding problems in real-time with our integrated compiler for popular languages.</p>
          </Card>
        </div>
      </div>
    </div>
  )
}