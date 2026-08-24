<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useRestaurantStore } from '../stores/restaurant'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const restaurantStore = useRestaurantStore()
const authStore = useAuthStore()

const name = ref('')
const cuisine = ref('')
const city = ref('')
const address = ref('')
const hours = ref('')
const priceRange = ref<'R$' | 'R$$' | 'R$$$' | 'R$$$$'>('R$$')
const phone = ref('')
const website = ref('')
const description = ref('')
const formError = ref('')

// Categorias padrão de culinária para sugestão
const defaultCuisines = ['Brasileira', 'Italiana', 'Japonesa', 'Hamburgueria', 'Mexicana', 'Árabe', 'Pizzaria', 'Frutos do Mar', 'Doceria & Café']

function handleSubmit() {
  formError.value = ''

  if (!name.value.trim()) {
    formError.value = 'Por favor, informe o nome do restaurante.'
    return
  }

  if (!cuisine.value.trim()) {
    formError.value = 'Por favor, informe o tipo de culinária.'
    return
  }

  if (!city.value.trim()) {
    formError.value = 'Por favor, informe a cidade.'
    return
  }

  if (!address.value.trim()) {
    formError.value = 'Por favor, informe o endereço completo.'
    return
  }

  const created = restaurantStore.addRestaurant({
    name: name.value,
    cuisine: cuisine.value,
    city: city.value,
    address: address.value,
    hours: hours.value || 'Segunda a Domingo: 11h às 23h',
    priceRange: priceRange.value,
    phone: phone.value,
    website: website.value,
    description: description.value,
    amenities: ['Wi-Fi Grátis', 'Ar Condicionado', 'Aceita Cartões e Pix', 'Ambiente Agradável'],
  })

  // Limpar campos
  name.value = ''
  cuisine.value = ''
  city.value = ''
  address.value = ''
  hours.value = ''
  phone.value = ''
  website.value = ''
  description.value = ''

  restaurantStore.closeAddRestaurantModal()

  // Redirecionar para a página do novo restaurante
  router.push(`/restaurant/${created.id}`)
}
</script>

<template>
  <div
    v-if="restaurantStore.isAddRestaurantModalOpen"
    class="modal-backdrop animate-fade-in"
    @click.self="restaurantStore.closeAddRestaurantModal()"
  >
    <div class="modal-card">
      <div class="modal-header">
        <div>
          <h2 class="modal-title">🍽️ Cadastrar Novo Restaurante</h2>
          <p class="modal-subtitle">Adicione as informações do estabelecimento ao Guia Sabor.</p>
        </div>
        <button
          type="button"
          class="btn-close"
          @click="restaurantStore.closeAddRestaurantModal()"
        >
          ✕
        </button>
      </div>

      <form class="modal-body" @submit.prevent="handleSubmit">
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label" for="resName">Nome do Restaurante *</label>
            <input
              id="resName"
              v-model="name"
              type="text"
              class="form-input"
              placeholder="Ex: Bistro Parisiense"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="resCuisine">Tipo de Culinária *</label>
            <input
              id="resCuisine"
              v-model="cuisine"
              type="text"
              class="form-input"
              list="cuisinesList"
              placeholder="Ex: Francesa, Italiana, Hamburgueria..."
              required
            />
            <datalist id="cuisinesList">
              <option v-for="c in defaultCuisines" :key="c" :value="c" />
            </datalist>
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label" for="resCity">Cidade *</label>
            <input
              id="resCity"
              v-model="city"
              type="text"
              class="form-input"
              placeholder="Ex: Campinas ou São Paulo"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="resPrice">Faixa de Preço</label>
            <select id="resPrice" v-model="priceRange" class="form-select">
              <option value="R$">R$ (Econômico - até R$ 40)</option>
              <option value="R$$">R$$ (Moderado - R$ 40 a R$ 80)</option>
              <option value="R$$$">R$$$ (Sofisticado - R$ 80 a R$ 150)</option>
              <option value="R$$$$">R$$$$ (Alta Gastronomia - R$ 150+)</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="resAddress">Endereço Completo *</label>
          <input
            id="resAddress"
            v-model="address"
            type="text"
            class="form-input"
            placeholder="Ex: Rua das Palmeiras, 350 - Bairro Centro"
            required
          />
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label" for="resHours">Horário de Funcionamento</label>
            <input
              id="resHours"
              v-model="hours"
              type="text"
              class="form-input"
              placeholder="Ex: Ter - Dom: 11h30 às 23h00"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="resPhone">Telefone / WhatsApp</label>
            <input
              id="resPhone"
              v-model="phone"
              type="text"
              class="form-input"
              placeholder="Ex: (19) 99876-5432"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="resDesc">Descrição & Especialidades</label>
          <textarea
            id="resDesc"
            v-model="description"
            rows="3"
            class="form-textarea"
            placeholder="Descreva o conceito, pratos mais famosos e ambiente do restaurante..."
          ></textarea>
        </div>

        <div v-if="formError" class="modal-error">
          {{ formError }}
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="btn-secondary"
            @click="restaurantStore.closeAddRestaurantModal()"
          >
            Cancelar
          </button>
          <button type="submit" class="btn-primary">
            Salvar e Cadastrar Restaurante
          </button>
        </div>
      </form>
    </div>
  </div>
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
  padding: 1.25rem;
}

.modal-card {
  background-color: #ffffff;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 640px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
}

.modal-header {
  padding: 1.5rem 1.75rem 1.15rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.modal-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--secondary);
  letter-spacing: -0.02em;
}

.modal-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 0.2rem;
}

.btn-close {
  background: var(--surface-alt);
  border: 1px solid var(--border-subtle);
  font-size: 1rem;
  color: var(--text-muted);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.btn-close:hover {
  background: var(--primary-light);
  color: var(--primary);
  border-color: var(--primary-border);
}

.modal-body {
  padding: 1.5rem 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--secondary);
}

.form-input,
.form-select,
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

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-glow);
}

.modal-error {
  background-color: var(--danger-bg);
  color: var(--danger);
  border: 1px solid var(--danger-border);
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border-subtle);
}

@media (max-width: 600px) {
  .form-row-2 {
    grid-template-columns: 1fr;
  }
}
</style>
