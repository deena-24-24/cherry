import React from 'react'
import * as styles from './LandingPage.module.css'
import { HomeFeatures } from '../../components/landingPage/candidate/CandidateHomeFeatures'
import { HeroBanner } from '../../components/landingPage/candidate/HeroBanner'
import { SubscriptionBanner } from '../../components/landingPage/SubscriptionBanner'
import { FaqSection } from '../../components/landingPage/FaqSection'
import { useAuthStore } from '../../store'
import { HrHeroBanner } from '../../components/landingPage/hr/HrHeroBanner'
import { HrHomeFeatures } from '../../components/landingPage/hr/HrHomeFeatures'
import { BannerMain } from '../../components/landingPage/BannerMain'
import { BannerAI } from '../../components/landingPage/BannerAI'
import { BannerUpper } from '../../components/landingPage/BannerUpper'

export const LandingPage: React.FC = () => {

  const { user } = useAuthStore()
  return (
    <div className={styles["landingContainer"]}>

      {!user ? (
        <>
          <BannerUpper />
          <BannerMain />
          <BannerAI />
        </>) : (
        (
          user.role === "candidate" ? (
            <>
              <HeroBanner />
              <HomeFeatures />
            </>
          ) : (
            <>
              <HrHeroBanner />
              <HrHomeFeatures />
            </>

          )
        )
      )}

      {/*добавить лоудер*/}

      <SubscriptionBanner />
      <FaqSection />
    </div>
  )
}
