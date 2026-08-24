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

function navigateToRestaurant(id: string, event: Event) {
  event.stopPropagation()
  router.push(`/restaurant/${id}`)
}
</script>

<template>
  <article
    class="restaurant-card"
    :class="{ 'is-selected': isSelected }"
    tabindex="0"
    role="button"
    :aria-pressed="isSelected"
    @click="emit('select', restaurant.id)"
    @keydown.enter="emit('select', restaurant.id)"
    @keydown.space.prevent="emit('select', restaurant.id)"
  >
    <div class="card-header">
      <div class="title-group">
        <h3 class="restaurant-name">{{ restaurant.name }}</h3>
        <span v-if="restaurant.priceRange" class="price-badge">{{ restaurant.priceRange }}</span>
      </div>
      <span class="tag tag-cuisine">{{ restaurant.cuisine }}</span>
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
          Ver Página com Abas ↗
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
  padding: 1.45rem;
  cursor: pointer;
  transition: transform var(--transition-normal), box-shadow var(--transition-normal), border-color var(--transition-normal);
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
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
}

.restaurant-description {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.45rem;
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

