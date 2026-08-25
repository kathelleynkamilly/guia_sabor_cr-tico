import { testConnection, query } from '../config/db.js'
import initDatabase from '../database/initDb.js'

/**
 * Retorna status da conexão e saúde do Banco de Dados MySQL
 */
export async function getDbHealth(req, res) {
  try {
    const health = await testConnection()
    res.json({
      success: health.connected,
      data: health,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Falha ao testar conexão com o MySQL.',
      error: error.message,
    })
  }
}

/**
 * Retorna estatísticas gerais das tabelas do MySQL
 */
export async function getDbStats(req, res) {
  try {
    const [r1] = await query('SELECT COUNT(*) AS totalRestaurants FROM restaurants')
    const [r2] = await query('SELECT COUNT(*) AS totalVerified FROM restaurants WHERE is_verified = 1')
    const [r3] = await query('SELECT COUNT(*) AS totalMenuItems FROM menu_items')
    const [r4] = await query('SELECT COUNT(*) AS totalReviews FROM reviews')
    const [r5] = await query('SELECT COUNT(*) AS totalReports FROM fraud_reports')
    const [r6] = await query('SELECT COUNT(*) AS totalUsers FROM users')

    res.json({
      success: true,
      data: {
        totalRestaurants: r1.totalRestaurants,
        totalVerified: r2.totalVerified,
        totalMenuItems: r3.totalMenuItems,
        totalReviews: r4.totalReviews,
        totalReports: r5.totalReports,
        totalUsers: r6.totalUsers,
      },
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas do banco:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas do MySQL.',
      error: error.message,
    })
  }
}

/**
 * Endpoint para disparar inicialização e seed do banco
 */
export async function runDbInit(req, res) {
  try {
    const success = await initDatabase()
    if (success) {
      res.json({ success: true, message: 'Banco de dados MySQL inicializado e populado com sucesso!' })
    } else {
      res.status(500).json({ success: false, message: 'Falha ao inicializar o banco de dados MySQL.' })
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro durante a inicialização.', error: error.message })
  }
}
