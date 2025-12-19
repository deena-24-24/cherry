import React, { useState } from 'react'
import * as styles from './CandidatesFilter.module.css'

export interface FilterState {
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
    onFiltersChange({
      ...filters,
      [field]: value,
    })
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
      
      <div className={styles["filterGroup"]}>
        <label className={styles["filterLabel"]}>Город?</label>
        <input
          type="text"
          value={filters.city}
          onChange={(e) => handleFilterChange('city', e.target.value)}
          className={styles["filterInput"]}
          placeholder="Введите город"
        />
      </div>

      <div className={styles["filterGroup"]}>
        <label className={styles["filterLabel"]}>Стаж</label>
        <input
          type="text"
          value={filters.experience}
          onChange={(e) => handleFilterChange('experience', e.target.value)}
          className={styles["filterInput"]}
          placeholder="Введите стаж"
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
            placeholder="Добавить навык"
          />
          <button
            type="button"
            onClick={handleAddSkill}
            className={styles["addSkillButton"]}
          >
            +
          </button>
        </div>
        {filters.skills.length > 0 && (
          <div className={styles["skillsList"]}>
            {filters.skills.map((skill, index) => (
              <div key={index} className={styles["skillChip"]}>
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className={styles["removeSkillButton"]}
                >
                  ×
                </button>
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
          <span>По рейтингу собеседований</span>
        </label>
      </div>
    </div>
  )
}

