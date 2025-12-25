import React, { useEffect, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Provider as ReduxProvider } from 'react-redux'
import { ChakraProvider } from '@chakra-ui/react'

import { AppRouter } from './router'
import { store } from './__data__/store'
import { Loader } from './components/ui/Loader/Loader'

const App = () => {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // имитация загрузки данных
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div style={{ position: 'relative', height: '100vh' }}>
        <Loader />
      </div>
    )
  }

  return (
    <BrowserRouter basename='/cherry'>
      <ChakraProvider>
        <ReduxProvider store={store}>
          <AppRouter />
        </ReduxProvider>
      </ChakraProvider>
    </BrowserRouter>
  )
}

export default App