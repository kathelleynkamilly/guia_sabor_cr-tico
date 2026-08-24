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
}

export interface RestaurantFilters {
  search: string
  cuisine: string
  city: string
}

