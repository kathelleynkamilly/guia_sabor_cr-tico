<script setup lang="ts">
import { RouterView } from 'vue-router'
import Navbar from './components/Navbar.vue'
import AuthModal from './components/AuthModal.vue'
import AddRestaurantModal from './components/AddRestaurantModal.vue'
</script>

<template>
  <div class="app-wrapper">
    <Navbar />
    
    <main class="app-main">
      <RouterView />
    </main>

    <footer class="app-footer">
      <div class="container footer-content">
        <div class="footer-brand">
          <span class="footer-logo">🍽️ Guia <span class="brand-highlight">Sabor Crítico</span></span>
          <p class="footer-desc">Curadoria refinada, avaliações sinceras e as melhores experiências gastronômicas.</p>
        </div>
        <div class="footer-copy">
          <p>&copy; {{ new Date().getFullYear() }} Guia Sabor Crítico &bull; O padrão de excelência gastronômica.</p>
        </div>
      </div>
    </footer>

    <!-- Modais Globais -->
    <AuthModal />
    <AddRestaurantModal />
  </div>
</template>

<style scoped>
.app-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--background);
}

.app-main {
  flex: 1;
}

.app-footer {
  background-color: #ffffff;
  border-top: 1px solid var(--border);
  position: relative;
  padding: 3rem 0 2rem;
  margin-top: auto;
}

.app-footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--primary), transparent);
}

.footer-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1.25rem;
}

.footer-logo {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--secondary);
  letter-spacing: -0.02em;
}

.brand-highlight {
  color: var(--primary);
}

.footer-desc {
  font-size: 0.925rem;
  color: var(--text-secondary);
  margin-top: 0.35rem;
  max-width: 480px;
}

.footer-copy {
  font-size: 0.825rem;
  color: var(--text-muted);
  border-top: 1px solid var(--border-subtle);
  padding-top: 1.25rem;
  width: 100%;
}
</style>
