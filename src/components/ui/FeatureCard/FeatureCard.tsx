import React from 'react'
import * as styles from './FeatureCard.module.css'

export interface FeatureCardProps {
  title: string
  description: string
  borderColor?: string
  width?: string
  height?: string
  left?: string
  top?: string
  buttonLeft?: string
  buttonTop?: string
  buttonBackground?: string
  buttonBorderColor?: string
  onButtonClick?: () => void
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  borderColor = '#F2C2C8',
  width = '731.63px',
  height = '197.40px',
  left,
  top,
  buttonLeft,
  buttonTop,
  buttonBackground = '#B0DDFC',
  buttonBorderColor = '#082060',
  onButtonClick
}) => {
  const cardStyle: React.CSSProperties = {
    width,
    height,
    left,
    top,
    position: 'absolute',
    background: 'white',
    borderRadius: '25px',
    outline: `4px ${borderColor} solid`,
    outlineOffset: '-2px'
  }

  const contentStyle: React.CSSProperties = {
    width,
    height,
    padding: '20px',
    left,
    top,
    position: 'absolute',
    background: 'rgba(176, 221, 252, 0)',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: '6px',
    display: 'inline-flex'
  }

  const buttonStyle: React.CSSProperties = {
    width: '94.12px',
    height: '41.50px',
    paddingLeft: '17px',
    paddingRight: '17px',
    paddingTop: '12px',
    paddingBottom: '12px',
    left: buttonLeft,
    top: buttonTop,
    position: 'absolute',
    background: buttonBackground,
    borderRadius: '7.25px',
    outline: `1px ${buttonBorderColor} solid`,
    outlineOffset: '-0.50px',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '7.25px',
    display: 'inline-flex',
    cursor: 'pointer',
    border: 'none'
  }

  return (
    <>
      <div style={cardStyle} />
      <div style={contentStyle}>
        <div style={{
          width: '350px',
          color: 'black',
          fontSize: '25px',
          fontFamily: 'Anek Tamil',
          fontWeight: 700,
          textTransform: 'uppercase',
          lineHeight: '22.75px',
          wordWrap: 'break-word'
        }}>
          {title}
        </div>
        <div style={{
          width: '100%',
          maxWidth: '500px',
          color: 'black',
          fontSize: '17px',
          fontFamily: 'Geist',
          fontWeight: 400,
          lineHeight: '22.27px',
          letterSpacing: '0.17px',
          wordWrap: 'break-word'
        }}>
          {description}
        </div>
      </div>
      {buttonLeft && buttonTop && (
        <button style={buttonStyle} onClick={onButtonClick}>
          <div style={{
            color: '#082060',
            fontSize: '15px',
            fontFamily: 'Geist Mono',
            fontWeight: 400,
            textTransform: 'uppercase',
            lineHeight: '16.50px',
            wordWrap: 'break-word'
          }}>
            перейти
          </div>
        </button>
      )}
    </>
  )
}

