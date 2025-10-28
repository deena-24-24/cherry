import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Provider as ReduxProvider } from 'react-redux'
import { ChakraProvider } from '@chakra-ui/react'

import { AppRouter } from './router'
import { store } from './__data__/store'

const App = () => {
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