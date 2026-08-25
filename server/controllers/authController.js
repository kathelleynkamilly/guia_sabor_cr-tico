import { query } from '../config/db.js'

/**
 * Autentica o usuário com consulta ao MySQL
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'E-mail e senha são obrigatórios.' })
    }

    const cleanEmail = email.trim().toLowerCase()
    const rows = await query('SELECT * FROM users WHERE LOWER(email) = ?', [cleanEmail])

    if (rows.length === 0) {
      // Fallback para conta de teste
      if (cleanEmail === 'usuario@exemplo.com' && password === '123456') {
        return res.json({
          success: true,
          user: {
            id: 'user-demo',
            name: 'Usuário Convidado',
            email: 'usuario@exemplo.com',
            role: 'user',
            createdAt: new Date().toLocaleDateString('pt-BR'),
          },
        })
      }
      return res.status(401).json({ success: false, message: 'E-mail ou senha incorretos.' })
    }

    const user = rows[0]
    if (user.password_hash !== password) {
      return res.status(401).json({ success: false, message: 'E-mail ou senha incorretos.' })
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
      },
    })
  } catch (error) {
    console.error('Erro no login:', error)
    res.status(500).json({ success: false, message: 'Erro ao autenticar usuário.', error: error.message })
  }
}

/**
 * Cadastra um novo usuário no banco MySQL
 */
export async function register(req, res) {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Por favor, preencha todos os campos obrigatórios.' })
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'A senha deve conter no mínimo 6 caracteres.' })
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanName = name.trim()

    // Verificar e-mail duplicado
    const existing = await query('SELECT id FROM users WHERE LOWER(email) = ?', [cleanEmail])
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Este e-mail já está cadastrado.' })
    }

    const userId = 'user-' + Date.now()
    const createdAt = new Date().toLocaleDateString('pt-BR')

    await query(
      'INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, cleanName, cleanEmail, password, 'user', createdAt]
    )

    res.status(201).json({
      success: true,
      user: {
        id: userId,
        name: cleanName,
        email: cleanEmail,
        role: 'user',
        createdAt,
      },
    })
  } catch (error) {
    console.error('Erro no cadastro:', error)
    res.status(500).json({ success: false, message: 'Erro ao cadastrar usuário.', error: error.message })
  }
}
