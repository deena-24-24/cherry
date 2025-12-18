import * as styles from "./BannerMain.module.css"

import React, { useEffect, useState } from 'react'
import { BannerMainDesktop } from './BannerMainDesktop'
import { BannerMainMobile } from './BannerMainMobile'

const MOBILE_BREAKPOINT = 900

export const BannerMain: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT)
    }

    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (isMobile) {
    return <BannerMainMobile />
  }

  return <BannerMainDesktop />
}

