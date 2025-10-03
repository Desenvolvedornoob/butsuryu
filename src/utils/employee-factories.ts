import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { User } from '@/types/user';

type TableExistsResponse = {
  count: number;
};

type FactoryIdRecord = {
  factory_id: string;
};

/**
 * Função para buscar todas as fábricas associadas a um funcionário
 * @param employeeId ID do funcionário
 * @returns Array com os IDs das fábricas associadas
 */
export const getEmployeeFactories = async (employeeId: string) => {
  try {
    console.log("====== getEmployeeFactories ======");
    console.log("Buscando fábricas para o funcionário:", employeeId);
    
    // Primeiro tentar buscar diretamente da tabela de relacionamento
    const { data: relationData, error: relationError } = await supabase
      .from('employee_factories')
      .select('factory_id')
      .eq('employee_id', employeeId);
    
    if (relationError) {
      console.error("Erro ao buscar da tabela employee_factories:", relationError);
    } else {
      console.log("Dados encontrados na tabela employee_factories:", relationData);
      
      // Se encontramos dados na tabela de relacionamento, retornar esses IDs
      if (relationData && relationData.length > 0) {
        const factoryIds = relationData.map((record: FactoryIdRecord) => record.factory_id);
        console.log("Fábricas encontradas na tabela de relacionamento:", factoryIds);
        console.log("============================");
        return factoryIds;
      }
    }
    
    // Como não encontramos na tabela de relacionamento, buscar do perfil
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('factory_id')
      .eq('id', employeeId)
      .single();
      
    if (profileError) {
      console.error("Erro ao buscar factory_id do perfil:", profileError);
      console.log("============================");
      return [];
    }
    
    console.log("Dados encontrados no perfil:", profileData);
    
    // Garantir que o retorno seja sempre um array, mesmo que factory_id seja string
    if (profileData?.factory_id) {
      let result;
      
      // Se for um array, retorna como está
      if (Array.isArray(profileData.factory_id)) {
        result = profileData.factory_id;
      }
      // Se for uma string com vírgulas, divide em array
      else if (typeof profileData.factory_id === 'string' && profileData.factory_id.includes(',')) {
        result = profileData.factory_id.split(',');
      }
      // Se for uma string simples, retorna como item único em array
      else {
        result = [profileData.factory_id];
      }
      
      console.log("Fábricas encontradas no perfil:", result);
      console.log("============================");
      return result;
    }
    
    console.log("Nenhuma fábrica encontrada para o funcionário");
    console.log("============================");
    return [];
  } catch (error) {
    console.error("Erro ao buscar fábricas do funcionário:", error);
    console.log("============================");
    return [];
  }
};

/**
 * Função para atualizar as fábricas associadas a um funcionário
 * @param employeeId ID do funcionário 
 * @param factoryIds Array com os IDs das fábricas
 */
export const updateEmployeeFactories = async (employeeId: string, factoryIds: string[]) => {
  try {
    console.log("Atualizando fábricas para o funcionário:", employeeId, factoryIds);
    
    // Não verificamos mais se a tabela existe, assumimos que ela existe
    // Definir o tipo correto para as associações de factory
    type EmployeeFactoryInsert = Database['public']['Tables']['employee_factories']['Insert'];
    
    // 1. Primeiro atualizar também o factory_id no perfil para compatibilidade
    if (factoryIds.length > 0) {
      console.log("Atualizando factory_id no perfil para compatibilidade:", factoryIds[0]);
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ factory_id: factoryIds[0] })
        .eq('id', employeeId);
        
      if (updateProfileError) {
        console.error("Erro ao atualizar factory_id no perfil:", updateProfileError);
      }
    } else {
      // Se não tem fábricas selecionadas, definir como null
      console.log("Removendo factory_id do perfil (null)");
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ factory_id: null })
        .eq('id', employeeId);
        
      if (updateProfileError) {
        console.error("Erro ao remover factory_id do perfil:", updateProfileError);
      }
    }
    
    // 2. Remover associações existentes na tabela de relacionamento
    console.log("Removendo associações existentes na tabela employee_factories");
    const { error: deleteError } = await supabase
      .from('employee_factories')
      .delete()
      .eq('employee_id', employeeId);
      
    if (deleteError) {
      console.error("Erro ao remover associações existentes:", deleteError);
      // Não lançamos exceção, continuamos tentando adicionar novas associações
    }
    
    // 3. Adicionar novas associações
    if (factoryIds.length > 0) {
      console.log("Adicionando", factoryIds.length, "novas associações de fábrica");
      const associations: EmployeeFactoryInsert[] = factoryIds.map(factoryId => ({
        employee_id: employeeId,
        factory_id: factoryId
      }));
      
      // Inserir uma a uma para identificar melhor possíveis erros
      for (const association of associations) {
        console.log("Inserindo associação:", association);
        const { error: insertError } = await supabase
          .from('employee_factories')
          .insert([association]);
          
        if (insertError) {
          console.error("Erro ao adicionar associação:", insertError, association);
        } else {
          console.log("Associação inserida com sucesso:", association);
        }
      }
    }
    
    console.log("Processo de atualização de fábricas concluído");
    
  } catch (error) {
    console.error("Erro ao atualizar fábricas do funcionário:", error);
    toast.error("Não foi possível atualizar as fábricas do funcionário");
  }
};

// Função para carregar fábricas dos funcionários após carregamento de dados
export const loadEmployeeFactories = async (employees: User[]): Promise<User[]> => {
  if (!employees || employees.length === 0) {
    console.log('Não há funcionários para carregar fábricas');
    return employees;
  }
  
  console.log(`Iniciando carregamento de fábricas para ${employees.length} funcionários`);
  
  try {
    // Cria um mapa das fábricas por funcionário
    const factoryMap: Record<string, string[]> = {};
    
    // Obter todas as associações de fábricas para todos os funcionários de uma vez
    const { data: factoryAssociations, error: associationsError } = await supabase
      .from('employee_factories')
      .select('employee_id, factory_id')
      .in('employee_id', employees.map(emp => emp.id));
    
    if (associationsError) {
      console.error('Erro ao obter fábricas dos funcionários da tabela employee_factories:', associationsError);
    } else if (factoryAssociations && factoryAssociations.length > 0) {
      console.log(`Encontradas ${factoryAssociations.length} associações de fábricas`);
      
      // Cria o mapa de fábricas por funcionário
      factoryAssociations.forEach(association => {
        if (!factoryMap[association.employee_id]) {
          factoryMap[association.employee_id] = [];
        }
        factoryMap[association.employee_id].push(association.factory_id);
      });
      
      // Atualiza cada funcionário com suas fábricas
      employees.forEach(employee => {
        const factories = factoryMap[employee.id];
        if (factories && factories.length > 0) {
          console.log(`Funcionário ${employee.id} tem ${factories.length} fábricas associadas:`, factories);
          // Atribuir o array de fábricas diretamente
          employee.factory_id = factories;
        } else {
          console.log(`Funcionário ${employee.id} não tem fábricas na tabela de relacionamento, verificando profile...`);
          // Se não encontrou na tabela de relacionamento, mantém o factory_id existente
          // e garante que seja um array
          if (employee.factory_id) {
            if (!Array.isArray(employee.factory_id)) {
              employee.factory_id = [employee.factory_id];
            }
          } else {
            employee.factory_id = [];
          }
        }
      });
    } else {
      console.log('Nenhuma associação encontrada na tabela employee_factories, usando factory_id de profiles');
      
      // Se não encontrou associações, garantir que cada factory_id seja um array
      employees.forEach(employee => {
        if (employee.factory_id) {
          if (!Array.isArray(employee.factory_id)) {
            employee.factory_id = [employee.factory_id];
          }
        } else {
          employee.factory_id = [];
        }
      });
    }
    
  } catch (error) {
    console.error('Erro geral ao carregar fábricas:', error);
  }
  
  console.log('Carregamento de fábricas concluído');
  return employees;
}; 