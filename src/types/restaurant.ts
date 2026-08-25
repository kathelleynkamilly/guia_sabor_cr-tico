export interface Review {
  id: string
  author: string
  authorEmail?: string
  stars: number
  comment: string
  createdAt: string
}

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: 'Entradas' | 'Pratos Principais' | 'Sobremesas' | 'Bebidas'
  isPopular?: boolean
  isVegetarian?: boolean
  image?: string
}

export interface FraudReport {
  id: string
  restaurantId: string
  restaurantName: string
  reporterName: string
  reporterEmail?: string
  reason:
    | 'perfil_falso'
    | 'golpe_pix'
    | 'endereco_inexistente'
    | 'cardapio_fraudulento'
    | 'marca_clonada'
    | 'outro'
  description: string
  createdAt: string
  status: 'em_analise' | 'resolvido'
}

export interface Restaurant {
  id: string
  name: string
  cuisine: string
  address: string
  city: string
  hours: string
  rating: number
  reviews: Review[]
  description?: string
  image?: string
  priceRange?: 'R$' | 'R$$' | 'R$$$' | 'R$$$$'
  phone?: string
  website?: string
  amenities?: string[]
  menu?: MenuItem[]
  // Campos de Segurança e Verificação Anti-Golpe
  cnpj?: string
  legalName?: string
  isVerified?: boolean
  verificationStatus?: 'verified' | 'pending' | 'unverified'
  verifiedDate?: string
  verifiedBy?: string
  safetyScore?: number
  verifiedBadges?: string[]
  reportCount?: number
}

export interface RestaurantFilters {
  search: string
  cuisine: string
  city: string
  onlyVerified?: boolean
}

