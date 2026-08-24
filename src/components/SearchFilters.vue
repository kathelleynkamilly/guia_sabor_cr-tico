<script setup lang="ts">
import { useRestaurantStore } from '../stores/restaurant'

const restaurantStore = useRestaurantStore()
</script>

<template>
  <section class="search-section">
    <div class="search-header">
      <h1 class="search-title">Encontre o seu próximo prato</h1>
      <p class="search-subtitle">Descubra restaurantes incríveis e compartilhe sua experiência com a comunidade</p>
    </div>

    <div class="search-card">
      <!-- Input de Busca Principal -->
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          v-model="restaurantStore.searchQuery"
          type="text"
          placeholder="Buscar por nome, prato, cozinha ou cidade..."
          class="search-input"
        />
        <button
          v-if="restaurantStore.searchQuery"
          type="button"
          class="btn-clear"
          title="Limpar busca"
          @click="restaurantStore.searchQuery = ''"
        >
          ✕
        </button>
      </div>

      <!-- Filtros em Dropdown -->
      <div class="filters-row">
        <div class="filter-group">
          <label for="filterCuisine" class="filter-label">Tipo de Cozinha</label>
          <div class="select-wrapper">
            <select
              id="filterCuisine"
              v-model="restaurantStore.selectedCuisine"
              class="filter-select"
            >
              <option value="">Todas as Cozinhas</option>
              <option
                v-for="cuisine in restaurantStore.cuisinesList"
                :key="cuisine"
                :value="cuisine"
              >
                {{ cuisine }}
              </option>
            </select>
          </div>
        </div>

        <div class="filter-group">
          <label for="filterCity" class="filter-label">Cidade</label>
          <div class="select-wrapper">
            <select
              id="filterCity"
              v-model="restaurantStore.selectedCity"
              class="filter-select"
            >
              <option value="">Todas as Cidades</option>
              <option
                v-for="city in restaurantStore.citiesList"
                :key="city"
                :value="city"
              >
                {{ city }}
              </option>
            </select>
          </div>
        </div>

        <!-- Botão Limpar Filtros -->
        <div v-if="restaurantStore.hasActiveFilters" class="clear-filters-wrapper">
          <button
            type="button"
            class="btn-reset-filters"
            @click="restaurantStore.resetFilters()"
          >
            Limpar Filtros
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.search-section {
  margin-bottom: 2.5rem;
}

.search-header {
  text-align: center;
  margin-bottom: 1.75rem;
}

.search-title {
  font-size: 2.35rem;
  font-weight: 800;
  color: var(--secondary);
  letter-spacing: -0.035em;
  margin-bottom: 0.5rem;
}

.search-subtitle {
  font-size: 1.05rem;
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto;
}

.search-card {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.65rem;
  box-shadow: var(--shadow-md);
  position: relative;
}

.search-box {
  display: flex;
  align-items: center;
  background: var(--surface-alt);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0.45rem 1rem;
  margin-bottom: 1.25rem;
  transition: var(--transition-fast);
}

.search-box:focus-within {
  border-color: var(--primary);
  background: #ffffff;
  box-shadow: 0 0 0 3.5px var(--primary-glow);
}

.search-icon {
  font-size: 1.1rem;
  margin-right: 0.75rem;
  color: var(--text-muted);
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0.6rem 0;
  font-size: 1rem;
  color: var(--text);
  font-weight: 500;
}

.search-input::placeholder {
  color: var(--text-muted);
  font-weight: 400;
}

.btn-clear {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 0.9rem;
  padding: 0.2rem 0.5rem;
  border-radius: 50%;
  cursor: pointer;
}

.btn-clear:hover {
  color: var(--primary);
}

.filters-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1.25rem;
}

.filter-group {
  flex: 1;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.filter-label {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.select-wrapper {
  position: relative;
}

.filter-select {
  width: 100%;
  padding: 0.65rem 1rem;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  background-color: #ffffff;
  color: var(--text);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.filter-select:hover {
  border-color: var(--text-muted);
}

.filter-select:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-glow);
}

.clear-filters-wrapper {
  display: flex;
  align-items: center;
}

.btn-reset-filters {
  background-color: var(--primary-light);
  border: 1px solid var(--primary-border);
  color: var(--primary);
  padding: 0.65rem 1.15rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-reset-filters:hover {
  background-color: var(--primary);
  color: #ffffff;
  box-shadow: var(--shadow-red);
}

@media (max-width: 640px) {
  .search-title {
    font-size: 1.75rem;
  }
  .filters-row {
    flex-direction: column;
  }
  .filter-group {
    width: 100%;
  }
}
</style>
