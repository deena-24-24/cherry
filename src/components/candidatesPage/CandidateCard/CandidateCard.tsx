import React from 'react'
import { CandidateData } from '../../../service/candidate/candidateService'
import { Button } from '../../ui/Button/Button'
import * as styles from './CandidateCard.module.css'
// Временно используем any для совместимости с Resume, если типы не совпадают идеально
import { Resume } from '../../../types/resume'

interface CandidateCardProps {
  candidate: Resume | CandidateData; // Поддержка обоих типов
  isFavorite: boolean;
  onAddToFavorites: (candidateId: string) => void;
  onRemoveFromFavorites: (candidateId: string) => void;
  onViewResume: (candidate: any) => void;
  onChatClick?: (candidateId: string) => void; // Новый проп
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

  const calculateExperience = () => {
    if (!candidate.experience || candidate.experience.length === 0) {
      return 'Нет опыта'
    }
    return `${candidate.experience.length} ${candidate.experience.length === 1 ? 'год' : 'лет'}`
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

  return (
    <div className={styles["card"]}>
      <div className={styles["cardContent"]}>
        {/* Аватар */}
        <div className={styles["avatar"]}>
          {candidate.avatar ? (
            <img src={candidate.avatar} alt={fullName} className={styles["avatarImage"]} />
          ) : (
            <div className={styles["avatarPlaceholder"]}>
              {fullName?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Информация */}
        <div className={styles["info"]}>
          <div className={styles["name"]}>{fullName}</div>
          <div className={styles["details"]}>
            <span className={styles["detailItem"]}>{candidate.country || 'Город не указан'}</span>
            <span className={styles["detailItem"]}>
              {(candidate as any).position ? (candidate as any).position : `Стаж ${calculateExperience()}`}
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
        </div>

        {/* Действия */}
        <div className={styles["actions"]}>
          <Button
            variant="primary"
            onClick={() => onViewResume(candidate)}
            className={styles["viewButton"]}
          >
            Резюме
          </Button>

          <Button
            variant="secondary"
            onClick={handleChatClick}
            className={styles["messageButton"]}
          >
            Написать
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