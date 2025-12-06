import React, { useState } from 'react'
import { Button } from '../../components/ui/Button/Button'
import { FeatureCard } from '../../components/ui/FeatureCard/FeatureCard'
import { FaqItem } from '../../components/ui/FaqItem/FaqItem'
import * as styles from './LandingPage.module.css'
import heroImage from '../../assets/im1.jpg'
import { HomeFeatures } from '../../components/layout/CandidateHomeFeatures'

export const LandingPage: React.FC = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(3)

  const handleFaqToggle = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index)
  }

  return (
    <div className={styles["landingContainer"]}>
      {/* Hero Section */}
      <div className={styles["heroSection"]}>
        <div className={styles["heroImageWrapper"]}>
          <img 
            className={styles["heroImage"]}
            src={heroImage} 
            alt="Hero" 
          />
        </div>
        <Button
          variant="custom"
          styleProps={{
            width: '186px',
            height: '62px',
            backgroundColor: '#082060',
            textColor: '#F5F5FF',
            borderRadius: '15px',
            fontSize: '24px',
            fontFamily: 'Geist Mono',
            padding: '12px 17px',
            gap: '7.25px'
          }}
          className={styles["startButton"]}
        >
          НАЧАТЬ
        </Button>
        <div className={styles["heroSubtitle"]}>
          Your personal AI-powered career assistant to help you build a resume, practice interviews, and ace technical challenges.
        </div>
        <div className={styles["heroTitle"]}>
          <span className={styles["titlePart1"]}>гОТОВИМСЯ К СОБЕСЕДОВАНИЯМ</span>
          <span className={styles["titlePart2"]}> </span>
          <span className={styles["titlePart3"]}>ЭФФЕКТИВНО</span>
        </div>
      </div>

      <HomeFeatures />
      {/* Features Section */}
      {/*
      <div className={styles["featuresSection"]}>
        <div className={styles["featuresTitle"]}>наши возможности</div>
        
        <FeatureCard
          title="ИИ-собеседование"
          description="Practice your interview skills with an animated AI assistant that asks relevant questions."
          borderColor="#F2C2C8"
          width="731.63px"
          height="197.40px"
          left="3.68px"
          top="69.85px"
          buttonLeft="623.04px"
          buttonTop="205.50px"
          buttonBackground="#B0DDFC"
          buttonBorderColor="#082060"
        />
        
        <FeatureCard
          title="чат"
          description="Hone your knowledge by answering technical questions in a chat with our AI expert."
          borderColor="#83BCFF"
          width="365.36px"
          height="197.40px"
          left="777.64px"
          top="69.85px"
          buttonLeft="1030.72px"
          buttonTop="205.50px"
          buttonBackground="#F2C2C8"
          buttonBorderColor="#082060"
        />
        
        <FeatureCard
          title="анализ резюме"
          description="Easily create and update a professional resume with our intuitive editor."
          borderColor="#83BCFF"
          width="365.36px"
          height="197.40px"
          left="4.60px"
          top="296.60px"
          buttonLeft="254px"
          buttonTop="427.19px"
          buttonBackground="#F2C2C8"
          buttonBorderColor="#082060"
        />
        
        <FeatureCard
          title="онлайн-компилятор"
          description="Solve coding problems in real-time with our integrated compiler for popular languages."
          borderColor="#F2C2C8"
          width="731.63px"
          height="197.40px"
          left="411.37px"
          top="296.60px"
          buttonLeft="1030.72px"
          buttonTop="427.19px"
          buttonBackground="#83BCFF"
          buttonBorderColor="#082060"
        />
      </div>
*/}
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
            backgroundColor: '#F2C2C8',
            textColor: '#082060',
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
