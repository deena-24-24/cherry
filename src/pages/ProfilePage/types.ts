export interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCode: string;
  country: string;
  about: string;
}

export interface PhoneCode {
  code: string;
  country: string;
}

export type MenuItem = 'about' | 'progress' | 'resume';

export const phoneCodes: PhoneCode[] = [
  { code: '+7', country: 'Россия' },
  { code: '+1', country: 'США/Канада' },
  { code: '+44', country: 'Великобритания' },
  { code: '+49', country: 'Германия' },
  { code: '+33', country: 'Франция' },
  { code: '+39', country: 'Италия' },
  { code: '+34', country: 'Испания' },
  { code: '+86', country: 'Китай' },
  { code: '+81', country: 'Япония' },
  { code: '+82', country: 'Южная Корея' },
  { code: '+91', country: 'Индия' },
  { code: '+61', country: 'Австралия' },
  { code: '+55', country: 'Бразилия' },
  { code: '+52', country: 'Мексика' },
  { code: '+380', country: 'Украина' },
  { code: '+375', country: 'Беларусь' },
  { code: '+7', country: 'Казахстан' },
];

export const countries: string[] = [
  'Россия', 'США', 'Канада', 'Великобритания', 'Германия', 'Франция', 'Италия', 'Испания',
  'Китай', 'Япония', 'Южная Корея', 'Индия', 'Австралия', 'Бразилия', 'Мексика',
  'Украина', 'Беларусь', 'Казахстан', 'Польша', 'Нидерланды', 'Бельгия', 'Швейцария',
  'Австрия', 'Швеция', 'Норвегия', 'Дания', 'Финляндия', 'Португалия', 'Греция', 'Турция'
];

