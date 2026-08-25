import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

import {
  getAllRestaurants,
  getRestaurantById,
  createRestaurant,
  verifyRestaurant,
} from './controllers/restaurantController.js'
import { addReview } from './controllers/reviewController.js'
import { getAllReports, submitFraudReport } from './controllers/reportController.js'
import { login, register } from './controllers/authController.js'
import { getDbHealth, getDbStats, runDbInit } from './controllers/dbController.js'
import { testConnection } from './config/db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const app = express()
const PORT = process.env.PORT || 3001

// Middlewares
app.use(cors())
app.use(express.json())

// Log de requisições simples
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`)
  next()
})

// ==========================================
// ROTAS DE STATUS E DIAGNÓSTICO DO BANCO
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Guia Sabor Crítico API', timestamp: new Date().toISOString() })
})
app.get('/api/db/health', getDbHealth)
app.get('/api/db/stats', getDbStats)
app.post('/api/db/init', runDbInit)

// ==========================================
// ROTAS DE RESTAURANTES
// ==========================================
app.get('/api/restaurants', getAllRestaurants)
app.get('/api/restaurants/:id', getRestaurantById)
app.post('/api/restaurants', createRestaurant)
app.post('/api/restaurants/:id/verify', verifyRestaurant)

// ==========================================
// ROTAS DE AVALIAÇÕES
// ==========================================
app.post('/api/restaurants/:restaurantId/reviews', addReview)

// ==========================================
// ROTAS DE DENÚNCIAS E SEGURANÇA
// ==========================================
app.get('/api/reports', getAllReports)
app.post('/api/reports', submitFraudReport)

// ==========================================
// ROTAS DE AUTENTICAÇÃO
// ==========================================
app.post('/api/auth/login', login)
app.post('/api/auth/register', register)

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`\n==================================================`)
  console.log(`🟢 Servidor Backend rodando em: http://localhost:${PORT}`)
  console.log(`==================================================`)

  // Testar conexão inicial com MySQL
  const health = await testConnection()
  if (health.connected) {
    console.log(`✅ Conectado com sucesso ao MySQL (${health.database} @ ${health.host}:${health.port})`)
  } else {
    console.warn(`⚠️ Não foi possível conectar ao MySQL automaticamente (${health.error || 'Verifique o .env'}).`)
    console.warn(`💡 O servidor está pronto. Você pode inicializar o banco executando 'npm run db:init'.\n`)
  }
})

export default app
