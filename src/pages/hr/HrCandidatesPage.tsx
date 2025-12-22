import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchCandidates, fetchFavorites, addToFavorites, removeFromFavorites } from '../../service/api/candidatesService'
import { chatService } from '../../service/api/chatService'
import { useChatStore } from '../../store/useChatStore'
import { CandidateCard } from '../../components/candidatesPage/CandidateCard/CandidateCard'
import { CandidatesFilter, FilterState } from '../../components/candidatesPage/CandidatesFilter/CandidatesFilter'
import { ResumeModal } from '../../components/candidatesPage/ResumeModal/ResumeModal'
import * as styles from './HrCandidatesPage.module.css'
import { Resume } from '../../types/resume'
import { ROUTES } from '../../router/routes'
import { CandidateData } from '../../service/api/candidateService'
import { Loader } from '../../components/ui/Loader/Loader'

export const HrCandidatesContent: React.FC<{ showTitle?: boolean }> = ({ showTitle = false }) => {
  const navigate = useNavigate()
  const { fetchChatById } = useChatStore()
  const [candidates, setCandidates] = useState<Resume[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCandidate, setSelectedCandidate] = useState<Resume | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const [filters, setFilters] = useState<FilterState>({
    position: '', city: '', experience: '', skills: [], sortBy: 'rating',
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [allCandidates, favData] = await Promise.all([ fetchCandidates(), fetchFavorites() ])
        setCandidates(allCandidates as unknown as Resume[])
        setFavorites(favData.map(f => f.userId || '').filter(Boolean))
      } catch (error) { console.error(error) } finally { setLoading(false) }
    }
    loadData()
  }, [])

  // На десктопе фильтры всегда видны
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 769) {
        setShowFilters(true)
      }
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])


  // Фильтрация
  const filteredCandidates = useMemo(() => {
    let result = [...candidates]

    if (filters.position) {
      result = result.filter(c =>
        c.position?.toLowerCase().includes(filters.position.toLowerCase()) ||
        (c as unknown as CandidateData).jobTitle?.toLowerCase().includes(filters.position.toLowerCase())
      )
    }
    if (filters.city) {
      result = result.filter(c =>
        c.city?.toLowerCase().includes(filters.city.toLowerCase())
      )
    }
    if (filters.skills.length > 0) {
      result = result.filter(c => {
        const cSkills = (c.skills || []).map(s => s.toLowerCase())
        return filters.skills.every(fs => cSkills.includes(fs.toLowerCase()))
      })
    }
    if (filters.sortBy === 'experience') {
      result.sort((a, b) => (b.experience?.length || 0) - (a.experience?.length || 0))
    }

    return result
  }, [candidates, filters])

  const availableSkills = useMemo(() => {
    const s = new Set<string>()
    candidates.forEach(c => c.skills?.forEach(sk => s.add(sk)))
    return Array.from(s)
  }, [candidates])

  // Handlers
  const handleAddToFavorites = async (userId: string) => {
    try {
      await addToFavorites(userId)
      setFavorites(prev => [...prev, userId])
    } catch (e) {
      console.error(e)
    }
  }

  const handleRemoveFromFavorites = async (userId: string) => {
    try {
      await removeFromFavorites(userId)
      setFavorites(prev => prev.filter(id => id !== userId))
    } catch (e) {
      console.error(e)
    }
  }

  const handleChatClick = async (targetUserId: string) => {
    try {
      const chatData = await chatService.startChat(targetUserId)

      if (chatData && chatData.id) {
        await fetchChatById(chatData.id)
      }

      navigate(ROUTES.CHAT)
    } catch (error) {
      console.error("Не удалось начать чат:", error)
      alert("Ошибка при создании чата")
    }
  }

  return (
    <>
      {showTitle && (
        <div className={styles["titleContainer"]}>
          <div className={styles["title"]}>КАНДИДАТЫ</div>
          <button
            className={styles["filterToggle"]}
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Показать/скрыть фильтры"
          >
            {showFilters ? '✕' : '☰'} Фильтры
          </button>
        </div>
      )}

      <div className={styles["container"]}>
        <div className={`${styles["filterContainer"]} ${showFilters ? styles["filterContainerOpen"] : ''}`}>
          <CandidatesFilter filters={filters} onFiltersChange={setFilters} availableSkills={availableSkills} />
        </div>

        <div className={styles["candidatesList"]}>
          {loading ? (
            <Loader />
          ) : filteredCandidates.length === 0 ? (
            <div className={styles["emptyState"]}>Ничего не найдено</div>
          ) : (
            filteredCandidates.map(c => (
              <CandidateCard
                key={c.id}
                candidate={c} // Удален as any, так как c имеет тип Resume
                isFavorite={c.userId ? favorites.includes(c.userId) : false}
                onAddToFavorites={handleAddToFavorites}
                onRemoveFromFavorites={handleRemoveFromFavorites}
                onViewResume={() => setSelectedCandidate(c)}
                onChatClick={handleChatClick}
              />
            ))
          )}
        </div>
      </div>

      {selectedCandidate && (
        <ResumeModal
          candidate={selectedCandidate as unknown as CandidateData}
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