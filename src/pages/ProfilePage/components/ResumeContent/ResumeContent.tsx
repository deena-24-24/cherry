import React, { useState, useEffect } from "react"
import { useResumeStore } from "../../../../store/useResumeStore"
import { useAuthStore } from "../../../../store"
import { Button } from "../../../../components/ui/Button/Button"
import { fetchCandidate, updateCandidate, CandidateData } from "../../../../service/candidate/candidateService"
import * as styles from "./ResumeContent.module.css"

interface ResumeContentProps {
  key?: string;
}

export const ResumeContent: React.FC<ResumeContentProps> = () => {
  const { user } = useAuthStore()
  const { resume, setResume, addExperience, addEducation } = useResumeStore()
  const [isEditing, setIsEditing] = useState(false)
  const [localResume, setLocalResume] = useState(resume)
  const [skills, setSkills] = useState<string[]>(['React', 'Node.js'])
  const [showExperienceModal, setShowExperienceModal] = useState(false)
  const [showEducationModal, setShowEducationModal] = useState(false)
  const [resumeFileName, setResumeFileName] = useState<string>('')
  const [resumeFileData, setResumeFileData] = useState<string>('') // base64 или URL
  
  // Форма для опыта работы
  const [experienceForm, setExperienceForm] = useState({
    periodStart: '',
    periodEnd: '',
    company: '',
    title: ''
  })
  
  // Форма для образования
  const [educationForm, setEducationForm] = useState({
    year: '',
    institution: '',
    degree: ''
  })

  // Функция загрузки данных кандидата
  const loadCandidateData = async () => {
    if (!user) return
    
    try {
      // Загружаем все данные кандидата из единого API
      const candidateData = await fetchCandidate()
      
      // Преобразуем данные кандидата в формат резюме
      const resumeData = {
        firstName: candidateData.firstName || '',
        lastName: candidateData.lastName || '',
        fullName: (candidateData.firstName || candidateData.lastName)
          ? `${candidateData.firstName || ''} ${candidateData.lastName || ''}`.trim()
          : candidateData.email || '',
        email: candidateData.email || '',
        phone: candidateData.phone || '',
        jobTitle: candidateData.country || '', // Место жительства берется из country профиля
        photoUrl: candidateData.avatar || '',
        experience: candidateData.experience || [],
        education: candidateData.education || [],
        about: candidateData.about || '', // Информация "О себе"
      }
      
      setResume(resumeData)
      setLocalResume(resumeData)
      
      // Загружаем навыки
      if (candidateData.skills && candidateData.skills.length > 0) {
        setSkills(candidateData.skills)
      } else {
        setSkills([])
      }
      
      // Загружаем файл резюме - всегда проверяем наличие файла в бэкенде
      const fileName = candidateData.resumeFileName || ''
      const fileData = candidateData.resumeFileData || ''
      
      console.log('🔍 Проверка файла при загрузке:', {
        fileName: fileName || 'НЕТ',
        hasData: !!fileData,
        dataLength: fileData?.length || 0,
        candidateDataKeys: Object.keys(candidateData)
      })
      
      // Устанавливаем файл, даже если он пустой (для сброса состояния)
      setResumeFileName(fileName)
      setResumeFileData(fileData)
      
      if (fileName) {
        console.log('✅ Файл резюме найден в бэкенде и загружен:', fileName, 'размер данных:', fileData.length)
      } else {
        console.log('ℹ️ Файл резюме не найден в бэкенде')
      }
    } catch (error) {
      console.error('Ошибка загрузки данных кандидата:', error)
      // Используем данные из профиля как fallback
      const name = user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user.email || ''
      
      const fallbackResume = {
        ...resume,
        fullName: name,
        email: user.email || '',
        phone: user.phone || '',
        jobTitle: user.country || '', // Место жительства берется из country профиля
        photoUrl: user.avatar || '',
      }
      setResume(fallbackResume)
      setLocalResume(fallbackResume)
    }
  }

  // Загружаем данные при монтировании компонента (при переключении на раздел резюме)
  useEffect(() => {
    loadCandidateData().then()
  }, [])

  // Загружаем данные при изменении пользователя
  useEffect(() => {
    loadCandidateData().then()
  }, [user?._id, user?.email, user?.country])

  // Синхронизируем локальное состояние с store
  useEffect(() => {
    setLocalResume(resume)
  }, [resume])

  const handleFieldChange = (field: keyof typeof localResume, value: string) => {
    setLocalResume(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleExperienceChange = (index: number, field: keyof typeof localResume.experience[0], value: string) => {
    setLocalResume(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }))
  }

  const handleEducationChange = (index: number, field: keyof typeof localResume.education[0], value: string) => {
    setLocalResume(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }))
  }

  const handleRemoveExperience = (index: number) => {
    setLocalResume(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }))
  }

  const handleRemoveEducation = (index: number) => {
    setLocalResume(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }))
  }

  const handleRemoveSkill = (index: number) => {
    setSkills(prev => prev.filter((_, i) => i !== index))
  }

  const handleAddSkill = () => {
    const newSkill = prompt('Введите название навыка:')
    if (newSkill && newSkill.trim()) {
      setSkills(prev => [...prev, newSkill.trim()])
    }
  }

  const handleOpenExperienceModal = () => {
    setExperienceForm({ periodStart: '', periodEnd: '', company: '', title: '' })
    setShowExperienceModal(true)
  }

  const handleCloseExperienceModal = () => {
    setShowExperienceModal(false)
    setExperienceForm({ periodStart: '', periodEnd: '', company: '', title: '' })
  }

  const handleSubmitExperience = () => {
    const period = experienceForm.periodStart && experienceForm.periodEnd
      ? `${experienceForm.periodStart} - ${experienceForm.periodEnd}`
      : experienceForm.periodStart || experienceForm.periodEnd
    
    setLocalResume(prev => ({
      ...prev,
      experience: [...prev.experience, {
        period: period || '',
        company: experienceForm.company,
        title: experienceForm.title,
        description: ''
      }]
    }))
    handleCloseExperienceModal()
  }

  const handleOpenEducationModal = () => {
    setEducationForm({ year: '', institution: '', degree: '' })
    setShowEducationModal(true)
  }

  const handleCloseEducationModal = () => {
    setShowEducationModal(false)
    setEducationForm({ year: '', institution: '', degree: '' })
  }

  const handleSubmitEducation = () => {
    setLocalResume(prev => ({
      ...prev,
      education: [...prev.education, {
        year: educationForm.year,
        institution: educationForm.institution,
        degree: educationForm.degree
      }]
    }))
    handleCloseEducationModal()
  }

  const handleSave = async () => {
    try {
      // Подготавливаем данные для сохранения в единое хранилище кандидата
      const candidateData: Partial<CandidateData> = {
        // Базовые данные профиля (если изменены в резюме)
        firstName: localResume.firstName || '',
        lastName: localResume.lastName || '',
        email: localResume.email,
        phone: localResume.phone,
        country: localResume.jobTitle || '', // Место жительства из резюме обновляет country в профиле
        // Данные резюме - всегда отправляем, чтобы обновить существующие данные
        experience: localResume.experience || [],
        education: localResume.education || [],
        skills: skills || [],
        about: localResume.about || '',
        // Всегда отправляем файл, даже если он пустой (для удаления)
        resumeFileName: resumeFileName ? String(resumeFileName) : '',
        resumeFileData: resumeFileData ? String(resumeFileData) : '',
      }
      
      console.log('💾 Сохранение файла резюме:', {
        fileName: resumeFileName || 'НЕТ',
        hasData: !!resumeFileData,
        dataLength: resumeFileData?.length || 0,
        resumeFileNameType: typeof resumeFileName,
        resumeFileDataType: typeof resumeFileData,
        candidateDataKeys: Object.keys(candidateData),
        willSendFileName: candidateData.resumeFileName || 'НЕТ',
        willSendFileData: candidateData.resumeFileData ? `данные (${candidateData.resumeFileData.length} символов)` : 'НЕТ'
      })
      
      // Проверяем, что файл включен в данные перед отправкой
      console.log('📤 Отправка данных на сервер, проверка файла:', {
        resumeFileName: candidateData.resumeFileName || 'НЕТ',
        resumeFileData: candidateData.resumeFileData ? `данные (${candidateData.resumeFileData.length} символов)` : 'НЕТ',
        allKeys: Object.keys(candidateData)
      })
      
      // Сохраняем все данные в единое хранилище
      const savedCandidate = await updateCandidate(candidateData)
      
      console.log('📥 Получен ответ от сервера, проверка файла:', {
        resumeFileName: savedCandidate.resumeFileName || 'НЕТ',
        resumeFileData: savedCandidate.resumeFileData ? `данные (${savedCandidate.resumeFileData.length} символов)` : 'НЕТ'
      })
      
      // Преобразуем данные кандидата в формат резюме
      const mergedResume = {
        firstName: savedCandidate.firstName || '',
        lastName: savedCandidate.lastName || '',
        fullName: (savedCandidate.firstName || savedCandidate.lastName)
          ? `${savedCandidate.firstName || ''} ${savedCandidate.lastName || ''}`.trim()
          : savedCandidate.email || '',
        email: savedCandidate.email || '',
        phone: savedCandidate.phone || '',
        jobTitle: savedCandidate.country || '', // Место жительства берется из country профиля
        photoUrl: savedCandidate.avatar || '',
        experience: savedCandidate.experience || [],
        education: savedCandidate.education || [],
        about: savedCandidate.about || '', // Информация "О себе"
      }
      
      // Обновляем store
      setResume(mergedResume)
      setLocalResume(mergedResume)
      
      // Обновляем навыки
      if (savedCandidate.skills) {
        setSkills(savedCandidate.skills)
      }
      
      // Обновляем файл резюме - всегда обновляем состояние
      const savedFileName = savedCandidate.resumeFileName || ''
      const savedFileData = savedCandidate.resumeFileData || ''
      
      setResumeFileName(savedFileName)
      setResumeFileData(savedFileData)
      
      console.log('✅ Файл обновлен после сохранения:', {
        fileName: savedFileName || 'НЕТ',
        hasData: !!savedFileData,
        dataLength: savedFileData?.length || 0,
        savedCandidateKeys: Object.keys(savedCandidate)
      })
      
      setIsEditing(false)
    } catch (error) {
      console.error('Ошибка сохранения данных кандидата:', error)
      // В случае ошибки все равно обновляем локальное состояние
      setResume(localResume)
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setLocalResume(resume)
    setIsEditing(false)
    // Восстанавливаем имя файла из сохраненных данных
    if (resume) {
      // Файл восстанавливается при перезагрузке данных
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      try {
        // Читаем файл как base64
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64String = reader.result as string
          setResumeFileData(base64String)
          setResumeFileName(file.name)
          console.log('✅ Файл загружен в состояние:', {
            fileName: file.name,
            fileSize: file.size,
            dataLength: base64String.length,
            dataPreview: base64String.substring(0, 50) + '...'
          })
        }
        reader.onerror = (error) => {
          console.error('❌ Ошибка чтения файла:', error)
        }
        reader.readAsDataURL(file)
      } catch (error) {
        console.error('❌ Ошибка обработки файла:', error)
      }
    } else {
      alert('Пожалуйста, выберите файл в формате PDF')
    }
  }

  const handleRemoveFile = () => {
    setResumeFileName('')
    setResumeFileData('')
    // Сбрасываем input
    const fileInput = document.getElementById('resume-file-input') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  return (
    <div className={styles["resumeContent"]}>
      {/* Верхняя часть: личная информация */}
      <div className={styles["infoCard"]}>
        <div className={styles["topSection"]}>
          <div className={styles["infoRow"]}>
            <label className={styles["label"]}>ИМЯ</label>
            {isEditing ? (
              <input
                type="text"
                value={localResume.firstName || ''}
                onChange={(e) => handleFieldChange('firstName', e.target.value)}
                className={styles["input"]}
              />
            ) : (
              <div className={styles["value"]}>{localResume.firstName || 'Не указано'}</div>
            )}
          </div>

          <div className={styles["infoRow"]}>
            <label className={styles["label"]}>ФАМИЛИЯ</label>
            {isEditing ? (
              <input
                type="text"
                value={localResume.lastName || ''}
                onChange={(e) => handleFieldChange('lastName', e.target.value)}
                className={styles["input"]}
              />
            ) : (
              <div className={styles["value"]}>{localResume.lastName || 'Не указано'}</div>
            )}
          </div>

          <div className={styles["infoRow"]}>
            <label className={styles["label"]}>ЭЛЕКТРОННАЯ ПОЧТА</label>
            {isEditing ? (
              <input
                type="email"
                value={localResume.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                className={styles["input"]}
                style={{ textTransform: 'none' }}
              />
            ) : (
              <div className={styles["value"]} style={{ textTransform: 'none' }}>{localResume.email || 'Не указано'}</div>
            )}
          </div>

          <div className={styles["infoRow"]}>
            <label className={styles["label"]}>Телефон (необязательно)</label>
            {isEditing ? (
              <input
                type="tel"
                value={localResume.phone}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                className={styles["input"]}
              />
            ) : (
              <div className={styles["value"]}>{localResume.phone || 'Не указано'}</div>
            )}
          </div>

          <div className={styles["infoRow"]}>
            <label className={styles["label"]}>Место жительства</label>
            {isEditing ? (
              <input
                type="text"
                value={localResume.jobTitle || ''}
                onChange={(e) => handleFieldChange('jobTitle', e.target.value)}
                className={styles["input"]}
                placeholder="Город"
              />
            ) : (
              <div className={styles["value"]}>{localResume.jobTitle || 'Не указано'}</div>
            )}
          </div>
        </div>
      </div>

      {/* Опыт работы */}
      <div className={styles["sectionCard"]}>
        <div className={styles["section"]}>
          <h3 className={styles["sectionTitle"]}>ОПЫТ РАБОТЫ</h3>
          {localResume.experience.map((exp, index) => (
            <div key={index} className={styles["experienceItem"]}>
              {isEditing ? (
                <div className={styles["editableItem"]}>
                  <div className={styles["editableItemHeader"]}>
                    <span className={styles["itemNumber"]}>{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveExperience(index)}
                      className={styles["deleteButton"]}
                      title="Удалить"
                    >
                      ×
                    </button>
                  </div>
                  <div className={styles["editableItemContent"]}>
                    <div className={styles["editableField"]}>
                      <label className={styles["editableLabel"]}>Период работы</label>
                      <input
                        type="text"
                        value={exp.period}
                        onChange={(e) => handleExperienceChange(index, 'period', e.target.value)}
                        className={styles["editableInput"]}
                        placeholder="Например: 2020 - 2023"
                      />
                    </div>
                    <div className={styles["editableField"]}>
                      <label className={styles["editableLabel"]}>Компания</label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => handleExperienceChange(index, 'company', e.target.value)}
                        className={styles["editableInput"]}
                        placeholder="Название компании"
                      />
                    </div>
                    <div className={styles["editableField"]}>
                      <label className={styles["editableLabel"]}>Должность</label>
                      <input
                        type="text"
                        value={exp.title}
                        onChange={(e) => handleExperienceChange(index, 'title', e.target.value)}
                        className={styles["editableInput"]}
                        placeholder="Название должности"
                      />
                    </div>
                    {exp.description && (
                      <div className={styles["editableField"]}>
                        <label className={styles["editableLabel"]}>Описание</label>
                        <textarea
                          value={exp.description}
                          onChange={(e) => handleExperienceChange(index, 'description', e.target.value)}
                          className={styles["editableTextarea"]}
                          placeholder="Описание обязанностей и достижений"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className={styles["experienceGrid"]}>
                  <div className={styles["period"]}>{exp.period}</div>
                  <div className={styles["experienceDetails"]}>
                    <div className={styles["value"]}>{exp.company}</div>
                    <div className={styles["value"]}>{exp.title}</div>
                    {exp.description && (
                      <div className={styles["description"]}>{exp.description}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {isEditing && (
            <Button
              variant="secondary"
              onClick={handleOpenExperienceModal}
              className={styles["addButton"]}
            >
              + Добавить опыт работы
            </Button>
          )}
        </div>
      </div>

      {/* Навыки */}
      <div className={styles["sectionCard"]}>
        <div className={styles["section"]}>
          <h3 className={styles["sectionTitle"]}>Навыки</h3>
          <div className={styles["skillsContainer"]}>
            {skills.map((skill, index) => (
              <div key={index} className={styles["skillTag"]}>
                <span>{skill}</span>
                {isEditing && (
                  <span
                    onClick={() => handleRemoveSkill(index)}
                    className={styles["skillRemove"]}
                  >
                    ×
                  </span>
                )}
              </div>
            ))}
            {isEditing && (
              <button
                type="button"
                onClick={handleAddSkill}
                className={styles["addSkillButton"]}
              >
                +
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Образование */}
      <div className={styles["sectionCard"]}>
        <div className={styles["section"]}>
          <h3 className={styles["sectionTitle"]}>Образование</h3>
          {localResume.education.map((edu, index) => (
            <div key={index} className={styles["educationItem"]}>
              {isEditing ? (
                <div className={styles["editableItem"]}>
                  <div className={styles["editableItemHeader"]}>
                    <span className={styles["itemNumber"]}>{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEducation(index)}
                      className={styles["deleteButton"]}
                      title="Удалить"
                    >
                      ×
                    </button>
                  </div>
                  <div className={styles["editableItemContent"]}>
                    <div className={styles["editableField"]}>
                      <label className={styles["editableLabel"]}>Год окончания</label>
                      <input
                        type="text"
                        value={edu.year}
                        onChange={(e) => handleEducationChange(index, 'year', e.target.value)}
                        className={styles["editableInput"]}
                        placeholder="Например: 2020"
                      />
                    </div>
                    <div className={styles["editableField"]}>
                      <label className={styles["editableLabel"]}>Учебное заведение</label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => handleEducationChange(index, 'institution', e.target.value)}
                        className={styles["editableInput"]}
                        placeholder="Название учебного заведения"
                      />
                    </div>
                    <div className={styles["editableField"]}>
                      <label className={styles["editableLabel"]}>Специальность</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                        className={styles["editableInput"]}
                        placeholder="Специальность или направление"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles["educationGrid"]}>
                  <div className={styles["year"]}>{edu.year}</div>
                  <div className={styles["educationDetails"]}>
                    <div className={styles["value"]}>{edu.institution}</div>
                    <div className={styles["value"]}>{edu.degree}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {isEditing && (
            <Button
              variant="secondary"
              onClick={handleOpenEducationModal}
              className={styles["addButton"]}
            >
              + Добавить образование
            </Button>
          )}
        </div>
      </div>

      {/* О себе */}
      <div className={styles["sectionCard"]}>
        <div className={styles["section"]}>
          <h3 className={styles["sectionTitle"]}>О себе</h3>
          {isEditing ? (
            <textarea
              value={localResume.about || ''}
              onChange={(e) => handleFieldChange('about', e.target.value)}
              className={styles["textarea"]}
              placeholder="Расскажите о себе"
            />
          ) : (
            <div className={styles["value"]} style={{ whiteSpace: 'pre-wrap' }}>{localResume.about || 'Не указано'}</div>
          )}
        </div>
      </div>

      {/* Файл резюме */}
      <div className={styles["sectionCard"]}>
        <div className={styles["section"]}>
          <h3 className={styles["sectionTitle"]}>ПРИКРЕПИТЬ РЕЗЮМЕ</h3>
          <div className={styles["fileSection"]}>
            {isEditing ? (
              <>
                {resumeFileName ? (
                  <div className={styles["fileDisplayEditable"]}>
                    <div className={styles["fileIcon"]}>📄</div>
                    <div className={styles["fileName"]}>{resumeFileName}</div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className={styles["fileRemoveButton"]}
                      title="Удалить файл"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className={styles["fileUpload"]}>
                    <input 
                      type="file" 
                      accept=".pdf" 
                      className={styles["fileInput"]}
                      onChange={handleFileChange}
                      id="resume-file-input"
                    />
                    <label htmlFor="resume-file-input" className={styles["fileLabel"]}>
                      Выберите файл PDF
                    </label>
                  </div>
                )}
              </>
            ) : (
              <>
                {resumeFileName ? (
                  <div className={styles["fileDisplay"]}>
                    <div className={styles["fileIcon"]}>📄</div>
                    <div className={styles["fileName"]}>{resumeFileName}</div>
                  </div>
                ) : (
                  <div className={styles["filePlaceholder"]}>
                    Файл не загружен
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Кнопки сохранения/отмены или редактирования */}
      {isEditing ? (
        <div className={styles["actions"]}>
          <Button
            variant="primary"
            onClick={handleSave}
            className={styles["saveButton"]}
          >
            Сохранить
          </Button>
          <Button
            variant="secondary"
            onClick={handleCancel}
            className={styles["cancelButton"]}
          >
            Отмена
          </Button>
        </div>
      ) : (
        <div className={styles["editButtonContainer"]}>
          <Button
            variant="primary"
            onClick={() => setIsEditing(true)}
            className={styles["editButton"]}
          >
            РЕДАКТИРОВАТЬ
          </Button>
        </div>
      )}

      {/* Модальное окно для добавления опыта работы */}
      {showExperienceModal && (
        <div className={styles["modalOverlay"]} onClick={handleCloseExperienceModal}>
          <div className={styles["modalContent"]} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles["modalTitle"]}>РАССКАЖИТЕ О ВАШЕМ ОПЫТЕ РАБОТЫ</h3>
            <div className={styles["modalForm"]}>
              <div className={styles["formGroup"]}>
                <label className={styles["formLabel"]}>ПЕРИОД</label>
                <div className={styles["periodInputs"]}>
                  <input
                    type="text"
                    value={experienceForm.periodStart}
                    onChange={(e) => setExperienceForm(prev => ({ ...prev, periodStart: e.target.value }))}
                    className={styles["modalInput"]}
                    placeholder="Начало"
                  />
                  <input
                    type="text"
                    value={experienceForm.periodEnd}
                    onChange={(e) => setExperienceForm(prev => ({ ...prev, periodEnd: e.target.value }))}
                    className={styles["modalInput"]}
                    placeholder="Конец"
                  />
                </div>
              </div>
              <div className={styles["formGroup"]}>
                <label className={styles["formLabel"]}>КОМПАНИЯ</label>
                <input
                  type="text"
                  value={experienceForm.company}
                  onChange={(e) => setExperienceForm(prev => ({ ...prev, company: e.target.value }))}
                  className={styles["modalInput"]}
                  placeholder="Название компании"
                />
              </div>
              <div className={styles["formGroup"]}>
                <label className={styles["formLabel"]}>ДОЛЖНОСТЬ</label>
                <input
                  type="text"
                  value={experienceForm.title}
                  onChange={(e) => setExperienceForm(prev => ({ ...prev, title: e.target.value }))}
                  className={styles["modalInput"]}
                  placeholder="Название должности"
                />
              </div>
              <Button
                variant="primary"
                onClick={handleSubmitExperience}
                className={styles["modalSubmitButton"]}
              >
                ДОБАВИТЬ
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для добавления образования */}
      {showEducationModal && (
        <div className={styles["modalOverlay"]} onClick={handleCloseEducationModal}>
          <div className={styles["modalContent"]} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles["modalTitle"]}>РАССКАЖИТЕ О ВАШЕМ ОБРАЗОВАНИИ</h3>
            <div className={styles["modalForm"]}>
              <div className={styles["formGroup"]}>
                <label className={styles["formLabel"]}>ГОД ОКОНЧАНИЯ</label>
                <input
                  type="text"
                  value={educationForm.year}
                  onChange={(e) => setEducationForm(prev => ({ ...prev, year: e.target.value }))}
                  className={styles["modalInput"]}
                  placeholder="Год"
                />
              </div>
              <div className={styles["formGroup"]}>
                <label className={styles["formLabel"]}>УЧЕБНОЕ ЗАВЕДЕНИЕ</label>
                <input
                  type="text"
                  value={educationForm.institution}
                  onChange={(e) => setEducationForm(prev => ({ ...prev, institution: e.target.value }))}
                  className={styles["modalInput"]}
                  placeholder="Название учебного заведения"
                />
              </div>
              <div className={styles["formGroup"]}>
                <label className={styles["formLabel"]}>СПЕЦИАЛЬНОСТЬ</label>
                <input
                  type="text"
                  value={educationForm.degree}
                  onChange={(e) => setEducationForm(prev => ({ ...prev, degree: e.target.value }))}
                  className={styles["modalInput"]}
                  placeholder="Специальность"
                />
              </div>
              <Button
                variant="primary"
                onClick={handleSubmitEducation}
                className={styles["modalSubmitButton"]}
              >
                ДОБАВИТЬ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

