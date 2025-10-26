const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Генерация JWT токена
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// Middleware для проверки аутентификации
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Токен отсутствует, доступ запрещен' });
    }

    // Проверяем токен и извлекаем из него данные
    const decoded = jwt.verify(token, JWT_SECRET);

    // помещаем расшифрованные данные в req.user
    req.user = decoded;

    next();
  } catch (error) {
    res.status(401).json({ message: 'Невалидный токен' });
  }
};

module.exports = {
  generateToken,
  auth: authMiddleware,
};