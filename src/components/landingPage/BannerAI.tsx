import React from 'react'
import * as styles from './BannerAI.module.css'
import AIImage from '../../assets/img.png'

export const BannerAI: React.FC = () => {

  return (

    <section className={styles["ai-banner"]}>
      <div className={styles["banner-text"]}>
        Готовьтесь к собеседованиям с нашим ИИ-ассистентом
      </div>
      <div className={styles["banner-inner"]}>


        {/* ЛЕВЫЕ ВОЛНЫ */}
        <div className={styles["wave-side"]}>
          <div className={styles["audio-track"]}>
            {Array.from({ length: 32 }).map((_, i) => (
              <div
                key={i}
                className={styles["audio-bar"]}
                style={{
                  animationDelay: `${i * 0.06}s`,
                  height: `${18 + Math.random() * 42}px`
                }}
              />
            ))}
          </div>
        </div>

        {/* ЦЕНТР — КАРТИНКА */}
        <div className={styles["center-image"]}>
          {/* ты подставишь своё изображение */}
          <img
            src={AIImage}
            alt="Candidate"
          />
        </div>

        {/* ПРАВЫЕ ВОЛНЫ */}
        <div className={styles["wave-side"]}>
          <div className={styles["audio-track"]}>
            {Array.from({ length: 32 }).map((_, i) => (
              <div
                key={i}
                className={styles["audio-bar"]}
                style={{
                  animationDelay: `${i * 0.06}s`,
                  height: `${18 + Math.random() * 42}px`
                }}
              />
            ))}
          </div>
        </div>

      </div>
    </section>

  )
}