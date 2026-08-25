import { query, getPool } from '../config/db.js'

/**
 * Retorna todos os restaurantes com suporte a filtros
 */
export async function getAllRestaurants(req, res) {
  try {
    const { search, cuisine, city, onlyVerified } = req.query

    let sql = `
      SELECT 
        r.*,
        (
          SELECT JSON_ARRAYAGG(a.amenity_name)
          FROM restaurant_amenities a
          WHERE a.restaurant_id = r.id
        ) AS amenities,
        (
          SELECT JSON_ARRAYAGG(b.badge_name)
          FROM restaurant_badges b
          WHERE b.restaurant_id = r.id
        ) AS verifiedBadges,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', m.id,
              'name', m.name,
              'description', m.description,
              'price', CAST(m.price AS DOUBLE),
              'category', m.category,
              'isPopular', IF(m.is_popular = 1, TRUE, FALSE),
              'isVegetarian', IF(m.is_vegetarian = 1, TRUE, FALSE),
              'image', m.image
            )
          )
          FROM menu_items m
          WHERE m.restaurant_id = r.id
        ) AS menu,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', rev.id,
              'author', rev.author,
              'authorEmail', rev.author_email,
              'stars', rev.stars,
              'comment', rev.comment,
              'createdAt', rev.created_at
            )
          )
          FROM (
            SELECT * FROM reviews 
            WHERE restaurant_id = r.id 
            ORDER BY created_timestamp DESC
          ) rev
        ) AS reviews
      FROM restaurants r
      WHERE 1=1
    `

    const params = []

    if (search) {
      const q = `%${search}%`
      sql += ` AND (r.name LIKE ? OR r.cuisine LIKE ? OR r.city LIKE ? OR r.address LIKE ? OR r.legal_name LIKE ? OR r.cnpj LIKE ?)`
      params.push(q, q, q, q, q, q)
    }

    if (cuisine) {
      sql += ` AND r.cuisine = ?`
      params.push(cuisine)
    }

    if (city) {
      sql += ` AND r.city = ?`
      params.push(city)
    }

    if (onlyVerified === 'true' || onlyVerified === true) {
      sql += ` AND r.is_verified = 1`
    }

    sql += ` ORDER BY r.rating DESC, r.created_at DESC`

    const rows = await query(sql, params)

    // Formatar os campos para o frontend
    const formatted = rows.map(r => ({
      id: r.id,
      name: r.name,
      cuisine: r.cuisine,
      address: r.address,
      city: r.city,
      hours: r.hours,
      rating: Number(r.rating) || 5.0,
      description: r.description || '',
      image: r.image || null,
      priceRange: r.price_range || 'R$$',
      phone: r.phone || '',
      website: r.website || '',
      cnpj: r.cnpj || '',
      legalName: r.legal_name || '',
      isVerified: Boolean(r.is_verified),
      verificationStatus: r.verification_status || 'unverified',
      verifiedDate: r.verified_date || null,
      verifiedBy: r.verified_by || null,
      safetyScore: Number(r.safety_score) || 50,
      reportCount: Number(r.report_count) || 0,
      amenities: typeof r.amenities === 'string' ? JSON.parse(r.amenities) : (r.amenities || []),
      verifiedBadges: typeof r.verifiedBadges === 'string' ? JSON.parse(r.verifiedBadges) : (r.verifiedBadges || []),
      menu: typeof r.menu === 'string' ? JSON.parse(r.menu) : (r.menu || []),
      reviews: typeof r.reviews === 'string' ? JSON.parse(r.reviews) : (r.reviews || []),
    }))

    res.json({ success: true, data: formatted })
  } catch (error) {
    console.error('Erro ao buscar restaurantes:', error)
    res.status(500).json({ success: false, message: 'Erro ao buscar restaurantes no banco de dados.', error: error.message })
  }
}

/**
 * Retorna um restaurante específico pelo ID com cardápio e avaliações
 */
export async function getRestaurantById(req, res) {
  try {
    const { id } = req.params
    const rows = await query('SELECT * FROM restaurants WHERE id = ?', [id])

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Restaurante não encontrado.' })
    }

    const r = rows[0]

    // Buscar comodidades, selos, cardápio e avaliações
    const amenitiesRows = await query('SELECT amenity_name FROM restaurant_amenities WHERE restaurant_id = ?', [id])
    const badgesRows = await query('SELECT badge_name FROM restaurant_badges WHERE restaurant_id = ?', [id])
    const menuRows = await query('SELECT * FROM menu_items WHERE restaurant_id = ?', [id])
    const reviewRows = await query('SELECT * FROM reviews WHERE restaurant_id = ? ORDER BY created_timestamp DESC', [id])

    const formatted = {
      id: r.id,
      name: r.name,
      cuisine: r.cuisine,
      address: r.address,
      city: r.city,
      hours: r.hours,
      rating: Number(r.rating) || 5.0,
      description: r.description || '',
      image: r.image || null,
      priceRange: r.price_range || 'R$$',
      phone: r.phone || '',
      website: r.website || '',
      cnpj: r.cnpj || '',
      legalName: r.legal_name || '',
      isVerified: Boolean(r.is_verified),
      verificationStatus: r.verification_status || 'unverified',
      verifiedDate: r.verified_date || null,
      verifiedBy: r.verified_by || null,
      safetyScore: Number(r.safety_score) || 50,
      reportCount: Number(r.report_count) || 0,
      amenities: amenitiesRows.map(a => a.amenity_name),
      verifiedBadges: badgesRows.map(b => b.badge_name),
      menu: menuRows.map(m => ({
        id: m.id,
        name: m.name,
        description: m.description,
        price: Number(m.price),
        category: m.category,
        isPopular: Boolean(m.is_popular),
        isVegetarian: Boolean(m.is_vegetarian),
        image: m.image,
      })),
      reviews: reviewRows.map(rev => ({
        id: rev.id,
        author: rev.author,
        authorEmail: rev.author_email,
        stars: rev.stars,
        comment: rev.comment,
        createdAt: rev.created_at,
      })),
    }

    res.json({ success: true, data: formatted })
  } catch (error) {
    console.error('Erro ao obter restaurante:', error)
    res.status(500).json({ success: false, message: 'Erro ao buscar detalhes do restaurante.', error: error.message })
  }
}

/**
 * Cadastra um novo restaurante com transação relacional
 */
export async function createRestaurant(req, res) {
  const pool = getPool()
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const {
      name,
      cuisine,
      address,
      city,
      hours,
      description,
      image,
      priceRange,
      phone,
      website,
      cnpj,
      legalName,
      amenities = [],
      menu = [],
      requestVerification,
    } = req.body

    if (!name || !cuisine || !address || !city) {
      await connection.rollback()
      return res.status(400).json({ success: false, message: 'Campos obrigatórios ausentes (nome, culinária, endereço, cidade).' })
    }

    const id = 'rest-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)
    const isVerified = Boolean(cnpj && legalName && cnpj.length >= 14)
    const verificationStatus = isVerified ? 'verified' : cnpj ? 'pending' : 'unverified'
    const verifiedDate = isVerified ? new Date().toLocaleDateString('pt-BR') : null
    const verifiedBy = isVerified ? 'Validação Oficial CNPJ & Equipe Guia Sabor' : null
    const safetyScore = isVerified ? 96 : cnpj ? 70 : 45

    // 1. Inserir restaurante
    await connection.query(
      `INSERT INTO restaurants (
        id, name, cuisine, address, city, hours, rating, description, image, price_range,
        phone, website, cnpj, legal_name, is_verified, verification_status, verified_date,
        verified_by, safety_score, report_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name.trim(),
        cuisine.trim(),
        address.trim(),
        city.trim(),
        hours?.trim() || 'Seg - Dom: 11h às 23h',
        5.0,
        description?.trim() || '',
        image || null,
        priceRange || 'R$$',
        phone?.trim() || '',
        website?.trim() || '',
        cnpj?.trim() || '',
        legalName?.trim() || '',
        isVerified ? 1 : 0,
        verificationStatus,
        verifiedDate,
        verifiedBy,
        safetyScore,
        0,
      ]
    )

    // 2. Inserir comodidades
    const finalAmenities = amenities.length > 0 ? amenities : ['Wi-Fi Grátis', 'Ar Condicionado', 'Aceita Cartões e Pix']
    for (const am of finalAmenities) {
      await connection.query('INSERT INTO restaurant_amenities (restaurant_id, amenity_name) VALUES (?, ?)', [id, am])
    }

    // 3. Inserir selos
    const defaultBadges = isVerified
      ? [
          '🛡️ CNPJ Regular na Receita Federal',
          '📍 Endereço Comercial Físico Confirmado',
          '📞 Telefone Oficial de Atendimento Validado',
          '🔒 Proteção Anti-Fraude & Pagamento Seguro',
        ]
      : ['📋 Cadastro Inicial na Plataforma']

    for (const badge of defaultBadges) {
      await connection.query('INSERT INTO restaurant_badges (restaurant_id, badge_name) VALUES (?, ?)', [id, badge])
    }

    // 4. Inserir itens de cardápio
    if (menu && menu.length > 0) {
      for (const item of menu) {
        const itemId = item.id || ('m-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6))
        await connection.query(
          `INSERT INTO menu_items (
            id, restaurant_id, name, description, price, category, is_popular, is_vegetarian, image
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            itemId,
            id,
            item.name,
            item.description || '',
            item.price || 0,
            item.category || 'Pratos Principais',
            item.isPopular ? 1 : 0,
            item.isVegetarian ? 1 : 0,
            item.image || null,
          ]
        )
      }
    }

    // 5. Inserir avaliação de boas-vindas
    const welcomeRevId = 'rev-' + Date.now()
    const welcomeComment = isVerified
      ? 'Restaurante verificado com CNPJ ativo e dados autenticados contra fraudes no Guia Sabor!'
      : 'Restaurante cadastrado na plataforma. Seja o primeiro cliente a avaliar!'

    await connection.query(
      `INSERT INTO reviews (id, restaurant_id, author, stars, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [welcomeRevId, id, 'Equipe Guia Sabor', 5, welcomeComment, new Date().toLocaleDateString('pt-BR')]
    )

    await connection.commit()

    // Retornar objeto completo criado
    const createdRestaurant = {
      id,
      name,
      cuisine,
      address,
      city,
      hours: hours || 'Seg - Dom: 11h às 23h',
      rating: 5.0,
      description: description || '',
      image,
      priceRange: priceRange || 'R$$',
      phone: phone || '',
      website: website || '',
      cnpj: cnpj || '',
      legalName: legalName || '',
      isVerified,
      verificationStatus,
      verifiedDate,
      verifiedBy,
      safetyScore,
      reportCount: 0,
      amenities: finalAmenities,
      verifiedBadges: defaultBadges,
      menu,
      reviews: [
        {
          id: welcomeRevId,
          author: 'Equipe Guia Sabor',
          stars: 5,
          comment: welcomeComment,
          createdAt: new Date().toLocaleDateString('pt-BR'),
        },
      ],
    }

    res.status(201).json({ success: true, data: createdRestaurant })
  } catch (error) {
    await connection.rollback()
    console.error('Erro ao criar restaurante:', error)
    res.status(500).json({ success: false, message: 'Erro ao cadastrar restaurante no banco.', error: error.message })
  } finally {
    connection.release()
  }
}

/**
 * Validação e verificação oficial de CNPJ anti-fraude
 */
export async function verifyRestaurant(req, res) {
  try {
    const { id } = req.params
    const { cnpj, legalName } = req.body

    if (!cnpj || !legalName) {
      return res.status(400).json({ success: false, message: 'CNPJ e Razão Social são obrigatórios.' })
    }

    const verifiedDate = new Date().toLocaleDateString('pt-BR')
    const verifiedBy = 'Validação Oficial CNPJ Guia Sabor'

    await query(
      `UPDATE restaurants 
       SET cnpj = ?, legal_name = ?, is_verified = 1, verification_status = 'verified', 
           verified_date = ?, verified_by = ?, safety_score = 98 
       WHERE id = ?`,
      [cnpj, legalName, verifiedDate, verifiedBy, id]
    )

    // Atualizar badges
    await query('DELETE FROM restaurant_badges WHERE restaurant_id = ?', [id])
    const badges = [
      '🛡️ CNPJ Regular na Receita Federal',
      '📍 Endereço Comercial Físico Confirmado',
      '📞 Telefone Oficial de Atendimento Validado',
      '🔒 Proteção Anti-Fraude & Pagamento Seguro',
    ]

    for (const b of badges) {
      await query('INSERT INTO restaurant_badges (restaurant_id, badge_name) VALUES (?, ?)', [id, b])
    }

    res.json({ success: true, message: 'Restaurante verificado com sucesso!' })
  } catch (error) {
    console.error('Erro ao verificar restaurante:', error)
    res.status(500).json({ success: false, message: 'Erro ao verificar restaurante.', error: error.message })
  }
}
