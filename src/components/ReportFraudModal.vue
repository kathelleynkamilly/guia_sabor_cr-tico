<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRestaurantStore } from '../stores/restaurant'
import { useAuthStore } from '../stores/auth'
import type { FraudReport } from '../types/restaurant'

const restaurantStore = useRestaurantStore()
const authStore = useAuthStore()

const selectedReason = ref<FraudReport['reason']>('perfil_falso')
const description = ref('')
const reporterName = ref(authStore.currentUser?.name || '')
const reporterEmail = ref(authStore.currentUser?.email || '')
const isSubmitting = ref(false)
const submitSuccess = ref(false)
const protocolCode = ref('')
const formError = ref('')

const reasonsList: { value: FraudReport['reason']; label: string; icon: string; desc: string }[] = [
  {
    value: 'perfil_falso',
    label: 'Perfil Falso ou Clonado',
    icon: '🎭',
    desc: 'O perfil se passa por outro restaurante ou foi criado por terceiros não autorizados.',
  },
  {
    value: 'golpe_pix',
    label: 'Golpe do Pix / Chave Falsa',
    icon: '💸',
    desc: 'Exigência de Pix para conta de pessoa física estranha ou cobrança de taxa antecipada indevida.',
  },
  {
    value: 'endereco_inexistente',
    label: 'Endereço Falso / Fantasma',
    icon: '📍',
    desc: 'O restaurante não existe no endereço informado ou o local é um terreno baldio/residência fechada.',
  },
  {
    value: 'cardapio_fraudulento',
    label: 'Cardápio / Preços Enganosos',
    icon: '📋',
    desc: 'Preços com discrepância abusiva ou promoções enganosas para atrair pagamentos.',
  },
  {
    value: 'marca_clonada',
    label: 'Uso Indevido de Marca',
    icon: '🏷️',
    desc: 'Utilização de fotos, cardápio ou nome comercial de outra empresa sem consentimento.',
  },
  {
    value: 'outro',
    label: 'Outra Suspeita de Fraude',
    icon: '⚠️',
    desc: 'Qualquer outra atividade abusiva ou suspeita de golpe ao consumidor.',
  },
]

const targetRestaurant = computed(() => restaurantStore.reportingRestaurant)

function handleClose() {
  formError.value = ''
  submitSuccess.value = false
  description.value = ''
  protocolCode.value = ''
  restaurantStore.closeReportModal()
}

async function handleSubmit() {
  formError.value = ''

  if (!targetRestaurant.value) return

  if (!description.value.trim() || description.value.trim().length < 10) {
    formError.value = 'Por favor, descreva detalhadamente o ocorrido (mínimo de 10 caracteres).'
    return
  }

  isSubmitting.value = true

  try {
    const success = await restaurantStore.submitFraudReport({
      restaurantId: targetRestaurant.value!.id,
      restaurantName: targetRestaurant.value!.name,
      reporterName: reporterName.value || authStore.currentUser?.name || 'Cliente da Comunidade',
      reporterEmail: reporterEmail.value || authStore.currentUser?.email,
      reason: selectedReason.value,
      description: description.value,
    })

    isSubmitting.value = false

    if (success) {
      protocolCode.value = `SEC-${Date.now().toString().slice(-6)}`
      submitSuccess.value = true
    } else {
      formError.value = 'Ocorreu um erro ao registrar a denúncia. Tente novamente.'
    }
  } catch {
    isSubmitting.value = false
    formError.value = 'Ocorreu um erro ao registrar a denúncia. Tente novamente.'
  }
}
</script>

<template>
  <div
    v-if="restaurantStore.isReportModalOpen && targetRestaurant"
    class="modal-backdrop animate-fade-in"
    @click.self="handleClose"
  >
    <div class="modal-card">
      <div class="modal-header">
        <div class="header-title-box">
          <div class="header-icon">🛡️</div>
          <div>
            <h2 class="modal-title">Denunciar Suspeita de Golpe</h2>
            <p class="modal-subtitle">
              Sua denúncia ajuda a manter a comunidade do Guia Sabor 100% segura contra fraudes.
            </p>
          </div>
        </div>
        <button type="button" class="btn-close" @click="handleClose">✕</button>
      </div>

      <div v-if="submitSuccess" class="success-screen">
        <div class="success-icon-box">✓</div>
        <h3 class="success-title">Denúncia Registrada com Sucesso!</h3>
        <p class="success-desc">
          O protocolo <strong>#{{ protocolCode }}</strong> foi encaminhado para a equipe de Compliance e Segurança do Guia Sabor.
        </p>

        <div class="success-details-card">
          <div class="detail-row">
            <span>Restaurante:</span>
            <strong>{{ targetRestaurant.name }}</strong>
          </div>
          <div class="detail-row">
            <span>Motivo:</span>
            <strong>{{ reasonsList.find(r => r.value === selectedReason)?.label }}</strong>
          </div>
          <div class="detail-row">
            <span>Status:</span>
            <span class="badge-review">🔍 Em Auditoria Prioritária</span>
          </div>
        </div>

        <p class="security-promise">
          🔒 Investigamos todas as denúncias em até 24 horas úteis. Perfis comprovadamente fraudulentos são banidos imediatamente.
        </p>

        <button type="button" class="btn-primary btn-block" @click="handleClose">
          Entendi, Fechar Janela
        </button>
      </div>

      <form v-else class="modal-body" @submit.prevent="handleSubmit">
        <div class="target-res-banner">
          <span class="target-label">Estabelecimento sob análise:</span>
          <h4 class="target-name">{{ targetRestaurant.name }}</h4>
          <span class="target-location">📍 {{ targetRestaurant.city }} &bull; {{ targetRestaurant.address }}</span>
          <span v-if="targetRestaurant.cnpj" class="target-cnpj">CNPJ: {{ targetRestaurant.cnpj }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">Qual é o motivo da suspeita? *</label>
          <div class="reasons-grid">
            <label
              v-for="r in reasonsList"
              :key="r.value"
              class="reason-option"
              :class="{ selected: selectedReason === r.value }"
            >
              <input
                v-model="selectedReason"
                type="radio"
                name="reason"
                :value="r.value"
                class="hidden-radio"
              />
              <div class="reason-content">
                <span class="r-icon">{{ r.icon }}</span>
                <div>
                  <span class="r-title">{{ r.label }}</span>
                  <p class="r-desc">{{ r.desc }}</p>
                </div>
              </div>
            </label>
          </div>
        </div>

        <div class="form-group">
          <label for="reportDesc" class="form-label">Detalhes da Suspeita / Ocorrência *</label>
          <textarea
            id="reportDesc"
            v-model="description"
            rows="3"
            class="form-textarea"
            placeholder="Ex: Tentei fazer um pedido pelo WhatsApp informado e solicitaram chave Pix em nome de pessoa física não relacionada, ou o endereço físico não corresponde ao restaurante..."
            required
          ></textarea>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label for="reporterName" class="form-label">Seu Nome (Opcional / Anônimo)</label>
            <input
              id="reporterName"
              v-model="reporterName"
              type="text"
              class="form-input"
              placeholder="Ex: Seu Nome ou Anônimo"
            />
          </div>

          <div class="form-group">
            <label for="reporterEmail" class="form-label">Seu E-mail para Acompanhamento</label>
            <input
              id="reporterEmail"
              v-model="reporterEmail"
              type="email"
              class="form-input"
              placeholder="Ex: seuemail@exemplo.com"
            />
          </div>
        </div>

        <div class="security-warning-box">
          <span class="warn-icon">💡</span>
          <p>
            <strong>Dica de Segurança:</strong> Nunca envie transferências Pix caso o nome do titular da conta não coincida com a Razão Social oficial do restaurante verificado.
          </p>
        </div>

        <div v-if="formError" class="modal-error">
          {{ formError }}
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="handleClose">
            Cancelar
          </button>
          <button
            type="submit"
            class="btn-danger"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? 'Enviando denúncia...' : '🚩 Enviar Denúncia Anti-Golpe' }}
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
  background-color: rgba(24, 24, 27, 0.72);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 120;
  padding: 1.25rem;
}

.modal-card {
  background-color: #ffffff;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 620px;
  max-height: 92vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
}

.modal-header {
  padding: 1.4rem 1.6rem 1.1rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: linear-gradient(180deg, #fffafa 0%, #ffffff 100%);
}

.header-title-box {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.header-icon {
  font-size: 1.75rem;
  background: #fee2e2;
  border: 1px solid #fca5a5;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #991b1b;
  letter-spacing: -0.02em;
}

.modal-subtitle {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 0.15rem;
}

.btn-close {
  background: var(--surface-alt);
  border: 1px solid var(--border-subtle);
  font-size: 0.95rem;
  color: var(--text-muted);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  cursor: pointer;
}

.btn-close:hover {
  background: #fee2e2;
  color: #991b1b;
}

.modal-body {
  padding: 1.4rem 1.6rem;
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.target-res-banner {
  background-color: #f8fafc;
  border: 1px solid var(--border);
  border-left: 4px solid #991b1b;
  border-radius: var(--radius-md);
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.target-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  font-weight: 700;
}

.target-name {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--secondary);
}

.target-location {
  font-size: 0.825rem;
  color: var(--text-secondary);
}

.target-cnpj {
  font-size: 0.78rem;
  font-family: monospace;
  font-weight: 700;
  color: #475569;
  background: #e2e8f0;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  width: fit-content;
  margin-top: 0.2rem;
}

.reasons-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.55rem;
  margin-top: 0.4rem;
}

.reason-option {
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0.65rem 0.85rem;
  cursor: pointer;
  transition: all var(--transition-fast);
  background: #ffffff;
  display: block;
}

.reason-option:hover {
  border-color: #f87171;
  background-color: #fffbfb;
}

.reason-option.selected {
  border-color: #dc2626;
  background-color: #fef2f2;
  box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.15);
}

.hidden-radio {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.reason-content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.r-icon {
  font-size: 1.25rem;
  line-height: 1.2;
}

.r-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--secondary);
  display: block;
}

.r-desc {
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-top: 0.1rem;
  line-height: 1.35;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--secondary);
}

.form-input,
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
.form-textarea:focus {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12);
}

.security-warning-box {
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  font-size: 0.825rem;
  color: #1e3a8a;
  line-height: 1.45;
}

.warn-icon {
  font-size: 1.1rem;
}

.modal-error {
  background-color: var(--danger-bg);
  color: var(--danger);
  border: 1px solid var(--danger-border);
  padding: 0.65rem 0.9rem;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 600;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-subtle);
}

.btn-danger {
  background-color: #dc2626;
  color: #ffffff;
  border: none;
  padding: 0.65rem 1.25rem;
  border-radius: var(--radius-md);
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
}

.btn-danger:hover:not(:disabled) {
  background-color: #b91c1c;
  transform: translateY(-1px);
}

.btn-danger:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Success Screen */
.success-screen {
  padding: 2.25rem 1.75rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.success-icon-box {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #dcfce7;
  color: #16a34a;
  border: 2px solid #86efac;
  font-size: 1.85rem;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
}

.success-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--secondary);
}

.success-desc {
  font-size: 0.925rem;
  color: var(--text-secondary);
  max-width: 440px;
}

.success-details-card {
  width: 100%;
  max-width: 440px;
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  text-align: left;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.badge-review {
  background: #fef3c7;
  color: #b45309;
  font-weight: 700;
  font-size: 0.78rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.security-promise {
  font-size: 0.825rem;
  color: var(--text-muted);
  max-width: 440px;
  margin-bottom: 0.5rem;
}

@media (max-width: 600px) {
  .form-row-2 {
    grid-template-columns: 1fr;
  }
}
</style>
