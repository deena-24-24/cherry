const { generateToken } = require('../middleware/authMiddleware');
const { mockDB } = require('../mockData.js');

// --- БАЗА ДАННЫХ В ПАМЯТИ ---
const users = mockDB.users;
let userIdCounter = 1;

/**
 * @desc    Регистрация нового кандидата
 * @route   POST /api/auth/register/candidate
 * @access  Public
 */
const registerCandidate = async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  try {
    // 1. Проверяем, существует ли пользователь в нашем массиве
    if (users.find(user => user.email === email)) {
      return res.status(409).json({ message: 'Пользователь с таким email уже существует' });
    }

    // 2. Создаем нового пользователя
    const newUser = {
      _id: `user_${userIdCounter++}`,
      email,
      password, // В заглушке храним пароль в открытом виде
      role: 'candidate',
      firstName,
      lastName,
    };

    // 3. "Сохраняем" пользователя, добавляя его в массив
    users.push(newUser);
    console.log('Новый кандидат зарегистрирован:', newUser);
    console.log('Всего пользователей:', users.length);


    // 4. Генерируем токен и отправляем ответ
    const token = generateToken(newUser._id, newUser.role);
    res.status(201).json({
      token,
      user: {
        _id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера при регистрации' });
  }
};

/**
 * @desc    Регистрация нового HR-специалиста
 * @route   POST /api/auth/register/hr
 * @access  Public
 */
const registerHr = async (req, res) => {
  const { email, password, firstName, lastName, companyName } = req.body;

  try {
    if (users.find(user => user.email === email)) {
      return res.status(409).json({ message: 'Пользователь с таким email уже существует' });
    }

    const newUser = {
      _id: `user_${userIdCounter++}`,
      email,
      password,
      role: 'hr',
      firstName,
      lastName,
      companyName,
    };

    users.push(newUser);
    console.log('Новый HR зарегистрирован:', newUser);
    console.log('Всего пользователей:', users.length);


    const token = generateToken(newUser._id, newUser.role);
    res.status(201).json({
      token,
      user: {
        _id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        companyName: newUser.companyName,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера при регистрации' });
  }
};


/**
 * @desc    Аутентификация пользователя
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Ищем пользователя в массиве
    const user = users.find(u => u.email === email);

    // 2. Проверяем пользователя и пароль (прямое сравнение)
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Неверные учетные данные' });
    }

    // 3. Генерируем токен и отправляем ответ
    const token = generateToken(user._id, user.role);
    console.log('Пользователь вошел в систему:', user.email);
    res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        companyName: user.companyName, // Будет undefined для кандидата, это нормально
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера при входе' });
  }
};

/**
 * @desc    Получение данных о текущем пользователе
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  // В req.user у нас теперь payload из токена: { userId, role }
  const currentUser = users.find(u => u._id === req.user.userId);

  if (!currentUser) {
    return res.status(404).json({ message: 'Пользователь не найден' });
  }

  // Отправляем данные без пароля
  const { password, ...userToSend } = currentUser;
  res.json(userToSend);
};


module.exports = {
  registerCandidate,
  registerHr,
  login,
  getMe,
};