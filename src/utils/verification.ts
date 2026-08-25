/**
 * Utilitários para Validação de CNPJ e Prevenção de Golpes no Guia Sabor
 */

/**
 * Valida o algoritmo de CNPJ oficial da Receita Federal do Brasil (14 dígitos).
 * Realiza a checagem dos dois dígitos verificadores (módulo 11) e rejeita sequências repetidas.
 */
export function validateCNPJ(cnpj: string): boolean {
  if (!cnpj) return false

  // Remove caracteres não numéricos
  const clean = cnpj.replace(/\D/g, '')

  // CNPJ deve ter exatamente 14 dígitos
  if (clean.length !== 14) return false

  // Elimina sequências inválidas conhecidas (todos os dígitos iguais)
  if (/^(\d)\1{13}$/.test(clean)) return false

  // Validação do 1º dígito verificador
  let size = clean.length - 2
  let numbers = clean.substring(0, size)
  const digits = clean.substring(size)
  let sum = 0
  let pos = size - 7

  for (let i = size; i >= 1; i--) {
    sum += Number(numbers.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== Number(digits.charAt(0))) return false

  // Validação do 2º dígito verificador
  size = size + 1
  numbers = clean.substring(0, size)
  sum = 0
  pos = size - 7

  for (let i = size; i >= 1; i--) {
    sum += Number(numbers.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== Number(digits.charAt(1))) return false

  return true
}

/**
 * Formata um valor de texto como CNPJ (XX.XXX.XXX/XXXX-XX)
 */
export function formatCNPJ(value: string): string {
  if (!value) return ''
  const clean = value.replace(/\D/g, '').slice(0, 14)

  if (clean.length <= 2) return clean
  if (clean.length <= 5) return `${clean.slice(0, 2)}.${clean.slice(2)}`
  if (clean.length <= 8) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5)}`
  if (clean.length <= 12) {
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8)}`
  }
  return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12, 14)}`
}

/**
 * Formata um número de telefone brasileiro para (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 */
export function formatPhone(value: string): string {
  if (!value) return ''
  const clean = value.replace(/\D/g, '').slice(0, 11)

  if (clean.length <= 2) return clean ? `(${clean}` : ''
  if (clean.length <= 6) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`
  if (clean.length <= 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`
  }
  return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`
}

/**
 * Retorna selos de segurança padrão baseados nas informações do estabelecimento
 */
export function getSafetyBadges(isVerified: boolean = false, hasCnpj: boolean = false): string[] {
  if (isVerified) {
    return [
      '🛡️ CNPJ Regular na Receita Federal',
      '📍 Endereço Comercial Físico Confirmado',
      '📞 Telefone Oficial de Atendimento Validado',
      '🔒 Proteção Anti-Fraude & Pagamento Seguro',
      '✨ Estabelecimento Auditado pelo Guia Sabor',
    ]
  }

  if (hasCnpj) {
    return [
      '📄 CNPJ Informado pelo Responsável',
      '⏳ Verificação Presencial em Andamento',
    ]
  }

  return [
    '⚠️ Estabelecimento sem Verificação Oficial',
    '💡 Recomendado confirmar dados antes de pagamentos antecipados',
  ]
}
