// Script para debug detalhado do processamento de dados
// Execute este script no console do navegador

console.log('🔍 DEBUG PROCESSAMENTO DE DADOS...');

async function debugDataProcessing() {
  try {
    // Obter usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ Usuário não autenticado');
      return;
    }
    
    console.log('👤 Usuário:', user.id);
    
    // 1. Buscar dados brutos de todas as tabelas
    console.log('\n📊 DADOS BRUTOS DAS TABELAS:');
    
    // Requests
    const { data: requestsData, error: requestsError } = await supabase
      .from('requests')
      .select('*')
      .eq('user_id', user.id);
    
    console.log('📋 Requests:', requestsData?.length || 0);
    if (requestsData) {
      requestsData.forEach((req, index) => {
        console.log(`  Request ${index + 1}:`, {
          id: req.id,
          type: req.type,
          status: req.status,
          start_date: req.start_date,
          end_date: req.end_date,
          reason: req.reason
        });
      });
    }
    
    // Time Off
    const { data: timeOffData, error: timeOffError } = await supabase
      .from('time_off')
      .select('*')
      .eq('user_id', user.id);
    
    console.log('📋 Time Off:', timeOffData?.length || 0);
    if (timeOffData) {
      timeOffData.forEach((req, index) => {
        console.log(`  Time Off ${index + 1}:`, {
          id: req.id,
          status: req.status,
          start_date: req.start_date,
          end_date: req.end_date,
          reason: req.reason
        });
      });
    }
    
    // Early Departures
    const { data: earlyDeparturesData, error: earlyDeparturesError } = await supabase
      .from('early_departures')
      .select('*')
      .eq('user_id', user.id);
    
    console.log('📋 Early Departures:', earlyDeparturesData?.length || 0);
    if (earlyDeparturesData) {
      earlyDeparturesData.forEach((req, index) => {
        console.log(`  Early Departure ${index + 1}:`, {
          id: req.id,
          status: req.status,
          date: req.date,
          reason: req.reason
        });
      });
    }
    
    // Lateness
    const { data: latenessData, error: latenessError } = await supabase
      .from('lateness')
      .select('*')
      .eq('user_id', user.id);
    
    console.log('📋 Lateness:', latenessData?.length || 0);
    if (latenessData) {
      latenessData.forEach((req, index) => {
        console.log(`  Lateness ${index + 1}:`, {
          id: req.id,
          status: req.status,
          date: req.date,
          reason: req.reason
        });
      });
    }
    
    // 2. Verificar se há IDs duplicados entre tabelas
    console.log('\n🔍 VERIFICANDO DUPLICAÇÕES:');
    
    const allIds = [
      ...(requestsData?.map(req => req.id) || []),
      ...(timeOffData?.map(req => req.id) || []),
      ...(earlyDeparturesData?.map(req => req.id) || []),
      ...(latenessData?.map(req => req.id) || [])
    ];
    
    const uniqueIds = [...new Set(allIds)];
    console.log('📊 Total de IDs:', allIds.length);
    console.log('📊 IDs únicos:', uniqueIds.length);
    
    if (allIds.length !== uniqueIds.length) {
      console.log('❌ IDs duplicados encontrados!');
      const duplicates = allIds.filter((id, index) => allIds.indexOf(id) !== index);
      console.log('📋 IDs duplicados:', [...new Set(duplicates)]);
    } else {
      console.log('✅ Nenhuma duplicata encontrada');
    }
    
    // 3. Verificar classificação de tipos
    console.log('\n🔍 VERIFICANDO CLASSIFICAÇÃO DE TIPOS:');
    
    if (timeOffData) {
      timeOffData.forEach((timeOff, index) => {
        const originalRequest = requestsData?.find(req => req.id === timeOff.id);
        const isAbsence = originalRequest?.type === 'absence' || 
                         (!originalRequest && timeOff.start_date === timeOff.end_date);
        
        console.log(`Time Off ${index + 1}:`, {
          id: timeOff.id,
          start_date: timeOff.start_date,
          end_date: timeOff.end_date,
          isSameDate: timeOff.start_date === timeOff.end_date,
          originalRequestType: originalRequest?.type,
          classifiedAs: isAbsence ? 'absence' : (originalRequest?.type || 'time-off')
        });
      });
    }
    
    // 4. Testar fetchUserData com logs detalhados
    console.log('\n📊 TESTANDO fetchUserData:');
    const myDataResult = await fetchUserData(user.id);
    
    console.log('📄 Total processado:', myDataResult.length);
    
    // Mostrar cada request processado
    myDataResult.forEach((req, index) => {
      console.log(`Processed ${index + 1}:`, {
        id: req.id,
        type: req.type,
        status: req.status,
        date: req.date,
        endDate: req.endDate,
        reason: req.reason
      });
    });
    
    // 5. Contar por tipo
    const typeCount = {
      'time-off': myDataResult.filter(req => req.type === 'time-off').length,
      'early-departure': myDataResult.filter(req => req.type === 'early-departure').length,
      'lateness': myDataResult.filter(req => req.type === 'lateness').length,
      'absence': myDataResult.filter(req => req.type === 'absence').length
    };
    
    console.log('📊 Contagem por tipo:', typeCount);
    
    // 6. Verificar se há requests com status 'approved'
    const approvedRequests = myDataResult.filter(req => req.status === 'approved');
    console.log('✅ Requests aprovados:', approvedRequests.length);
    
    approvedRequests.forEach((req, index) => {
      console.log(`  Aprovado ${index + 1}:`, {
        id: req.id,
        type: req.type,
        date: req.date,
        reason: req.reason
      });
    });
    
  } catch (error) {
    console.error('❌ Erro no debug:', error);
  }
}

// Executar debug
debugDataProcessing();
