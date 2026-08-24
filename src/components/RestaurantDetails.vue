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

  if (restaurantStore.selectedRestaurant) {
    const success = restaurantStore.addReview(
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

      <!-- Botão para Página Completa com Abas -->
      <div class="full-page-banner">
        <button
          type="button"
          class="btn-primary btn-full-page"
          @click="router.push(`/restaurant/${restaurantStore.selectedRestaurant.id}`)"
        >
          Ver Página Completa (Cardápio, Sobre & Abas) ↗
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
      <p>Clique em qualquer restaurante da lista ao lado para ver endereço completo, horário e avaliações.</p>
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
  margin-bottom: 1rem;
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
  align-self: flex-start;
  background-color: var(--primary-light);
  color: var(--primary);
  border: 1px solid var(--primary-border);
  font-weight: 700;
}

.btn-close-details {
  background: var(--surface-alt);
  border: 1px solid var(--border);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 0.9rem;
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-close-details:hover {
  background: var(--primary-light);
  color: var(--primary);
  border-color: var(--primary-border);
}

.meta-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
  background: var(--surface-alt);
  padding: 1rem;
  border-radius: var(--radius-md);
  margin-bottom: 1.25rem;
  border: 1px solid var(--border-subtle);
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.meta-icon {
  font-size: 1.05rem;
}

.rating-overview {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 0.5rem 0;
}

.full-page-banner {
  margin-top: 1.15rem;
}

.btn-full-page {
  width: 100%;
  font-size: 0.9rem;
  padding: 0.75rem 1rem;
}

.score-box {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score-number {
  font-size: 2.35rem;
  font-weight: 800;
  color: var(--secondary);
  line-height: 1;
}

.score-meta {
  display: flex;
  flex-direction: column;
}

.score-label {
  font-weight: 700;
  color: var(--secondary);
  font-size: 0.95rem;
}

.score-total {
  font-size: 0.825rem;
  color: var(--text-muted);
}

.divider {
  border: none;
  border-top: 1px solid var(--border);
  margin: 1.5rem 0;
}

.box-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--secondary);
  margin-bottom: 1rem;
  letter-spacing: -0.015em;
}

.review-box {
  background: var(--surface-alt);
  padding: 1.25rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
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
  font-weight: 600;
  color: var(--text);
}

.star-picker {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.star-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: #ffffff;
  font-size: 0.9rem;
  color: var(--text);
  resize: vertical;
  min-height: 70px;
}

.form-textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-glow);
}

.alert-error {
  background-color: var(--danger-bg);
  color: var(--danger);
  padding: 0.65rem 0.85rem;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  border: 1px solid var(--danger-border);
}

.alert-success {
  background-color: var(--success-bg);
  color: var(--success);
  padding: 0.65rem 0.85rem;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  border: 1px solid var(--success-border);
}

.btn-submit {
  width: 100%;
  padding: 0.75rem;
}

.guest-prompt {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
}

.guest-text {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.reviews-section {
  display: flex;
  flex-direction: column;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.review-item {
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 1rem;
}

.review-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.author-avatar {
  width: 28px;
  height: 28px;
  background: var(--primary-gradient);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  box-shadow: 0 1px 4px rgba(185, 28, 28, 0.2);
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
</style>
