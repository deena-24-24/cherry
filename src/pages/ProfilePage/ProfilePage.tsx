import React, { useState } from "react";
import { Sidebar} from "../../components/Sidebar/Sidebar"
import * as styles from "./ProfilePage.module.css";


interface ProfileData {
  name: string;
  email: string;
  phone?: string;
  country?: string;
  about?: string;
}

export const ProfilePage: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false); // по умолчанию режим просмотра
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "Иван Иванов",
    email: "ivan@example.com",
    phone: "+7 (999) 123-45-67",
    country: "Россия",
    about: "Разработчик программного обеспечения",
  });

  const handleSave = (data: ProfileData) => {
    setProfileData(data);
    setIsEditing(false);
  };

  return (
    <div>
      <div>
        <h1 className={styles["title"]}>ЛИЧНЫЙ КАБИНЕТ</h1>
      </div>
      <div className={styles["page"]}>
        {isEditing ? (
          <ProfileForm initialData={profileData} onSave={handleSave} />
        ) : (
          <ProfileView data={profileData} onEdit={() => setIsEditing(true)} />
        )}
        <Sidebar />
      </div>
    </div>
    

    
  );
};

interface ProfileFormProps {
  initialData: ProfileData;
  onSave: (data: ProfileData) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ initialData, onSave }) => {
  const [formData, setFormData] = useState<ProfileData>(initialData);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form className={styles["form"]} onSubmit={handleSubmit}>
      <div>
        <label>Имя</label>
        <input
          className={styles["input"]}
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label>Электронная почта</label>
        <input
          className={styles["input"]}
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label>Телефон (необязательно)</label>
        <input
          className={styles["input"]}
          type="tel"
          name="phone"
          value={formData.phone || ""}
          onChange={handleChange}
        />
      </div>
      <div>
        <label>Страна (необязательно)</label>
        <input
          className={styles["input"]}
          type="text"
          name="country"
          value={formData.country || ""}
          onChange={handleChange}
        />
      </div>
      <div>
        <label>О себе</label>
        <textarea
          className={styles["input"]}
          name="about"
          value={formData.about || ""}
          onChange={handleChange}
          rows={4}
        />
      </div>
      <button type="submit" className={styles["button"]}>
        СОХРАНИТЬ
      </button>
    </form>
  );
};

interface ProfileViewProps {
  data: ProfileData;
  onEdit: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ data, onEdit }) => {
  return (
    <div className={styles["viewContainer"]}>
      <div className={styles["field"]}>
        <div className={styles["label"]}>Имя</div>
        <div className={styles["valueBox"]}>{data.name || "-"}</div>
      </div>
      <div className={styles["field"]}>
        <div className={styles["label"]}>Электронная почта</div>
        <div className={styles["valueBox"]}>{data.email || "-"}</div>
      </div>
      <div className={styles["field"]}>
        <div className={styles["label"]}>Телефон (необязательно)</div>
        <div className={styles["valueBox"]}>{data.phone || "-"}</div>
      </div>
      <div className={styles["field"]}>
        <div className={styles["label"]}>Страна (необязательно)</div>
        <div className={styles["valueBox"]}>{data.country || "-"}</div>
      </div>
      <div className={styles["field"]}>
        <div className={styles["label"]}>О себе</div>
        <div className={styles["valueBox"]}>{data.about || "-"}</div>
      </div>
      <button onClick={onEdit} className={styles["button"]}>
        РЕДАКТИРОВАТЬ
      </button>
    </div>
  );
};


