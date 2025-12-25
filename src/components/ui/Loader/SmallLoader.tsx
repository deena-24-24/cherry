import React from 'react'
import * as styles from './Loader.module.css'

export const SmallLoader: React.FC = () => {

  return (
    <div className={styles["loader-component"]}>
      <div className={styles["loader"]}>
        <span/>
        <span/>
        <span/>
        <span/>
      </div>
    </div>

  )
}