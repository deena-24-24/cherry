import React, { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import * as styles from "./CandidateHomeFeatures.module.css"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export const HomeFeatures: React.FC = () => {
  const navigate = useNavigate()
  const cardsRef = useRef<HTMLDivElement[]>([])

  const gridRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const cards = cardsRef.current
    const grid = gridRef.current

    // ВАЖНО: теперь mouseleave будет ТОЛЬКО на grid
    const resetAll = () => {
      cards.forEach((c) => {
        gsap.to(c, {
          scale: 1,
          x: 0,
          y: 0,
          zIndex: 1,
          duration: 0.35,
          ease: "power3.out",
        })
      })
    }

    // Вешаем reset только на grid
    grid?.addEventListener("mouseleave", resetAll)

    cards.forEach((card, index) => {
      card.addEventListener("mouseenter", () => {
        cards.forEach((other, i) => {
          if (i === index) {
            // активная карточка
            gsap.to(other, {
              scale: 1.15,
              duration: 0.3,
              ease: "power3.out",
              zIndex: 10,
            })
          } else {
            // сжатие остальных
            gsap.to(other, {
              scale: 0.85,
              duration: 0.3,
              ease: "power3.out",
              zIndex: 1,
            })

            // ---- СДВИГИ ----
            const isHoveredLeft = index % 2 === 0
            const isOtherLeft = i % 2 === 0

            const push = 16 // расстояние между карточками при наведении

            if (isHoveredLeft && !isOtherLeft) {
              gsap.to(other, { x: push, duration: 0.3, ease: "power3.out" })
            }
            if (!isHoveredLeft && isOtherLeft) {
              gsap.to(other, { x: -push, duration: 0.3, ease: "power3.out" })
            }

            if (index < 2 && i >= 2) {
              gsap.to(other, { y: push, duration: 0.3, ease: "power3.out" })
            }
            if (index >= 2 && i < 2) {
              gsap.to(other, { y: -push, duration: 0.3, ease: "power3.out" })
            }

          }
        })
      })
    })

    return () => {
      grid?.removeEventListener("mouseleave", resetAll)
    }
  }, [])

  useEffect(() => {
    cardsRef.current.forEach((card, index) => {
      gsap.fromTo(
        card,
        {
          opacity: 0,
          x: index % 2 === 0 ? -150 : 150, // чётные — слева, нечётные — справа
        },
        {
          opacity: 1,
          x: 0,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
          },
        }
      )
    })
  }, [])

  const setRef = (el: HTMLDivElement | null, index: number) => {
    if (el) cardsRef.current[index] = el
  }

  const cards = [
    {
      title: "ИИ-СОБЕСЕДОВАНИЕ",
      text: "Оттачивайте навыки прохождения технического интервью с нашим ИИ-ассистентом",
      color: "pink",
      route: "/interview",
    },
    {
      title: "ЧАТ",
      text: "Изучайте новое и повторяйте известное в чате с искусственным интеллектом",
      color: "blue",
      route: "/chat",
    },
    {
      title: "РЕЗЮМЕ",
      text: "Заполняйте резюме, которое увидят HR-специалисты из реальных компаний",
      color: "blue",
      route: "/resume",
    },
    {
      title: "ОНЛАЙН-КОМПИЛЯТОР",
      text: "Решайте реальные задачи в интегрированном онлайн-компиляторе",
      color: "pink",
      route: "/compiler",
    },
  ]

  return (
    <section className={styles["section"]}>
      <h2 className={styles["title"]}>НАШИ ВОЗМОЖНОСТИ</h2>

      <div className={styles["grid"]} ref={gridRef}>
        {cards.map((card, index) => (
          <div
            key={card.title}
            ref={(el) => setRef(el, index)}
            className={`${styles["card"]} ${styles[card.color]}`}
            onClick={() => navigate(card.route)}
          >
            <h3 className={styles["cardTitle"]}>{card.title}</h3>
            <p className={styles["cardText"]}>{card.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
