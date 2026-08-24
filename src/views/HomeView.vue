<script setup lang="ts">
import SearchFilters from '../components/SearchFilters.vue'
import RestaurantList from '../components/RestaurantList.vue'
import RestaurantDetails from '../components/RestaurantDetails.vue'
</script>

<template>
  <div class="home-view">
    <div class="container main-content">
      <!-- Seção de Busca e Filtros -->
      <SearchFilters />

      <!-- Layout em 2 Colunas -->
      <div class="layout-columns">
        <div class="column-list">
          <RestaurantList />
        </div>
        <div class="column-details">
          <RestaurantDetails />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-view {
  padding: 2rem 0 4rem;
  flex: 1;
}

.layout-columns {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 2.25rem;
  align-items: start;
}

@media (max-width: 960px) {
  .layout-columns {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}
</style>
