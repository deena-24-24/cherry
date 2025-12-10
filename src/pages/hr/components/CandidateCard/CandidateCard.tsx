import React from 'react';
import { CandidateData } from '../../../../service/candidate/candidateService';
import { Button } from '../../../../components/ui/Button/Button';
import * as styles from './CandidateCard.module.css';

interface CandidateCardProps {
  candidate: CandidateData;
  isFavorite: boolean;
  onAddToFavorites: (candidateId: string) => void;
  onRemoveFromFavorites: (candidateId: string) => void;
  onViewResume: (candidate: CandidateData) => void;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  isFavorite,
  onAddToFavorites,
  onRemoveFromFavorites,
  onViewResume,
}) => {
  const fullName = candidate.firstName && candidate.lastName
    ? `${candidate.firstName} ${candidate.lastName}`
    : candidate.email;

  // Вычисляем стаж работы из опыта
  const calculateExperience = () => {
    if (!candidate.experience || candidate.experience.length === 0) {
      return 'Нет опыта';
    }
    
    // Простой расчет - берем первый и последний период
    // В реальности нужен более сложный алгоритм
    const periods = candidate.experience.map(exp => {
      const [start, end] = exp.period.split(' - ');
      return { start, end: end || 'настоящее время' };
    });
    
    // Упрощенный расчет
    return `${candidate.experience.length} ${candidate.experience.length === 1 ? 'год' : 'лет'}`;
  };

  const handleFavoriteClick = () => {
    if (candidate.userId) {
      if (isFavorite) {
        onRemoveFromFavorites(candidate.userId);
      } else {
        onAddToFavorites(candidate.userId);
      }
    }
  };

  return (
    <div className={styles["card"]}>
      <div className={styles["cardContent"]}>
        {/* Аватар */}
        <div className={styles["avatar"]}>
          {candidate.avatar ? (
            <img src={candidate.avatar} alt={fullName} className={styles["avatarImage"]} />
          ) : (
            <div className={styles["avatarPlaceholder"]}>
              {fullName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Информация о кандидате */}
        <div className={styles["info"]}>
          <div className={styles["name"]}>{fullName}</div>
          <div className={styles["details"]}>
            <span className={styles["detailItem"]}>{candidate.country || 'Город не указан'}</span>
            <span className={styles["detailItem"]}>Стаж {calculateExperience()}</span>
            <span className={styles["detailItem"]}>Рейтинг 0.0</span>
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

        {/* Кнопки действий */}
        <div className={styles["actions"]}>
          <Button
            variant="secondary"
            onClick={() => onViewResume(candidate)}
            className={styles["viewButton"]}
          >
            Просмотр резюме
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
  );
};

