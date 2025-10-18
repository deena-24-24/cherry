import React from 'react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'

export const AuthorizationPage: React.FC = () => {
  return (
    <div className="container pd-lg">
      <Card className="max-w-md mx-auto">
        <h1 className="text-center mb-lg">Login</h1>
        <form className="d-flex flex-column gap-md">
          <Input label="Email" id="email" type="email" placeholder="you@example.com" />
          <Input label="Password" id="password" type="password" placeholder="••••••••" />
          <Button type="submit">Login</Button>
        </form>
      </Card>
    </div>
  )
}