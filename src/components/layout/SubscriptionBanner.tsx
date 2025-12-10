/*import React from 'react'
import { Button } from '../ui/Button/Button'
import './SubscriptionBanner.module.css'

export const SubscriptionBanner: React.FC = () => {
  return (
    <div className={"subscriptionSection"}>
      <div className={"subscriptionBackground"}></div>
      <div className={"subscriptionTitle"}>
        получите неограниченный доступ к ресурсам
      </div>
      <Button
        variant="custom"
        styleProps={{
          width: '271px',
          height: '54px',
          backgroundColor: '#fffcf5',
          textColor: '#36447c',
          borderRadius: '15px',
          fontSize: '20px',
          fontFamily: 'Geist Mono',
          padding: '12px 17px',
          gap: '7.25px'
        }}
        className={"subscriptionButton"}
      >
        Оформить подписку
      </Button>
    </div>
  )
}*/
import React from 'react'
import { Button } from '../ui/Button/Button'
import * as styles from'./SubscriptionBanner.module.css'

export const SubscriptionBanner: React.FC = () => {
  return (
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
        >
          Оформить подписку
        </Button>
      </div>
    </section>
  )
}
