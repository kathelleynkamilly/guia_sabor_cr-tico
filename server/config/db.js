import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Carregar variáveis de ambiente da raiz do projeto
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'guia_sabor_critico',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  charset: 'utf8mb4',
}

let pool = null

export function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig)
  }
  return pool
}

/**
 * Testa a conexão com o banco de dados MySQL
 */
export async function testConnection() {
  try {
    const currentPool = getPool()
    const connection = await currentPool.getConnection()
    await connection.ping()
    connection.release()
    return {
      connected: true,
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
    }
  } catch (error) {
    return {
      connected: false,
      error: error.message,
      code: error.code,
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
    }
  }
}

/**
 * Executa uma consulta SQL parametrizada
 */
export async function query(sql, params = []) {
  const currentPool = getPool()
  const [rows] = await currentPool.query(sql, params)
  return rows
}

export default {
  getPool,
  testConnection,
  query,
  dbConfig,
}
