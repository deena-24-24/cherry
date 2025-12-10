import React from 'react'
import { CandidateData } from '../../../../service/candidate/candidateService'
import * as styles from './ResumeModal.module.css'

interface ResumeModalProps {
  candidate: CandidateData | null;
  onClose: () => void;
}

export const ResumeModal: React.FC<ResumeModalProps> = ({ candidate, onClose }) => {
  if (!candidate) return null

  const fullName = candidate.firstName && candidate.lastName
    ? `${candidate.firstName} ${candidate.lastName}`
    : candidate.email

  return (
    <div className={styles["modalOverlay"]} onClick={onClose}>
      <div className={styles["modalContent"]} onClick={(e) => e.stopPropagation()}>
        <button className={styles["closeButton"]} onClick={onClose}>×</button>
        
        <div className={styles["resumeHeader"]}>
          <h2 className={styles["resumeTitle"]}>РЕЗЮМЕ</h2>
          <div className={styles["candidateName"]}>{fullName}</div>
        </div>

        <div className={styles["resumeBody"]}>
          {/* Личная информация */}
          <div className={styles["section"]}>
            <div className={styles["infoRow"]}>
              <label className={styles["label"]}>ИМЯ</label>
              <div className={styles["value"]}>{candidate.firstName || 'Не указано'}</div>
            </div>
            <div className={styles["infoRow"]}>
              <label className={styles["label"]}>ФАМИЛИЯ</label>
              <div className={styles["value"]}>{candidate.lastName || 'Не указано'}</div>
            </div>
            <div className={styles["infoRow"]}>
              <label className={styles["label"]}>ЭЛЕКТРОННАЯ ПОЧТА</label>
              <div className={styles["value"]}>{candidate.email || 'Не указано'}</div>
            </div>
            <div className={styles["infoRow"]}>
              <label className={styles["label"]}>ТЕЛЕФОН</label>
              <div className={styles["value"]}>{candidate.phone || 'Не указано'}</div>
            </div>
            <div className={styles["infoRow"]}>
              <label className={styles["label"]}>МЕСТО ЖИТЕЛЬСТВА</label>
              <div className={styles["value"]}>{candidate.country || 'Не указано'}</div>
            </div>
          </div>

          {/* Опыт работы */}
          {candidate.experience && candidate.experience.length > 0 && (
            <div className={styles["section"]}>
              <h3 className={styles["sectionTitle"]}>ОПЫТ РАБОТЫ</h3>
              {candidate.experience.map((exp, index) => (
                <div key={index} className={styles["experienceItem"]}>
                  <div className={styles["experiencePeriod"]}>{exp.period}</div>
                  <div className={styles["experienceCompany"]}>{exp.company}</div>
                  <div className={styles["experienceTitle"]}>{exp.title}</div>
                  {exp.description && (
                    <div className={styles["experienceDescription"]}>{exp.description}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Образование */}
          {candidate.education && candidate.education.length > 0 && (
            <div className={styles["section"]}>
              <h3 className={styles["sectionTitle"]}>ОБРАЗОВАНИЕ</h3>
              {candidate.education.map((edu, index) => (
                <div key={index} className={styles["educationItem"]}>
                  <div className={styles["educationYear"]}>{edu.year}</div>
                  <div className={styles["educationInstitution"]}>{edu.institution}</div>
                  <div className={styles["educationDegree"]}>{edu.degree}</div>
                </div>
              ))}
            </div>
          )}

          {/* Навыки */}
          {candidate.skills && candidate.skills.length > 0 && (
            <div className={styles["section"]}>
              <h3 className={styles["sectionTitle"]}>НАВЫКИ</h3>
              <div className={styles["skillsContainer"]}>
                {candidate.skills.map((skill, index) => (
                  <span key={index} className={styles["skillTag"]}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* О себе */}
          {candidate.about && (
            <div className={styles["section"]}>
              <h3 className={styles["sectionTitle"]}>О СЕБЕ</h3>
              <div className={styles["aboutText"]}>{candidate.about}</div>
            </div>
          )}

          {/* PDF файл */}
          {candidate.resumeFileName && (
            <div className={styles["section"]}>
              <h3 className={styles["sectionTitle"]}>ПРИКРЕПЛЕННОЕ РЕЗЮМЕ</h3>
              <div className={styles["fileDisplay"]}>
                <div className={styles["fileIcon"]}>📄</div>
                <div className={styles["fileName"]}>{candidate.resumeFileName}</div>
                {candidate.resumeFileData && (
                  <a
                    href={`data:application/pdf;base64,${candidate.resumeFileData}`}
                    download={candidate.resumeFileName}
                    className={styles["downloadLink"]}
                  >
                    Скачать
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

