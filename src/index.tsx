/* eslint-disable @typescript-eslint/ban-ts-comment */
 
/* eslint-disable react/display-name */
import React from 'react'
import ReactDOM from 'react-dom/client'
  
import App from './app'
import './app.css'

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
