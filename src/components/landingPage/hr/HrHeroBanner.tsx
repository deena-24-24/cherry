import heroImage from "../../../assets/hr_home.png"
import { Button } from '../../ui/Button/Button'
import React, { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from "gsap/ScrollTrigger"
import * as styles from './HrHeroBanner.module.css'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../../router/routes'

gsap.registerPlugin(ScrollTrigger)

export const HrHeroBanner: React.FC = () => {

  const navigate = useNavigate()
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useGSAP(() => {
    const el = wrapperRef.current
    if (!el) return

    gsap.set(el, {
      clipPath: "polygon(14% 0%, 82% 0%, 93% 100%, 10% 90%)",
      borderRadius: "10% 0 15% 40%",
    })
    gsap.from(el, {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      borderRadius: '0 0 0 0',
      scrollTrigger: {
        trigger: el,
        start: "top top",
        end: "bottom center",
        scrub: true,
      },
      ease: "power1.inOut",
      duration: 1.5,
    })
  }, [])

  return (
    <div className={styles["hero-banner"]}>
      <div ref={wrapperRef} className={styles["hero-bg"]}></div>

      <div className={styles["hero-content"]}>
        <div className={styles["hero-text"]}>
          <h1>Добро пожаловать в CareerUp</h1>
          <p>
            Просмотрите опубликованные нашими пользователями резюме. Возможно, кто-то из них идеально подходит вашей компании?
          </p>
          <Button
            variant="custom"
            styleProps={{
              width: '186px',
              height: '62px',
              backgroundColor: '#36447c',
              textColor: '#fffcf5',
              borderRadius: '15px',
              fontSize: '24px',
              fontFamily: 'Geist Mono',
              padding: '12px 17px',
              gap: '7.25px'
            }}
            onClick={()=> navigate(ROUTES.HR_CANDIDATES)}
          >
            ПЕРЕЙТИ
          </Button>
        </div>

        <div className={styles["hero-image"]}>
          <img src={heroImage} alt="HR Illustration" />
        </div>
      </div>
    </div>
  )
}
