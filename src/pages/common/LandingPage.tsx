import React, { useState } from 'react'
import * as styles from './LandingPage.module.css'
import { HomeFeatures } from '../../components/layout/CandidateHomeFeatures'
import { HeroBanner } from '../../components/layout/HeroBanner'
import { SubscriptionBanner } from '../../components/layout/SubscriptionBanner'
import { FaqSection } from '../../components/layout/FaqSection'
import { useAuthStore } from '../../store'

export const LandingPage: React.FC = () => {

  const { user } = useAuthStore()
  return (
    <div className={styles["landingContainer"]}>

      {/*{user ? (<HomeFeatures />) : (
        <HeroBanner />
      )}*/}
      <HeroBanner />
      <HomeFeatures />



      {/* Interview Section */}
      <div className={styles["interviewSection"]}>
        <div className={styles["interviewTitle"]}>
          готовьтесь к реальным собеседованиям с нашим ии-интервьюером
        </div>
        
      </div>

      <SubscriptionBanner />
      <FaqSection />
    </div>
  )
}
