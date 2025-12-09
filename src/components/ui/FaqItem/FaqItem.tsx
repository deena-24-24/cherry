{/*import React from 'react'
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
*/}

import React from 'react'
import * as styles from './FaqItem.module.css'

export interface FaqItemProps {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}

export const FaqItem: React.FC<FaqItemProps> = ({
                                                  question,
                                                  answer,
                                                  isOpen,
                                                  onToggle
                                                }) => {
  return (
    <div className={styles["faqItem"]}>
      <button className={styles["faqHeader"]} onClick={onToggle}>
        <span className={styles["faqQuestion"]}>{question}</span>
        <span className={`${styles["faqButton"]} ${isOpen ? styles["faqButtonActive"] : ''}`}>
          {isOpen ? '+' : '+'}
        </span>
      </button>

      <div className={`${styles["faqAnswerWrapper"]} ${isOpen ? styles["open"] : ''}`}>
        <div className={styles["faqAnswer"]}>{answer}</div>
      </div>
    </div>
  )
}

