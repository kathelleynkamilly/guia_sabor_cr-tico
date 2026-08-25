<script setup lang="ts">
import { ref } from 'vue'
import { useRestaurantStore } from '../stores/restaurant'

const restaurantStore = useRestaurantStore()
const isTesting = ref(false)
const feedbackMessage = ref('')

async function handleTestConnection() {
  isTesting.value = true
  feedbackMessage.value = ''
  await restaurantStore.checkDbConnection()
  isTesting.value = false
  if (restaurantStore.isDbConnected) {
    feedbackMessage.value = 'Conexão com o banco de dados MySQL ativa e operando perfeitamente!'
  } else {
    feedbackMessage.value = 'Não foi possível conectar ao MySQL. Verifique as credenciais no arquivo .env.'
  }
}

async function handleReseed() {
  feedbackMessage.value = ''
  const success = await restaurantStore.reseedDatabase()
  if (success) {
    feedbackMessage.value = 'Banco de dados MySQL reinicializado e populado com sucesso!'
  } else {
    feedbackMessage.value = 'Erro ao popular banco de dados MySQL.'
  }
}
</script>

<template>
  <div v-if="restaurantStore.isDbModalOpen" class="modal-overlay" @click.self="restaurantStore.closeDbModal()">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-title-group">
          <span class="db-icon">🗄️</span>
          <div>
            <h3>Status do Banco de Dados MySQL</h3>
            <p class="subtitle">Gerenciamento de persistência e conexão da aplicação</p>
          </div>
        </div>
        <button class="btn-close" @click="restaurantStore.closeDbModal()">✕</button>
      </div>

      <div class="modal-body">
        <!-- Status Geral -->
        <div class="status-banner" :class="restaurantStore.isDbConnected ? 'status-online' : 'status-offline'">
          <div class="status-indicator">
            <span class="status-dot"></span>
            <span class="status-text">
              {{ restaurantStore.isDbConnected ? 'Banco de Dados MySQL Conectado' : 'Modo Offline / Sem Conexão' }}
            </span>
          </div>
          <span class="engine-tag">MySQL 8.0 / MariaDB</span>
        </div>

        <!-- Parâmetros de Conexão -->
        <div class="db-info-grid">
          <div class="info-card">
            <span class="label">Host / Servidor</span>
            <span class="value">{{ restaurantStore.dbHealthInfo?.host || '127.0.0.1' }}</span>
          </div>
          <div class="info-card">
            <span class="label">Porta</span>
            <span class="value">{{ restaurantStore.dbHealthInfo?.port || 3306 }}</span>
          </div>
          <div class="info-card">
            <span class="label">Database</span>
            <span class="value code-val">{{ restaurantStore.dbHealthInfo?.database || 'guia_sabor_critico' }}</span>
          </div>
          <div class="info-card">
            <span class="label">Usuário</span>
            <span class="value">{{ restaurantStore.dbHealthInfo?.user || 'root' }}</span>
          </div>
        </div>

        <!-- Estatísticas das Tabelas -->
        <div v-if="restaurantStore.isDbConnected && restaurantStore.dbStats" class="stats-section">
          <h4>Registros no Banco de Dados</h4>
          <div class="stats-grid">
            <div class="stat-pill">
              <span class="stat-num">{{ restaurantStore.dbStats.totalRestaurants }}</span>
              <span class="stat-lbl">Restaurantes</span>
            </div>
            <div class="stat-pill">
              <span class="stat-num">{{ restaurantStore.dbStats.totalVerified }}</span>
              <span class="stat-lbl">Verificados</span>
            </div>
            <div class="stat-pill">
              <span class="stat-num">{{ restaurantStore.dbStats.totalMenuItems }}</span>
              <span class="stat-lbl">Pratos / Cardápios</span>
            </div>
            <div class="stat-pill">
              <span class="stat-num">{{ restaurantStore.dbStats.totalReviews }}</span>
              <span class="stat-lbl">Avaliações</span>
            </div>
            <div class="stat-pill">
              <span class="stat-num">{{ restaurantStore.dbStats.totalUsers }}</span>
              <span class="stat-lbl">Usuários</span>
            </div>
            <div class="stat-pill">
              <span class="stat-num">{{ restaurantStore.dbStats.totalReports }}</span>
              <span class="stat-lbl">Denúncias</span>
            </div>
          </div>
        </div>

        <!-- Feedback message -->
        <div v-if="feedbackMessage" class="feedback-box" :class="restaurantStore.isDbConnected ? 'msg-success' : 'msg-warn'">
          {{ feedbackMessage }}
        </div>

        <!-- Instruções de Uso / Comandos -->
        <div class="tips-box">
          <p class="tips-title">💡 Comandos Rápidos no Terminal:</p>
          <ul>
            <li><code>npm run db:init</code> : Cria as tabelas e popula com os dados iniciais.</li>
            <li><code>npm run server</code> : Inicia a API REST conectada ao MySQL na porta 3001.</li>
            <li><code>npm run dev:all</code> : Executa o Frontend (Vite) e o Backend (Node/MySQL) juntos.</li>
          </ul>
        </div>
      </div>

      <div class="modal-footer">
        <button
          type="button"
          class="btn-secondary"
          :disabled="isTesting"
          @click="handleTestConnection()"
        >
          <span v-if="isTesting">🔄 Testando...</span>
          <span v-else>🔍 Testar Conexão</span>
        </button>

        <button
          type="button"
          class="btn-reseed"
          :disabled="restaurantStore.isDbSyncing"
          @click="handleReseed()"
        >
          <span v-if="restaurantStore.isDbSyncing">⏳ Populando...</span>
          <span v-else>🌱 Re-executar Seed Automático</span>
        </button>

        <button type="button" class="btn-primary" @click="restaurantStore.closeDbModal()">
          Concluído
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-card {
  background: #ffffff;
  border-radius: var(--radius-xl, 16px);
  width: 100%;
  max-width: 620px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.db-icon {
  font-size: 1.75rem;
}

.modal-title-group h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #0f172a;
}

.subtitle {
  margin: 0.15rem 0 0;
  font-size: 0.825rem;
  color: #64748b;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 6px;
  line-height: 1;
}

.btn-close:hover {
  color: #0f172a;
  background: #f1f5f9;
}

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-height: 75vh;
  overflow-y: auto;
}

.status-banner {
  padding: 0.85rem 1.15rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid transparent;
}

.status-online {
  background-color: #ecfdf5;
  border-color: #a7f3d0;
  color: #065f46;
}

.status-offline {
  background-color: #fffbeb;
  border-color: #fde68a;
  color: #92400e;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 0.925rem;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.status-online .status-dot {
  background-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.25);
}

.status-offline .status-dot {
  background-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.25);
}

.engine-tag {
  font-size: 0.75rem;
  font-weight: 600;
  background: #ffffff;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  color: #475569;
}

.db-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.info-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-card .label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.info-card .value {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
}

.info-card .code-val {
  font-family: monospace;
  color: #0284c7;
}

.stats-section h4 {
  margin: 0 0 0.65rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: #334155;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.65rem;
}

.stat-pill {
  background: #f1f5f9;
  border-radius: 8px;
  padding: 0.65rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.stat-num {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
}

.stat-lbl {
  font-size: 0.725rem;
  font-weight: 600;
  color: #64748b;
}

.feedback-box {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
}

.msg-success {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.msg-warn {
  background: #fffbeb;
  color: #b45309;
  border: 1px solid #fde68a;
}

.tips-box {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  padding: 0.85rem 1rem;
  font-size: 0.825rem;
  color: #475569;
}

.tips-title {
  margin: 0 0 0.35rem;
  font-weight: 700;
  color: #1e293b;
}

.tips-box ul {
  margin: 0;
  padding-left: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.tips-box code {
  background: #e2e8f0;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  font-family: monospace;
  font-weight: 700;
  color: #0f172a;
}

.modal-footer {
  padding: 1rem 1.5rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-secondary {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #334155;
  font-weight: 600;
  padding: 0.5rem 0.95rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
}

.btn-secondary:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.btn-reseed {
  background: #f0fdf4;
  border: 1px solid #86efac;
  color: #166534;
  font-weight: 600;
  padding: 0.5rem 0.95rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
}

.btn-reseed:hover:not(:disabled) {
  background: #dcfce7;
  border-color: #4ade80;
}

.btn-primary {
  background: #b91c1c;
  border: none;
  color: #ffffff;
  font-weight: 700;
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
}

.btn-primary:hover {
  background: #991b1b;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .db-info-grid, .stats-grid {
    grid-template-columns: 1fr;
  }
  .modal-footer {
    flex-direction: column;
  }
}
</style>
