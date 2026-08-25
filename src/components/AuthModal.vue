<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

// Formulário de Login
const loginEmail = ref('')
const loginPassword = ref('')

// Formulário de Cadastro
const regName = ref('')
const regEmail = ref('')
const regPassword = ref('')

// Feedback
const errorMessage = ref('')
const successMessage = ref('')

watch(
  () => authStore.authModalTab,
  () => {
    errorMessage.value = ''
    successMessage.value = ''
  }
)

watch(
  () => authStore.isAuthModalOpen,
  (isOpen) => {
    if (isOpen) {
      errorMessage.value = ''
      successMessage.value = ''
    }
  }
)

async function handleLoginSubmit() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!loginEmail.value || !loginPassword.value) {
    errorMessage.value = 'Por favor, informe seu e-mail e senha.'
    return
  }

  const result = await authStore.login(loginEmail.value, loginPassword.value)
  if (!result.success) {
    errorMessage.value = result.message || 'Falha ao autenticar.'
  } else {
    loginEmail.value = ''
    loginPassword.value = ''
  }
}

async function handleRegisterSubmit() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!regName.value || !regEmail.value || !regPassword.value) {
    errorMessage.value = 'Por favor, preencha todos os campos.'
    return
  }

  if (regPassword.value.length < 6) {
    errorMessage.value = 'A senha deve conter no mínimo 6 caracteres.'
    return
  }

  const result = await authStore.register(regName.value, regEmail.value, regPassword.value)
  if (!result.success) {
    errorMessage.value = result.message || 'Erro ao realizar cadastro.'
  } else {
    regName.value = ''
    regEmail.value = ''
    regPassword.value = ''
  }
}

function handleFillDemo() {
  loginEmail.value = 'usuario@exemplo.com'
  loginPassword.value = '123456'
  errorMessage.value = ''
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && authStore.isAuthModalOpen) {
    authStore.closeAuthModal()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="authStore.isAuthModalOpen"
      class="modal-backdrop animate-fade-in"
      @click.self="authStore.closeAuthModal()"
    >
      <div class="modal-card" role="dialog" aria-modal="true">
        <button
          type="button"
          class="btn-close-modal"
          aria-label="Fechar modal"
          @click="authStore.closeAuthModal()"
        >
          ✕
        </button>

        <!-- Abas -->
        <div class="modal-tabs">
          <button
            type="button"
            class="tab-btn"
            :class="{ active: authStore.authModalTab === 'login' }"
            @click="authStore.authModalTab = 'login'"
          >
            Entrar
          </button>
          <button
            type="button"
            class="tab-btn"
            :class="{ active: authStore.authModalTab === 'register' }"
            @click="authStore.authModalTab = 'register'"
          >
            Criar Conta
          </button>
        </div>

        <!-- Mensagens de Alerta -->
        <div v-if="errorMessage" class="alert-error">
          {{ errorMessage }}
        </div>
        <div v-if="successMessage" class="alert-success">
          {{ successMessage }}
        </div>

        <!-- Formulário de Login -->
        <form
          v-if="authStore.authModalTab === 'login'"
          class="auth-form"
          @submit.prevent="handleLoginSubmit"
        >
          <div class="form-field">
            <label for="loginEmail" class="field-label">E-mail</label>
            <input
              id="loginEmail"
              v-model="loginEmail"
              type="email"
              placeholder="seu.email@exemplo.com"
              class="field-input"
              required
              autocomplete="email"
            />
          </div>

          <div class="form-field">
            <label for="loginPassword" class="field-label">Senha</label>
            <input
              id="loginPassword"
              v-model="loginPassword"
              type="password"
              placeholder="••••••••"
              class="field-input"
              required
              autocomplete="current-password"
            />
          </div>

          <button type="submit" class="btn-primary btn-block">
            Entrar no Guia
          </button>

          <div class="demo-box">
            <button type="button" class="btn-demo" @click="handleFillDemo">
              Preencher com Usuário de Demonstração
            </button>
          </div>
        </form>

        <!-- Formulário de Cadastro -->
        <form
          v-else
          class="auth-form"
          @submit.prevent="handleRegisterSubmit"
        >
          <div class="form-field">
            <label for="regName" class="field-label">Nome Completo</label>
            <input
              id="regName"
              v-model="regName"
              type="text"
              placeholder="Ex: Carlos Santana"
              class="field-input"
              required
              autocomplete="name"
            />
          </div>

          <div class="form-field">
            <label for="regEmail" class="field-label">E-mail</label>
            <input
              id="regEmail"
              v-model="regEmail"
              type="email"
              placeholder="seu.email@exemplo.com"
              class="field-input"
              required
              autocomplete="email"
            />
          </div>

          <div class="form-field">
            <label for="regPassword" class="field-label">Senha</label>
            <input
              id="regPassword"
              v-model="regPassword"
              type="password"
              placeholder="Mínimo 6 caracteres"
              minlength="6"
              class="field-input"
              required
              autocomplete="new-password"
            />
          </div>

          <button type="submit" class="btn-primary btn-block">
            Cadastrar e Entrar
          </button>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(24, 24, 27, 0.65);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}

.modal-card {
  background-color: #ffffff;
  border-radius: var(--radius-lg);
  padding: 2.25rem;
  width: 100%;
  max-width: 420px;
  position: relative;
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--border);
}

.btn-close-modal {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  background: var(--surface-alt);
  border: 1px solid var(--border-subtle);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: var(--text-muted);
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
}

.btn-close-modal:hover {
  background: var(--primary-light);
  color: var(--primary);
  border-color: var(--primary-border);
}

.modal-tabs {
  display: flex;
  border-bottom: 2px solid var(--border);
  margin-bottom: 1.5rem;
}

.tab-btn {
  flex: 1;
  padding: 0.75rem;
  background: none;
  border: none;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-muted);
  cursor: pointer;
  transition: var(--transition-fast);
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}

.tab-btn.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--secondary);
}

.field-input {
  padding: 0.75rem 1rem;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  color: var(--text);
  background: #ffffff;
  transition: var(--transition-fast);
}

.field-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-glow);
}

.btn-block {
  width: 100%;
  padding: 0.85rem;
  font-size: 1rem;
  margin-top: 0.5rem;
}

.demo-box {
  text-align: center;
  margin-top: 0.5rem;
}

.btn-demo {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 0.8rem;
  text-decoration: underline;
  cursor: pointer;
}

.btn-demo:hover {
  color: var(--primary);
}

.alert-error {
  background-color: var(--danger-bg);
  color: var(--danger);
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  margin-bottom: 1rem;
  border: 1px solid var(--danger-border);
}

.alert-success {
  background-color: var(--success-bg);
  color: var(--success);
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  margin-bottom: 1rem;
  border: 1px solid var(--success-border);
}
</style>
