import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '../types/auth'
import { api } from '../services/api'

const STORAGE_USER_KEY = 'guia_sabor_current_user'
const STORAGE_USERS_KEY = 'guia_sabor_registered_users'

export const useAuthStore = defineStore('auth', () => {
  // Estado
  const currentUser = ref<User | null>(null)
  const isAuthModalOpen = ref<boolean>(false)
  const authModalTab = ref<'login' | 'register'>('login')
  const isLoading = ref<boolean>(false)

  // Inicializar usuário do localStorage
  try {
    const savedUser = localStorage.getItem(STORAGE_USER_KEY)
    if (savedUser) {
      currentUser.value = JSON.parse(savedUser)
    }
  } catch (error) {
    console.error('Erro ao carregar usuário autenticado do localStorage:', error)
  }

  // Getters
  const isAuthenticated = computed(() => !!currentUser.value)
  const userName = computed(() => currentUser.value?.name || '')

  // Recuperar lista de usuários registrados (fallback local)
  function getRegisteredUsers(): Array<{ id: string; name: string; email: string; passwordHash: string }> {
    try {
      const usersJson = localStorage.getItem(STORAGE_USERS_KEY)
      return usersJson ? JSON.parse(usersJson) : []
    } catch {
      return []
    }
  }

  // Salvar usuário autenticado
  function setCurrentUser(user: User | null) {
    currentUser.value = user
    if (user) {
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(STORAGE_USER_KEY)
    }
  }

  // Ações
  async function login(email: string, password: string): Promise<{ success: boolean; message?: string }> {
    const cleanEmail = email.trim().toLowerCase()
    isLoading.value = true

    try {
      // 1. Tentar autenticação via MySQL API
      const result = await api.login(cleanEmail, password)
      if (result.success && result.user) {
        setCurrentUser(result.user)
        closeAuthModal()
        isLoading.value = false
        return { success: true }
      }
    } catch (err) {
      console.warn('Backend indisponível para login, tentando validação local...', err)
    }

    // 2. Fallback local se o servidor estiver offline
    const users = getRegisteredUsers()
    const userMatch = users.find(u => u.email.toLowerCase() === cleanEmail && u.passwordHash === password)

    if (userMatch) {
      const loggedUser: User = {
        id: userMatch.id,
        name: userMatch.name,
        email: userMatch.email,
        createdAt: new Date().toLocaleDateString('pt-BR'),
      }
      setCurrentUser(loggedUser)
      closeAuthModal()
      isLoading.value = false
      return { success: true }
    }

    // Fallback de conta demo
    if (cleanEmail === 'usuario@exemplo.com' && password === '123456') {
      const demoUser: User = {
        id: 'user-demo',
        name: 'Usuário Convidado',
        email: 'usuario@exemplo.com',
        createdAt: new Date().toLocaleDateString('pt-BR'),
      }
      setCurrentUser(demoUser)
      closeAuthModal()
      isLoading.value = false
      return { success: true }
    }

    isLoading.value = false
    return {
      success: false,
      message: 'E-mail ou senha incorretos. Verifique suas credenciais ou crie uma conta.',
    }
  }

  async function register(name: string, email: string, password: string): Promise<{ success: boolean; message?: string }> {
    const cleanName = name.trim()
    const cleanEmail = email.trim().toLowerCase()

    if (!cleanName || !cleanEmail || !password) {
      return { success: false, message: 'Por favor, preencha todos os campos obrigatórios.' }
    }

    if (password.length < 6) {
      return { success: false, message: 'A senha deve conter no mínimo 6 caracteres.' }
    }

    isLoading.value = true

    try {
      // 1. Tentar cadastro via MySQL API
      const result = await api.register(cleanName, cleanEmail, password)
      if (result.success && result.user) {
        setCurrentUser(result.user)
        closeAuthModal()
        isLoading.value = false
        return { success: true }
      } else if (result.message) {
        isLoading.value = false
        return { success: false, message: result.message }
      }
    } catch (err) {
      console.warn('Backend indisponível para cadastro, registrando localmente...', err)
    }

    // 2. Fallback local se o servidor estiver offline
    const users = getRegisteredUsers()
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      isLoading.value = false
      return { success: false, message: 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.' }
    }

    const newUser = {
      id: 'user-' + Date.now(),
      name: cleanName,
      email: cleanEmail,
      passwordHash: password,
    }

    users.push(newUser)
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users))

    const activeUser: User = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      createdAt: new Date().toLocaleDateString('pt-BR'),
    }
    setCurrentUser(activeUser)
    closeAuthModal()
    isLoading.value = false
    return { success: true }
  }

  function logout() {
    setCurrentUser(null)
  }

  function openLoginModal() {
    authModalTab.value = 'login'
    isAuthModalOpen.value = true
  }

  function openRegisterModal() {
    authModalTab.value = 'register'
    isAuthModalOpen.value = true
  }

  function closeAuthModal() {
    isAuthModalOpen.value = false
  }

  return {
    currentUser,
    isAuthModalOpen,
    authModalTab,
    isLoading,
    isAuthenticated,
    userName,
    login,
    register,
    logout,
    openLoginModal,
    openRegisterModal,
    closeAuthModal,
  }
})
