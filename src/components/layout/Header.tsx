import React, { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { ROUTES } from '../../router/routes'
import { usePopupStore } from '../../store'
import { useAuthStore } from '../../store'
import { CandidateNavigation } from './CandidateNavigation'
import { HrNavigation } from './HrNavigation'
import logoTitle from '../../assets/logo_title.svg'
import * as styles from './Header.module.css'
import gsap from 'gsap'
import { useWindowScroll } from 'react-use'


export const Header: React.FC = () => {
  const { openAuth } = usePopupStore()
  const { user, logout } = useAuthStore()
  
  const handleAuthClick = () => {
    if (user) {
      logout()
    } else {
      openAuth()
    }
  }

  const [lastScrollY, setLastScrollY] = useState(0)
  const [isNavVisible, setIsNavVisible] =useState(true)
  const navContainerRef = useRef<HTMLDivElement | null>(null)
  const { y: currentScrollY } = useWindowScroll()
  useEffect(() => {
    const navEl = navContainerRef.current
    if (!navEl) return

    if(currentScrollY === 0) {
      setIsNavVisible(true)
    } else if(currentScrollY > lastScrollY) {
      setIsNavVisible(false)
    } else if(currentScrollY < lastScrollY) {
      setIsNavVisible(true)
    }

    setLastScrollY(currentScrollY)
  }, [currentScrollY])

  useEffect(() => {
    const navEl = navContainerRef.current
    if (!navEl) return

    gsap.to(navContainerRef.current, {
      y: isNavVisible ? 0 : -100,
      opacity: isNavVisible ? 1 : 0,
      duration: 0.35,
      ease:"power2.out",
    })
  }, [isNavVisible])

  
  return (
    <div ref={navContainerRef} className={styles["floatingWrapper"]}>
      <div className={styles["headerContainer"]}>
        <div className={styles["headerContent"]}>
          {/* Логотип */}
          <NavLink to={ROUTES.HOME} className={styles["logoLink"]}>
            <img 
              src={logoTitle}
              alt="Career Up Logo" 
              className={styles["logo"]}
            />
          </NavLink>

          {/* Навигация */}
          <div className={styles["navContainer"]}>
            {user && (
              user.role === 'candidate' ? (
                <CandidateNavigation />
              ) : (
                <HrNavigation />
              )
            )}
            <button 
              className={styles["loginButton"]}
              onClick={handleAuthClick}
            >
              <span className={styles["loginButtonText"]}>
                {user ? 'ВЫХОД' : 'ВХОД'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
