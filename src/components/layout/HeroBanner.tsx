import React, { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from "gsap/ScrollTrigger"

import "./HeroBanner.css"   // 👉 подключаем css
import heroImage from "../../assets/cand_home.png"
import { Button } from '../ui/Button/Button'

gsap.registerPlugin(ScrollTrigger)

export const HeroBanner: React.FC = () => {
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useGSAP(() => {
    const el = wrapperRef.current
    if (!el) return

    gsap.set(el, {
      clipPath: "polygon(14% 0%, 72% 0%, 90% 90%, 0% 100%)",
      borderRadius: "10% 0 40% 10%",
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
    <div className="hero-banner">
      <div ref={wrapperRef} className="hero-bg"></div>

      <div className="hero-content">
        <div className="hero-text">
          <h1>Добро пожаловать в ИИ-интервью</h1>
          <p>
            Пройди тренировочное собеседование, оцени свои навыки и прокачайся
            с помощью искусственного интеллекта.
          </p>
          <Button
            variant="custom"
            styleProps={{
              width: '186px',
              height: '62px',
              backgroundColor: '#95525b',
              textColor: '#fffcf5',
              borderRadius: '15px',
              fontSize: '24px',
              fontFamily: 'Geist Mono',
              padding: '12px 17px',
              gap: '7.25px'
            }}
          >
            НАЧАТЬ
          </Button>
        </div>

        <div className="hero-image">
          <img src={heroImage} alt="HR Illustration" />
        </div>
      </div>
    </div>
  )
}
