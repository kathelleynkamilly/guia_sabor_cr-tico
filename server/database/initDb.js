import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { SEED_USERS, SEED_RESTAURANTS } from './seedData.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'guia_sabor_critico',
}

async function initDatabase() {
  console.log('\n🚀 [MySQL Init] Iniciando configuração do Banco de Dados...')
  console.log(`📡 Conectando ao MySQL em ${dbConfig.host}:${dbConfig.port} (Usuário: ${dbConfig.user})...`)

  let connection = null

  try {
    // 1. Conectar ao servidor MySQL sem especificar banco para poder criá-lo
    connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      multipleStatements: true,
    })

    console.log('✅ Conexão inicial com o servidor MySQL estabelecida com sucesso!')

    // 2. Criar Banco de Dados se não existir
    console.log(`📦 Criando banco de dados '${dbConfig.database}' se não existir...`)
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    )
    await connection.query(`USE \`${dbConfig.database}\`;`)
    console.log(`✅ Banco de dados '${dbConfig.database}' pronto!`)

    // 3. Executar DDL do Schema
    const schemaPath = path.resolve(__dirname, 'schema.sql')
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8')
      console.log('🏗️ Criando tabelas e chaves relacionais...')
      await connection.query(schemaSql)
      console.log('✅ Tabelas criadas com sucesso (users, restaurants, restaurant_amenities, restaurant_badges, menu_items, reviews, fraud_reports)!')
    }

    // 4. Seed de Usuários
    console.log('👤 Verificando dados de usuários...')
    for (const u of SEED_USERS) {
      const [existing] = await connection.query('SELECT id FROM users WHERE id = ? OR email = ?', [u.id, u.email])
      if (existing.length === 0) {
        await connection.query(
          'INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [u.id, u.name, u.email, u.password_hash, u.role, u.created_at]
        )
      }
    }
    console.log(`✅ Usuários verificados/inseridos (${SEED_USERS.length} registros padrão).`)

    // 5. Seed de Restaurantes e Relacionamentos
    console.log('🍽️ Verificando e populando catálogo de restaurantes...')
    let insertedCount = 0

    for (const r of SEED_RESTAURANTS) {
      const [existing] = await connection.query('SELECT id FROM restaurants WHERE id = ?', [r.id])
      if (existing.length === 0) {
        // Inserir restaurante principal
        await connection.query(
          `INSERT INTO restaurants (
            id, name, cuisine, address, city, hours, rating, description, image, price_range,
            phone, website, cnpj, legal_name, is_verified, verification_status, verified_date,
            verified_by, safety_score, report_count
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            r.id,
            r.name,
            r.cuisine,
            r.address,
            r.city,
            r.hours,
            r.rating,
            r.description || '',
            r.image || null,
            r.priceRange || 'R$$',
            r.phone || '',
            r.website || '',
            r.cnpj || '',
            r.legalName || '',
            r.isVerified ? 1 : 0,
            r.verificationStatus || 'unverified',
            r.verifiedDate || null,
            r.verifiedBy || null,
            r.safetyScore || 50,
            r.reportCount || 0,
          ]
        )

        // Inserir comodidades (amenities)
        if (r.amenities && Array.isArray(r.amenities)) {
          for (const amenity of r.amenities) {
            await connection.query(
              'INSERT INTO restaurant_amenities (restaurant_id, amenity_name) VALUES (?, ?)',
              [r.id, amenity]
            )
          }
        }

        // Inserir selos de verificação
        if (r.verifiedBadges && Array.isArray(r.verifiedBadges)) {
          for (const badge of r.verifiedBadges) {
            await connection.query(
              'INSERT INTO restaurant_badges (restaurant_id, badge_name) VALUES (?, ?)',
              [r.id, badge]
            )
          }
        }

        // Inserir pratos do cardápio (menu_items)
        if (r.menu && Array.isArray(r.menu)) {
          for (const item of r.menu) {
            await connection.query(
              `INSERT INTO menu_items (
                id, restaurant_id, name, description, price, category, is_popular, is_vegetarian, image
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                item.id,
                r.id,
                item.name,
                item.description || '',
                item.price,
                item.category || 'Pratos Principais',
                item.isPopular ? 1 : 0,
                item.isVegetarian ? 1 : 0,
                item.image || null,
              ]
            )
          }
        }

        // Inserir avaliações (reviews)
        if (r.reviews && Array.isArray(r.reviews)) {
          for (const rev of r.reviews) {
            await connection.query(
              `INSERT INTO reviews (
                id, restaurant_id, author, author_email, stars, comment, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                rev.id,
                r.id,
                rev.author,
                rev.authorEmail || null,
                rev.stars,
                rev.comment,
                rev.createdAt,
              ]
            )
          }
        }

        insertedCount++
      }
    }

    console.log(`✅ Restaurantes inicializados com sucesso (${insertedCount} novos restaurantes inseridos com cardápios, selos e avaliações)!`)

    // Estatísticas finais
    const [[{ totalRestaurants }]] = await connection.query('SELECT COUNT(*) AS totalRestaurants FROM restaurants')
    const [[{ totalMenuItems }]] = await connection.query('SELECT COUNT(*) AS totalMenuItems FROM menu_items')
    const [[{ totalReviews }]] = await connection.query('SELECT COUNT(*) AS totalReviews FROM reviews')
    const [[{ totalUsers }]] = await connection.query('SELECT COUNT(*) AS totalUsers FROM users')

    console.log('\n📊 [Resumo do Banco de Dados MySQL]')
    console.log(`   🍽️ Restaurantes cadastrados: ${totalRestaurants}`)
    console.log(`   📋 Pratos nos Cardápios: ${totalMenuItems}`)
    console.log(`   ⭐ Avaliações registradas: ${totalReviews}`)
    console.log(`   👤 Usuários: ${totalUsers}`)
    console.log('✨ Banco de Dados MySQL configurado e pronto para uso!\n')

    await connection.end()
    return true
  } catch (error) {
    console.error('\n❌ [Erro ao inicializar MySQL]:', error.message)
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('💡 Dica: Verifique o usuário e senha do MySQL no arquivo .env (DB_USER e DB_PASSWORD).')
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Dica: O serviço MySQL não respondeu na porta 3306. Verifique se o MySQL Server está em execução.')
    }
    if (connection) {
      await connection.end().catch(() => {})
    }
    return false
  }
}

// Executar se chamado diretamente
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initDatabase().then(success => {
    process.exit(success ? 0 : 1)
  })
}

export default initDatabase
