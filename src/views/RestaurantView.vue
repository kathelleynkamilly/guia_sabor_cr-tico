<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRestaurantStore } from '../stores/restaurant'
import { useAuthStore } from '../stores/auth'
import type { MenuItem } from '../types/restaurant'
import { formatCNPJ, validateCNPJ } from '../utils/verification'
import StarRating from '../components/StarRating.vue'

const route = useRoute()
const router = useRouter()
const restaurantStore = useRestaurantStore()
const authStore = useAuthStore()

// Aba ativa
type TabType = 'sobre' | 'cardapio' | 'avaliacoes' | 'contato' | 'seguranca'
const activeTab = ref<TabType>('sobre')

// Filtro de categoria no cardápio
const activeMenuCategory = ref<string>('Todos')

// Modal de visualização de foto do prato
const selectedDish = ref<MenuItem | null>(null)

function openDishModal(dish: MenuItem) {
  selectedDish.value = dish
}

function closeDishModal() {
  selectedDish.value = null
}

function getCategoryIcon(category: string): string {
  switch (category) {
    case 'Entradas':
      return '🥗'
    case 'Pratos Principais':
      return '🍲'
    case 'Sobremesas':
      return '🍰'
    case 'Bebidas':
      return '🍷'
    default:
      return '🍽️'
  }
}

function handleImageError(event: Event) {
  const target = event.target as HTMLImageElement
  if (target && !target.src.includes('photo-1546069901')) {
    target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
  }
}

// Formulário de nova avaliação
const reviewStars = ref<number>(5)
const reviewComment = ref<string>('')
const formError = ref<string>('')
const formSuccess = ref<string>('')

// Copiado feedback
const isCopied = ref<boolean>(false)

// Validação de CNPJ pelo proprietário
const ownerCnpj = ref('')
const ownerLegalName = ref('')
const ownerVerifyError = ref('')
const ownerVerifySuccess = ref('')

const restaurantId = computed(() => route.params.id as string)

const restaurant = computed(() => {
  if (!restaurantId.value) return null
  return restaurantStore.getRestaurantById(restaurantId.value) || null
})

onMounted(() => {
  if (restaurantId.value) {
    restaurantStore.selectRestaurant(restaurantId.value)
  }
})

watch(
  () => route.params.id,
  newId => {
    if (newId) {
      restaurantStore.selectRestaurant(newId as string)
      activeTab.value = 'sobre'
    }
  }
)

// Categorias do cardápio
const menuCategories = computed(() => {
  if (!restaurant.value?.menu) return []
  const set = new Set<string>()
  restaurant.value.menu.forEach(item => set.add(item.category))
  return ['Todos', ...Array.from(set)]
})

// Pratos filtrados
const filteredMenu = computed(() => {
  if (!restaurant.value?.menu) return []
  if (activeMenuCategory.value === 'Todos') {
    return restaurant.value.menu
  }
  return restaurant.value.menu.filter(item => item.category === activeMenuCategory.value)
})

// Distribuição de notas
const ratingDistribution = computed(() => {
  if (!restaurant.value) return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, total: 0 }
  const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, total: restaurant.value.reviews.length }
  restaurant.value.reviews.forEach(rev => {
    const star = Math.round(rev.stars) as 1 | 2 | 3 | 4 | 5
    if (dist[star] !== undefined) {
      dist[star]++
    }
  })
  return dist
})

function getRatingPercentage(count: number): number {
  if (!ratingDistribution.value.total) return 0
  return Math.round((count / ratingDistribution.value.total) * 100)
}

async function handleReviewSubmit() {
  formError.value = ''
  formSuccess.value = ''

  if (!authStore.isAuthenticated) {
    authStore.openLoginModal()
    return
  }

  if (reviewStars.value < 1 || reviewStars.value > 5) {
    formError.value = 'Por favor, selecione uma nota de 1 a 5 estrelas.'
    return
  }

  if (!reviewComment.value.trim()) {
    formError.value = 'Por favor, escreva um comentário sobre a sua experiência.'
    return
  }

  if (restaurant.value) {
    const success = await restaurantStore.addReview(
      restaurant.value.id,
      authStore.currentUser?.name || 'Cliente',
      reviewStars.value,
      reviewComment.value,
      authStore.currentUser?.email
    )

    if (success) {
      formSuccess.value = '🎉 Avaliação publicada com sucesso! Obrigado pelo seu relato.'
      reviewComment.value = ''
      reviewStars.value = 5

      setTimeout(() => {
        formSuccess.value = ''
      }, 5000)
    }
  }
}

function shareRestaurant() {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(window.location.href)
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 3000)
  }
}

function formatPrice(val: number): string {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function openScamReport() {
  if (restaurant.value) {
    restaurantStore.openReportModal(restaurant.value)
  }
}

function onOwnerCnpjInput(e: Event) {
  const target = e.target as HTMLInputElement
  ownerCnpj.value = formatCNPJ(target.value)
}

async function handleOwnerVerification() {
  ownerVerifyError.value = ''
  ownerVerifySuccess.value = ''

  if (!ownerCnpj.value.trim() || !validateCNPJ(ownerCnpj.value)) {
    ownerVerifyError.value = 'CNPJ inválido de acordo com as regras da Receita Federal. Confira os dígitos.'
    return
  }

  if (!ownerLegalName.value.trim()) {
    ownerVerifyError.value = 'Por favor, informe a Razão Social da empresa.'
    return
  }

  if (restaurant.value) {
    const success = await restaurantStore.verifyRestaurant(
      restaurant.value.id,
      ownerCnpj.value,
      ownerLegalName.value
    )

    if (success) {
      ownerVerifySuccess.value = '🎉 Estabelecimento verificado com sucesso! O selo oficial de segurança foi concedido.'
      ownerCnpj.value = ''
      ownerLegalName.value = ''
    }
  }
}
</script>

<template>
  <div class="restaurant-page">
    <div class="container">
      <!-- Barra de navegação superior (Voltar + Compartilhar + Denúncia) -->
      <div class="top-nav-bar">
        <button type="button" class="btn-back" @click="router.push('/')">
          ← Voltar para todos os restaurantes
        </button>

        <div class="top-actions">
          <button
            type="button"
            class="btn-report-action"
            title="Denunciar suspeita de fraude ou golpe neste restaurante"
            @click="openScamReport"
          >
            🚩 Denunciar Golpe
          </button>
          <button type="button" class="btn-secondary btn-sm" @click="shareRestaurant">
            <span v-if="isCopied">✅ Link Copiado!</span>
            <span v-else>🔗 Compartilhar</span>
          </button>
        </div>
      </div>

      <template v-if="restaurant">
        <!-- Hero Header do Restaurante -->
        <header class="restaurant-hero">
          <div class="hero-content">
            <!-- Selo de Verificação no Topo -->
            <div class="verification-hero-bar">
              <div v-if="restaurant.isVerified" class="hero-verified-badge">
                <span class="v-icon">🛡️</span>
                <span class="v-text">ESTABELECIMENTO VERIFICADO • ANTI-GOLPE</span>
                <span v-if="restaurant.cnpj" class="v-cnpj">{{ restaurant.cnpj }}</span>
                <span class="v-score">Score: {{ restaurant.safetyScore || 98 }}%</span>
              </div>
              <div v-else class="hero-unverified-badge">
                <span class="v-icon">⚠️</span>
                <span class="v-text">VERIFICAÇÃO DE CNPJ PENDENTE</span>
              </div>
            </div>

            <div class="hero-tags">
              <span class="tag tag-cuisine">{{ restaurant.cuisine }}</span>
              <span v-if="restaurant.priceRange" class="tag tag-price">{{ restaurant.priceRange }}</span>
              <span class="tag tag-city">📍 {{ restaurant.city }}</span>
            </div>

            <h1 class="hero-title">{{ restaurant.name }}</h1>

            <p v-if="restaurant.legalName && restaurant.isVerified" class="hero-legal-name">
              Razão Social: <strong>{{ restaurant.legalName }}</strong> &bull; Homologado pelo Guia Sabor
            </p>

            <p v-if="restaurant.description" class="hero-description">
              {{ restaurant.description }}
            </p>

            <div class="hero-meta">
              <div class="rating-badge-large">
                <StarRating :rating="restaurant.rating" size="md" />
                <span class="rating-num">{{ restaurant.rating.toFixed(1) }}</span>
                <span class="reviews-count">({{ restaurant.reviews.length }} {{ restaurant.reviews.length === 1 ? 'avaliação' : 'avaliações' }})</span>
              </div>

              <div class="meta-item">
                <span class="meta-icon">🕒</span>
                <span>{{ restaurant.hours }}</span>
              </div>

              <div v-if="restaurant.phone" class="meta-item">
                <span class="meta-icon">📞</span>
                <span>{{ restaurant.phone }}</span>
              </div>
            </div>
          </div>

          <div class="hero-cta-box">
            <div class="cta-card">
              <div class="cta-shield-icon">🛡️</div>
              <span class="cta-title">Ambiente Seguro</span>
              <p class="cta-desc">
                {{ restaurant.isVerified ? 'Restaurante 100% auditado contra fraudes com CNPJ regular.' : 'Consulte as orientações de segurança anti-golpe antes de efetuar pagamentos.' }}
              </p>
              <button
                type="button"
                class="btn-primary btn-block"
                @click="activeTab = 'seguranca'"
              >
                🛡️ Ver Certificado de Autenticidade
              </button>
              <button
                v-if="restaurant.menu && restaurant.menu.length > 0"
                type="button"
                class="btn-secondary btn-block"
                @click="activeTab = 'cardapio'"
              >
                📋 Explorar Cardápio
              </button>
            </div>
          </div>
        </header>

        <!-- Barra de Abas (Tabs) -->
        <nav class="restaurant-tabs-nav" aria-label="Abas do Restaurante">
          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === 'sobre' }"
            @click="activeTab = 'sobre'"
          >
            <span class="tab-icon">ℹ️</span>
            <span class="tab-label">Sobre & Comodidades</span>
          </button>

          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === 'cardapio' }"
            @click="activeTab = 'cardapio'"
          >
            <span class="tab-icon">🍽️</span>
            <span class="tab-label">Cardápio</span>
            <span v-if="restaurant.menu" class="tab-badge">{{ restaurant.menu.length }}</span>
          </button>

          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === 'avaliacoes' }"
            @click="activeTab = 'avaliacoes'"
          >
            <span class="tab-icon">⭐</span>
            <span class="tab-label">Avaliações</span>
            <span class="tab-badge">{{ restaurant.reviews.length }}</span>
          </button>

          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === 'contato' }"
            @click="activeTab = 'contato'"
          >
            <span class="tab-icon">📍</span>
            <span class="tab-label">Localização & Contato</span>
          </button>

          <!-- ABA 5: AUTENTICIDADE & SEGURANÇA ANTI-GOLPE -->
          <button
            type="button"
            class="tab-btn tab-btn-security"
            :class="{ active: activeTab === 'seguranca' }"
            @click="activeTab = 'seguranca'"
          >
            <span class="tab-icon">🛡️</span>
            <span class="tab-label">Autenticidade & Segurança</span>
            <span v-if="restaurant.isVerified" class="tab-badge-verified">✓ Selo Ativo</span>
          </button>
        </nav>

        <!-- Conteúdo das Abas -->
        <main class="tab-content-wrapper">
          <!-- ABA 1: SOBRE & COMODIDADES -->
          <section v-if="activeTab === 'sobre'" class="tab-pane animate-fade-in">
            <div class="content-grid-two">
              <div class="content-main-card">
                <h2 class="pane-title">Apresentação</h2>
                <p class="long-desc">
                  {{ restaurant.description || 'Restaurante especializado em culinária selecionada, proporcionando momentos marcantes para você, seus amigos e família.' }}
                </p>

                <h3 class="subsection-title">✨ Comodidades e Diferenciais</h3>
                <div class="amenities-grid">
                  <div
                    v-for="amenity in (restaurant.amenities || ['Wi-Fi Grátis', 'Ar Condicionado', 'Aceita Cartões e Pix'])"
                    :key="amenity"
                    class="amenity-chip"
                  >
                    <span class="amenity-check">✓</span>
                    <span>{{ amenity }}</span>
                  </div>
                </div>

                <div class="highlights-box">
                  <h4>💡 Dica para sua visita</h4>
                  <p>
                    Recomendamos consultar o horário de pico nos finais de semana ou entrar em contato previamente pelo telefone <strong>{{ restaurant.phone || 'disponível na aba de contato' }}</strong> para garantir sua mesa.
                  </p>
                </div>
              </div>

              <!-- Cartão Lateral Rápido -->
              <div class="content-side-card">
                <h3 class="side-title">Resumo Rápido</h3>
                <ul class="quick-facts">
                  <li>
                    <span class="fact-label">Culinária:</span>
                    <span class="fact-val">{{ restaurant.cuisine }}</span>
                  </li>
                  <li>
                    <span class="fact-label">Faixa de Preço:</span>
                    <span class="fact-val">{{ restaurant.priceRange || 'Médio (R$$)' }}</span>
                  </li>
                  <li>
                    <span class="fact-label">Cidade:</span>
                    <span class="fact-val">{{ restaurant.city }}</span>
                  </li>
                  <li>
                    <span class="fact-label">Horário:</span>
                    <span class="fact-val">{{ restaurant.hours }}</span>
                  </li>
                  <li v-if="restaurant.phone">
                    <span class="fact-label">Telefone:</span>
                    <span class="fact-val">{{ restaurant.phone }}</span>
                  </li>
                  <li v-if="restaurant.cnpj">
                    <span class="fact-label">CNPJ:</span>
                    <span class="fact-val">{{ restaurant.cnpj }}</span>
                  </li>
                </ul>

                <button
                  type="button"
                  class="btn-primary btn-block"
                  style="margin-top: 1.25rem"
                  @click="activeTab = 'cardapio'"
                >
                  Ver Pratos do Cardápio →
                </button>
              </div>
            </div>
          </section>

          <!-- ABA 2: CARDÁPIO -->
          <section v-else-if="activeTab === 'cardapio'" class="tab-pane animate-fade-in">
            <div class="menu-pane-header">
              <div>
                <h2 class="pane-title">Cardápio & Especialidades</h2>
                <p class="pane-subtitle">Explore as opções preparadas com ingredientes selecionados.</p>
              </div>

              <!-- Filtros de categoria do cardápio -->
              <div v-if="menuCategories.length > 1" class="menu-categories-pills">
                <button
                  v-for="cat in menuCategories"
                  :key="cat"
                  type="button"
                  class="category-pill"
                  :class="{ active: activeMenuCategory === cat }"
                  @click="activeMenuCategory = cat"
                >
                  <span v-if="cat !== 'Todos'" class="pill-icon">{{ getCategoryIcon(cat) }}</span>
                  <span>{{ cat }}</span>
                </button>
              </div>
            </div>

            <!-- Grade de Pratos do Cardápio com Imagens -->
            <div v-if="filteredMenu.length > 0" class="menu-grid">
              <article
                v-for="item in filteredMenu"
                :key="item.id"
                class="menu-item-card"
                tabindex="0"
                role="button"
                @click="openDishModal(item)"
                @keydown.enter="openDishModal(item)"
                @keydown.space.prevent="openDishModal(item)"
              >
                <div class="menu-item-media">
                  <img
                    v-if="item.image"
                    :src="item.image"
                    :alt="item.name"
                    class="dish-img"
                    loading="lazy"
                    @error="handleImageError"
                  />
                  <div v-else class="dish-fallback">
                    <span class="fallback-icon">{{ getCategoryIcon(item.category) }}</span>
                  </div>

                  <div class="media-badges-overlay">
                    <span v-if="item.isPopular" class="tag-badge-popular">⭐ Mais Pedido</span>
                    <span v-if="item.isVegetarian" class="tag-badge-veggie">🌱 Vegetariano</span>
                  </div>

                  <div class="media-category-chip">
                    {{ item.category }}
                  </div>

                  <div class="media-hover-hint">
                    <span>🔍 Ver Foto & Detalhes</span>
                  </div>
                </div>

                <div class="menu-item-content">
                  <div class="menu-item-header">
                    <h3 class="item-name">{{ item.name }}</h3>
                    <span class="item-price">{{ formatPrice(item.price) }}</span>
                  </div>

                  <p class="item-description">{{ item.description }}</p>
                </div>
              </article>
            </div>

            <div v-else class="empty-menu">
              <p>Nenhum item encontrado nesta categoria de cardápio.</p>
            </div>
          </section>

          <!-- ABA 3: AVALIAÇÕES -->
          <section v-else-if="activeTab === 'avaliacoes'" class="tab-pane animate-fade-in">
            <div class="reviews-layout">
              <!-- Coluna Esquerda: Placar & Formulário -->
              <div class="reviews-action-col">
                <!-- Placar Geral -->
                <div class="rating-summary-card">
                  <h3 class="pane-title">Nota da Comunidade</h3>
                  <div class="summary-score-row">
                    <div class="big-score">{{ restaurant.rating.toFixed(1) }}</div>
                    <div class="big-stars">
                      <StarRating :rating="restaurant.rating" size="lg" />
                      <span class="total-reviews-text">
                        Baseado em {{ restaurant.reviews.length }} 
                        {{ restaurant.reviews.length === 1 ? 'avaliação' : 'avaliações' }}
                      </span>
                    </div>
                  </div>

                  <!-- Barras de Distribuição -->
                  <div class="distribution-bars">
                    <div v-for="star in [5, 4, 3, 2, 1]" :key="star" class="dist-row">
                      <span class="dist-label">{{ star }} ★</span>
                      <div class="dist-track">
                        <div
                          class="dist-fill"
                          :style="{ width: `${getRatingPercentage(ratingDistribution[star as 1|2|3|4|5])}%` }"
                        ></div>
                      </div>
                      <span class="dist-count">
                        {{ ratingDistribution[star as 1|2|3|4|5] }} ({{ getRatingPercentage(ratingDistribution[star as 1|2|3|4|5]) }}%)
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Formulário de Avaliação -->
                <div class="write-review-card">
                  <h3 class="side-title">Deixe a sua Avaliação</h3>

                  <template v-if="authStore.isAuthenticated">
                    <form class="review-form" @submit.prevent="handleReviewSubmit">
                      <div class="form-group">
                        <label class="form-label">Sua Nota Geral:</label>
                        <div class="picker-row">
                          <StarRating v-model="reviewStars" interactive size="lg" />
                          <span class="picker-num">{{ reviewStars }} {{ reviewStars === 1 ? 'estrela' : 'estrelas' }}</span>
                        </div>
                      </div>

                      <div class="form-group">
                        <label for="commentInput" class="form-label">Seu Comentário:</label>
                        <textarea
                          id="commentInput"
                          v-model="reviewComment"
                          rows="4"
                          class="form-textarea"
                          placeholder="Conte em detalhes como foi o atendimento, sabor dos pratos e ambiente..."
                          required
                        ></textarea>
                      </div>

                      <div v-if="formError" class="alert-box alert-danger">
                        {{ formError }}
                      </div>

                      <div v-if="formSuccess" class="alert-box alert-success">
                        {{ formSuccess }}
                      </div>

                      <button type="submit" class="btn-primary btn-block">
                        Publicar Avaliação
                      </button>
                    </form>
                  </template>

                  <template v-else>
                    <div class="login-prompt">
                      <p>Você precisa estar logado para publicar uma avaliação.</p>
                      <button
                        type="button"
                        class="btn-primary btn-sm"
                        @click="authStore.openLoginModal()"
                      >
                        Entrar para Avaliar
                      </button>
                    </div>
                  </template>
                </div>
              </div>

              <!-- Coluna Direita: Lista de Comentários -->
              <div class="reviews-feed-col">
                <h3 class="pane-title">Feed de Opiniões ({{ restaurant.reviews.length }})</h3>

                <div v-if="restaurant.reviews.length > 0" class="reviews-feed">
                  <article
                    v-for="review in restaurant.reviews"
                    :key="review.id"
                    class="review-feed-card"
                  >
                    <div class="review-feed-header">
                      <div class="author-block">
                        <div class="avatar-circle">
                          {{ review.author.charAt(0).toUpperCase() }}
                        </div>
                        <div>
                          <h4 class="author-name">{{ review.author }}</h4>
                          <span class="review-date">{{ review.createdAt }}</span>
                        </div>
                      </div>
                      <StarRating :rating="review.stars" size="sm" />
                    </div>

                    <p class="review-body">{{ review.comment }}</p>
                  </article>
                </div>

                <div v-else class="empty-feed">
                  <p>Ainda não há avaliações para este restaurante. Seja o primeiro a comentar!</p>
                </div>
              </div>
            </div>
          </section>

          <!-- ABA 4: LOCALIZAÇÃO & CONTATO -->
          <section v-else-if="activeTab === 'contato'" class="tab-pane animate-fade-in">
            <div class="content-grid-two">
              <div class="content-main-card">
                <h2 class="pane-title">Endereço & Acesso</h2>
                <div class="address-box">
                  <div class="address-icon">📍</div>
                  <div>
                    <h3 class="address-line">{{ restaurant.address }}</h3>
                    <p class="address-city">{{ restaurant.city }} - Brasil</p>
                  </div>
                </div>

                <div class="map-visual-placeholder">
                  <div class="map-inner">
                    <span class="map-pin">📍</span>
                    <strong>{{ restaurant.name }}</strong>
                    <p>{{ restaurant.address }}, {{ restaurant.city }}</p>
                    <a
                      :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name + ' ' + restaurant.address + ' ' + restaurant.city)}`"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="btn-primary btn-sm"
                      style="margin-top: 0.75rem;"
                    >
                      🗺️ Abrir no Google Maps
                    </a>
                  </div>
                </div>
              </div>

              <div class="content-side-card">
                <h3 class="side-title">Canais de Contato & Horários</h3>

                <div class="contact-block">
                  <div class="contact-item">
                    <span class="c-icon">🕒</span>
                    <div>
                      <strong>Horário de Funcionamento</strong>
                      <p>{{ restaurant.hours }}</p>
                    </div>
                  </div>

                  <div v-if="restaurant.phone" class="contact-item">
                    <span class="c-icon">📞</span>
                    <div>
                      <strong>Telefone / WhatsApp</strong>
                      <p>{{ restaurant.phone }}</p>
                    </div>
                  </div>

                  <div v-if="restaurant.website" class="contact-item">
                    <span class="c-icon">🌐</span>
                    <div>
                      <strong>Website Oficial</strong>
                      <p>
                        <a :href="restaurant.website" target="_blank" rel="noopener noreferrer" class="web-link">
                          {{ restaurant.website }} ↗
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- ABA 5: AUTENTICIDADE, CERTIFICADO & SEGURANÇA ANTI-GOLPE -->
          <section v-else-if="activeTab === 'seguranca'" class="tab-pane animate-fade-in">
            <div class="security-layout-grid">
              <!-- Certificado de Autenticidade -->
              <div class="certificate-container">
                <div
                  class="certificate-card"
                  :class="restaurant.isVerified ? 'cert-verified' : 'cert-unverified'"
                >
                  <div class="cert-header">
                    <div class="cert-seal">
                      <span class="seal-icon">{{ restaurant.isVerified ? '🛡️' : '⚠️' }}</span>
                    </div>
                    <div>
                      <span class="cert-tag">CERTIFICADO DIGITAL GUIA SABOR</span>
                      <h2 class="cert-title">
                        {{ restaurant.isVerified ? 'Selo de Autenticidade & Proteção Anti-Fraude' : 'Certificado de Verificação Pendente' }}
                      </h2>
                    </div>
                  </div>

                  <div class="cert-body">
                    <div class="cert-details-grid">
                      <div class="cert-field">
                        <span class="field-label">Nome Fantasia:</span>
                        <strong class="field-value">{{ restaurant.name }}</strong>
                      </div>

                      <div class="cert-field">
                        <span class="field-label">Razão Social Oficial:</span>
                        <strong class="field-value">{{ restaurant.legalName || 'Não informada' }}</strong>
                      </div>

                      <div class="cert-field">
                        <span class="field-label">CNPJ (Receita Federal):</span>
                        <strong class="field-value field-mono">{{ restaurant.cnpj || 'Pendente de homologação' }}</strong>
                      </div>

                      <div class="cert-field">
                        <span class="field-label">Endereço Comercial Auditado:</span>
                        <strong class="field-value">{{ restaurant.address }}, {{ restaurant.city }}</strong>
                      </div>

                      <div class="cert-field">
                        <span class="field-label">Data de Homologação:</span>
                        <strong class="field-value">{{ restaurant.verifiedDate || 'Aguardando validação' }}</strong>
                      </div>

                      <div class="cert-field">
                        <span class="field-label">Auditor Responsável:</span>
                        <strong class="field-value">{{ restaurant.verifiedBy || 'Equipe Guia Sabor Compliance' }}</strong>
                      </div>
                    </div>

                    <!-- Placar de Confiabilidade Anti-Fraude -->
                    <div class="safety-score-banner">
                      <div class="score-circle-box">
                        <span class="score-percent">{{ restaurant.safetyScore || 98 }}%</span>
                        <span class="score-txt">Índice de Confiabilidade</span>
                      </div>
                      <div class="score-explanation">
                        <span class="score-status-badge" :class="restaurant.isVerified ? 'status-green' : 'status-yellow'">
                          {{ restaurant.isVerified ? '✓ Risco de Fraude: MÍNIMO / INEXISTENTE' : '⚠️ Verificação Documental Recomendada' }}
                        </span>
                        <p class="score-p">
                          {{ restaurant.isVerified
                            ? 'Este estabelecimento cumpriu todos os critérios da auditoria fiscal, validação de localização física e possui zero denúncias de golpe.'
                            : 'Este perfil foi cadastrado por membros da comunidade e ainda não possui CNPJ validado pela moderação.'
                          }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Checklist de Auditoria Anti-Fraude -->
                  <div class="audit-checklist-box">
                    <h3 class="checklist-title">📋 Itens Auditados pelo Sistema Anti-Golpe</h3>
                    <div class="checklist-grid">
                      <div
                        v-for="badge in (restaurant.verifiedBadges || [
                          '🛡️ CNPJ Regular na Receita Federal',
                          '📍 Endereço Comercial Físico Confirmado',
                          '📞 Telefone Oficial de Atendimento Validado',
                          '🔒 Proteção Anti-Fraude & Pagamento Seguro'
                        ])"
                        :key="badge"
                        class="checklist-item"
                        :class="{ 'item-checked': restaurant.isVerified }"
                      >
                        <span class="check-icon">{{ restaurant.isVerified ? '✓' : '•' }}</span>
                        <span>{{ badge }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Formulário para Proprietário Solicitar Verificação se não for verificado -->
                <div v-if="!restaurant.isVerified" class="owner-verify-card">
                  <div class="owner-verify-header">
                    <span class="owner-icon">🏢</span>
                    <div>
                      <h3 class="owner-title">Você é o Proprietário deste Restaurante?</h3>
                      <p class="owner-subtitle">Valide seu CNPJ agora para obter o Selo Oficial de Autenticidade e proteger sua marca contra clones.</p>
                    </div>
                  </div>

                  <form class="owner-verify-form" @submit.prevent="handleOwnerVerification">
                    <div class="form-row-2">
                      <div class="form-group">
                        <label class="form-label" for="ownerCnpj">CNPJ do Restaurante</label>
                        <input
                          id="ownerCnpj"
                          v-model="ownerCnpj"
                          type="text"
                          class="form-input"
                          placeholder="00.000.000/0000-00"
                          maxlength="18"
                          @input="onOwnerCnpjInput"
                          required
                        />
                      </div>
                      <div class="form-group">
                        <label class="form-label" for="ownerLegal">Razão Social Oficial</label>
                        <input
                          id="ownerLegal"
                          v-model="ownerLegalName"
                          type="text"
                          class="form-input"
                          placeholder="Ex: Empresa de Alimentos Ltda."
                          required
                        />
                      </div>
                    </div>

                    <div v-if="ownerVerifyError" class="alert-box alert-danger">
                      {{ ownerVerifyError }}
                    </div>

                    <div v-if="ownerVerifySuccess" class="alert-box alert-success">
                      {{ ownerVerifySuccess }}
                    </div>

                    <button type="submit" class="btn-primary">
                      🛡️ Validar CNPJ e Obter Selo Oficial
                    </button>
                  </form>
                </div>
              </div>

              <!-- Guia Anti-Golpe para o Consumidor -->
              <div class="security-guide-col">
                <div class="guide-card">
                  <div class="guide-header">
                    <span class="guide-icon">💡</span>
                    <h3 class="guide-title">Dicas Anti-Golpe para o Consumidor</h3>
                  </div>

                  <div class="guide-tips-list">
                    <div class="tip-card">
                      <div class="tip-num">1</div>
                      <div>
                        <strong>Confira o Titular do Pix</strong>
                        <p>
                          Antes de confirmar qualquer transferência via Pix, certifique-se de que a conta de destino está em nome de <strong>{{ restaurant.legalName || restaurant.name }}</strong> e não de pessoas físicas desconhecidas.
                        </p>
                      </div>
                    </div>

                    <div class="tip-card">
                      <div class="tip-num">2</div>
                      <div>
                        <strong>Utilize os Canais Oficiais</strong>
                        <p>
                          Golpistas costumam clonar perfis no Instagram e WhatsApp. Ligue ou envie mensagem apenas para os números e links cadastrados e verificados nesta página.
                        </p>
                      </div>
                    </div>

                    <div class="tip-card">
                      <div class="tip-num">3</div>
                      <div>
                        <strong>Cuidado com Taxas de Reserva</strong>
                        <p>
                          Nunca compartilhe códigos de SMS, senhas ou pague taxas adicionais não discriminadas no cardápio oficial.
                        </p>
                      </div>
                    </div>

                    <div class="tip-card">
                      <div class="tip-num">4</div>
                      <div>
                        <strong>Pagamento na Entrega</strong>
                        <p>
                          Em caso de dúvidas na primeira compra, prefira realizar o pagamento presencialmente na maquininha na retirada ou entrega.
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Canal de Denúncia de Fraude -->
                  <div class="report-box">
                    <h4>Notou alguma atividade fraudulenta?</h4>
                    <p>Caso desconfie de um perfil clonado ou tentativa de golpe, reporte imediatamente para nossa equipe de segurança.</p>
                    <button
                      type="button"
                      class="btn-danger-report"
                      @click="openScamReport"
                    >
                      🚩 Denunciar Estabelecimento ou Suspeita de Fraude
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </template>

      <!-- Estado Quando Restaurante Não For Encontrado -->
      <div v-else class="not-found-card">
        <span class="not-found-icon">🔍</span>
        <h2>Restaurante não encontrado</h2>
        <p>O restaurante que você está procurando não existe ou foi removido.</p>
        <button type="button" class="btn-primary" @click="router.push('/')">
          Voltar para a Página Inicial
        </button>
      </div>

      <!-- Modal / Lightbox do Prato -->
      <div
        v-if="selectedDish"
        class="dish-modal-backdrop animate-fade-in"
        @click.self="closeDishModal"
      >
        <div class="dish-modal-card">
          <button
            type="button"
            class="btn-close-dish-modal"
            title="Fechar visualização"
            @click="closeDishModal"
          >
            ✕
          </button>

          <div class="dish-modal-image-container">
            <img
              v-if="selectedDish.image"
              :src="selectedDish.image"
              :alt="selectedDish.name"
              class="dish-modal-image"
            />
            <div v-else class="dish-modal-fallback">
              <span class="modal-fallback-icon">{{ getCategoryIcon(selectedDish.category) }}</span>
            </div>
            <div class="dish-modal-floating-tags">
              <span v-if="selectedDish.isPopular" class="tag-badge-popular">⭐ Mais Pedido</span>
              <span v-if="selectedDish.isVegetarian" class="tag-badge-veggie">🌱 Vegetariano</span>
              <span class="tag-badge-cat">{{ selectedDish.category }}</span>
            </div>
          </div>

          <div class="dish-modal-body">
            <div class="dish-modal-top-row">
              <h3 class="dish-modal-name">{{ selectedDish.name }}</h3>
              <span class="dish-modal-price">{{ formatPrice(selectedDish.price) }}</span>
            </div>
            <p class="dish-modal-description">{{ selectedDish.description }}</p>
            <div class="dish-modal-footer">
              <span class="dish-modal-cuisine-tag">Restaurante: <strong>{{ restaurant?.name }}</strong></span>
              <button type="button" class="btn-secondary btn-sm" @click="closeDishModal">
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.restaurant-page {
  padding: 1.5rem 0 4rem;
}

.top-nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.btn-back {
  background: none;
  border: none;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--secondary);
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  transition: color var(--transition-fast), transform var(--transition-fast);
  cursor: pointer;
}

.btn-back:hover {
  color: var(--primary);
  transform: translateX(-3px);
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-report-action {
  background-color: #fee2e2;
  border: 1px solid #fca5a5;
  color: #991b1b;
  padding: 0.45rem 0.85rem;
  border-radius: var(--radius-md);
  font-size: 0.825rem;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-report-action:hover {
  background-color: #dc2626;
  color: #ffffff;
  border-color: #dc2626;
}

/* Hero Header */
.restaurant-hero {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 2.25rem;
  box-shadow: var(--shadow-md);
  display: grid;
  grid-template-columns: 1.8fr 1fr;
  gap: 2rem;
  align-items: center;
  margin-bottom: 1.75rem;
  position: relative;
  overflow: hidden;
}

.restaurant-hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  background: linear-gradient(90deg, #15803d, #b91c1c, #991b1b);
}

.verification-hero-bar {
  margin-bottom: 0.85rem;
}

.hero-verified-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 1.5px solid #86efac;
  color: #15803d;
  font-size: 0.8rem;
  font-weight: 800;
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  box-shadow: var(--shadow-sm);
  flex-wrap: wrap;
}

.hero-verified-badge .v-icon {
  font-size: 1rem;
}

.hero-verified-badge .v-cnpj {
  font-family: monospace;
  background: #ffffff;
  padding: 0.1rem 0.45rem;
  border-radius: 4px;
  border: 1px solid #bbf7d0;
  color: #166534;
}

.hero-verified-badge .v-score {
  background: #15803d;
  color: #ffffff;
  padding: 0.1rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
}

.hero-unverified-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #fefce8;
  border: 1.5px solid #fef08a;
  color: #a16207;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.65rem;
}

.tag-cuisine {
  background-color: var(--primary-light);
  color: var(--primary);
  font-weight: 700;
  border: 1px solid var(--primary-border);
}

.tag-price {
  background-color: var(--surface-alt);
  color: var(--text-secondary);
  font-weight: 700;
}

.tag-city {
  background-color: #ffffff;
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.hero-title {
  font-size: 2.35rem;
  font-weight: 800;
  color: var(--secondary);
  line-height: 1.2;
  margin-bottom: 0.35rem;
  letter-spacing: -0.03em;
}

.hero-legal-name {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: 0.75rem;
}

.hero-description {
  font-size: 1.05rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 1.25rem;
  max-width: 680px;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.25rem;
  font-size: 0.95rem;
  color: var(--text-secondary);
}

.rating-badge-large {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fffbeb;
  padding: 0.35rem 0.75rem;
  border-radius: var(--radius-md);
  border: 1px solid #fde68a;
}

.rating-num {
  font-weight: 800;
  font-size: 1.1rem;
  color: #92400e;
}

.reviews-count {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.cta-card {
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  text-align: center;
  align-items: center;
}

.cta-shield-icon {
  font-size: 2.25rem;
}

.cta-title {
  font-weight: 800;
  font-size: 1.15rem;
  color: var(--secondary);
}

.cta-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.45;
}

.btn-block {
  width: 100%;
}

/* Barra de Abas (Tabs) */
.restaurant-tabs-nav {
  display: flex;
  gap: 0.5rem;
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 0.5rem;
  margin-bottom: 2rem;
  box-shadow: var(--shadow-sm);
  overflow-x: auto;
}

.tab-btn {
  background: none;
  border: none;
  padding: 0.85rem 1.35rem;
  border-radius: var(--radius-md);
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--text-secondary);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all var(--transition-fast);
  white-space: nowrap;
  cursor: pointer;
}

.tab-btn:hover {
  background-color: var(--primary-light);
  color: var(--primary);
}

.tab-btn.active {
  background: var(--primary-gradient);
  color: #ffffff;
  box-shadow: var(--shadow-red);
}

.tab-btn.tab-btn-security.active {
  background: linear-gradient(135deg, #15803d 0%, #166534 100%);
  box-shadow: 0 4px 12px rgba(22, 101, 52, 0.3);
}

.tab-badge {
  background-color: rgba(0, 0, 0, 0.06);
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-full);
}

.tab-btn.active .tab-badge {
  background-color: rgba(255, 255, 255, 0.25);
  color: white;
}

.tab-badge-verified {
  background-color: #dcfce7;
  color: #15803d;
  font-size: 0.72rem;
  padding: 0.15rem 0.45rem;
  border-radius: var(--radius-full);
}

.tab-btn.active .tab-badge-verified {
  background-color: #ffffff;
  color: #15803d;
  font-weight: 800;
}

/* Estruturas de Conteúdo */
.content-grid-two {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  align-items: start;
}

.content-main-card,
.content-side-card {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 2rem;
  box-shadow: var(--shadow-sm);
}

.pane-title {
  font-size: 1.45rem;
  font-weight: 800;
  color: var(--secondary);
  margin-bottom: 0.85rem;
  letter-spacing: -0.02em;
}

.pane-subtitle {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin-bottom: 1.25rem;
}

.long-desc {
  font-size: 1.05rem;
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 1.75rem;
}

.subsection-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--secondary);
  margin-bottom: 1rem;
}

.amenities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.85rem;
  margin-bottom: 2rem;
}

.amenity-chip {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background-color: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
}

.amenity-check {
  color: var(--primary);
  font-weight: 800;
}

.highlights-box {
  background: var(--primary-light);
  border: 1px solid var(--primary-border);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  color: var(--primary-dark);
}

.highlights-box h4 {
  font-size: 0.95rem;
  font-weight: 700;
  margin-bottom: 0.35rem;
}

.highlights-box p {
  font-size: 0.9rem;
  line-height: 1.5;
}

.side-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--secondary);
  margin-bottom: 1.25rem;
}

.quick-facts {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.quick-facts li {
  display: flex;
  justify-content: space-between;
  padding-bottom: 0.65rem;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 0.9rem;
}

.fact-label {
  color: var(--text-muted);
}

.fact-val {
  font-weight: 600;
  color: var(--text);
  text-align: right;
}

/* Cardápio */
.menu-pane-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 1.75rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.menu-categories-pills {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.category-pill {
  background-color: #ffffff;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  padding: 0.5rem 1.15rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
}

.category-pill:hover {
  border-color: var(--primary);
  color: var(--primary);
  background-color: var(--primary-light);
}

.category-pill.active {
  background: var(--primary-gradient);
  color: white;
  border-color: var(--primary);
  box-shadow: var(--shadow-red);
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.menu-item-card {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  cursor: pointer;
  outline: none;
  transition: transform var(--transition-normal), box-shadow var(--transition-normal), border-color var(--transition-normal);
}

.menu-item-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-border);
}

.menu-item-card:focus-visible {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-glow);
}

.menu-item-media {
  position: relative;
  width: 100%;
  height: 200px;
  background-color: var(--surface-alt);
  overflow: hidden;
}

.dish-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

.menu-item-card:hover .dish-img {
  transform: scale(1.06);
}

.dish-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f7f6f5 0%, #edece9 100%);
}

.fallback-icon {
  font-size: 3rem;
  opacity: 0.6;
}

.media-badges-overlay {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  z-index: 2;
}

.media-category-chip {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: rgba(24, 24, 27, 0.75);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-full);
  z-index: 2;
}

.media-hover-hint {
  position: absolute;
  inset: 0;
  background: rgba(24, 24, 27, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition-fast);
  z-index: 3;
}

.media-hover-hint span {
  background: #ffffff;
  color: var(--secondary);
  font-size: 0.825rem;
  font-weight: 700;
  padding: 0.4rem 0.85rem;
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-md);
  transform: translateY(6px);
  transition: transform var(--transition-fast);
}

.menu-item-card:hover .media-hover-hint {
  opacity: 1;
}

.menu-item-card:hover .media-hover-hint span {
  transform: translateY(0);
}

.menu-item-content {
  padding: 1.25rem 1.35rem 1.4rem;
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: space-between;
  gap: 0.65rem;
}

.menu-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
}

.item-name {
  font-size: 1.125rem;
  font-weight: 800;
  color: var(--secondary);
  line-height: 1.3;
  letter-spacing: -0.015em;
}

.tag-badge-popular {
  background: #fef3c7;
  color: #92400e;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-sm);
  border: 1px solid #fde68a;
  box-shadow: var(--shadow-sm);
}

.tag-badge-veggie {
  background: #dcfce7;
  color: #166534;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-sm);
  border: 1px solid #bbf7d0;
  box-shadow: var(--shadow-sm);
}

.tag-badge-cat {
  background: var(--surface-alt);
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-sm);
}

.item-price {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--primary);
  white-space: nowrap;
}

.item-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Modal Lightbox de Foto do Prato */
.dish-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(24, 24, 27, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 1.25rem;
}

.dish-modal-card {
  background: #ffffff;
  border-radius: var(--radius-lg);
  overflow: hidden;
  max-width: 560px;
  width: 100%;
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--border);
  position: relative;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.btn-close-dish-modal {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(24, 24, 27, 0.7);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  color: #ffffff;
  border: none;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  cursor: pointer;
  z-index: 10;
  transition: all var(--transition-fast);
}

.btn-close-dish-modal:hover {
  background: var(--primary);
  transform: scale(1.08);
}

.dish-modal-image-container {
  position: relative;
  width: 100%;
  height: 300px;
  background-color: var(--surface-alt);
  flex-shrink: 0;
}

.dish-modal-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dish-modal-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f3f1;
}

.modal-fallback-icon {
  font-size: 4rem;
  opacity: 0.5;
}

.dish-modal-floating-tags {
  position: absolute;
  bottom: 0.85rem;
  left: 0.85rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.dish-modal-body {
  padding: 1.5rem 1.75rem 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  overflow-y: auto;
}

.dish-modal-top-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.dish-modal-name {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--secondary);
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.dish-modal-price {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--primary);
  white-space: nowrap;
}

.dish-modal-description {
  font-size: 0.925rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.dish-modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-subtle);
}

.dish-modal-cuisine-tag {
  font-size: 0.85rem;
  color: var(--text-muted);
}

/* Avaliações */
.reviews-layout {
  display: grid;
  grid-template-columns: 1fr 1.35fr;
  gap: 2rem;
  align-items: start;
}

.reviews-action-col {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.rating-summary-card,
.write-review-card {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.75rem;
  box-shadow: var(--shadow-sm);
}

.summary-score-row {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.big-score {
  font-size: 3.5rem;
  font-weight: 800;
  color: var(--secondary);
  line-height: 1;
}

.big-stars {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.total-reviews-text {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.distribution-bars {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dist-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.85rem;
}

.dist-label {
  width: 32px;
  font-weight: 600;
  color: var(--text-secondary);
}

.dist-track {
  flex: 1;
  height: 8px;
  background-color: var(--surface-alt);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.dist-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--stars), #b91c1c);
  border-radius: var(--radius-full);
  transition: width 0.4s ease;
}

.dist-count {
  width: 64px;
  text-align: right;
  color: var(--text-muted);
  font-size: 0.8rem;
}

/* Formulário de Avaliação */
.review-form {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-label {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--secondary);
}

.picker-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.picker-num {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.85rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  background: #ffffff;
  transition: border-color var(--transition-fast);
}

.form-input:focus,
.form-textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-glow);
}

.alert-box {
  padding: 0.85rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
}

.alert-danger {
  background-color: var(--danger-bg);
  color: var(--danger);
  border: 1px solid var(--danger-border);
}

.alert-success {
  background-color: var(--success-bg);
  color: var(--success);
  border: 1px solid var(--success-border);
}

.login-prompt {
  text-align: center;
  padding: 1.5rem 1rem;
  background-color: var(--surface-alt);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

/* Feed de Avaliações */
.reviews-feed-col {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.reviews-feed {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.review-feed-card {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.review-feed-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.author-block {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar-circle {
  width: 40px;
  height: 40px;
  background: var(--primary-gradient);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  box-shadow: 0 2px 6px rgba(185, 28, 28, 0.2);
}

.author-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--secondary);
}

.review-date {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.review-body {
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* Localização & Contato */
.address-box {
  display: flex;
  align-items: center;
  gap: 1rem;
  background-color: var(--surface-alt);
  padding: 1.25rem;
  border-radius: var(--radius-md);
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-subtle);
}

.address-icon {
  font-size: 2rem;
}

.address-line {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--secondary);
}

.address-city {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.map-visual-placeholder {
  background: linear-gradient(135deg, #f7f6f5, #ebe9e7);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 1.5rem;
}

.map-inner {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(6px);
  padding: 1.5rem;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid var(--border);
}

.map-pin {
  font-size: 1.8rem;
}

.contact-block {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.contact-item {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
}

.c-icon {
  font-size: 1.4rem;
  line-height: 1.2;
}

.contact-item strong {
  font-size: 0.9rem;
  color: var(--secondary);
}

.contact-item p {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.web-link {
  color: var(--primary);
  font-weight: 600;
}

.web-link:hover {
  text-decoration: underline;
}

/* ==========================================================================
   ABA 5: AUTENTICIDADE & SEGURANÇA ANTI-GOLPE
   ========================================================================== */
.security-layout-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 2rem;
  align-items: start;
}

.certificate-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.certificate-card {
  background: #ffffff;
  border-radius: var(--radius-lg);
  padding: 2.25rem;
  box-shadow: var(--shadow-md);
  position: relative;
  overflow: hidden;
}

.cert-verified {
  border: 2px solid #86efac;
  background: linear-gradient(180deg, #ffffff 0%, #fafffa 100%);
}

.cert-verified::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: linear-gradient(90deg, #15803d, #22c55e, #16a34a);
}

.cert-unverified {
  border: 2px dashed #fef08a;
  background: #fffdf5;
}

.cert-header {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-bottom: 1.75rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border);
}

.cert-seal {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #dcfce7;
  border: 2px solid #86efac;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
}

.seal-icon {
  font-size: 2rem;
}

.cert-tag {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #15803d;
  text-transform: uppercase;
}

.cert-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--secondary);
  margin-top: 0.2rem;
  letter-spacing: -0.02em;
}

.cert-details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  margin-bottom: 1.75rem;
}

.cert-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.field-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
}

.field-value {
  font-size: 0.95rem;
  color: var(--secondary);
}

.field-mono {
  font-family: monospace;
  font-size: 1rem;
  color: #166534;
}

.safety-score-banner {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 1.5px solid #86efac;
  border-radius: var(--radius-md);
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.75rem;
}

.score-circle-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border: 2px solid #22c55e;
  border-radius: 50%;
  width: 90px;
  height: 90px;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

.score-percent {
  font-size: 1.65rem;
  font-weight: 900;
  color: #15803d;
  line-height: 1;
}

.score-txt {
  font-size: 0.65rem;
  font-weight: 700;
  color: #4b5563;
  text-align: center;
  margin-top: 0.15rem;
}

.score-explanation {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.score-status-badge {
  font-size: 0.825rem;
  font-weight: 800;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  width: fit-content;
}

.status-green {
  background: #15803d;
  color: #ffffff;
}

.status-yellow {
  background: #ca8a04;
  color: #ffffff;
}

.score-p {
  font-size: 0.85rem;
  color: #374151;
  line-height: 1.45;
}

.audit-checklist-box {
  border-top: 1px solid var(--border);
  padding-top: 1.5rem;
}

.checklist-title {
  font-size: 1rem;
  font-weight: 800;
  color: var(--secondary);
  margin-bottom: 1rem;
}

.checklist-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.checklist-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: var(--surface-alt);
  padding: 0.65rem 0.85rem;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
}

.checklist-item.item-checked {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
}

.check-icon {
  font-weight: 900;
  color: #16a34a;
}

/* Validação para Donos de Estabelecimentos */
.owner-verify-card {
  background: #ffffff;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.75rem;
  box-shadow: var(--shadow-sm);
}

.owner-verify-header {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  margin-bottom: 1.25rem;
}

.owner-icon {
  font-size: 1.75rem;
}

.owner-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--secondary);
}

.owner-subtitle {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 0.15rem;
}

.owner-verify-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Guia Lateral Anti-Golpe */
.security-guide-col {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.guide-card {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.75rem;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.guide-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.guide-icon {
  font-size: 1.5rem;
}

.guide-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--secondary);
}

.guide-tips-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tip-card {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0.95rem;
}

.tip-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #1e293b;
  color: #ffffff;
  font-weight: 800;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tip-card strong {
  font-size: 0.9rem;
  color: var(--secondary);
  display: block;
  margin-bottom: 0.25rem;
}

.tip-card p {
  font-size: 0.825rem;
  color: var(--text-secondary);
  line-height: 1.45;
}

.report-box {
  background: #fff5f5;
  border: 1.5px solid #fecaca;
  border-radius: var(--radius-md);
  padding: 1.25rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.65rem;
}

.report-box h4 {
  font-size: 0.95rem;
  font-weight: 800;
  color: #991b1b;
}

.report-box p {
  font-size: 0.825rem;
  color: #7f1d1d;
  line-height: 1.4;
}

.btn-danger-report {
  background-color: #dc2626;
  color: #ffffff;
  border: none;
  padding: 0.65rem 1rem;
  border-radius: var(--radius-md);
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all var(--transition-fast);
  width: 100%;
}

.btn-danger-report:hover {
  background-color: #b91c1c;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
  transform: translateY(-1px);
}

/* Estado Não Encontrado */
.not-found-card {
  background: #ffffff;
  border: 1.5px dashed var(--border);
  border-radius: var(--radius-lg);
  padding: 4rem 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.not-found-icon {
  font-size: 3rem;
}

/* Responsividade */
@media (max-width: 960px) {
  .restaurant-hero {
    grid-template-columns: 1fr;
  }
  .content-grid-two,
  .reviews-layout,
  .security-layout-grid {
    grid-template-columns: 1fr;
  }
  .cert-details-grid,
  .checklist-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .hero-title {
    font-size: 1.75rem;
  }
  .menu-grid {
    grid-template-columns: 1fr;
  }
}
</style>
