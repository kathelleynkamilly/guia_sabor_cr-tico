<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRestaurantStore } from '../stores/restaurant'
import { useAuthStore } from '../stores/auth'
import StarRating from '../components/StarRating.vue'

const route = useRoute()
const router = useRouter()
const restaurantStore = useRestaurantStore()
const authStore = useAuthStore()

// Aba ativa
type TabType = 'sobre' | 'cardapio' | 'avaliacoes' | 'contato'
const activeTab = ref<TabType>('sobre')

// Filtro de categoria no cardápio
const activeMenuCategory = ref<string>('Todos')

// Formulário de nova avaliação
const reviewStars = ref<number>(5)
const reviewComment = ref<string>('')
const formError = ref<string>('')
const formSuccess = ref<string>('')

// Copiado feedback
const isCopied = ref<boolean>(false)

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

function handleReviewSubmit() {
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
    const success = restaurantStore.addReview(
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
</script>

<template>
  <div class="restaurant-page">
    <div class="container">
      <!-- Barra de navegação superior (Voltar + Compartilhar) -->
      <div class="top-nav-bar">
        <button type="button" class="btn-back" @click="router.push('/')">
          ← Voltar para todos os restaurantes
        </button>

        <div class="top-actions">
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
            <div class="hero-tags">
              <span class="tag tag-cuisine">{{ restaurant.cuisine }}</span>
              <span v-if="restaurant.priceRange" class="tag tag-price">{{ restaurant.priceRange }}</span>
              <span class="tag tag-city">📍 {{ restaurant.city }}</span>
            </div>

            <h1 class="hero-title">{{ restaurant.name }}</h1>

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
              <span class="cta-title">Gostou da experiência?</span>
              <p class="cta-desc">Deixe sua nota e ajude outras pessoas a descobrirem pratos incríveis.</p>
              <button
                type="button"
                class="btn-primary btn-block"
                @click="activeTab = 'avaliacoes'"
              >
                ✍️ Escrever Avaliação
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
                  {{ cat }}
                </button>
              </div>
            </div>

            <!-- Grade de Pratos do Cardápio -->
            <div v-if="filteredMenu.length > 0" class="menu-grid">
              <article v-for="item in filteredMenu" :key="item.id" class="menu-item-card">
                <div class="menu-item-header">
                  <div class="menu-item-titles">
                    <h3 class="item-name">{{ item.name }}</h3>
                    <div class="item-tags">
                      <span v-if="item.isPopular" class="tag-badge-popular">⭐ Mais Pedido</span>
                      <span v-if="item.isVegetarian" class="tag-badge-veggie">🌱 Vegetariano</span>
                      <span class="tag-badge-cat">{{ item.category }}</span>
                    </div>
                  </div>
                  <span class="item-price">{{ formatPrice(item.price) }}</span>
                </div>
                <p class="item-description">{{ item.description }}</p>
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
}

.btn-back:hover {
  color: var(--primary);
  transform: translateX(-3px);
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
  background: linear-gradient(90deg, #b91c1c, #991b1b, #7f1d1d);
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.85rem;
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
  margin-bottom: 0.75rem;
  letter-spacing: -0.03em;
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
}

.cta-title {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--secondary);
}

.cta-desc {
  font-size: 0.875rem;
  color: var(--text-secondary);
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
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 1.25rem;
}

.menu-item-card {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.75rem;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast);
}

.menu-item-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-border);
}

.menu-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.item-name {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--secondary);
  line-height: 1.3;
}

.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.35rem;
}

.tag-badge-popular {
  background: #fef3c7;
  color: #92400e;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-sm);
  border: 1px solid #fde68a;
}

.tag-badge-veggie {
  background: #dcfce7;
  color: #166534;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-sm);
  border: 1px solid #bbf7d0;
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
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--primary);
  white-space: nowrap;
}

.item-description {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.55;
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

.form-textarea {
  width: 100%;
  padding: 0.85rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  background: #ffffff;
  resize: vertical;
  transition: border-color var(--transition-fast);
}

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
  .reviews-layout {
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
