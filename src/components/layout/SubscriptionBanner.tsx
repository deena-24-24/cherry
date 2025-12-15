import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button/Button'
import * as styles from'./SubscriptionBanner.module.css'

export const SubscriptionBanner: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      <section className={styles["subscription"]}>
        <div className={styles["subscription__inner"]}>
          <h2 className={styles["subscription__title"]}>
            получите неограниченный доступ к ресурсам
          </h2>

          <Button
            variant="custom"
            styleProps={{
              width: '280px',
              height: '54px',
              backgroundColor: '#fffcf5',
              textColor: '#36447c',
              borderRadius: '15px',
              fontSize: '20px',
              fontFamily: 'Geist Mono',
              padding: '12px 17px',
              gap: '7.25px'
            }}
            className={styles["subscription__button"]}
            onClick={() => setIsOpen(true)}
          >
            Оформить подписку
          </Button>
        </div>
      </section>

      {isOpen && (
        <div className={styles["subscription__overlay"]}>
          <div className={styles["subscription__popup"]}>
            <h3>🚧 Подписка скоро будет доступна</h3>
            <p>
              Мы уже работаем над системой подписки.
            </p>

            <Button onClick={() => setIsOpen(false)}>
              Понятно
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
