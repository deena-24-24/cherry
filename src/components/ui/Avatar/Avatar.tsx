import React from "react"
import * as styles from "./Avatar.module.css"

export interface AvatarStyleProps {
  width?: string;
  height?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: string;
  marginLeft?: string;
}

interface AvatarProps {
  avatarUrl: string;
  isEditing: boolean;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  styleProps?: AvatarStyleProps;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  avatarUrl,
  isEditing,
  onAvatarChange,
  styleProps,
  className = '',
}) => {
  const avatarStyles: React.CSSProperties = styleProps ? {
    width: styleProps.width,
    height: styleProps.height,
    backgroundColor: styleProps.backgroundColor,
    borderColor: styleProps.borderColor,
    borderRadius: styleProps.borderRadius,
    marginLeft: styleProps.marginLeft,
  } : {}

  return (
    <>
      {isEditing ? (
        <div className={`${styles["avatar"]} ${className}`} style={avatarStyles}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className={styles["avatarImage"]} />
          ) : (
            <div className={styles["avatarPlaceholder"]} />
          )}
          <label className={styles["avatarUpload"]}>
            <input
              type="file"
              accept="image/*"
              onChange={onAvatarChange}
              className={styles["avatarInput"]}
            />
            <span className={styles["avatarUploadText"]}>Изменить фото</span>
          </label>
        </div>
      ) : (
        <div className={`${styles["avatar"]} ${className}`} style={avatarStyles}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className={styles["avatarImage"]} />
          ) : (
            <div className={styles["avatarPlaceholder"]} />
          )}
        </div>
      )}
    </>
  )
}

