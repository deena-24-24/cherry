import React, { useState, useEffect, useMemo } from 'react'
import { CandidateData } from '../../service/candidate/candidateService'
import { fetchCandidates, fetchFavorites, addToFavorites, removeFromFavorites } from '../../service/hr/candidatesService'
import { CandidateCard } from './components/CandidateCard/CandidateCard'
import { CandidatesFilter, FilterState } from './components/CandidatesFilter/CandidatesFilter'
import { ResumeModal } from './components/ResumeModal/ResumeModal'
import * as styles from './HrCandidatesPage.module.css'

interface HrCandidatesContentProps {
  showTitle?: boolean;
}

export const HrCandidatesContent: React.FC<HrCandidatesContentProps> = ({ showTitle = false }) => {
  const [candidates, setCandidates] = useState<CandidateData[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateData | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    city: '',
    experience: '',
    skills: [],
    sortBy: 'rating',
  })

  // Загрузка данных
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [candidatesData, favoritesData] = await Promise.all([
          fetchCandidates(),
          fetchFavorites(),
        ])
        setCandidates(candidatesData)
        setFavorites(favoritesData.map(f => f.userId || '').filter(Boolean))
      } catch (error) {
        console.error('Ошибка загрузки данных:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Фильтрация и сортировка кандидатов
  const filteredAndSortedCandidates = useMemo(() => {
    let filtered = [...candidates]

    // Фильтр по городу
    if (filters.city) {
      filtered = filtered.filter(c => 
        c.country?.toLowerCase().includes(filters.city.toLowerCase())
      )
    }

    // Фильтр по стажу (упрощенный - по количеству опыта)
    if (filters.experience) {
      const experienceNum = parseInt(filters.experience)
      if (!isNaN(experienceNum)) {
        filtered = filtered.filter(c => 
          (c.experience?.length || 0) >= experienceNum
        )
      }
    }

    // Фильтр по навыкам
    if (filters.skills.length > 0) {
      filtered = filtered.filter(c => {
        const candidateSkills = (c.skills || []).map(s => s.toLowerCase())
        return filters.skills.some(filterSkill => 
          candidateSkills.includes(filterSkill.toLowerCase())
        )
      })
    }

    // Сортировка
    if (filters.sortBy === 'experience') {
      filtered.sort((a, b) => {
        const aExp = a.experience?.length || 0
        const bExp = b.experience?.length || 0
        return bExp - aExp
      })
    } else if (filters.sortBy === 'rating') {
      // Пока рейтинг не реализован, сортируем по имени
      filtered.sort((a, b) => {
        const aName = `${a.firstName || ''} ${a.lastName || ''}`.trim()
        const bName = `${b.firstName || ''} ${b.lastName || ''}`.trim()
        return aName.localeCompare(bName)
      })
    }

    return filtered
  }, [candidates, filters])

  // Получение всех уникальных навыков для фильтра
  const availableSkills = useMemo(() => {
    const skillsSet = new Set<string>()
    candidates.forEach(c => {
      (c.skills || []).forEach(skill => skillsSet.add(skill))
    })
    return Array.from(skillsSet).sort()
  }, [candidates])

  // Обработчики для избранного
  const handleAddToFavorites = async (candidateId: string) => {
    try {
      await addToFavorites(candidateId)
      setFavorites(prev => [...prev, candidateId])
    } catch (error) {
      console.error('Ошибка добавления в избранное:', error)
    }
  }

  const handleRemoveFromFavorites = async (candidateId: string) => {
    try {
      await removeFromFavorites(candidateId)
      setFavorites(prev => prev.filter(id => id !== candidateId))
    } catch (error) {
      console.error('Ошибка удаления из избранного:', error)
    }
  }

  const handleViewResume = (candidate: CandidateData) => {
    setSelectedCandidate(candidate)
  }

  if (loading) {
    return (
      <>
        {showTitle && <div className={styles["title"]}>КАНДИДАТЫ</div>}
        <div className={styles["loading"]}>Загрузка кандидатов...</div>
      </>
    )
  }

  return (
    <>
      {showTitle && <div className={styles["title"]}>КАНДИДАТЫ</div>}
      
      <div className={styles["container"]}>
        {/* Фильтр */}
        <div className={styles["filterContainer"]}>
          <CandidatesFilter
            filters={filters}
            onFiltersChange={setFilters}
            availableSkills={availableSkills}
          />
        </div>

        {/* Список кандидатов */}
        <div className={styles["candidatesList"]}>
          {filteredAndSortedCandidates.length === 0 ? (
            <div className={styles["emptyState"]}>
              <p>Кандидаты не найдены</p>
              <p>Попробуйте изменить параметры фильтрации</p>
            </div>
          ) : (
            filteredAndSortedCandidates.map((candidate) => (
              <CandidateCard
                key={candidate.userId}
                candidate={candidate}
                isFavorite={candidate.userId ? favorites.includes(candidate.userId) : false}
                onAddToFavorites={handleAddToFavorites}
                onRemoveFromFavorites={handleRemoveFromFavorites}
                onViewResume={handleViewResume}
              />
            ))
          )}
        </div>
      </div>

      {/* Модальное окно для просмотра резюме */}
      {selectedCandidate && (
        <ResumeModal
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
        />
      )}
    </>
  )
}

export const HrCandidatesPage: React.FC = () => {
  return (
    <div className={styles["page"]}>
      <HrCandidatesContent showTitle={true} />
    </div>
  )
}
