import React, { useState, ChangeEvent, FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { Button } from '../ui/Button/Button'
import { type User } from '../../types'
import * as authService from '../../service/api/authService'
import * as styles from './AuthPopup.module.css'

interface FormData {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  phone: string
  companyName: string
}

interface Errors {
  [key: string]: string
}

type UserType = 'candidate' | 'hr'

interface AuthPopupProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (data: { user: User; token: string }) => void
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
    companyName: ''
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
      companyName: ''
    })
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    setActiveTab('login')
    onClose()
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
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
        newErrors.confirmPassword = 'Подтверждение обязательно'
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
    setErrors({})

    try {
      let data
      if (activeTab === 'login') {
        data = await authService.loginUser({
          email: formData.email,
          password: formData.password,
        })
      } else {
        const requestData =
          userType === 'candidate'
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
              phone: formData.phone
            }
        data = await authService.registerUser(requestData, userType)
      }

      console.log('Auth response:', data)

      if (data && data.user && data.token) {
        if (activeTab === 'register') {
          const userWithFormData = {
            ...data.user,
            phone: formData.phone || data.user.phone || '',
            ...(userType === 'hr' && {})
          }
          onLogin({ ...data, user: userWithFormData })
        } else {
          onLogin(data)
        }
        handleClose()
      } else {
        throw new Error('Неверный формат ответа от сервера')
      }
    } catch (error) {
      console.error('Auth error:', error)
      const message =
        error instanceof Error ? error.message : 'Произошла ошибка'
      setErrors({ submit: message })
    } finally {
      setLoading(false)
    }
  }

  const switchToRegister = (type: UserType) => {
    setUserType(type)
    setActiveTab('register')
    resetForm()
  }

  const switchToLogin = () => {
    setActiveTab('login')
    resetForm()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className={styles['authRoutes-popup-overlay']}
        onClick={handleClose}
      >
        <div
          className={styles['authRoutes-popup']}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className={styles['authRoutes-popup-close']}
            onClick={handleClose}
          >
            &times;
          </button>
          <div className={styles['authRoutes-popup-header']}>
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
              onSwitchToLogin={switchToLogin}
              onUserTypeChange={setUserType}
            />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

const LoginForm: React.FC<LoginFormProps> = ({ formData, errors, loading, onInputChange, onSubmit, onSwitchToRegister }) => (
  <form onSubmit={onSubmit} className={styles['authRoutes-form']}>
    <div className={styles['form-group']}>
      <label htmlFor="login-email">Email</label>
      <input
        id="login-email"
        type="email"
        name="email"
        value={formData.email}
        onChange={onInputChange}
        className={errors.email ? styles['error'] : ''}
        placeholder="Введите ваш email"
        autoComplete="email"
      />
      {errors.email && (
        <span className={styles['error-text']}>{errors.email}</span>
      )}
    </div>

    <div className={styles['form-group']}>
      <label htmlFor="login-password">Пароль</label>
      <input
        id="login-password"
        type="password"
        name="password"
        value={formData.password}
        onChange={onInputChange}
        className={errors.password ? styles['error'] : ''}
        placeholder="Введите ваш пароль"
        autoComplete="current-password"
      />
      {errors.password && (
        <span className={styles['error-text']}>{errors.password}</span>
      )}
    </div>

    {errors.submit && (
      <div className={styles['error-message']}>{errors.submit}</div>
    )}

    <Button
      type="submit"
      disabled={loading}
      styleProps={{ width: '100%', textColor: '#fffcf5' }}
    >
      {loading ? 'Вход...' : 'Войти'}
    </Button>

    <div className={styles['authRoutes-switch']}>
      <p>Еще нет аккаунта?</p>
      <div className={styles['register-buttons']}>
        <Button
          type="button"
          variant="secondary"
          onClick={() => onSwitchToRegister('candidate')}
          styleProps={{ width: '100%', borderColor: 'transparent' }}
        >
          Я соискатель
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => onSwitchToRegister('hr')}
          styleProps={{ width: '100%', borderColor: 'transparent' }}
        >
          Я HR-агент
        </Button>
      </div>
    </div>
  </form>
)

const RegisterForm: React.FC<RegisterFormProps> = ({ userType, formData, errors, loading, onInputChange, onSubmit, onSwitchToLogin, onUserTypeChange }) => (
  <form onSubmit={onSubmit} className={styles['authRoutes-form']}>
    <div className={styles['user-type-selector']}>
      <Button
        type="button"
        variant="secondary"
        className={`${styles['user-type-btn']} ${
          userType === 'candidate' ? styles['active'] : ''
        }`}
        onClick={() => onUserTypeChange('candidate')}
        styleProps={{ width: '100%' }}
      >
        👤 Соискатель
      </Button>
      <Button
        type="button"
        variant="secondary"
        className={`${styles['user-type-btn']} ${
          userType === 'hr' ? styles['active'] : ''
        }`}
        onClick={() => onUserTypeChange('hr')}
        styleProps={{ width: '100%' }}
      >
        💼 HR-агент
      </Button>
    </div>

    <div className={styles['form-row']}>
      <div className={styles['form-group']}>
        <label htmlFor="reg-firstName">Имя</label>
        <input
          id="reg-firstName"
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={onInputChange}
          className={errors.firstName ? styles['error'] : ''}
          placeholder="Ваше имя"
        />
        {errors.firstName && (
          <span className={styles['error-text']}>{errors.firstName}</span>
        )}
      </div>

      <div className={styles['form-group']}>
        <label htmlFor="reg-lastName">Фамилия</label>
        <input
          id="reg-lastName"
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={onInputChange}
          className={errors.lastName ? styles['error'] : ''}
          placeholder="Ваша фамилия"
        />
        {errors.lastName && (
          <span className={styles['error-text']}>{errors.lastName}</span>
        )}
      </div>
    </div>

    <div className={styles['form-group']}>
      <label htmlFor="reg-email">Email</label>
      <input
        id="reg-email"
        type="email"
        name="email"
        value={formData.email}
        onChange={onInputChange}
        className={errors.email ? styles['error'] : ''}
        placeholder="example@mail.com"
        autoComplete="email"
      />
      {errors.email && (
        <span className={styles['error-text']}>{errors.email}</span>
      )}
    </div>

    {userType === 'hr' && (
      <>
        <div className={styles['form-group']}>
          <label htmlFor="reg-companyName">Название компании</label>
          <input
            id="reg-companyName"
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={onInputChange}
            className={errors.companyName ? styles['error'] : ''}
            placeholder="Введите название компании"
          />
          {errors.companyName && (
            <span className={styles['error-text']}>{errors.companyName}</span>
          )}
        </div>
      </>
    )}

    <div className={styles['form-group']}>
      <label htmlFor="reg-phone">Телефон</label>
      <input
        id="reg-phone"
        type="tel"
        name="phone"
        value={formData.phone}
        onChange={onInputChange}
        placeholder="+7 (999) 123-45-67"
      />
    </div>

    <div className={styles['form-row']}>
      <div className={styles['form-group']}>
        <label htmlFor="reg-password">Пароль</label>
        <input
          id="reg-password"
          type="password"
          name="password"
          value={formData.password}
          onChange={onInputChange}
          className={errors.password ? styles['error'] : ''}
          placeholder="Не менее 6 символов"
        />
        {errors.password && (
          <span className={styles['error-text']}>{errors.password}</span>
        )}
      </div>

      <div className={styles['form-group']}>
        <label htmlFor="reg-confirmPassword">Подтверждение пароля</label>
        <input
          id="reg-confirmPassword"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={onInputChange}
          className={errors.confirmPassword ? styles['error'] : ''}
          placeholder="Повторите пароль"
        />
        {errors.confirmPassword && (
          <span className={styles['error-text']}>
            {errors.confirmPassword}
          </span>
        )}
      </div>
    </div>

    {errors.submit && (
      <div className={styles['error-message']}>{errors.submit}</div>
    )}

    <Button
      type="submit"
      disabled={loading}
      styleProps={{ width: '100%', textColor: '#fffcf5' }}
    >
      {loading ? 'Регистрация...' : 'Зарегистрироваться'}
    </Button>

    <div className={styles['authRoutes-switch']}>
      <p>
        Уже есть аккаунт?{' '}
        <button
          type="button"
          className={styles['switch-link']}
          onClick={onSwitchToLogin}
        >
          Войти
        </button>
      </p>
    </div>
  </form>
)

export default AuthPopup