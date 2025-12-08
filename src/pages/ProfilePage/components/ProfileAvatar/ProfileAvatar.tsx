import React from "react"
import { Avatar } from "../../../../components/ui/Avatar/Avatar"

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
    <Avatar
      avatarUrl={avatarUrl}
      isEditing={isEditing}
      onAvatarChange={onAvatarChange}
    />
  )
}

