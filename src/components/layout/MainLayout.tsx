// src/layouts/MainLayout.tsx
import React from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from '../layout/Header'
import { Footer } from '../layout/Footer'

export const MainLayout: React.FC = () => {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
