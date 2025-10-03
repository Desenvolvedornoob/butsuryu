-- Script para adicionar 'observador' ao enum user_role no Supabase
-- IMPORTANTE: Execute cada bloco separadamente, aguardando cada um completar

-- PASSO 1: Execute este bloco primeiro e aguarde completar
-- Primeiro, vamos verificar o enum atual
SELECT unnest(enum_range(NULL::user_role)) as existing_roles;

-- PASSO 2: Execute este bloco em uma nova transação (separadamente)
-- Adicionar 'observador' ao enum user_role
ALTER TYPE user_role ADD VALUE 'observador';

-- PASSO 3: Execute este bloco após o anterior completar
-- Verificar se foi adicionado corretamente
SELECT unnest(enum_range(NULL::user_role)) as updated_roles;

-- Comentário sobre a nova role
COMMENT ON TYPE user_role IS 'Funções disponíveis: admin, funcionario, superuser, observador. Observadores têm acesso de visualização total mas não aparecem em estatísticas.';
