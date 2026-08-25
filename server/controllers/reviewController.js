import { query, getPool } from '../config/db.js'

/**
 * Adiciona uma avaliação a um restaurante e recalcula a nota média no MySQL
 */
export async function addReview(req, res) {
  const pool = getPool()
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const { restaurantId } = req.params
    const { author, authorEmail, stars, comment } = req.body

    if (!restaurantId || !comment || stars === undefined) {
      await connection.rollback()
      return res.status(400).json({ success: false, message: 'Dados da avaliação incompletos.' })
    }

    // Verificar se restaurante existe
    const [restRows] = await connection.query('SELECT id FROM restaurants WHERE id = ?', [restaurantId])
    if (restRows.length === 0) {
      await connection.rollback()
      return res.status(404).json({ success: false, message: 'Restaurante não encontrado.' })
    }

    const reviewId = 'rev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)
    const createdAt = new Date().toLocaleDateString('pt-BR')
    const finalStars = Math.max(1, Math.min(5, Number(stars) || 5))

    // Inserir avaliação
    await connection.query(
      `INSERT INTO reviews (id, restaurant_id, author, author_email, stars, comment, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        reviewId,
        restaurantId,
        author?.trim() || 'Usuário Anônimo',
        authorEmail?.trim() || null,
        finalStars,
        comment.trim(),
        createdAt,
      ]
    )

    // Recalcular média de estrelas
    const [ratingRows] = await connection.query(
      'SELECT AVG(stars) AS avgRating, COUNT(*) AS countReviews FROM reviews WHERE restaurant_id = ?',
      [restaurantId]
    )

    const avgNum = Number(ratingRows[0]?.avgRating) || 5.0
    const newRating = Number(avgNum.toFixed(1))
    await connection.query('UPDATE restaurants SET rating = ? WHERE id = ?', [newRating, restaurantId])

    await connection.commit()

    const reviewData = {
      id: reviewId,
      restaurantId,
      author: author?.trim() || 'Usuário Anônimo',
      authorEmail: authorEmail?.trim() || null,
      stars: finalStars,
      comment: comment.trim(),
      createdAt,
    }

    res.status(201).json({ success: true, data: reviewData, newRating })
  } catch (error) {
    await connection.rollback()
    console.error('Erro ao adicionar avaliação:', error)
    res.status(500).json({ success: false, message: 'Erro ao salvar avaliação no banco.', error: error.message })
  } finally {
    connection.release()
  }
}
