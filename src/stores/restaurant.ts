import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Restaurant, Review, MenuItem, FraudReport } from '../types/restaurant'
import { INITIAL_RESTAURANTS } from '../data/initialRestaurants'
import { validateCNPJ, getSafetyBadges } from '../utils/verification'
import { api } from '../services/api'

const STORAGE_RESTAURANTS_KEY = 'guia_sabor_restaurants_v6'
const STORAGE_FRAUD_REPORTS_KEY = 'guia_sabor_fraud_reports_v1'

export function getDefaultMenuForCuisine(cuisine: string): MenuItem[] {
  const c = cuisine.toLowerCase()

  if (c.includes('italia') || c.includes('massa') || c.includes('pizza')) {
    return [
      {
        id: 'm-def-1',
        name: 'Bruschetta Tradizionale Pomodoro',
        description: 'Pão italiano artesanal tostado com tomates frescos, azeite extravirgem e manjericão.',
        price: 32.0,
        category: 'Entradas',
        isVegetarian: true,
        image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: 'm-def-2',
        name: 'Fettuccine Especial da Casa',
        description: 'Massa fresca artesanal com emulsão de manteiga trufada, parmesão e cogumelos.',
        price: 68.0,
        category: 'Pratos Principais',
        isPopular: true,
        image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281084?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: 'm-def-3',
        name: 'Tiramisù Clássico Italiano',
        description: 'Camadas de mascarpone, café expresso e cacau puro 100%.',
        price: 26.0,
        category: 'Sobremesas',
        isPopular: true,
        image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: 'm-def-4',
        name: 'Vinho Tinto Selecionado (Taça)',
        description: 'Vinho encorpado com notas de frutas vermelhas e carvalho.',
        price: 34.0,
        category: 'Bebidas',
        image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
      },
    ]
  }

  if (c.includes('japon') || c.includes('oriental') || c.includes('sushi')) {
    return [
      {
        id: 'm-def-1',
        name: 'Sunomono Especial com Gergelim',
        description: 'Finas lâminas de pepino agridoce e sementes de gergelim tostadas.',
        price: 28.0,
        category: 'Entradas',
        isVegetarian: true,
        image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: 'm-def-2',
        name: 'Combo Especial do Chef (16 peças)',
        description: 'Sashimis de salmão fresco, nigiris trufados e uramakis autorais.',
        price: 98.0,
        category: 'Pratos Principais',
        isPopular: true,
        image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: 'm-def-3',
        name: 'Mochi Artesanal de Matcha',
        description: 'Massa elástica de arroz com sorvete cremoso de chá verde.',
        price: 22.0,
        category: 'Sobremesas',
        image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: 'm-def-4',
        name: 'Sakê Premium Filtrado (Dose)',
        description: 'Sakê japonês suave e aromático servido gelado.',
        price: 36.0,
        category: 'Bebidas',
        image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80',
      },
    ]
  }

  if (c.includes('hamburg') || c.includes('burger') || c.includes('lanche')) {
    return [
      {
        id: 'm-def-1',
        name: 'Batatas Rústicas com Alecrim e Páprica',
        description: 'Batatas com corte especial crocantes com maionese artesanal da casa.',
        price: 28.0,
        category: 'Entradas',
        isPopular: true,
        isVegetarian: true,
        image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: 'm-def-2',
        name: 'Smoked Bacon Cheddar Burger',
        description: 'Blend bovino 180g, queijo cheddar inglês, tiras de bacon crocante e pão brioche.',
        price: 44.0,
        category: 'Pratos Principais',
        isPopular: true,
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: 'm-def-3',
        name: 'Brownie de Chocolate com Sorvete',
        description: 'Brownie quente de chocolate 70% com calda de caramelo e sorvete de baunilha.',
        price: 24.0,
        category: 'Sobremesas',
        isPopular: true,
        image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: 'm-def-4',
        name: 'Chopp Artesanal IPA (500ml)',
        description: 'Chopp fresco com notas cítricas e amargor equilibrado.',
        price: 20.0,
        category: 'Bebidas',
        image: 'https://images.unsplash.com/photo-1608270191722-1d54e4a78cb5?auto=format&fit=crop&w=800&q=80',
      },
    ]
  }

  // Padrão Geral / Brasileira
  return [
    {
      id: 'm-def-1',
      name: 'Dadinhos de Tapioca com Geleia de Pimenta',
      description: 'Cubos crocantes de queijo coalho e tapioca servidos com geleia agridoce defumada.',
      price: 34.0,
      category: 'Entradas',
      isPopular: true,
      isVegetarian: true,
      image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'm-def-2',
      name: 'Prato Especial da Casa com Acompanhamentos',
      description: 'Cortes selecionados preparados no ponto com arroz, feijão especial e guarnições frescas.',
      price: 62.0,
      category: 'Pratos Principais',
      isPopular: true,
      image: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'm-def-3',
      name: 'Sobremesa Artesanal da Casa',
      description: 'Receita caseira tradicional preparada diariamente com ingredientes selecionados.',
      price: 22.0,
      category: 'Sobremesas',
      isPopular: true,
      image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'm-def-4',
      name: 'Bebida Especial Refrescante da Casa',
      description: 'Preparada com frutas frescas da estação e ingredientes premium.',
      price: 18.0,
      category: 'Bebidas',
      image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80',
    },
  ]
}

/**
 * Garante que cada restaurante e cada prato possua foto de alta resolução,
 * preservando todas as imagens do cardápio mesmo se vierem de caches antigos ou localStorage.
 */
export function hydrateRestaurantMenu(restaurant: Restaurant): Restaurant {
  const initialMatch = INITIAL_RESTAURANTS.find(ir => ir.id === restaurant.id)

  let menu = restaurant.menu
  if (!menu || menu.length === 0) {
    if (initialMatch?.menu && initialMatch.menu.length > 0) {
      menu = JSON.parse(JSON.stringify(initialMatch.menu))
    } else {
      menu = getDefaultMenuForCuisine(restaurant.cuisine)
    }
  }

  // Garantir fotos em todos os itens do cardápio
  restaurant.menu = (menu || []).map(item => {
    if (item.image && typeof item.image === 'string' && item.image.trim().length > 10) {
      return item
    }

    // Tentar localizar no INITIAL_RESTAURANTS correspondente
    if (initialMatch?.menu) {
      const matchItem = initialMatch.menu.find(
        m => m.id === item.id || m.name.toLowerCase() === item.name.toLowerCase()
      )
      if (matchItem?.image) {
        return { ...item, image: matchItem.image }
      }
    }

    // Fallbacks fotográficos por categoria
    let fallbackImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
    const cat = item.category?.toLowerCase() || ''
    if (cat.includes('entrada')) {
      fallbackImage = 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=800&q=80'
    } else if (cat.includes('principal') || cat.includes('prato')) {
      fallbackImage = 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'
    } else if (cat.includes('sobremesa') || cat.includes('doce')) {
      fallbackImage = 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80'
    } else if (cat.includes('bebida') || cat.includes('drink')) {
      fallbackImage = 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80'
    }

    return {
      ...item,
      image: fallbackImage,
    }
  })

  // Garantir imagem de capa do restaurante
  if (!restaurant.image && initialMatch?.image) {
    restaurant.image = initialMatch.image
  }

  return restaurant
}

export const useRestaurantStore = defineStore('restaurant', () => {
  // Estado inicial de restaurantes
  const restaurants = ref<Restaurant[]>([])
  const selectedRestaurantId = ref<string | null>(null)
  const isLoading = ref<boolean>(false)

  // Status de conexão com MySQL
  const isDbConnected = ref<boolean>(false)
  const dbHealthInfo = ref<{ host?: string; port?: number; database?: string; user?: string; error?: string } | null>(null)
  const dbStats = ref<{
    totalRestaurants: number
    totalVerified: number
    totalMenuItems: number
    totalReviews: number
    totalReports: number
    totalUsers: number
  } | null>(null)
  const isDbModalOpen = ref<boolean>(false)
  const isDbSyncing = ref<boolean>(false)

  // Filtros de busca
  const searchQuery = ref<string>('')
  const selectedCuisine = ref<string>('')
  const selectedCity = ref<string>('')
  const onlyVerified = ref<boolean>(false)

  // Modais
  const isAddRestaurantModalOpen = ref<boolean>(false)
  const isReportModalOpen = ref<boolean>(false)
  const reportingRestaurant = ref<Restaurant | null>(null)

  // Denúncias de fraudes
  const fraudReports = ref<FraudReport[]>([])

  // Checar conexão com MySQL e carregar dados
  async function checkDbConnection() {
    try {
      const health = await api.getDbHealth()
      isDbConnected.value = !!health.connected
      dbHealthInfo.value = health
      if (health.connected) {
        const stats = await api.getDbStats()
        if (stats) dbStats.value = stats
      }
    } catch {
      isDbConnected.value = false
    }
  }

  // Inicialização e Carga
  async function loadRestaurants() {
    isLoading.value = true
    try {
      // 1. Tentar buscar dados do MySQL via API
      await checkDbConnection()
      if (isDbConnected.value) {
        const data = await api.getRestaurants()
        if (data && data.length > 0) {
          restaurants.value = data.map(hydrateRestaurantMenu)
          saveToStorage()
          isLoading.value = false
          return
        }
      }
    } catch (err) {
      console.warn('Falha ao conectar com a API MySQL, utilizando fallback local...', err)
    }

    // 2. Fallback de localStorage se backend não estiver ativo
    try {
      const saved =
        localStorage.getItem(STORAGE_RESTAURANTS_KEY) ||
        localStorage.getItem('guia_sabor_restaurants_v5') ||
        localStorage.getItem('guia_sabor_restaurants_v4') ||
        localStorage.getItem('guia_sabor_restaurants_v3') ||
        localStorage.getItem('guia_sabor_restaurants_v2')

      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          restaurants.value = parsed.map(hydrateRestaurantMenu)
          saveToStorage()
          isLoading.value = false
          return
        }
      }
    } catch (error) {
      console.error('Erro ao ler restaurantes do localStorage:', error)
    }

    // 3. Caso padrão inicial
    restaurants.value = JSON.parse(JSON.stringify(INITIAL_RESTAURANTS)).map(hydrateRestaurantMenu)
    saveToStorage()
    isLoading.value = false
  }

  async function loadFraudReports() {
    try {
      if (isDbConnected.value) {
        const reports = await api.getFraudReports()
        if (reports && reports.length > 0) {
          fraudReports.value = reports
          saveReportsToStorage()
          return
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar denúncias da API:', err)
    }

    try {
      const saved = localStorage.getItem(STORAGE_FRAUD_REPORTS_KEY)
      if (saved) {
        fraudReports.value = JSON.parse(saved)
      }
    } catch (e) {
      console.error('Erro ao ler denúncias do localStorage:', e)
    }
  }

  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_RESTAURANTS_KEY, JSON.stringify(restaurants.value))
    } catch (error) {
      console.error('Erro ao salvar restaurantes no localStorage:', error)
    }
  }

  function saveReportsToStorage() {
    try {
      localStorage.setItem(STORAGE_FRAUD_REPORTS_KEY, JSON.stringify(fraudReports.value))
    } catch (e) {
      console.error('Erro ao salvar denúncias no localStorage:', e)
    }
  }

  // Inicializar dados
  loadRestaurants().then(() => {
    loadFraudReports()
  })

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

  const verifiedCount = computed(() => {
    return restaurants.value.filter(r => r.isVerified).length
  })

  const filteredRestaurants = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()
    const cuisineFilter = selectedCuisine.value
    const cityFilter = selectedCity.value
    const filterVerified = onlyVerified.value

    return restaurants.value.filter(res => {
      const matchesQuery =
        !query ||
        res.name.toLowerCase().includes(query) ||
        res.cuisine.toLowerCase().includes(query) ||
        res.city.toLowerCase().includes(query) ||
        res.address.toLowerCase().includes(query) ||
        (res.legalName && res.legalName.toLowerCase().includes(query)) ||
        (res.cnpj && res.cnpj.includes(query))

      const matchesCuisine = !cuisineFilter || res.cuisine === cuisineFilter
      const matchesCity = !cityFilter || res.city === cityFilter
      const matchesVerified = !filterVerified || res.isVerified === true

      return matchesQuery && matchesCuisine && matchesCity && matchesVerified
    })
  })

  const selectedRestaurant = computed(() => {
    if (!selectedRestaurantId.value) return null
    return restaurants.value.find(r => r.id === selectedRestaurantId.value) || null
  })

  const hasActiveFilters = computed(() => {
    return (
      !!searchQuery.value ||
      !!selectedCuisine.value ||
      !!selectedCity.value ||
      onlyVerified.value
    )
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
    onlyVerified.value = false
  }

  function toggleOnlyVerified() {
    onlyVerified.value = !onlyVerified.value
  }

  function openAddRestaurantModal() {
    isAddRestaurantModalOpen.value = true
  }

  function closeAddRestaurantModal() {
    isAddRestaurantModalOpen.value = false
  }

  function openReportModal(restaurant: Restaurant) {
    reportingRestaurant.value = restaurant
    isReportModalOpen.value = true
  }

  function closeReportModal() {
    isReportModalOpen.value = false
    reportingRestaurant.value = null
  }

  function openDbModal() {
    checkDbConnection()
    isDbModalOpen.value = true
  }

  function closeDbModal() {
    isDbModalOpen.value = false
  }

  async function reseedDatabase(): Promise<boolean> {
    isDbSyncing.value = true
    try {
      const ok = await api.initDb()
      if (ok) {
        await loadRestaurants()
        await loadFraudReports()
        await checkDbConnection()
      }
      isDbSyncing.value = false
      return ok
    } catch {
      isDbSyncing.value = false
      return false
    }
  }

  async function addRestaurant(newRes: {
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
    cnpj?: string
    legalName?: string
    requestVerification?: boolean
  }): Promise<Restaurant> {
    const isCnpjValid = newRes.cnpj ? validateCNPJ(newRes.cnpj) : false
    const isVerified = isCnpjValid && !!newRes.legalName
    const assignedMenu = (newRes.menu && newRes.menu.length > 0) ? newRes.menu : getDefaultMenuForCuisine(newRes.cuisine)

    let created: Restaurant | null = null

    // 1. Tentar salvar no MySQL
    if (isDbConnected.value) {
      try {
        created = await api.createRestaurant({
          ...newRes,
          menu: assignedMenu,
        })
      } catch (err) {
        console.warn('Erro ao salvar no MySQL, salvando localmente...', err)
      }
    }

    // 2. Fallback de criação local
    if (!created) {
      created = {
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
        menu: assignedMenu,
        cnpj: newRes.cnpj?.trim() || '',
        legalName: newRes.legalName?.trim() || '',
        isVerified,
        verificationStatus: isVerified ? 'verified' : newRes.cnpj ? 'pending' : 'unverified',
        verifiedDate: isVerified ? new Date().toLocaleDateString('pt-BR') : undefined,
        verifiedBy: isVerified ? 'Validação Automática de CNPJ & Equipe Guia Sabor' : undefined,
        safetyScore: isVerified ? 96 : newRes.cnpj ? 70 : 40,
        verifiedBadges: getSafetyBadges(isVerified, !!newRes.cnpj),
        reportCount: 0,
        reviews: [
          {
            id: 'rev-' + Date.now(),
            author: 'Equipe Guia Sabor',
            stars: 5,
            comment: isVerified
              ? 'Restaurante verificado com CNPJ ativo e dados autenticados contra golpes. Bem-vindo ao Guia Sabor!'
              : 'Restaurante recém cadastrado na plataforma. Seja o primeiro cliente a avaliar!',
            createdAt: new Date().toLocaleDateString('pt-BR'),
          },
        ],
      }
    }

    const hydrated = hydrateRestaurantMenu(created)
    restaurants.value.unshift(hydrated)
    saveToStorage()
    checkDbConnection()
    return hydrated
  }

  async function verifyRestaurant(restaurantId: string, cnpj: string, legalName: string): Promise<boolean> {
    const target = restaurants.value.find(r => r.id === restaurantId)
    if (!target) return false

    if (!validateCNPJ(cnpj)) return false

    if (isDbConnected.value) {
      try {
        await api.verifyRestaurant(restaurantId, cnpj, legalName)
      } catch (err) {
        console.warn('Erro ao atualizar verificação no MySQL:', err)
      }
    }

    target.cnpj = cnpj
    target.legalName = legalName
    target.isVerified = true
    target.verificationStatus = 'verified'
    target.verifiedDate = new Date().toLocaleDateString('pt-BR')
    target.verifiedBy = 'Validação Oficial CNPJ Guia Sabor'
    target.safetyScore = 98
    target.verifiedBadges = getSafetyBadges(true, true)

    saveToStorage()
    return true
  }

  async function submitFraudReport(data: {
    restaurantId: string
    restaurantName: string
    reporterName: string
    reporterEmail?: string
    reason: FraudReport['reason']
    description: string
  }): Promise<boolean> {
    let report: FraudReport | null = null

    if (isDbConnected.value) {
      try {
        report = await api.submitFraudReport(data)
      } catch (err) {
        console.warn('Erro ao enviar denúncia para o MySQL:', err)
      }
    }

    if (!report) {
      report = {
        id: 'rep-' + Date.now(),
        restaurantId: data.restaurantId,
        restaurantName: data.restaurantName,
        reporterName: data.reporterName.trim() || 'Usuário Anônimo',
        reporterEmail: data.reporterEmail,
        reason: data.reason,
        description: data.description.trim(),
        createdAt: new Date().toLocaleDateString('pt-BR'),
        status: 'em_analise',
      }
    }

    fraudReports.value.unshift(report)
    saveReportsToStorage()

    // Atualizar contador de denúncias no restaurante local
    const target = restaurants.value.find(r => r.id === data.restaurantId)
    if (target) {
      target.reportCount = (target.reportCount || 0) + 1
      if (target.reportCount >= 3) {
        target.safetyScore = Math.max(20, (target.safetyScore || 80) - 30)
      }
      saveToStorage()
    }

    return true
  }

  async function addReview(
    restaurantId: string,
    author: string,
    stars: number,
    comment: string,
    authorEmail?: string
  ): Promise<boolean> {
    const targetRestaurant = restaurants.value.find(r => r.id === restaurantId)
    if (!targetRestaurant) return false

    const cleanStars = Math.max(1, Math.min(5, stars))
    let newReview: Review | null = null

    if (isDbConnected.value) {
      try {
        const result = await api.addReview(restaurantId, {
          author: author.trim() || 'Usuário Anônimo',
          authorEmail,
          stars: cleanStars,
          comment: comment.trim(),
        })
        newReview = result.review
        targetRestaurant.rating = result.newRating
      } catch (err) {
        console.warn('Erro ao persistir avaliação no MySQL:', err)
      }
    }

    if (!newReview) {
      newReview = {
        id: 'rev-' + Date.now(),
        author: author.trim() || 'Usuário Anônimo',
        authorEmail,
        stars: cleanStars,
        comment: comment.trim(),
        createdAt: new Date().toLocaleDateString('pt-BR'),
      }
      targetRestaurant.reviews.unshift(newReview)
      const totalStars = targetRestaurant.reviews.reduce((acc, curr) => acc + curr.stars, 0)
      targetRestaurant.rating = Number((totalStars / targetRestaurant.reviews.length).toFixed(1))
    } else {
      targetRestaurant.reviews.unshift(newReview)
    }

    saveToStorage()
    return true
  }

  return {
    restaurants,
    selectedRestaurantId,
    searchQuery,
    selectedCuisine,
    selectedCity,
    onlyVerified,
    isAddRestaurantModalOpen,
    isReportModalOpen,
    reportingRestaurant,
    fraudReports,
    isLoading,
    isDbConnected,
    dbHealthInfo,
    dbStats,
    isDbModalOpen,
    isDbSyncing,
    cuisinesList,
    citiesList,
    verifiedCount,
    filteredRestaurants,
    selectedRestaurant,
    hasActiveFilters,
    checkDbConnection,
    reseedDatabase,
    openDbModal,
    closeDbModal,
    selectRestaurant,
    getRestaurantById,
    resetFilters,
    toggleOnlyVerified,
    openAddRestaurantModal,
    closeAddRestaurantModal,
    openReportModal,
    closeReportModal,
    addRestaurant,
    verifyRestaurant,
    submitFraudReport,
    addReview,
    loadRestaurants,
  }
})
