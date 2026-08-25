<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Restaurant } from '../types/restaurant'
import StarRating from './StarRating.vue'

const router = useRouter()

defineProps<{
  restaurant: Restaurant
  isSelected: boolean
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
}>()

function handleCardImgError(e: Event) {
  const target = e.target as HTMLImageElement
  if (target && !target.src.includes('photo-1546069901')) {
    target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
  }
}

function navigateToRestaurant(id: string, event: Event) {
  event.stopPropagation()
  router.push(`/restaurant/${id}`)
}
</script>

<template>
  <article
    class="restaurant-card"
    :class="{ 'is-selected': isSelected, 'is-verified': restaurant.isVerified }"
    tabindex="0"
    role="button"
    :aria-pressed="isSelected"
    @click="emit('select', restaurant.id)"
    @keydown.enter="emit('select', restaurant.id)"
    @keydown.space.prevent="emit('select', restaurant.id)"
  >
    <!-- Capa / Foto do Restaurante ou Cardápio -->
    <div v-if="restaurant.image || (restaurant.menu && restaurant.menu[0]?.image)" class="card-cover-media">
      <img
        :src="restaurant.image || restaurant.menu?.[0]?.image"
        :alt="restaurant.name"
        class="cover-img"
        loading="lazy"
        @error="handleCardImgError"
      />
      <div class="cover-overlay"></div>
      <div class="cover-top-badges">
        <div v-if="restaurant.isVerified" class="badge-verified-float" title="Selo Oficial Anti-Golpe">
          <span>🛡️ Verificado</span>
        </div>
        <span class="tag tag-cuisine-float">{{ restaurant.cuisine }}</span>
      </div>
      <div v-if="restaurant.menu && restaurant.menu.length > 0" class="cover-menu-badge">
        <span>🍽️ {{ restaurant.menu.length }} opções no cardápio</span>
      </div>
    </div>

    <!-- SELO ANTI-GOLPE & VERIFICAÇÃO (quando sem foto ou detalhe complementar) -->
    <div v-else class="verification-pill-bar">
      <div v-if="restaurant.isVerified" class="badge-verified" title="Estabelecimento auditado contra fraudes com CNPJ regular">
        <span class="badge-icon">🛡️</span>
        <span class="badge-text">Verificado • Anti-Golpe</span>
        <span v-if="restaurant.cnpj" class="cnpj-chip">{{ restaurant.cnpj }}</span>
      </div>
      <div v-else class="badge-unverified" title="Estabelecimento cadastrado sem verificação documental de CNPJ">
        <span class="badge-icon">⚠️</span>
        <span class="badge-text">Sem Verificação</span>
      </div>

      <span class="tag tag-cuisine">{{ restaurant.cuisine }}</span>
    </div>

    <div class="card-header">
      <div class="title-group">
        <h3 class="restaurant-name">{{ restaurant.name }}</h3>
        <span v-if="restaurant.priceRange" class="price-badge">{{ restaurant.priceRange }}</span>
      </div>
    </div>

    <p v-if="restaurant.description" class="restaurant-description">
      {{ restaurant.description }}
    </p>

    <div class="card-info">
      <div class="info-item">
        <span class="info-icon">📍</span>
        <span class="info-text">{{ restaurant.city }} &bull; {{ restaurant.address }}</span>
      </div>
      <div class="info-item">
        <span class="info-icon">🕒</span>
        <span class="info-text">{{ restaurant.hours }}</span>
      </div>
      <div v-if="restaurant.legalName && restaurant.isVerified" class="info-item legal-info">
        <span class="info-icon">🏢</span>
        <span class="info-text">Razão Social: {{ restaurant.legalName }}</span>
      </div>
    </div>

    <div class="card-footer">
      <div class="rating-container">
        <StarRating :rating="restaurant.rating" size="sm" />
        <span class="rating-value">{{ restaurant.rating.toFixed(1) }}</span>
        <span class="reviews-count">({{ restaurant.reviews.length }})</span>
      </div>

      <div class="card-actions">
        <button
          type="button"
          class="btn-view-page"
          title="Ver página completa do restaurante"
          @click="navigateToRestaurant(restaurant.id, $event)"
        >
          Ver Página ↗
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.restaurant-card {
  background-color: #ffffff;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.35rem 1.45rem;
  cursor: pointer;
  transition: transform var(--transition-normal), box-shadow var(--transition-normal), border-color var(--transition-normal);
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  outline: none;
  position: relative;
  overflow: hidden;
}

.restaurant-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 4px;
  background-color: transparent;
  transition: background-color var(--transition-fast);
}

.restaurant-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-border);
}

.restaurant-card:hover::before {
  background-color: var(--primary);
}

.restaurant-card:focus-visible {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-glow);
}

.restaurant-card.is-selected {
  border-color: var(--primary);
  background: linear-gradient(135deg, #ffffff 0%, #fffafa 100%);
  box-shadow: 0 6px 20px rgba(185, 28, 28, 0.12);
}

.restaurant-card.is-selected::before {
  background-color: var(--primary);
}

/* Capa Fotográfica */
.card-cover-media {
  position: relative;
  width: calc(100% + 2.9rem);
  height: 145px;
  margin: -1.35rem -1.45rem 0.25rem -1.45rem;
  overflow: hidden;
  background-color: var(--surface-alt);
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.restaurant-card:hover .cover-img {
  transform: scale(1.06);
}

.cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.25) 100%);
  pointer-events: none;
}

.cover-top-badges {
  position: absolute;
  top: 0.65rem;
  left: 0.75rem;
  right: 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  z-index: 2;
}

.badge-verified-float {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: rgba(21, 128, 61, 0.9);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.22rem 0.55rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.tag-cuisine-float {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  color: var(--primary);
  border: 1px solid rgba(255, 255, 255, 0.7);
  font-weight: 800;
  font-size: 0.74rem;
  padding: 0.22rem 0.55rem;
  border-radius: var(--radius-sm);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.cover-menu-badge {
  position: absolute;
  bottom: 0.6rem;
  right: 0.75rem;
  background: rgba(24, 24, 27, 0.82);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.18rem 0.5rem;
  border-radius: var(--radius-full);
  z-index: 2;
}

/* Barra de Verificação no Topo do Card */
.verification-pill-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.badge-verified {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #15803d;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.55rem;
  border-radius: 9999px;
}

.badge-verified .badge-icon {
  font-size: 0.85rem;
}

.cnpj-chip {
  font-family: monospace;
  font-size: 0.7rem;
  color: #166534;
  background: #dcfce7;
  padding: 0.05rem 0.35rem;
  border-radius: 4px;
}

.badge-unverified {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: #fefce8;
  border: 1px solid #fef08a;
  color: #a16207;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 9999px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.restaurant-name {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--secondary);
  line-height: 1.3;
  letter-spacing: -0.02em;
}

.price-badge {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 700;
  background: var(--surface-alt);
  padding: 0.15rem 0.4rem;
  border-radius: var(--radius-sm);
}

.tag-cuisine {
  background-color: var(--primary-light);
  color: var(--primary);
  border: 1px solid var(--primary-border);
  font-weight: 700;
  font-size: 0.75rem;
  padding: 0.25rem 0.55rem;
  border-radius: var(--radius-sm);
}

.restaurant-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.835rem;
  color: var(--text-secondary);
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.legal-info {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.info-icon {
  font-size: 0.95rem;
}

.info-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-subtle);
}

.rating-container {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.rating-value {
  font-weight: 800;
  color: var(--text);
  font-size: 0.925rem;
}

.reviews-count {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.card-actions {
  display: flex;
  align-items: center;
}

.btn-view-page {
  background-color: var(--primary-light);
  color: var(--primary);
  border: 1px solid var(--primary-border);
  font-weight: 700;
  font-size: 0.825rem;
  padding: 0.4rem 0.85rem;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.btn-view-page:hover {
  background: var(--primary-gradient);
  color: #ffffff;
  border-color: var(--primary);
  box-shadow: var(--shadow-red);
  transform: translateY(-1px);
}
</style>
