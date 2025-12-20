import React, { useState, useEffect } from "react"
import { Button } from "../../ui/Button/Button"
import * as styles from "./ResumeContent.module.css"
import { Resume } from "../../../types/resume"
import { fetchMyResumes, createResume, updateResume, deleteResume } from "../../../service/api/resumeService"
import { AVAILABLE_POSITIONS } from '../../../constants/positions'

export const ResumeContent: React.FC = () => {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // --- State для модального окна создания ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newResumePosition, setNewResumePosition] = useState(AVAILABLE_POSITIONS[0])

  // Текущее редактируемое резюме
  const activeResume = resumes.find(r => r.id === selectedResumeId)

  // Состояние редактирования
  const [isEditing, setIsEditing] = useState(false)
  const [localResume, setLocalResume] = useState<Resume | null>(null)
  const [newSkill, setNewSkill] = useState('')

  // Загрузка списка резюме
  useEffect(() => {
    loadResumes()
  }, [])

  // При смене активного резюме обновляем локальный стейт
  useEffect(() => {
    if (activeResume) {
      setLocalResume(activeResume)
    }
  }, [activeResume])

  const loadResumes = async () => {
    setIsLoading(true)
    try {
      const data = await fetchMyResumes()
      setResumes(data)
      if (data.length > 0 && !selectedResumeId) {
        setSelectedResumeId(data[0].id)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  // Открытие модального окна
  const openCreateModal = () => {
    // Сбрасываем выбор на первый элемент или на дефолт
    setNewResumePosition(AVAILABLE_POSITIONS[0])
    setIsCreateModalOpen(true)
  }

  // Закрытие модального окна
  const closeCreateModal = () => {
    setIsCreateModalOpen(false)
  }

  // Создание резюме через модальное окно
  const handleSubmitCreateResume = async () => {
    try {
      // 1. Проверка на дубликат позиции
      // Мы проверяем поле position (или title, так как они совпадают)
      const duplicate = resumes.find(r => r.position === newResumePosition)

      if (duplicate) {
        alert(`Резюме для позиции "${newResumePosition}" уже существует! Выберите другую позицию или отредактируйте существующее.`)
        return
      }

      // 2. Создаем резюме
      // Используем выбранную позицию и как title, и как position
      const newResume = await createResume(newResumePosition, newResumePosition)

      setResumes([...resumes, newResume])
      setSelectedResumeId(newResume.id)
      setIsEditing(true)
      closeCreateModal()
    } catch (e) {
      alert("Ошибка при создании резюме")
      console.error(e)
    }
  }

  const handleDeleteResume = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить это резюме?")) return
    try {
      await deleteResume(id)
      const newResumes = resumes.filter(r => r.id !== id)
      setResumes(newResumes)
      if (newResumes.length > 0) setSelectedResumeId(newResumes[0].id)
      else setSelectedResumeId(null)
    } catch (e) {
      console.log(`Ошибка удаления: ${e}`)
    }
  }

  const handleSave = async () => {
    if (!localResume || !selectedResumeId) return
    try {
      const updated = await updateResume(selectedResumeId, localResume)
      setResumes(resumes.map(r => r.id === selectedResumeId ? updated : r))
      setIsEditing(false)
    } catch (e) {
      console.error(e)
      alert("Ошибка сохранения")
    }
  }

  const handleFieldChange = (field: keyof Resume, value) => {
    if (!localResume) return
    setLocalResume({ ...localResume, [field]: value })
  }

  // --- Handlers for Experience (Массив) ---
  const handleAddExperience = () => {
    if (!localResume) return
    const newExp = { title: '', company: '', period: '', description: '' }
    setLocalResume({ ...localResume, experience: [...localResume.experience, newExp] })
  }

  const handleExpChange = (index: number, field: string, val: string) => {
    if (!localResume) return
    const newExp = [...localResume.experience]
    newExp[index] = { ...newExp[index], [field]: val }
    setLocalResume({ ...localResume, experience: newExp })
  }

  const handleRemoveExperience = (index: number) => {
    if (!localResume) return
    const newExp = localResume.experience.filter((_, i) => i !== index)
    setLocalResume({ ...localResume, experience: newExp })
  }

  // --- Handlers for Skills ---
  const handleAddSkill = () => {
    if (!localResume || !newSkill.trim()) return
    setLocalResume({ ...localResume, skills: [...localResume.skills, newSkill.trim()] })
    setNewSkill('')
  }
  const handleRemoveSkill = (idx: number) => {
    if (!localResume) return
    setLocalResume({ ...localResume, skills: localResume.skills.filter((_, i) => i !== idx) })
  }

  if (isLoading) return <div>Загрузка...</div>

  return (
    <div className={styles["resumeContent"]}>
      {/* --- Tabs / Switcher --- */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {resumes.map(r => (
          <button
            key={r.id}
            onClick={() => { setSelectedResumeId(r.id); setIsEditing(false) }}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: r.id === selectedResumeId ? '2px solid #082060' : '1px solid #ccc',
              background: r.id === selectedResumeId ? '#E9F0FF' : 'white',
              cursor: 'pointer'
            }}
          >
            {r.title}
          </button>
        ))}
        <button
          onClick={openCreateModal}
          style={{ padding: '8px 16px', borderRadius: '8px', border: '1px dashed #082060', background: 'transparent', cursor: 'pointer' }}
        >
          + Новое резюме
        </button>
      </div>

      {!localResume ? (
        <div>Нет резюме. Создайте новое.</div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h2 className={styles["resumeTitle"]}>
              {/* Показываем позицию как заголовок */}
              {localResume.position}
            </h2>
            {isEditing && (
              <button onClick={() => handleDeleteResume(localResume.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>
                Удалить резюме
              </button>
            )}
          </div>

          {/* --- Опыт работы --- */}
          <div className={styles["sectionCard"]}>
            <div className={styles["section"]}>
              <h3 className={styles["sectionTitle"]}>Опыт работы</h3>
              {localResume.experience.map((exp, idx) => (
                <div key={idx} className={styles["experienceItem"]}>
                  {isEditing ? (
                    <div className={styles["editableItem"]}>
                      <input placeholder="Период" value={exp.period} onChange={e => handleExpChange(idx, 'period', e.target.value)} className={styles["editableInput"]} style={{ marginBottom: 5 }}/>
                      <input placeholder="Компания" value={exp.company} onChange={e => handleExpChange(idx, 'company', e.target.value)} className={styles["editableInput"]} style={{ marginBottom: 5 }}/>
                      <input placeholder="Должность" value={exp.title} onChange={e => handleExpChange(idx, 'title', e.target.value)} className={styles["editableInput"]} style={{ marginBottom: 5 }}/>
                      <textarea placeholder="Описание" value={exp.description} onChange={e => handleExpChange(idx, 'description', e.target.value)} className={styles["editableTextarea"]} />
                      <button onClick={() => handleRemoveExperience(idx)} className={styles["deleteButton"]}>Удалить</button>
                    </div>
                  ) : (
                    <div className={styles["experienceGrid"]}>
                      <div className={styles["period"]}>{exp.period}</div>
                      <div className={styles["experienceDetails"]}>
                        <div style={{ fontWeight: 'bold' }}>{exp.company}</div>
                        <div>{exp.title}</div>
                        <div style={{ fontSize: '0.9em', color: '#666' }}>{exp.description}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {isEditing && (
                <Button variant="secondary" onClick={handleAddExperience} className={styles["addButton"]}>
                  + Добавить место работы
                </Button>
              )}
            </div>
          </div>

          {/* --- Навыки --- */}
          <div className={styles["sectionCard"]}>
            <div className={styles["section"]}>
              <h3 className={styles["sectionTitle"]}>Навыки</h3>
              <div className={styles["skillsContainer"]}>
                {localResume.skills.map((skill, idx) => (
                  <div key={idx} className={styles["skillTag"]}>
                    {skill}
                    {isEditing && <span onClick={() => handleRemoveSkill(idx)} style={{ cursor:'pointer', marginLeft: 5 }}>×</span>}
                  </div>
                ))}
              </div>
              {isEditing && (
                <div style={{ marginTop: 10, display: 'flex', gap: 5 }}>
                  <input
                    value={newSkill}
                    onChange={e => setNewSkill(e.target.value)}
                    className={styles["input"]}
                    placeholder="Новый навык"
                    onKeyDown={e => e.key === 'Enter' && handleAddSkill()}
                  />
                  <button onClick={handleAddSkill} className={styles["addSkillButton"]} style={{ width: 40, fontSize: 20 }}>+</button>
                </div>
              )}
            </div>
          </div>

          {/* --- О себе --- */}
          <div className={styles["sectionCard"]}>
            <div className={styles["section"]}>
              <h3 className={styles["sectionTitle"]}>О себе</h3>
              {isEditing ? (
                <textarea
                  className={styles["textarea"]}
                  value={localResume.about || ''}
                  onChange={e => handleFieldChange('about', e.target.value)}
                />
              ) : (
                <div className={styles["value"]}>{localResume.about}</div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className={styles["actions"]}>
            {isEditing ? (
              <>
                <Button variant="primary" onClick={handleSave}>Сохранить</Button>
                <Button variant="secondary" onClick={() => { setIsEditing(false); setLocalResume(activeResume || null) }} className={styles["cancelButton"]}>Отмена</Button>
              </>
            ) : (
              <Button variant="primary" onClick={() => setIsEditing(true)} styleProps={{ textColor: '#fffcf5' }}>
                РЕДАКТИРОВАТЬ
              </Button>
            )}
          </div>
        </>
      )}

      {/* --- МОДАЛЬНОЕ ОКНО СОЗДАНИЯ РЕЗЮМЕ --- */}
      {isCreateModalOpen && (
        <div className={styles["modalOverlay"]} onClick={closeCreateModal}>
          <div className={styles["modalContent"]} onClick={e => e.stopPropagation()}>
            <h3 className={styles["modalTitle"]}>Новое резюме</h3>

            {/* Поле для ввода названия убрано */}

            <div>
              <label className={styles["modalLabel"]}>Выберите позицию</label>
              <select
                className={styles["modalSelect"]}
                value={newResumePosition}
                onChange={e => setNewResumePosition(e.target.value)}
              >
                {AVAILABLE_POSITIONS.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>

            <div className={styles["modalActions"]}>
              <button
                className={styles["modalButtonSecondary"]}
                onClick={closeCreateModal}
              >
                Отмена
              </button>
              <button
                className={styles["modalButtonPrimary"]}
                onClick={handleSubmitCreateResume}
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}