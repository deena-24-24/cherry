import React from 'react'
import * as styles from './Loader.module.css'

export const Loader: React.FC = () => {

  return (
    <div className={styles["loader-page"]}>
      <div className={styles["loader"]}>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>

  )
}