import React from 'react'
import { Button } from '../../components/ui/Button'

export const AiInterviewPage: React.FC = () => {
  return (
    <div className="container pd-lg">
      <h1 className="mb-lg text-center">AI Interview Session</h1>
      <div className="d-grid grid-cols-2 gap-lg">
        {/* AI Assistant Side */}
        <h2 className="text-center">AI Interviewer</h2>
        {/* Placeholder for the animated AI icon */}
        <div
          className="bg-light rounded"
          style={{ width: '200px', height: '200px', border: '2px dashed #007bff' }}
        >
          <p className="text-center" style={{ lineHeight: '200px' }}>Animated Icon</p>
        </div>
        <p className="text-center">The AI is asking a question...</p>

        {/* candidate Video Side */}
        <h2 className="text-center">Your Camera</h2>
        {/* Placeholder for the candidate's video feed */}
        <div
          className="bg-light rounded"
          style={{ width: '100%', height: '300px', border: '1px solid #dee2e6' }}
        >
          <p className="text-center" style={{ lineHeight: '300px' }}>Candidate Video Feed</p>
        </div>
        <div className="d-flex gap-md mt-md">
          <Button variant="primary">Start Recording</Button>
          <Button variant="secondary">End Session</Button>
        </div>
      </div>
    </div>
  )
}