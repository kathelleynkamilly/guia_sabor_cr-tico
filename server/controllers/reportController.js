import { query, getPool } from '../config/db.js'

/**
 * Retorna todas as denúncias cadastradas no MySQL
 */
export async function getAllReports(req, res) {
  try {
    const rows = await query('SELECT * FROM fraud_reports ORDER BY created_timestamp DESC')

    const formatted = rows.map(r => ({
      id: r.id,
      restaurantId: r.restaurant_id,
      restaurantName: r.restaurant_name,
      reporterName: r.reporter_name,
      reporterEmail: r.reporter_email,
      reason: r.reason,
      description: r.description,
      status: r.status,
      createdAt: r.created_at,
    }))

    res.json({ success: true, data: formatted })
  } catch (error) {
    console.error('Erro ao buscar denúncias:', error)
    res.status(500).json({ success: false, message: 'Erro ao buscar denúncias no banco.', error: error.message })
  }
}

/**
 * Cadastra uma nova denúncia de fraude e ajusta reputação do restaurante
 */
export async function submitFraudReport(req, res) {
  const pool = getPool()
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const { restaurantId, restaurantName, reporterName, reporterEmail, reason, description } = req.body

    if (!restaurantId || !reason || !description) {
      await connection.rollback()
      return res.status(400).json({ success: false, message: 'Campos obrigatórios da denúncia ausentes.' })
    }

    const reportId = 'rep-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)
    const createdAt = new Date().toLocaleDateString('pt-BR')

    // 1. Inserir denúncia
    await connection.query(
      `INSERT INTO fraud_reports (
        id, restaurant_id, restaurant_name, reporter_name, reporter_email, reason, description, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reportId,
        restaurantId,
        restaurantName || 'Restaurante',
        reporterName?.trim() || 'Usuário Anônimo',
        reporterEmail?.trim() || null,
        reason,
        description.trim(),
        'em_analise',
        createdAt,
      ]
    )

    // 2. Incrementar report_count e atualizar safety_score
    const [restRows] = await connection.query('SELECT report_count, safety_score FROM restaurants WHERE id = ?', [restaurantId])
    if (restRows.length > 0) {
      const currentCount = (restRows[0].report_count || 0) + 1
      let newScore = restRows[0].safety_score || 80

      if (currentCount >= 3) {
        newScore = Math.max(20, newScore - 30)
      }

      await connection.query(
        'UPDATE restaurants SET report_count = ?, safety_score = ? WHERE id = ?',
        [currentCount, newScore, restaurantId]
      )
    }

    await connection.commit()

    const reportData = {
      id: reportId,
      restaurantId,
      restaurantName,
      reporterName: reporterName?.trim() || 'Usuário Anônimo',
      reporterEmail,
      reason,
      description,
      createdAt,
      status: 'em_analise',
    }

    res.status(201).json({ success: true, data: reportData })
  } catch (error) {
    await connection.rollback()
    console.error('Erro ao registrar denúncia:', error)
    res.status(500).json({ success: false, message: 'Erro ao registrar denúncia.', error: error.message })
  } finally {
    connection.release()
  }
}
