<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRestaurantStore } from '../stores/restaurant'
import { useAuthStore } from '../stores/auth'
import { formatCNPJ, validateCNPJ, formatPhone } from '../utils/verification'

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
const cnpj = ref('')
const legalName = ref('')
const antiFraudAgreement = ref(false)
const formError = ref('')

// Categorias padrão de culinária para sugestão
const defaultCuisines = [
  'Brasileira',
  'Italiana',
  'Japonesa',
  'Hamburgueria',
  'Mexicana',
  'Árabe',
  'Pizzaria',
  'Frutos do Mar',
  'Doceria & Café',
]

function onCnpjInput(e: Event) {
  const target = e.target as HTMLInputElement
  cnpj.value = formatCNPJ(target.value)
}

function onPhoneInput(e: Event) {
  const target = e.target as HTMLInputElement
  phone.value = formatPhone(target.value)
}

const cnpjClean = computed(() => cnpj.value.replace(/\D/g, ''))

const cnpjStatus = computed(() => {
  if (!cnpj.value) return null
  if (cnpjClean.value.length < 14) return 'incomplete'
  return validateCNPJ(cnpj.value) ? 'valid' : 'invalid'
})

async function handleSubmit() {
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

  // Validação de CNPJ caso preenchido
  if (cnpj.value && !validateCNPJ(cnpj.value)) {
    formError.value = 'O CNPJ informado é inválido de acordo com o algoritmo da Receita Federal. Por favor, verifique os dígitos.'
    return
  }

  if (!antiFraudAgreement.value) {
    formError.value = 'Por favor, confirme a declaração de veracidade e autenticidade anti-fraude.'
    return
  }

  const created = await restaurantStore.addRestaurant({
    name: name.value,
    cuisine: cuisine.value,
    city: city.value,
    address: address.value,
    hours: hours.value || 'Segunda a Domingo: 11h às 23h',
    priceRange: priceRange.value,
    phone: phone.value,
    website: website.value,
    description: description.value,
    cnpj: cnpj.value,
    legalName: legalName.value || name.value,
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
  cnpj.value = ''
  legalName.value = ''
  antiFraudAgreement.value = false

  restaurantStore.closeAddRestaurantModal()

  // Redirecionar para a página do novo restaurante
  if (created && created.id) {
    router.push(`/restaurant/${created.id}`)
  }
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
          <h2 class="modal-title">🍽️ Cadastrar Estabelecimento</h2>
          <p class="modal-subtitle">
            Cadastre seu restaurante com verificação oficial e proteção contra golpes.
          </p>
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
        <!-- SEÇÃO DE AUTENTICIDADE E CNPJ -->
        <div class="verification-section-box">
          <div class="section-badge-header">
            <span class="badge-icon">🛡️</span>
            <div>
              <h3 class="section-title">Validação & Selo Anti-Golpe</h3>
              <p class="section-desc">
                Informar um CNPJ válido garante o <strong>Selo de Estabelecimento Verificado</strong>, transmitindo total segurança aos clientes contra perfis clonados e fraudes.
              </p>
            </div>
          </div>

          <div class="form-row-2" style="margin-top: 0.85rem;">
            <div class="form-group">
              <label class="form-label" for="resCnpj">CNPJ do Estabelecimento (Recomendado)</label>
              <div class="cnpj-input-container">
                <input
                  id="resCnpj"
                  v-model="cnpj"
                  type="text"
                  class="form-input"
                  placeholder="00.000.000/0000-00"
                  maxlength="18"
                  @input="onCnpjInput"
                />
                <span v-if="cnpjStatus === 'valid'" class="status-indicator is-valid">✓ Válido</span>
                <span v-else-if="cnpjStatus === 'invalid'" class="status-indicator is-invalid">✕ Inválido</span>
              </div>
              <span v-if="cnpjStatus === 'valid'" class="help-text is-valid">
                🟢 CNPJ auditável. O restaurante receberá o selo de autenticidade no catálogo.
              </span>
              <span v-else-if="cnpjStatus === 'invalid'" class="help-text is-invalid">
                🔴 Dígitos verificadores incorretos. Confira seu CNPJ antes de prosseguir.
              </span>
            </div>

            <div class="form-group">
              <label class="form-label" for="resLegalName">Razão Social Oficial</label>
              <input
                id="resLegalName"
                v-model="legalName"
                type="text"
                class="form-input"
                placeholder="Ex: Bella Gastronomia Eireli"
              />
              <span class="help-text">Nome registrado na Receita Federal.</span>
            </div>
          </div>
        </div>

        <!-- DADOS BÁSICOS DO RESTAURANTE -->
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label" for="resName">Nome Comercial (Fantasia) *</label>
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
            <label class="form-label" for="resPrice">Faixa de Preço Médio</label>
            <select id="resPrice" v-model="priceRange" class="form-select">
              <option value="R$">R$ (Econômico - até R$ 40)</option>
              <option value="R$$">R$$ (Moderado - R$ 40 a R$ 80)</option>
              <option value="R$$$">R$$$ (Sofisticado - R$ 80 a R$ 150)</option>
              <option value="R$$$$">R$$$$ (Alta Gastronomia - R$ 150+)</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="resAddress">Endereço Comercial Completo *</label>
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
            <label class="form-label" for="resPhone">Telefone / WhatsApp Comercial</label>
            <input
              id="resPhone"
              v-model="phone"
              type="text"
              class="form-input"
              placeholder="Ex: (19) 99876-5432"
              maxlength="15"
              @input="onPhoneInput"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="resDesc">Apresentação & Especialidades</label>
          <textarea
            id="resDesc"
            v-model="description"
            rows="3"
            class="form-textarea"
            placeholder="Descreva o conceito gastronômico, ambiente e pratos de destaque..."
          ></textarea>
        </div>

        <!-- DECLARAÇÃO ANTI-FRAUDE -->
        <label class="agreement-box">
          <input
            v-model="antiFraudAgreement"
            type="checkbox"
            class="checkbox-input"
            required
          />
          <span class="agreement-text">
            <strong>Declaração de Autenticidade:</strong> Declaro sob as penas da lei que represento um estabelecimento gastronômico legítimo e que todas as informações prestadas são autênticas e livres de fraudes.
          </span>
        </label>

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
            Salvar e Cadastrar Estabelecimento
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
  background-color: rgba(24, 24, 27, 0.7);
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
  max-width: 680px;
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
  gap: 1.15rem;
}

/* Caixa de Verificação Anti-Golpe */
.verification-section-box {
  background: linear-gradient(135deg, #f0fdf4 0%, #f8fafc 100%);
  border: 1.5px solid #86efac;
  border-radius: var(--radius-md);
  padding: 1.1rem 1.25rem;
}

.section-badge-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.badge-icon {
  font-size: 1.75rem;
  line-height: 1.2;
}

.section-title {
  font-size: 1rem;
  font-weight: 800;
  color: #166534;
}

.section-desc {
  font-size: 0.825rem;
  color: #1f2937;
  margin-top: 0.2rem;
  line-height: 1.4;
}

.cnpj-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.status-indicator {
  position: absolute;
  right: 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.45rem;
  border-radius: 4px;
  pointer-events: none;
}

.status-indicator.is-valid {
  background-color: #dcfce7;
  color: #15803d;
}

.status-indicator.is-invalid {
  background-color: #fee2e2;
  color: #b91c1c;
}

.help-text {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.2rem;
}

.help-text.is-valid {
  color: #15803d;
  font-weight: 600;
}

.help-text.is-invalid {
  color: #b91c1c;
  font-weight: 600;
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

.agreement-box {
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0.85rem 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  margin-top: 0.25rem;
}

.checkbox-input {
  margin-top: 0.25rem;
  width: 17px;
  height: 17px;
  accent-color: var(--primary);
  cursor: pointer;
}

.agreement-text {
  font-size: 0.825rem;
  color: var(--text-secondary);
  line-height: 1.45;
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
