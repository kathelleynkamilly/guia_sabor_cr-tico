<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useRestaurantStore } from '../stores/restaurant'
import { useAuthStore } from '../stores/auth'
import StarRating from './StarRating.vue'

const router = useRouter()
const restaurantStore = useRestaurantStore()
const authStore = useAuthStore()

const reviewStars = ref<number>(5)
const reviewComment = ref<string>('')
const formError = ref<string>('')
const formSuccess = ref<string>('')

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

  if (restaurantStore.selectedRestaurant) {
    const success = await restaurantStore.addReview(
      restaurantStore.selectedRestaurant.id,
      authStore.currentUser?.name || 'Cliente',
      reviewStars.value,
      reviewComment.value,
      authStore.currentUser?.email
    )

    if (success) {
      formSuccess.value = 'Avaliação enviada com sucesso! Obrigado pelo feedback.'
      reviewComment.value = ''
      reviewStars.value = 5

      setTimeout(() => {
        formSuccess.value = ''
      }, 4000)
    }
  }
}

function formatPrice(val: number): string {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function handleImgError(e: Event) {
  const target = e.target as HTMLImageElement
  if (target && !target.src.includes('photo-1546069901')) {
    target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
  }
}

function openScamReport() {
  if (restaurantStore.selectedRestaurant) {
    restaurantStore.openReportModal(restaurantStore.selectedRestaurant)
  }
}
</script>

<template>
  <aside v-if="restaurantStore.selectedRestaurant" class="details-card animate-fade-in">
    <!-- Cabeçalho dos Detalhes -->
    <div class="details-top">
      <div class="header-main">
        <div class="title-cuisine">
          <h2 class="restaurant-name">{{ restaurantStore.selectedRestaurant.name }}</h2>
          <span class="tag tag-cuisine">{{ restaurantStore.selectedRestaurant.cuisine }}</span>
        </div>
        <button
          type="button"
          class="btn-close-details"
          title="Fechar detalhes"
          @click="restaurantStore.selectRestaurant(null)"
        >
          ✕
        </button>
      </div>

      <!-- CARD DE VERIFICAÇÃO & SEGURANÇA ANTI-GOLPE -->
      <div
        class="security-banner-box"
        :class="restaurantStore.selectedRestaurant.isVerified ? 'is-verified-box' : 'is-unverified-box'"
      >
        <div class="security-header-row">
          <div class="sec-badge-title">
            <span class="sec-icon">{{ restaurantStore.selectedRestaurant.isVerified ? '🛡️' : '⚠️' }}</span>
            <strong>
              {{ restaurantStore.selectedRestaurant.isVerified ? 'Estabelecimento Verificado' : 'Verificação Pendente' }}
            </strong>
          </div>
          <span
            class="sec-score"
            :class="restaurantStore.selectedRestaurant.isVerified ? 'score-high' : 'score-mid'"
          >
            Score: {{ restaurantStore.selectedRestaurant.safetyScore || 98 }}%
          </span>
        </div>

        <div v-if="restaurantStore.selectedRestaurant.isVerified" class="sec-body">
          <p class="sec-text">
            Este restaurante possui <strong>CNPJ regular na Receita Federal</strong> e localização auditada contra fraudes.
          </p>
          <div class="sec-meta-tags">
            <span v-if="restaurantStore.selectedRestaurant.cnpj" class="sec-chip">
              CNPJ: {{ restaurantStore.selectedRestaurant.cnpj }}
            </span>
            <span v-if="restaurantStore.selectedRestaurant.legalName" class="sec-chip">
              Razão Social: {{ restaurantStore.selectedRestaurant.legalName }}
            </span>
          </div>
        </div>

        <div v-else class="sec-body">
          <p class="sec-text">
            Estabelecimento sem comprovação de CNPJ. Cautela recomendada para pagamentos antecipados ou Pix.
          </p>
        </div>

        <!-- Dica Anti-Golpe Pix -->
        <div class="anti-scam-tip">
          <span class="tip-icon">💡</span>
          <span><strong>Dica Anti-Golpe:</strong> Ao pagar via Pix, confira se o titular corresponde ao restaurante.</span>
        </div>

        <!-- Botão Denúncia -->
        <button
          type="button"
          class="btn-report-fraud"
          title="Reportar perfil falso, fraude de Pix ou endereço inexistente"
          @click="openScamReport"
        >
          🚩 Denunciar Suspeita de Golpe
        </button>
      </div>

      <!-- Informações Meta -->
      <div class="meta-grid">
        <div class="meta-row">
          <span class="meta-icon">📍</span>
          <span><strong>Endereço:</strong> {{ restaurantStore.selectedRestaurant.address }}</span>
        </div>
        <div class="meta-row">
          <span class="meta-icon">🏙️</span>
          <span><strong>Cidade:</strong> {{ restaurantStore.selectedRestaurant.city }}</span>
        </div>
        <div class="meta-row">
          <span class="meta-icon">🕒</span>
          <span><strong>Horário:</strong> {{ restaurantStore.selectedRestaurant.hours }}</span>
        </div>
        <div v-if="restaurantStore.selectedRestaurant.phone" class="meta-row">
          <span class="meta-icon">📞</span>
          <span><strong>Telefone:</strong> {{ restaurantStore.selectedRestaurant.phone }}</span>
        </div>
      </div>

      <!-- Placar da Nota Média -->
      <div class="rating-overview">
        <div class="score-box">
          <span class="score-number">{{ restaurantStore.selectedRestaurant.rating.toFixed(1) }}</span>
          <StarRating :rating="restaurantStore.selectedRestaurant.rating" size="md" />
        </div>
        <div class="score-meta">
          <span class="score-label">Nota da Comunidade</span>
          <span class="score-total">
            Baseado em {{ restaurantStore.selectedRestaurant.reviews.length }} 
            {{ restaurantStore.selectedRestaurant.reviews.length === 1 ? 'avaliação' : 'avaliações' }}
          </span>
        </div>
      </div>

      <!-- Preview dos Pratos em Destaque do Cardápio -->
      <div
        v-if="restaurantStore.selectedRestaurant.menu && restaurantStore.selectedRestaurant.menu.length > 0"
        class="menu-preview-section"
      >
        <div class="preview-header">
          <span class="preview-title">🍽️ Destaques do Cardápio</span>
          <button
            type="button"
            class="btn-link-menu"
            @click="router.push(`/restaurant/${restaurantStore.selectedRestaurant.id}`)"
          >
            Ver todos ({{ restaurantStore.selectedRestaurant.menu.length }}) →
          </button>
        </div>

        <div class="menu-preview-list">
          <div
            v-for="dish in restaurantStore.selectedRestaurant.menu.slice(0, 3)"
            :key="dish.id"
            class="menu-preview-item"
            @click="router.push(`/restaurant/${restaurantStore.selectedRestaurant.id}`)"
          >
            <div class="dish-thumb-box">
              <img
                v-if="dish.image"
                :src="dish.image"
                :alt="dish.name"
                class="dish-thumb"
                loading="lazy"
                @error="handleImgError"
              />
              <span v-else class="dish-thumb-fallback">🍲</span>
            </div>
            <div class="dish-preview-info">
              <div class="dish-name-row">
                <span class="dish-preview-name">{{ dish.name }}</span>
                <span class="dish-preview-price">{{ formatPrice(dish.price) }}</span>
              </div>
              <span class="dish-preview-cat">{{ dish.category }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Botão para Página Completa com Abas -->
      <div class="full-page-banner">
        <button
          type="button"
          class="btn-primary btn-full-page"
          @click="router.push(`/restaurant/${restaurantStore.selectedRestaurant.id}`)"
        >
          Ver Página Completa (Cardápio, Sobre & Segurança) ↗
        </button>
      </div>
    </div>

    <hr class="divider" />

    <!-- Formulário de Avaliação -->
    <div class="review-box">
      <h3 class="box-title">Deixe sua Avaliação</h3>

      <template v-if="authStore.isAuthenticated">
        <form class="review-form" @submit.prevent="handleReviewSubmit">
          <div class="form-group">
            <label class="form-label">Sua Nota:</label>
            <div class="star-picker">
              <StarRating v-model="reviewStars" interactive size="lg" />
              <span class="star-label">({{ reviewStars }} {{ reviewStars === 1 ? 'estrela' : 'estrelas' }})</span>
            </div>
          </div>

          <div class="form-group">
            <label for="reviewText" class="form-label">Sua Opinião:</label>
            <textarea
              id="reviewText"
              v-model="reviewComment"
              placeholder="Conte como foi sua experiência com a comida, atendimento e ambiente..."
              rows="3"
              class="form-textarea"
              required
            ></textarea>
          </div>

          <div v-if="formError" class="alert-error">
            {{ formError }}
          </div>

          <div v-if="formSuccess" class="alert-success">
            {{ formSuccess }}
          </div>

          <button type="submit" class="btn-primary btn-submit">
            Enviar Avaliação
          </button>
        </form>
      </template>

      <!-- Mensagem para Visitante -->
      <template v-else>
        <div class="guest-prompt">
          <p class="guest-text">Faça login para compartilhar sua experiência gastronômica.</p>
          <button
            type="button"
            class="btn-primary btn-sm"
            @click="authStore.openLoginModal()"
          >
            Fazer Login para Avaliar
          </button>
        </div>
      </template>
    </div>

    <hr class="divider" />

    <!-- Lista de Avaliações -->
    <div class="reviews-section">
      <h3 class="box-title">
        Avaliações da Comunidade ({{ restaurantStore.selectedRestaurant.reviews.length }})
      </h3>

      <div v-if="restaurantStore.selectedRestaurant.reviews.length > 0" class="reviews-list">
        <div
          v-for="rev in restaurantStore.selectedRestaurant.reviews"
          :key="rev.id"
          class="review-item"
        >
          <div class="review-header">
            <div class="author-info">
              <div class="author-avatar">{{ rev.author.charAt(0).toUpperCase() }}</div>
              <div class="author-details">
                <span class="author-name">{{ rev.author }}</span>
                <span class="review-date">{{ rev.createdAt }}</span>
              </div>
            </div>
            <StarRating :rating="rev.stars" size="sm" />
          </div>
          <p class="review-text">{{ rev.comment }}</p>
        </div>
      </div>

      <div v-else class="no-reviews">
        <p>Ainda não há avaliações registradas para este restaurante.</p>
      </div>
    </div>
  </aside>

  <!-- Estado de Nenhum Restaurante Selecionado -->
  <aside v-else class="details-placeholder">
    <div class="placeholder-content">
      <span class="placeholder-icon">👉</span>
      <h3>Nenhum restaurante selecionado</h3>
      <p>Clique em qualquer restaurante da lista ao lado para ver endereço completo, horário, cardápio e selo de verificação.</p>
    </div>
  </aside>
</template>

<style scoped>
.details-card {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.85rem;
  box-shadow: var(--shadow-md);
  position: sticky;
  top: 90px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

.details-placeholder {
  background: #ffffff;
  border: 1.5px dashed var(--border);
  border-radius: var(--radius-lg);
  padding: 3rem 2rem;
  text-align: center;
  position: sticky;
  top: 90px;
  min-height: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  color: var(--text-secondary);
}

.placeholder-icon {
  font-size: 2.5rem;
}

.placeholder-content h3 {
  color: var(--secondary);
  font-weight: 700;
}

.placeholder-content p {
  font-size: 0.9rem;
  max-width: 320px;
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.85rem;
}

.title-cuisine {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.restaurant-name {
  font-size: 1.65rem;
  font-weight: 800;
  color: var(--secondary);
  line-height: 1.25;
  letter-spacing: -0.025em;
}

.tag-cuisine {
  background-color: var(--primary-light);
  color: var(--primary);
  border: 1px solid var(--primary-border);
  font-weight: 700;
  font-size: 0.75rem;
  padding: 0.25rem 0.55rem;
  border-radius: var(--radius-sm);
  width: fit-content;
}

.btn-close-details {
  background: var(--surface-alt);
  border: 1px solid var(--border-subtle);
  font-size: 0.95rem;
  color: var(--text-muted);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.btn-close-details:hover {
  background: var(--primary-light);
  color: var(--primary);
}

/* Card de Segurança Anti-Golpe */
.security-banner-box {
  border-radius: var(--radius-md);
  padding: 0.95rem 1.1rem;
  margin-bottom: 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.is-verified-box {
  background: linear-gradient(135deg, #f0fdf4 0%, #f7fee7 100%);
  border: 1.5px solid #86efac;
}

.is-unverified-box {
  background: #fefce8;
  border: 1.5px solid #fef08a;
}

.security-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sec-badge-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.875rem;
  color: #166534;
}

.is-unverified-box .sec-badge-title {
  color: #854d0e;
}

.sec-icon {
  font-size: 1.05rem;
}

.sec-score {
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.15rem 0.45rem;
  border-radius: 9999px;
}

.score-high {
  background: #dcfce7;
  color: #15803d;
  border: 1px solid #86efac;
}

.score-mid {
  background: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fca5a5;
}

.sec-text {
  font-size: 0.8rem;
  color: #374151;
  line-height: 1.35;
}

.sec-meta-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.25rem;
}

.sec-chip {
  font-size: 0.72rem;
  font-family: monospace;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.85);
  color: #1f2937;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.anti-scam-tip {
  background: rgba(255, 255, 255, 0.75);
  border: 1px dashed rgba(0, 0, 0, 0.12);
  padding: 0.4rem 0.6rem;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.74rem;
  color: #4b5563;
  line-height: 1.3;
}

.tip-icon {
  font-size: 0.85rem;
}

.btn-report-fraud {
  background: none;
  border: none;
  font-size: 0.75rem;
  font-weight: 700;
  color: #dc2626;
  padding: 0.2rem 0;
  cursor: pointer;
  text-align: left;
  transition: color var(--transition-fast);
  margin-top: 0.1rem;
}

.btn-report-fraud:hover {
  color: #991b1b;
  text-decoration: underline;
}

.meta-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 1.25rem;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.meta-icon {
  font-size: 1rem;
}

.rating-overview {
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.score-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-right: 1rem;
  border-right: 1px solid var(--border);
}

.score-number {
  font-size: 1.85rem;
  font-weight: 800;
  color: var(--secondary);
  line-height: 1;
  margin-bottom: 0.3rem;
}

.score-meta {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.score-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--secondary);
}

.score-total {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.full-page-banner {
  margin-top: 1.25rem;
}

.btn-full-page {
  width: 100%;
  padding: 0.75rem 1rem;
  font-weight: 700;
  font-size: 0.9rem;
  text-align: center;
}

.divider {
  border: none;
  border-top: 1px solid var(--border-subtle);
  margin: 1.5rem 0;
}

.box-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--secondary);
  margin-bottom: 1rem;
  letter-spacing: -0.01em;
}

.review-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--secondary);
}

.star-picker {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.star-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
}

.form-textarea {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  background-color: #ffffff;
  color: var(--text);
  transition: border-color var(--transition-fast);
}

.form-textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-glow);
}

.alert-error {
  background-color: var(--danger-bg);
  color: var(--danger);
  border: 1px solid var(--danger-border);
  padding: 0.65rem 0.85rem;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 600;
}

.alert-success {
  background-color: #dcfce7;
  color: #15803d;
  border: 1px solid #86efac;
  padding: 0.65rem 0.85rem;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 600;
}

.btn-submit {
  align-self: flex-start;
  padding: 0.65rem 1.25rem;
  font-weight: 700;
}

.guest-prompt {
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.guest-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.review-item {
  background: var(--surface-alt);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.author-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary-gradient);
  color: #ffffff;
  font-weight: 800;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.author-details {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-weight: 700;
  font-size: 0.875rem;
  color: var(--text);
}

.review-date {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.review-text {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.no-reviews {
  text-align: center;
  color: var(--text-muted);
  font-size: 0.9rem;
  padding: 1rem 0;
}

/* Destaques do Cardápio na Sidebar */
.menu-preview-section {
  margin-top: 1.25rem;
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1rem;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.preview-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--secondary);
}

.btn-link-menu {
  background: none;
  border: none;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--primary);
  cursor: pointer;
  transition: color var(--transition-fast);
}

.btn-link-menu:hover {
  color: var(--primary-hover);
  text-decoration: underline;
}

.menu-preview-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.menu-preview-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #ffffff;
  padding: 0.5rem 0.65rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.menu-preview-item:hover {
  border-color: var(--primary-border);
  box-shadow: var(--shadow-sm);
  transform: translateX(2px);
}

.dish-thumb-box {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--surface-alt);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dish-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dish-thumb-fallback {
  font-size: 1.25rem;
}

.dish-preview-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  gap: 0.15rem;
}

.dish-name-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
}

.dish-preview-name {
  font-size: 0.825rem;
  font-weight: 700;
  color: var(--secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dish-preview-price {
  font-size: 0.825rem;
  font-weight: 800;
  color: var(--primary);
  white-space: nowrap;
}

.dish-preview-cat {
  font-size: 0.725rem;
  color: var(--text-muted);
}
</style>
