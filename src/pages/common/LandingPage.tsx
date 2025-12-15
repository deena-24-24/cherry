import React from 'react'
import * as styles from './LandingPage.module.css'
import { HomeFeatures } from '../../components/layout/CandidateHomeFeatures'
import { HeroBanner } from '../../components/layout/HeroBanner'
import { SubscriptionBanner } from '../../components/layout/SubscriptionBanner'
import { FaqSection } from '../../components/layout/FaqSection'
import { useAuthStore } from '../../store'
import { HrHeroBanner } from '../../components/layout/HrHeroBanner'
import { HrHomeFeatures } from '../../components/layout/HrHomeFeatures'
import { BannerMain } from '../../components/layout/BannerMain'
import { BannerAI } from '../../components/layout/BannerAI'
import { BannerUpper } from '../../components/layout/BannerUpper'

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
