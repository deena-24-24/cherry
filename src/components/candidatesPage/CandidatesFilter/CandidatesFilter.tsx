import React, { useState } from 'react'
import * as styles from './CandidatesFilter.module.css'
import { AVAILABLE_POSITIONS } from '../../../constants/positions'

export interface FilterState {
  position: string;
  city: string;
  experience: string;
  skills: string[];
  sortBy: 'rating' | 'experience';
}

interface CandidatesFilterProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableSkills: string[];
}

export const CandidatesFilter: React.FC<CandidatesFilterProps> = ({
  filters,
  onFiltersChange,
  availableSkills,
}) => {
  const [newSkill, setNewSkill] = useState('')

  const handleFilterChange = (field: keyof FilterState, value: string | string[]) => {
    onFiltersChange({ ...filters, [field]: value })
  }

  const handleAddSkill = () => {
    if (newSkill.trim() && !filters.skills.includes(newSkill.trim())) {
      handleFilterChange('skills', [...filters.skills, newSkill.trim()])
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (skill: string) => {
    handleFilterChange('skills', filters.skills.filter(s => s !== skill))
  }

  return (
    <div className={styles["filter"]}>
      <div className={styles["filterTitle"]}>ФИЛЬТРАЦИЯ</div>

      {/* Фильтр по Вакансии/Позиции - SELECT */}
      <div className={styles["filterGroup"]}>
        <label className={styles["filterLabel"]}>Вакансия / Позиция</label>
        <select
          value={filters.position}
          onChange={(e) => handleFilterChange('position', e.target.value)}
          className={styles["filterSelect"]} // Используем новый класс
        >
          <option value="">Все позиции</option>
          {AVAILABLE_POSITIONS.map(pos => (
            <option key={pos} value={pos}>{pos}</option>
          ))}
        </select>
      </div>

      <div className={styles["filterGroup"]}>
        <label className={styles["filterLabel"]}>Город</label>
        <input
          type="text"
          value={filters.city}
          onChange={(e) => handleFilterChange('city', e.target.value)}
          className={styles["filterInput"]}
          placeholder="Любой город"
        />
      </div>

      <div className={styles["filterGroup"]}>
        <label className={styles["filterLabel"]}>Стаж (лет)</label>
        <input
          type="number" // Лучше number
          min="0"
          value={filters.experience}
          onChange={(e) => handleFilterChange('experience', e.target.value)}
          className={styles["filterInput"]}
          placeholder="От"
        />
      </div>

      <div className={styles["filterGroup"]}>
        <label className={styles["filterLabel"]}>Навыки</label>
        <div className={styles["skillsInputContainer"]}>
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
            className={styles["filterInput"]}
            placeholder="Добавить"
          />
          <button type="button" onClick={handleAddSkill} className={styles["addSkillButton"]}>+</button>
        </div>
        {filters.skills.length > 0 && (
          <div className={styles["skillsList"]}>
            {filters.skills.map((skill, index) => (
              <div key={index} className={styles["skillChip"]}>
                {skill}
                <button type="button" onClick={() => handleRemoveSkill(skill)} className={styles["removeSkillButton"]}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles["sortSection"]}>
        <div className={styles["sortTitle"]}>Сортировать</div>
        <label className={styles["radioLabel"]}>
          <input
            type="radio"
            name="sortBy"
            value="experience"
            checked={filters.sortBy === 'experience'}
            onChange={() => handleFilterChange('sortBy', 'experience')}
            className={styles["radioInput"]}
          />
          <span>По стажу работы</span>
        </label>
        <label className={styles["radioLabel"]}>
          <input
            type="radio"
            name="sortBy"
            value="rating"
            checked={filters.sortBy === 'rating'}
            onChange={() => handleFilterChange('sortBy', 'rating')}
            className={styles["radioInput"]}
          />
          <span>По рейтингу</span>
        </label>
      </div>
    </div>
  )
}