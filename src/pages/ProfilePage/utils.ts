export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const formatPhoneNumber = (value: string): string => {
  // Удаляем все символы кроме цифр и +
  let cleaned = value.replace(/[^\d+]/g, '');
  
  // Если не начинается с +7, добавляем +7
  if (!cleaned.startsWith('+7')) {
    if (cleaned.startsWith('7')) {
      cleaned = '+' + cleaned;
    } else if (cleaned.startsWith('+') && !cleaned.startsWith('+7')) {
      cleaned = '+7' + cleaned.substring(1);
    } else {
      cleaned = '+7' + cleaned;
    }
  }
  
  // Ограничиваем длину: +7 + максимум 10 цифр = 12 символов
  // Формат: +7-XXX-XX-XX-XX
  if (cleaned.length > 12) {
    cleaned = cleaned.substring(0, 12);
  }
  
  // Извлекаем только цифры после +7
  const digits = cleaned.substring(2).replace(/\D/g, '');
  
  // Форматируем: +7-XXX-XX-XX-XX
  if (digits.length === 0) {
    return '+7';
  }
  
  let formatted = '+7';
  
  if (digits.length > 0) {
    formatted += '-' + digits.substring(0, 3);
  }
  if (digits.length > 3) {
    formatted += '-' + digits.substring(3, 5);
  }
  if (digits.length > 5) {
    formatted += '-' + digits.substring(5, 7);
  }
  if (digits.length > 7) {
    formatted += '-' + digits.substring(7, 9);
  }
  
  return formatted;
};

export const compressAvatarImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        // Размеры аватара
        const maxWidth = 236;
        const maxHeight = 236;
        
        // Вычисляем размеры с сохранением пропорций
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        // Создаем canvas для сжатия
        const canvas = document.createElement('canvas');
        canvas.width = maxWidth;
        canvas.height = maxHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Заливаем фон
          ctx.fillStyle = '#C8E6FF';
          ctx.fillRect(0, 0, maxWidth, maxHeight);
          
          // Вычисляем центрирование
          const x = (maxWidth - width) / 2;
          const y = (maxHeight - height) / 2;
          
          // Рисуем изображение
          ctx.drawImage(img, x, y, width, height);
          
          // Конвертируем в base64
          const compressedImage = canvas.toDataURL('image/jpeg', 0.9);
          resolve(compressedImage);
        } else {
          reject(new Error('Не удалось создать контекст canvas'));
        }
      };
      img.onerror = () => reject(new Error('Ошибка загрузки изображения'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Ошибка чтения файла'));
    reader.readAsDataURL(file);
  });
};

