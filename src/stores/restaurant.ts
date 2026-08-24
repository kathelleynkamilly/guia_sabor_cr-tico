import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Restaurant, Review, MenuItem } from '../types/restaurant'
import { INITIAL_RESTAURANTS } from '../data/initialRestaurants'

const STORAGE_RESTAURANTS_KEY = 'guia_sabor_restaurants_v2'

export const useRestaurantStore = defineStore('restaurant', () => {
  // Estado inicial carregado do localStorage ou fallback para dados mock
  const restaurants = ref<Restaurant[]>([])
  const selectedRestaurantId = ref<string | null>(null)

  // Filtros de busca
  const searchQuery = ref<string>('')
  const selectedCuisine = ref<string>('')
  const selectedCity = ref<string>('')

  // Modal de cadastro de restaurante
  const isAddRestaurantModalOpen = ref<boolean>(false)

  // Inicialização
  function loadRestaurants() {
    try {
      const saved = localStorage.getItem(STORAGE_RESTAURANTS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          restaurants.value = parsed
          return
        }
      }
    } catch (error) {
      console.error('Erro ao ler restaurantes do localStorage:', error)
    }
    // Caso padrão
    restaurants.value = [...INITIAL_RESTAURANTS]
    saveToStorage()
  }

  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_RESTAURANTS_KEY, JSON.stringify(restaurants.value))
    } catch (error) {
      console.error('Erro ao salvar restaurantes no localStorage:', error)
    }
  }

  loadRestaurants()

  // Getters / Computados
  const cuisinesList = computed(() => {
    const set = new Set<string>()
    restaurants.value.forEach(r => {
      if (r.cuisine) set.add(r.cuisine)
    })
    return Array.from(set).sort()
  })

  const citiesList = computed(() => {
    const set = new Set<string>()
    restaurants.value.forEach(r => {
      if (r.city) set.add(r.city)
    })
    return Array.from(set).sort()
  })

  const filteredRestaurants = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()
    const cuisineFilter = selectedCuisine.value
    const cityFilter = selectedCity.value

    return restaurants.value.filter(res => {
      // Filtro de texto (nome, cozinha, cidade ou endereço)
      const matchesQuery =
        !query ||
        res.name.toLowerCase().includes(query) ||
        res.cuisine.toLowerCase().includes(query) ||
        res.city.toLowerCase().includes(query) ||
        res.address.toLowerCase().includes(query)

      // Filtro de culinária
      const matchesCuisine = !cuisineFilter || res.cuisine === cuisineFilter

      // Filtro de cidade
      const matchesCity = !cityFilter || res.city === cityFilter

      return matchesQuery && matchesCuisine && matchesCity
    })
  })

  const selectedRestaurant = computed(() => {
    if (!selectedRestaurantId.value) return null
    return restaurants.value.find(r => r.id === selectedRestaurantId.value) || null
  })

  const hasActiveFilters = computed(() => {
    return !!searchQuery.value || !!selectedCuisine.value || !!selectedCity.value
  })

  // Ações
  function selectRestaurant(id: string | null) {
    selectedRestaurantId.value = id
  }

  function getRestaurantById(id: string): Restaurant | undefined {
    return restaurants.value.find(r => r.id === id)
  }

  function resetFilters() {
    searchQuery.value = ''
    selectedCuisine.value = ''
    selectedCity.value = ''
  }

  function openAddRestaurantModal() {
    isAddRestaurantModalOpen.value = true
  }

  function closeAddRestaurantModal() {
    isAddRestaurantModalOpen.value = false
  }

  function addRestaurant(newRes: {
    name: string
    cuisine: string
    address: string
    city: string
    hours: string
    description?: string
    priceRange?: 'R$' | 'R$$' | 'R$$$' | 'R$$$$'
    phone?: string
    website?: string
    amenities?: string[]
    menu?: MenuItem[]
  }): Restaurant {
    const created: Restaurant = {
      id: 'rest-' + Date.now(),
      name: newRes.name.trim(),
      cuisine: newRes.cuisine.trim(),
      address: newRes.address.trim(),
      city: newRes.city.trim(),
      hours: newRes.hours.trim() || 'Seg - Dom: 11h às 23h',
      rating: 5.0,
      description: newRes.description?.trim() || '',
      priceRange: newRes.priceRange || 'R$$',
      phone: newRes.phone?.trim() || '',
      website: newRes.website?.trim() || '',
      amenities: newRes.amenities || ['Wi-Fi Grátis', 'Ar Condicionado', 'Aceita Cartões e Pix'],
      menu: newRes.menu || [],
      reviews: [
        {
          id: 'rev-' + Date.now(),
          author: 'Equipe Guia Sabor',
          stars: 5,
          comment: 'Restaurante recém cadastrado na plataforma. Seja o primeiro cliente a avaliar!',
          createdAt: new Date().toLocaleDateString('pt-BR'),
        },
      ],
    }

    restaurants.value.unshift(created)
    saveToStorage()
    return created
  }

  function addReview(
    restaurantId: string,
    author: string,
    stars: number,
    comment: string,
    authorEmail?: string
  ): boolean {
    const targetRestaurant = restaurants.value.find(r => r.id === restaurantId)
    if (!targetRestaurant) return false

    const newReview: Review = {
      id: 'rev-' + Date.now(),
      author: author.trim() || 'Usuário Anônimo',
      authorEmail,
      stars: Math.max(1, Math.min(5, stars)),
      comment: comment.trim(),
      createdAt: new Date().toLocaleDateString('pt-BR'),
    }

    targetRestaurant.reviews.unshift(newReview)

    // Recalcular nota média
    const totalStars = targetRestaurant.reviews.reduce((acc, curr) => acc + curr.stars, 0)
    targetRestaurant.rating = Number((totalStars / targetRestaurant.reviews.length).toFixed(1))

    saveToStorage()
    return true
  }

  return {
    restaurants,
    selectedRestaurantId,
    searchQuery,
    selectedCuisine,
    selectedCity,
    isAddRestaurantModalOpen,
    cuisinesList,
    citiesList,
    filteredRestaurants,
    selectedRestaurant,
    hasActiveFilters,
    selectRestaurant,
    getRestaurantById,
    resetFilters,
    openAddRestaurantModal,
    closeAddRestaurantModal,
    addRestaurant,
    addReview,
    loadRestaurants,
  }
})

