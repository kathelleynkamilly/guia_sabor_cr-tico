export interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

export interface AuthState {
  currentUser: User | null
  isAuthModalOpen: boolean
  authModalTab: 'login' | 'register'
}
