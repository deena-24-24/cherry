import React from 'react'
import { CandidateData } from '../../../service/api/candidateService'
import { Button } from '../../ui/Button/Button'
import * as styles from './CandidateCard.module.css'
import { Resume } from '../../../types/resume'

interface CandidateCardProps {
  candidate: Resume | CandidateData;
  isFavorite: boolean;
  onAddToFavorites: (candidateId: string) => void;
  onRemoveFromFavorites: (candidateId: string) => void;
  onViewResume: (candidate: Resume | CandidateData) => void;
  onChatClick?: (candidateId: string) => void;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  isFavorite,
  onAddToFavorites,
  onRemoveFromFavorites,
  onViewResume,
  onChatClick
}) => {
  const fullName = candidate.firstName && candidate.lastName
    ? `${candidate.firstName} ${candidate.lastName}`
    : candidate.email

  // Вычисление стажа на основе периодов работы
  const calculateExperienceYears = (experience: Array<{ period: string }> | undefined): number => {
    if (!experience || experience.length === 0) {
      return 0
    }

    let totalMonths = 0
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1

    experience.forEach(exp => {
      const period = exp.period.trim()
      // Парсим форматы: "2020 - 2023", "2020 - настоящее время", "2020 - н.в." и т.д.
      const match = period.match(/(\d{4})\s*[-–—]\s*(\d{4}|настоящее\s+время|н\.в\.|по\s+настоящее\s+время)/i)
      
      if (match) {
        const startYear = parseInt(match[1], 10)
        const endStr = match[2].toLowerCase()
        
        let endYear: number
        let endMonth = 12 // По умолчанию конец года
        
        if (endStr.includes('настоящее') || endStr.includes('н.в.') || endStr.includes('по настоящее')) {
          endYear = currentYear
          endMonth = currentMonth
        } else {
          endYear = parseInt(match[2], 10)
        }

        if (!isNaN(startYear) && !isNaN(endYear) && endYear >= startYear) {
          // Вычисляем количество месяцев: (endYear - startYear) * 12 + (endMonth - 1)
          // Предполагаем, что работа началась в начале startYear (месяц 0)
          const months = (endYear - startYear) * 12 + endMonth
          totalMonths += Math.max(0, months)
        }
      } else {
        // Пробуем парсить только год начала, если формат не распознан
        const yearMatch = period.match(/\b(\d{4})\b/)
        if (yearMatch) {
          const startYear = parseInt(yearMatch[1], 10)
          if (!isNaN(startYear) && startYear <= currentYear) {
            // Если указан только год начала, считаем до текущего момента
            const months = (currentYear - startYear) * 12 + currentMonth
            totalMonths += Math.max(0, months)
          }
        }
      }
    })

    // Округляем до лет (месяцы / 12)
    return Math.floor(totalMonths / 12)
  }

  const calculateExperience = () => {
    const years = calculateExperienceYears(candidate.experience)
    if (years === 0) {
      return 'Нет опыта'
    }
    return `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`
  }

  const handleFavoriteClick = () => {
    if (candidate.userId) {
      if (isFavorite) {
        onRemoveFromFavorites(candidate.userId)
      } else {
        onAddToFavorites(candidate.userId)
      }
    }
  }

  const handleChatClick = () => {
    if (onChatClick && candidate.userId) {
      onChatClick(candidate.userId)
    }
  }

  const position = 'position' in candidate
    ? candidate.position
    : (candidate as CandidateData).jobTitle

  return (
    <div className={styles["card"]}>
      <div className={styles["cardContent"]}>
        {/* Аватар и рейтинг */}
        <div className={styles["avatarContainer"]}>
          <div className={styles["avatar"]}>
            {candidate.avatar ? (
              <img src={candidate.avatar} alt={fullName} className={styles["avatarImage"]} />
            ) : (
              <div className={styles["avatarPlaceholder"]}>
                {fullName?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          {candidate.rating !== null && candidate.rating !== undefined && (
            <div className={styles["rating"]}>
              <span className={styles["ratingValue"]}>{candidate.rating}</span>
              <span className={styles["ratingMax"]}>/10</span>
            </div>
          )}
        </div>

        {/* Имя */}
        <div className={styles["name"]}>{fullName}</div>

        {/* Детали */}
        <div className={styles["details"]}>
          <span className={styles["detailItem"]}>{candidate.city || 'Город не указан'}</span>
          <span className={styles["detailItem"]}>
            {position ? position : `Стаж ${calculateExperience()}`}
          </span>
        </div>

        {/* Навыки */}
        {candidate.skills && candidate.skills.length > 0 && (
          <div className={styles["skills"]}>
            {candidate.skills.slice(0, 3).map((skill, index) => (
              <span key={index} className={styles["skillTag"]}>
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Действия */}
        <div className={styles["actions"]}>
          <Button
            variant="primary"
            onClick={() => onViewResume(candidate)}
            className={styles["viewButton"]}
          >
            РЕЗЮМЕ
          </Button>

          <Button
            variant="secondary"
            onClick={handleChatClick}
            className={styles["messageButton"]}
          >
            НАПИСАТЬ
          </Button>

          <button
            type="button"
            onClick={handleFavoriteClick}
            className={`${styles["favoriteButton"]} ${isFavorite ? styles["favoriteButtonActive"] : ''}`}
            title={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
          >
            {isFavorite ? '★' : '☆'}
          </button>
        </div>
      </div>
    </div>
  )
}