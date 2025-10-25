import React from 'react'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

export const TechnicalChatPage: React.FC = () => {
  return (
    <div className="container pd-lg">
      <h1 className="text-center mb-lg">Technical Chat with AI Assistant</h1>
      {/* Chat Messages Area */}
      <div className="flex-grow-1 pd-md bg-light rounded mb-md" style={{ overflowY: 'auto' }}>
        {/* Example Message from AI */}
        <div className="mb-md">
          <p className="text-bold">AI Assistant:</p>
          <div className="bg-white pd-sm rounded">
            <p>Hello! Let`s start with a simple question. Can you explain the difference between `let`, `const`, and `var` in JavaScript?</p>
          </div>
        </div>
        {/* Example Message from User */}
        <div className="mb-md text-right">
          <p className="text-bold">You:</p>
          <div className="bg-primary pd-sm rounded" style={{ backgroundColor: '#007bff', color: 'white', display: 'inline-block', textAlign: 'left' }}>
            <p>Of course. `var` is function-scoped, while `let` and `const` are block-scoped...</p>
          </div>
        </div>
      </div>

      {/* Message Input Form */}
      <form className="d-flex gap-sm">
        <div className="flex-grow-1">
          <Input label="" id="chatMessage" name="chatMessage" placeholder="Type your answer..." />
        </div>
        <Button type="submit">Send</Button>
      </form>
    </div>
  )
}