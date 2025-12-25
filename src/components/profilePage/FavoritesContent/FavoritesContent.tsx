import React, { useState, useEffect } from 'react'
import { CandidateData } from '../../../service/api/candidateService'
import { fetchFavorites, removeFromFavorites } from '../../../service/api/candidatesService'
import { CandidateCard } from '../../candidatesPage/CandidateCard/CandidateCard'
import { ResumeModal } from '../../candidatesPage/ResumeModal/ResumeModal'
import * as styles from './FavoritesContent.module.css'
import { SmallLoader } from '../../ui/Loader/SmallLoader'

export const FavoritesContent: React.FC = () => {
  const [favorites, setFavorites] = useState<CandidateData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateData | null>(null)

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        setLoading(true)
        const favoritesData = await fetchFavorites()
        setFavorites(favoritesData)
      } catch (error) {
        console.error('Ошибка загрузки избранных:', error)
      } finally {
        setLoading(false)
      }
    }
    loadFavorites()
  }, [])

  const handleRemoveFromFavorites = async (candidateId: string) => {
    try {
      await removeFromFavorites(candidateId)
      setFavorites(prev => prev.filter(c => c.userId !== candidateId))
    } catch (error) {
      console.error('Ошибка удаления из избранного:', error)
    }
  }

  const handleViewResume = (candidate: CandidateData) => {
    setSelectedCandidate(candidate)
  }

  if (loading) {
    return <SmallLoader />
  }

  if (favorites.length === 0) {
    return (
      <div className={styles["emptyState"]}>
        <p>У вас пока нет избранных кандидатов</p>
        <p>Добавьте кандидатов в избранное на странице &quot;Кандидаты&quot;</p>
      </div>
    )
  }

  return (
    <div className={styles["container"]}>
      <div className={styles["favoritesList"]}>
        {favorites.map((candidate) => (
          <CandidateCard
            key={candidate.userId}
            candidate={candidate}
            isFavorite={true}
            onAddToFavorites={() => {}}
            onRemoveFromFavorites={handleRemoveFromFavorites}
            onViewResume={handleViewResume}
          />
        ))}
      </div>

      {selectedCandidate && (
        <ResumeModal
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
        />
      )}
    </div>
  )
}

