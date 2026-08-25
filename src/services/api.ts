import type { Restaurant, Review, MenuItem, FraudReport } from '../types/restaurant'
import type { User } from '../types/auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

/**
 * Cliente HTTP para a API REST do Guia Sabor Crítico (MySQL)
 */
export const api = {
  /**
   * Verifica a saúde e status de conexão com o banco de dados MySQL
   */
  async getDbHealth(): Promise<{ connected: boolean; host?: string; port?: number; database?: string; user?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/db/health`)
      if (!res.ok) throw new Error(`HTTP error ${res.status}`)
      const data = await res.json()
      return data.data || { connected: false }
    } catch (err: any) {
      return { connected: false, error: err.message }
    }
  },

  /**
   * Obtém estatísticas em tempo real do banco de dados MySQL
   */
  async getDbStats(): Promise<{
    totalRestaurants: number
    totalVerified: number
    totalMenuItems: number
    totalReviews: number
    totalReports: number
    totalUsers: number
  } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/db/stats`)
      if (!res.ok) return null
      const json = await res.json()
      return json.data || null
    } catch {
      return null
    }
  },

  /**
   * Dispara a inicialização / seed do banco de dados
   */
  async initDb(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/db/init`, { method: 'POST' })
      return res.ok
    } catch {
      return false
    }
  },

  /**
   * Busca todos os restaurantes com suporte a filtros opcionais
   */
  async getRestaurants(filters?: {
    search?: string
    cuisine?: string
    city?: string
    onlyVerified?: boolean
  }): Promise<Restaurant[]> {
    const params = new URLSearchParams()
    if (filters?.search) params.append('search', filters.search)
    if (filters?.cuisine) params.append('cuisine', filters.cuisine)
    if (filters?.city) params.append('city', filters.city)
    if (filters?.onlyVerified) params.append('onlyVerified', 'true')

    const url = `${API_BASE_URL}/restaurants${params.toString() ? '?' + params.toString() : ''}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Erro ao buscar restaurantes (Status ${res.status})`)
    const json = await res.json()
    return json.data || []
  },

  /**
   * Busca um restaurante específico pelo ID
   */
  async getRestaurantById(id: string): Promise<Restaurant | null> {
    const res = await fetch(`${API_BASE_URL}/restaurants/${encodeURIComponent(id)}`)
    if (!res.ok) return null
    const json = await res.json()
    return json.data || null
  },

  /**
   * Cadastra um novo restaurante no MySQL
   */
  async createRestaurant(restaurantData: {
    name: string
    cuisine: string
    address: string
    city: string
    hours?: string
    description?: string
    priceRange?: 'R$' | 'R$$' | 'R$$$' | 'R$$$$'
    phone?: string
    website?: string
    amenities?: string[]
    menu?: MenuItem[]
    cnpj?: string
    legalName?: string
    requestVerification?: boolean
  }): Promise<Restaurant> {
    const res = await fetch(`${API_BASE_URL}/restaurants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(restaurantData),
    })
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}))
      throw new Error(errorJson.message || `Erro ao cadastrar restaurante (Status ${res.status})`)
    }
    const json = await res.json()
    return json.data
  },

  /**
   * Valida e verifica oficialmente o restaurante contra fraudes
   */
  async verifyRestaurant(id: string, cnpj: string, legalName: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/restaurants/${encodeURIComponent(id)}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cnpj, legalName }),
    })
    return res.ok
  },

  /**
   * Adiciona uma avaliação e recalcula nota no MySQL
   */
  async addReview(
    restaurantId: string,
    reviewData: {
      author: string
      authorEmail?: string
      stars: number
      comment: string
    }
  ): Promise<{ review: Review; newRating: number }> {
    const res = await fetch(`${API_BASE_URL}/restaurants/${encodeURIComponent(restaurantId)}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData),
    })
    if (!res.ok) {
      throw new Error(`Erro ao enviar avaliação (Status ${res.status})`)
    }
    const json = await res.json()
    return { review: json.data, newRating: json.newRating }
  },

  /**
   * Retorna todas as denúncias de fraudes
   */
  async getFraudReports(): Promise<FraudReport[]> {
    const res = await fetch(`${API_BASE_URL}/reports`)
    if (!res.ok) return []
    const json = await res.json()
    return json.data || []
  },

  /**
   * Registra uma nova denúncia no MySQL
   */
  async submitFraudReport(data: {
    restaurantId: string
    restaurantName: string
    reporterName: string
    reporterEmail?: string
    reason: FraudReport['reason']
    description: string
  }): Promise<FraudReport> {
    const res = await fetch(`${API_BASE_URL}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      throw new Error(`Erro ao enviar denúncia (Status ${res.status})`)
    }
    const json = await res.json()
    return json.data
  },

  /**
   * Autentica o usuário no MySQL
   */
  async login(email: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const json = await res.json()
    if (!res.ok || !json.success) {
      return { success: false, message: json.message || 'Falha ao autenticar.' }
    }
    return { success: true, user: json.user }
  },

  /**
   * Cadastra um novo usuário no MySQL
   */
  async register(
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: User; message?: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    const json = await res.json()
    if (!res.ok || !json.success) {
      return { success: false, message: json.message || 'Falha ao registrar usuário.' }
    }
    return { success: true, user: json.user }
  },
}
