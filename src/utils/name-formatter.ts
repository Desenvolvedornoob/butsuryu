/**
 * Utilitário para formatação de nomes de funcionários
 * Agora simplificado após remoção do campo last_name
 */

export interface NameFields {
  first_name: string | null;
}

/**
 * Formata o nome do funcionário
 * @param nameFields - Objeto com first_name
 * @returns Nome formatado corretamente
 */
export function formatEmployeeName(nameFields: NameFields): string {
  const { first_name } = nameFields;
  
  // Se não tem first_name, retorna padrão
  if (!first_name || first_name.trim() === '') {
    return 'Nome não informado';
  }
  
  return first_name.trim();
}

/**
 * Formata nome do funcionário a partir de um objeto user
 * @param user - Objeto de usuário com campos de nome
 * @returns Nome formatado
 */
export function formatUserName(user: { first_name?: string | null }): string {
  return formatEmployeeName({
    first_name: user.first_name || null
  });
}