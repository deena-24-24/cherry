import React from 'react'
import { Button } from '../ui/Button/Button'
import * as styles from './BannerUpper.module.css'
import { usePopupStore } from '../../store'

export interface LandingHeaderProps {
  mainTitle?: string;
  description?: string;
  buttonText?: string;
  className?: string; /* Дополнительный CSS-класс для контейнера */
}

export const BannerUpper: React.FC<LandingHeaderProps> = ({
  mainTitle = "Делаем трудоустройство проще ",
  description = "Связываем кандидатов, не бегущих от новых технологий, с рекрутерами",
  buttonText = "Попробуйте. Это бесплатно →",
  className = '',
}) => {

  const { openAuth } = usePopupStore()
  const handleStartClick = () => { openAuth() }
  
  
  return (
    <div className={`${styles["container"]} ${className}`}>
      <h1 className={styles["mainTitle"]}>
        {mainTitle}
      </h1>

      <p className={styles["description"]}>
        {description}
      </p>

      <Button
        variant="primary"
        styleProps={{
          padding: '16px 32px',
          width: '60%',
          fontSize: '18px',
          borderRadius: '12px',
          backgroundColor: '#95525b',
          textColor: 'white',
        }}
        className={styles["ctaButton"]}
        onClick={handleStartClick}
      >
        {buttonText}
      </Button>
    </div>
  )
}