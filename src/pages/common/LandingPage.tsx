import React, { useState } from 'react'
import { Button } from '../../components/ui/Button/Button'
import { FeatureCard } from '../../components/ui/FeatureCard/FeatureCard'
import { FaqItem } from '../../components/ui/FaqItem/FaqItem'
import * as styles from './LandingPage.module.css'
import heroImage from '../../assets/im1.jpg'
import { HomeFeatures } from '../../components/layout/CandidateHomeFeatures'
import { HeroBanner } from '../../components/layout/HeroBanner'

export const LandingPage: React.FC = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(3)

  const handleFaqToggle = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index)
  }

  return (
    <div className={styles["landingContainer"]}>

      <HeroBanner />
      <HomeFeatures />

      {/* Interview Section */}
      <div className={styles["interviewSection"]}>
        <div className={styles["interviewTitle"]}>
          готовьтесь к реальным собеседованиям с нашим ии-интервьюером
        </div>
        
      </div>

      {/* Subscription Section */}
      <div className={styles["subscriptionSection"]}>
        <div className={styles["subscriptionBackground"]}></div>
        <div className={styles["subscriptionTitle"]}>
          получите неограниченный доступ к ресурсам
        </div>
        <Button
          variant="custom"
          styleProps={{
            width: '271px',
            height: '54px',
            backgroundColor: '#fffcf5',
            textColor: '#36447c',
            borderRadius: '15px',
            fontSize: '20px',
            fontFamily: 'Geist Mono',
            padding: '12px 17px',
            gap: '7.25px'
          }}
          className={styles["subscriptionButton"]}
        >
          Оформить подписку
        </Button>
      </div>

      {/* FAQ Section */}
      <div className={styles["faqSection"]}>
        <div className={styles["faqBackground"]}></div>
        <FaqItem
          question="Тут можно придумать вопросы"
          isOpen={openFaqIndex === 0}
          onToggle={() => handleFaqToggle(0)}
          top="23px"
        />
        <FaqItem
          question="Тут можно придумать вопросы"
          isOpen={openFaqIndex === 1}
          onToggle={() => handleFaqToggle(1)}
          top="86px"
        />
      </div>
    </div>
  )
}
