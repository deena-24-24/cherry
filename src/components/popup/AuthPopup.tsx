// @ts-nocheck
import React, { useState, ChangeEvent, FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { Button } from '../ui/Button'

import { type User } from '../../types/user'
import styles from './AuthPopup.module.css'

interface FormData {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  phone: string
  companyName: string
  position: string
}

interface Errors {
  [key: string]: string
}

type UserType = 'candidate' | 'hr'

interface AuthPopupProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (user: User) => void
}

interface LoginFormProps {
  formData: FormData
  errors: Errors
  loading: boolean
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: FormEvent) => void
  onSwitchToRegister: (type: UserType) => void
}

interface RegisterFormProps {
  userType: UserType
  formData: FormData
  errors: Errors
  loading: boolean
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: FormEvent) => void
  onSwitchToLogin: () => void
  onUserTypeChange: (type: UserType) => void
}

// ------------------------- //
// Основной компонент
// ------------------------- //

const AuthPopup: React.FC<AuthPopupProps> = ({ isOpen, onClose, onLogin }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [userType, setUserType] = useState<UserType>('candidate')
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    companyName: '',
    position: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Errors>({})

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: '',
      companyName: '',
      position: ''
    })
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Errors = {}

    if (!formData.email) {
      newErrors.email = 'Email обязателен'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Некорректный email'
    }

    if (!formData.password) {
      newErrors.password = 'Пароль обязателен'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Пароль должен быть не менее 6 символов'
    }

    if (activeTab === 'register') {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Подтверждение пароля обязательно'
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Пароли не совпадают'
      }

      if (!formData.firstName) newErrors.firstName = 'Имя обязательно'
      if (!formData.lastName) newErrors.lastName = 'Фамилия обязательна'
      if (userType === 'hr' && !formData.companyName) {
        newErrors.companyName = 'Название компании обязательно'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setLoading(true)

    try {
      const endpoint =
        activeTab === 'login'
          ? '/api/authRoutes/login'
          : userType === 'candidate'
            ? '/api/authRoutes/register/candidate'
            : '/api/authRoutes/register/hr'

      const requestData =
        activeTab === 'login'
          ? { email: formData.email, password: formData.password }
          : userType === 'candidate'
            ? {
              email: formData.email,
              password: formData.password,
              firstName: formData.firstName,
              lastName: formData.lastName,
              phone: formData.phone
            }
            : {
              email: formData.email,
              password: formData.password,
              companyName: formData.companyName,
              firstName: formData.firstName,
              lastName: formData.lastName,
              phone: formData.phone,
              position: formData.position
            }

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      const data = await response.json()
      if (response.ok) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        onLogin(data.user)
        handleClose()
      } else {
        setErrors({ submit: data.message || 'Произошла ошибка' })
      }
    } catch {
      setErrors({ submit: 'Ошибка соединения с сервером' })
    } finally {
      setLoading(false)
    }
  }

  const switchToRegister = (type: UserType) => {
    setUserType(type)
    setActiveTab('register')
    resetForm()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div className={styles.popupOverlay} onClick={handleClose}>
        <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
          <Button className={styles.closeButton} onClick={handleClose}>×</Button>
          <div className={styles.popupHeader}>
            <h2>{activeTab === 'login' ? 'Вход в аккаунт' : 'Регистрация'}</h2>
          </div>

          {activeTab === 'login' ? (
            <LoginForm
              formData={formData}
              errors={errors}
              loading={loading}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
              onSwitchToRegister={switchToRegister}
            />
          ) : (
            <RegisterForm
              userType={userType}
              formData={formData}
              errors={errors}
              loading={loading}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
              onSwitchToLogin={() => {
                setActiveTab('login')
                resetForm()
              }}
              onUserTypeChange={setUserType}
            />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

const LoginForm: React.FC<LoginFormProps> = ({ formData, errors, loading, onInputChange, onSubmit, onSwitchToRegister }) => (
  <form onSubmit={onSubmit} className={styles.form}>
    <div className={styles.formGroup}>
      <label htmlFor="login-email">Email</label>
      <input
        id="login-email"
        type="email"
        name="email"
        value={formData.email}
        onChange={onInputChange}
        className={`${styles.input} ${errors.email ? styles.error : ''}`}
        placeholder="Введите ваш email"
        autoComplete="email"
      />
      {errors.email && <span className={styles.errorText}>{errors.email}</span>}
    </div>

    <div className={styles.formGroup}>
      <label htmlFor="login-password">Пароль</label>
      <input
        id="login-password"
        type="password"
        name="password"
        value={formData.password}
        onChange={onInputChange}
        className={`${styles.input} ${errors.password ? styles.error : ''}`}
        placeholder="Введите ваш пароль"
        autoComplete="current-password"
      />
      {errors.password && <span className={styles.errorText}>{errors.password}</span>}
    </div>

    {errors.submit && <div className={styles.errorMessage}>{errors.submit}</div>}

    <Button type="submit" className={styles.submitButton} disabled={loading}>
      {loading ? 'Вход...' : 'Войти'}
    </Button>

    <div className={styles.switch}>
      <p>Еще нет аккаунта?</p>
      <div className={styles.registerButtons}>
        <Button
          type="button"
          className={styles.optionButton}
          onClick={() => onSwitchToRegister('candidate')}
        >
          Я соискатель
        </Button>
        <Button
          type="button"
          className={styles.optionButton}
          onClick={() => onSwitchToRegister('hr')}
        >
          Я HR
        </Button>
      </div>
    </div>
  </form>
)

const RegisterForm: React.FC<RegisterFormProps> = ({ userType, formData, errors, loading, onInputChange, onSubmit, onSwitchToLogin, onUserTypeChange }) => (
  <form onSubmit={onSubmit} className={styles.form}>
    <div className={styles.userTypeSelector}>
      <Button
        type="button"
        // 4. ЕЩЕ ОДИН ПРИМЕР ДИНАМИЧЕСКОГО КЛАССА
        className={`${styles.userTypeButton} ${userType === 'candidate' ? styles.active : ''}`}
        onClick={() => onUserTypeChange('candidate')}
      >
        👤 Соискатель
      </Button>
      <Button
        type="button"
        className={`${styles.userTypeButton} ${userType === 'hr' ? styles.active : ''}`}
        onClick={() => onUserTypeChange('hr')}
      >
        💼 HR специалист
      </Button>
    </div>

    <div className={styles.formRow}>
      <div className={styles.formGroup}>
        <label htmlFor="reg-firstName">Имя</label>
        <input
          id="reg-firstName"
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={onInputChange}
          className={`${styles.input} ${errors.firstName ? styles.error : ''}`}
          placeholder="Ваше имя"
        />
        {errors.firstName && <span className={styles.errorText}>{errors.firstName}</span>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="reg-lastName">Фамилия</label>
        <input
          id="reg-lastName"
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={onInputChange}
          className={`${styles.input} ${errors.lastName ? styles.error : ''}`}
          placeholder="Ваша фамилия"
        />
        {errors.lastName && <span className={styles.errorText}>{errors.lastName}</span>}
      </div>
    </div>

    <div className={styles.formGroup}>
      <label htmlFor="reg-email">Email</label>
      <input
        id="reg-email"
        type="email"
        name="email"
        value={formData.email}
        onChange={onInputChange}
        className={errors.email ? styles.error : ''}
        placeholder="example@mail.com"
        autoComplete="email"
      />
      {errors.email && <span className={styles.errorText}>{errors.email}</span>}
    </div>

    {userType === 'hr' && (
      <>
        <div className={styles.formGroup}>
          <label htmlFor="reg-companyName">Название компании</label>
          <input
            id="reg-companyName"
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={onInputChange}
            className={errors.companyName ? styles.error : ''}
            placeholder="Введите название компании"
          />
          {errors.companyName && <span className={styles.errorText}>{errors.companyName}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="reg-position">Должность</label>
          <input
            id="reg-position"
            type="text"
            name="position"
            value={formData.position}
            onChange={onInputChange}
            placeholder="HR менеджер"
          />
        </div>
      </>
    )}

    <div className={styles.formGroup}>
      <label htmlFor="reg-phone">Телефон (необязательно)</label>
      <input
        id="reg-phone"
        type="tel"
        name="phone"
        value={formData.phone}
        onChange={onInputChange}
        placeholder="+7 (999) 123-45-67"
      />
    </div>

    <div className={styles.formRow}>
      <div className={styles.formGroup}>
        <label htmlFor="reg-password">Пароль</label>
        <input
          id="reg-password"
          type="password"
          name="password"
          value={formData.password}
          onChange={onInputChange}
          className={errors.password ? styles.error : ''}
          placeholder="Не менее 6 символов"
        />
        {errors.password && <span className={styles.errorText}>{errors.password}</span>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="reg-confirmPassword">Подтверждение пароля</label>
        <input
          id="reg-confirmPassword"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={onInputChange}
          className={errors.confirmPassword ? styles.error : ''}
          placeholder="Повторите пароль"
        />
        {errors.confirmPassword && <span className={styles.errorText}>{errors.confirmPassword}</span>}
      </div>
    </div>

    {errors.submit && <div className={styles.errorMessage}>{errors.submit}</div>}

    <Button type="submit" className={styles.submitButton} disabled={loading}>
      {loading ? 'Регистрация...' : 'Зарегистрироваться'}
    </Button>

    <div className={styles.switch}>
      <p>
        Уже есть аккаунт?{' '}
        <Button type="button" className={styles.switchLink} onClick={onSwitchToLogin}>
          Войти
        </Button>
      </p>
    </div>
  </form>
)

export default AuthPopup
