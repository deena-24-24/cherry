import React, { useState, useEffect, useMemo } from 'react'
import { fetchCandidates } from '../../service/hr/candidatesService' // Это теперь возвращает Resume[]
import { CandidateCard } from '../../components/candidatesPage/CandidateCard/CandidateCard'
import { CandidatesFilter, FilterState } from '../../components/candidatesPage/CandidatesFilter/CandidatesFilter'
import { ResumeModal } from '../../components/candidatesPage/ResumeModal/ResumeModal'
import * as styles from './HrCandidatesPage.module.css'

import { Resume } from '../../types/resume'

export const HrCandidatesPage: React.FC<{ showTitle?: boolean }> = ({ showTitle = false }) => {
  const [candidates, setCandidates] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCandidate, setSelectedCandidate] = useState<Resume | null>(null)

  const [filters, setFilters] = useState<FilterState>({
    position: '',
    city: '',
    experience: '',
    skills: [],
    sortBy: 'rating',
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const data = await fetchCandidates()
        setCandidates(data as unknown as Resume[]) // Приведение типа
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredCandidates = useMemo(() => {
    let result = [...candidates]

    // Фильтр по Позиции (вакансии)
    if (filters.position) {
      result = result.filter(c =>
        c.position?.toLowerCase().includes(filters.position.toLowerCase()) ||
        c.title?.toLowerCase().includes(filters.position.toLowerCase())
      )
    }

    // Фильтр по Городу
    if (filters.city) {
      result = result.filter(c =>
        c.country?.toLowerCase().includes(filters.city.toLowerCase())
      )
    }

    // Фильтр по Навыкам
    if (filters.skills.length > 0) {
      result = result.filter(c => {
        const cSkills = (c.skills || []).map(s => s.toLowerCase())
        return filters.skills.every(fs => cSkills.includes(fs.toLowerCase()))
      })
    }

    // Сортировка по опыту (кол-во лет или записей)
    if (filters.sortBy === 'experience') {
      result.sort((a, b) => (b.experience?.length || 0) - (a.experience?.length || 0))
    }

    return result
  }, [candidates, filters])

  // Список всех навыков для автокомплита
  const availableSkills = useMemo(() => {
    const s = new Set<string>()
    candidates.forEach(c => c.skills?.forEach(sk => s.add(sk)))
    return Array.from(s)
  }, [candidates])

  return (
    <>
      {showTitle && <div className={styles["title"]}>КАНДИДАТЫ</div>}

      <div className={styles["container"]}>
        <div className={styles["filterContainer"]}>
          <CandidatesFilter
            filters={filters}
            onFiltersChange={setFilters}
            availableSkills={availableSkills}
          />
        </div>

        <div className={styles["candidatesList"]}>
          {loading ? (
            <div className={styles["loading"]}>Загрузка...</div>
          ) : filteredCandidates.length === 0 ? (
            <div className={styles["emptyState"]}>Ничего не найдено</div>
          ) : (
            filteredCandidates.map(c => (
              <CandidateCard
                key={c.id} // используем ID резюме
                candidate={c as any} // CandidateCard ожидает CandidateData, но поля совпадают
                isFavorite={false} // Добавить логику избранного по желанию
                onAddToFavorites={() => {}}
                onRemoveFromFavorites={() => {}}
                onViewResume={() => setSelectedCandidate(c)}
              />
            ))
          )}
        </div>
      </div>

      {selectedCandidate && (
        <ResumeModal
          candidate={selectedCandidate as any}
          onClose={() => setSelectedCandidate(null)}
        />
      )}
    </>
  )
}