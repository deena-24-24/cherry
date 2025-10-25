const bcrypt = require('bcryptjs')
const User = require('../models/User')
const Candidate = require('../models/Candidate')
const HR = require('../models/HR')
const { generateToken } = require('../middleware/authMiddleware')

/**
 * @desc    Регистрация нового кандидата
 * @route   POST /api/authRoutes/register/candidate
 * @access  Public
 */
const registerCandidate = async (req, res) => {
  const { email, password, firstName, lastName, phone } = req.body

  try {
    // 1. Проверяем, существует ли пользователь
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' })
    }

    // 2. Хешируем пароль
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // 3. Создаем нового пользователя
    const newUser = new User({
      email,
      password: hashedPassword,
      role: 'candidate'
    })
    await newUser.save()

    // 4. Создаем профиль кандидата, связанный с пользователем
    const newCandidate = new Candidate({
      user: newUser._id,
      firstName,
      lastName,
      phone
    })
    await newCandidate.save()

    // 5. Генерируем токен и отправляем ответ
    const token = generateToken(newUser._id, newUser.role)
    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        firstName: newCandidate.firstName,
        lastName: newCandidate.lastName
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Ошибка сервера при регистрации кандидата' })
  }
}

/**
 * @desc    Регистрация нового HR-специалиста
 * @route   POST /api/authRoutes/register/hr
 * @access  Public
 */
const registerHr = async (req, res) => {
  const { email, password, firstName, lastName, companyName, position, phone } = req.body

  try {
    // 1. Проверяем, существует ли пользователь
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' })
    }

    // 2. Хешируем пароль
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // 3. Создаем нового пользователя
    const newUser = new User({
      email,
      password: hashedPassword,
      role: 'hr'
    })
    await newUser.save()

    // 4. Создаем профиль HR, связанный с пользователем
    const newHr = new HR({
      user: newUser._id,
      firstName,
      lastName,
      companyName,
      position,
      phone
    })
    await newHr.save()

    // 5. Генерируем токен и отправляем ответ
    const token = generateToken(newUser._id, newUser.role)
    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        firstName: newHr.firstName,
        lastName: newHr.lastName,
        companyName: newHr.companyName
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Ошибка сервера при регистрации HR' })
  }
}

/**
 * @desc    Аутентификация пользователя и получение токена
 * @route   POST /api/authRoutes/login
 * @access  Public
 */
const login = async (req, res) => {
  const { email, password } = req.body

  try {
    // 1. Ищем пользователя по email
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: 'Неверные учетные данные' })
    }

    // 2. Сравниваем пароли
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Неверные учетные данные' })
    }

    // 3. Получаем дополнительные данные из профиля
    let userProfile = {}
    if (user.role === 'candidate') {
      const candidate = await Candidate.findOne({ user: user._id })
      userProfile = {
        firstName: candidate.firstName,
        lastName: candidate.lastName
      }
    } else if (user.role === 'hr') {
      const hr = await HR.findOne({ user: user._id })
      userProfile = {
        firstName: hr.firstName,
        lastName: hr.lastName,
        companyName: hr.companyName
      }
    }

    // 4. Генерируем токен и отправляем ответ
    const token = generateToken(user._id, user.role)
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        ...userProfile
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Ошибка сервера при входе' })
  }
}

/**
 * @desc    Получение данных о текущем пользователе
 * @route   GET /api/authRoutes/me
 * @access  Private
 */
const getMe = async (req, res) => {
  // Middleware `auth` уже поместил пользователя в req.user
  try {
    // Можно дополнительно обогатить данные пользователя из его профиля
    const user = await User.findById(req.user._id).select('-password')
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении данных пользователя' })
  }
}

module.exports = {
  registerCandidate,
  registerHr,
  login,
  getMe
}