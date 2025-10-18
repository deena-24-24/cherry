import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Provider as ReduxProvider } from 'react-redux'
import { ChakraProvider } from '@chakra-ui/react'

import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'
import { AppRouter } from './router'

import { Dashboard } from './dashboard'

import { store } from './__data__/store'

const App = () => {
  return (
    <BrowserRouter>
      <ChakraProvider>
        <ReduxProvider store={store}>
          {/*<Dashboard />*/}
          <Header />
          <AppRouter />
          <Footer />
        </ReduxProvider>
      </ChakraProvider>
    </BrowserRouter>
  )
}

export default App
