<script setup lang="ts">
import { useRestaurantStore } from '../stores/restaurant'
import RestaurantCard from './RestaurantCard.vue'

const restaurantStore = useRestaurantStore()
</script>

<template>
  <section class="list-section">
    <div class="list-header">
      <div class="header-titles">
        <h2 class="section-title">Restaurantes Disponíveis</h2>
        <span class="results-count">
          {{ restaurantStore.filteredRestaurants.length }}
          {{ restaurantStore.filteredRestaurants.length === 1 ? 'encontrado' : 'encontrados' }}
        </span>
      </div>
    </div>

    <!-- Lista de Cards -->
    <div v-if="restaurantStore.filteredRestaurants.length > 0" class="restaurants-grid">
      <RestaurantCard
        v-for="restaurant in restaurantStore.filteredRestaurants"
        :key="restaurant.id"
        :restaurant="restaurant"
        :is-selected="restaurantStore.selectedRestaurantId === restaurant.id"
        @select="restaurantStore.selectRestaurant(restaurant.id)"
      />
    </div>

    <!-- Estado Vazio (Empty State) -->
    <div v-else class="empty-state">
      <div class="empty-icon">🍽️</div>
      <h3 class="empty-title">Nenhum restaurante encontrado</h3>
      <p class="empty-desc">
        Não encontramos nenhum restaurante que corresponda aos filtros aplicados.
      </p>
      <button
        v-if="restaurantStore.hasActiveFilters"
        type="button"
        class="btn-primary"
        @click="restaurantStore.resetFilters()"
      >
        Limpar Filtros de Busca
      </button>
    </div>
  </section>
</template>

<style scoped>
.list-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.25rem;
}

.header-titles {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.section-title {
  font-size: 1.45rem;
  font-weight: 800;
  color: var(--secondary);
  letter-spacing: -0.025em;
}

.results-count {
  font-size: 0.85rem;
  color: var(--primary);
  background-color: var(--primary-light);
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-full);
  font-weight: 700;
  border: 1px solid var(--primary-border);
}

.restaurants-grid {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.empty-state {
  background: #ffffff;
  border: 1.5px dashed var(--border);
  border-radius: var(--radius-lg);
  padding: 3.5rem 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  box-shadow: var(--shadow-sm);
}

.empty-icon {
  font-size: 3rem;
  opacity: 0.85;
}

.empty-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--secondary);
}

.empty-desc {
  color: var(--text-secondary);
  font-size: 0.95rem;
  max-width: 400px;
}
</style>
