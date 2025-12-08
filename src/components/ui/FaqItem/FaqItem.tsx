import React from 'react'
import * as styles from './FaqItem.module.css'

export interface FaqItemProps {
  question?: string
  answer?: string
  isOpen?: boolean
  onToggle?: () => void
  top?: string
}

export const FaqItem: React.FC<FaqItemProps> = ({
  question,
  answer,
  isOpen = false,
  onToggle,
  top
}) => {
  return (
    <div className={styles["faqItem"]} style={{ top }}>
      {question && (
        <>
          <div className={styles["faqQuestion"]}>{question}</div>
          <div className={styles["faqDivider"]}></div>
        </>
      )}
      {answer && <div className={styles["faqAnswer"]}>{answer}</div>}
      <button 
        className={`${styles["faqButton"]} ${isOpen ? styles["faqButtonActive"] : ''}`}
        onClick={onToggle}
      >
        <span className={styles["faqButtonText"]}>
          {isOpen ? '-' : '+'}
        </span>
      </button>
    </div>
  )
}

