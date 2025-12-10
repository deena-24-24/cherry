import React, { useEffect, useRef, useState,  } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button/Button'
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
  const navigate = useNavigate()
  const { openAuth } = usePopupStore()
  const { user, logout } = useAuthStore()

  const handleAuthClick = () => {
    if (user) {
      logout()
      navigate(ROUTES.HOME)
    } else {
      openAuth()
    }
  }

  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const toggleMobile = () => {
    setIsMobileOpen(prev => !prev)
  }

  const [lastScrollY, setLastScrollY] = useState(0)
  const [isNavVisible, setIsNavVisible] =useState(true)
  const navContainerRef = useRef<HTMLDivElement | null>(null)
  const { y: currentScrollY } = useWindowScroll()
  useEffect(() => {
    const navEl = navContainerRef.current
    if (!navEl) return

    const threshold = 70 // сдвиг вниз на столько пикселей -> прячем хедер

    if(currentScrollY < threshold) {
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
            <img src={logoTitle}
              alt="Career Up Logo"
              className={styles["logo"]}/>
          </NavLink>

          {/* Навигация */}
          <div className={styles["navDesktop"]}>
            {user && (
              user.role === 'candidate' ? ( <CandidateNavigation />
              ) : (<HrNavigation />)
            )}

            <Button className={styles["loginButton"]} onClick={handleAuthClick}>
              <span className={styles["loginButtonText"]}>
                {user ? 'ВЫХОД' : 'ВХОД'}
              </span>
            </Button>
          </div>

          {/* БУРГЕР ДЛЯ МОБИЛКИ */}
          <button className={styles["burgerButton"]} onClick={toggleMobile}>
            <span className={isMobileOpen ? styles["burgerLineOpen"] : styles["burgerLine"]}></span>
            <span className={isMobileOpen ? styles["burgerLineOpen"] : styles["burgerLine"]}></span>
            <span className={isMobileOpen ? styles["burgerLineOpen"] : styles["burgerLine"]}></span>
          </button>
        </div>
      </div>
      {/* МОБИЛЬНОЕ МЕНЮ */}
      <div className={`${styles["mobileMenuWrapper"]} ${isMobileOpen ? styles["open"] : ""}`}>
        <div className={`${styles["mobileMenu"]}`}>
          <div className={styles["mobileMenuContent"]}>
            {user && (user.role === "candidate" ? <CandidateNavigation /> : <HrNavigation />)}
            <Button className={styles["mobileLoginButton"]} onClick={handleAuthClick}>
              {user ? "ВЫЙТИ" : "ВОЙТИ"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
