import React from "react"
import * as styles from "./ProfileAvatar.module.css"

interface ProfileAvatarProps {
  avatarUrl: string;
  isEditing: boolean;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  avatarUrl,
  isEditing,
  onAvatarChange,
}) => {
  return (
    <div className={styles["avatarContainer"]}>
      <div className={styles["avatarFrame"]}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className={styles["avatarImage"]} />
        ) : (
          <div className={styles["avatarPlaceholder"]} />
        )}

        {isEditing && (
          <label className={styles["avatarUploadOverlay"]}>
            <input
              type="file"
              accept="image/*"
              onChange={onAvatarChange}
              className={styles["avatarInput"]}
            />
            <span className={styles["avatarUploadText"]}>Изменить</span>
          </label>
        )}
      </div>
    </div>
  )
}