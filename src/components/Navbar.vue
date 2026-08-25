<script setup lang="ts">
import { useAuthStore } from '../stores/auth'
import { useRestaurantStore } from '../stores/restaurant'

const authStore = useAuthStore()
const restaurantStore = useRestaurantStore()
</script>

<template>
  <header class="navbar">
    <div class="container nav-content">
      <div class="nav-left">
        <router-link to="/" class="logo-link">
          <span class="logo-icon">🍽️</span>
          <span class="logo-text">Guia <span class="highlight">Sabor Crítico</span></span>
        </router-link>

        <nav class="nav-links">
          <router-link to="/" class="nav-tab-link" active-class="active" exact>
            Explorar
          </router-link>
          <button
            type="button"
            class="btn-nav-action"
            @click="restaurantStore.openAddRestaurantModal()"
          >
            + Cadastrar Restaurante
          </button>
        </nav>
      </div>

      <div class="nav-actions">
        <!-- Usuário Autenticado -->
        <template v-if="authStore.isAuthenticated">
          <div class="user-profile">
            <div class="user-avatar" :title="authStore.userName">
              {{ authStore.userName.charAt(0).toUpperCase() }}
            </div>
            <span class="user-greeting">Olá, <strong>{{ authStore.userName.split(' ')[0] }}</strong></span>
            <button
              type="button"
              class="btn-logout"
              title="Encerrar sessão"
              @click="authStore.logout()"
            >
              Sair
            </button>
          </div>
        </template>

        <!-- Usuário Visitante -->
        <template v-else>
          <div class="guest-actions">
            <button
              type="button"
              class="btn-secondary btn-sm"
              @click="authStore.openLoginModal()"
            >
              Entrar
            </button>
            <button
              type="button"
              class="btn-primary btn-sm"
              @click="authStore.openRegisterModal()"
            >
              Cadastrar
            </button>
          </div>
        </template>
      </div>
    </div>
  </header>
</template>


<style scoped>
.navbar {
  background-color: rgba(255, 255, 255, 0.96);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 1px 4px rgba(24, 24, 27, 0.04);
}

.nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 72px;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 2.25rem;
}

.logo-link {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--secondary);
  letter-spacing: -0.03em;
}

.logo-icon {
  font-size: 1.5rem;
  filter: drop-shadow(0 2px 4px rgba(185, 28, 28, 0.15));
}

.logo-text .highlight {
  color: var(--primary);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.nav-tab-link {
  padding: 0.5rem 0.95rem;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.nav-tab-link:hover {
  color: var(--primary);
  background-color: var(--primary-light);
}

.nav-tab-link.active {
  color: var(--primary);
  background-color: var(--primary-light);
  border: 1px solid var(--primary-border);
}

.btn-nav-action {
  background-color: #ffffff;
  border: 1px solid var(--primary-border);
  color: var(--primary);
  font-weight: 600;
  font-size: 0.85rem;
  padding: 0.5rem 0.95rem;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.btn-nav-action:hover {
  border-color: var(--primary);
  background-color: var(--primary);
  color: #ffffff;
  box-shadow: var(--shadow-red);
  transform: translateY(-1px);
}



.nav-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.guest-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-sm {
  padding: 0.45rem 1.15rem;
  font-size: 0.875rem;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  background-color: #ffffff;
  padding: 0.35rem 0.85rem 0.35rem 0.45rem;
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
}

.user-avatar {
  width: 32px;
  height: 32px;
  background: var(--primary-gradient);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  box-shadow: 0 2px 6px rgba(185, 28, 28, 0.25);
}

.user-greeting {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.user-greeting strong {
  color: var(--text);
}

.btn-logout {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.2rem 0.4rem;
  border-radius: var(--radius-sm);
  transition: color var(--transition-fast);
  margin-left: 0.25rem;
}

.btn-logout:hover {
  color: var(--danger);
}

@media (max-width: 768px) {
  .nav-links {
    display: none;
  }
}

@media (max-width: 640px) {
  .logo-text {
    font-size: 1.1rem;
  }
  .user-greeting {
    display: none;
  }
}
</style>

