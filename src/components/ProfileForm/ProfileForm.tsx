import React, { useState } from "react";
import * as styles from "./ProfileForm.module.css";

interface ProfileData {
  name: string;
  email: string;
  phone?: string;
  country?: string;
  about?: string;
}

export const ProfileForm: React.FC = () => {
  const [formData, setFormData] = useState<ProfileData>({
    name: "",
    email: "",
    phone: "",
    country: "",
    about: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(formData);
  };

  return (
    <form className={styles["form"]} onSubmit={handleSubmit}>
      <input
        type="text"
        name="name"
        placeholder="Имя"
        value={formData.name}
        onChange={handleChange}
      />
      <input
        type="email"
        name="email"
        placeholder="Электронная почта"
        value={formData.email}
        onChange={handleChange}
      />
      <input
        type="text"
        name="phone"
        placeholder="Телефон (необязательно)"
        value={formData.phone}
        onChange={handleChange}
      />
      <input
        type="text"
        name="country"
        placeholder="Страна (необязательно)"
        value={formData.country}
        onChange={handleChange}
      />
      <textarea
        name="about"
        placeholder="О себе"
        rows={3}
        value={formData.about}
        onChange={handleChange}
      />
      <button type="submit">Редактировать</button>
    </form>
  );
};


