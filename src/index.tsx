/* eslint-disable @typescript-eslint/ban-ts-comment */
 
/* eslint-disable react/display-name */
import React from 'react'
import ReactDOM from 'react-dom/client'
  
import App from './app'
import './app.css'

// Инициализация SaluteSpeech API ключа из переменных окружения (если доступны)
// Для использования SaluteSpeech API установите ключ одним из способов:
// 1. window.__SALUTE_SPEECH_API_KEY__ = 'ваш_ключ' (в консоли браузера или перед загрузкой)
// 2. Или настройте webpack DefinePlugin в bro.config.js
if (typeof window !== 'undefined' && !(window as any).__SALUTE_SPEECH_API_KEY__) {
  // Пробуем получить из process.env (установленного через webpack DefinePlugin)
  let apiKeyFromEnv: string | undefined
  
  if (typeof process !== 'undefined' && process.env) {
    apiKeyFromEnv = (process.env as any)?.REACT_APP_SALUTE_SPEECH_API_KEY
  }
  
  // Если не получили из process.env, пробуем загрузить из .env напрямую через window
  // (для случаев когда webpack DefinePlugin не работает)
  if (!apiKeyFromEnv) {
    // Ключ из .env файла (временно для тестирования)
    // В production это должно быть через переменные окружения или backend
    const envKey = 'MDE5YjJlMDMtMWQ4My03ZjZiLThhYjItOWExNGNjNmQ2YWExOjYyNTQwNzgwLTFlNTktNDViMi05MzlkLWJiOWNkYzQzNDEwMg=='
    if (envKey) {
      apiKeyFromEnv = envKey
    }
  }
  
  if (apiKeyFromEnv) {
    // Убираем кавычки если они есть и переносы строк
    const cleanKey = apiKeyFromEnv.replace(/^['"]|['"]$/g, '').replace(/\n/g, '').trim()
    if (cleanKey) {
      (window as any).__SALUTE_SPEECH_API_KEY__ = cleanKey
      console.log('✅ SaluteSpeech API key loaded')
    }
  }
}

export default () => <App/>
  
let rootElement: ReactDOM.Root
  
export const mount = (Component, element = document.getElementById('app')) => {
  rootElement = ReactDOM.createRoot(element)
  rootElement.render(<Component/>)

  // @ts-ignore
  if(module.hot) {
    // @ts-ignore
    module.hot.accept('./app', ()=> {
      rootElement.render(<Component/>)
    })
  }
}

export const unmount = () => {
  rootElement.unmount()
}
