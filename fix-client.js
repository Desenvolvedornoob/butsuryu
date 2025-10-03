const fs = require('fs');
const path = require('path');

// Caminho para o arquivo client.ts
const clientFilePath = path.join(__dirname, 'src', 'integrations', 'supabase', 'client.ts');

try {
  // Ler o conteúdo do arquivo
  let content = fs.readFileSync(clientFilePath, 'utf8');
  
  // Encontrar a parte do código que contém o iframe problemático
  const iframeRegex = /setTimeout\(\s*\(\)\s*=>\s*{\s*try\s*{\s*iframe\.contentWindow\?\.location\.href\s*=\s*dashboardUrl;[\s\S]*?}\s*}\s*,\s*\d+\s*\);/g;
  
  // Substituir pela versão corrigida (simplesmente removendo o bloco inteiro)
  content = content.replace(iframeRegex, '');
  
  // Verificar se há outras ocorrências de código solto/problemático
  const cleanupRegex = /(?:let|const|var)\s+iframe[\s\S]*?document\.createElement\(['"]iframe['"]\)[\s\S]*?;/g;
  content = content.replace(cleanupRegex, '');
  
  // Garantir que o arquivo termine corretamente
  if (!content.trim().endsWith(';')) {
    // Adicionar ponto e vírgula se não existir
    content = content.trim() + ';';
  }
  
  // Adicionar verificação de linha em branco no final
  if (!content.endsWith('\n')) {
    content += '\n';
  }
  
  // Escrever o conteúdo de volta para o arquivo
  fs.writeFileSync(clientFilePath, content, 'utf8');
  
  console.log('Arquivo client.ts corrigido com sucesso!');
} catch (error) {
  console.error('Erro ao corrigir o arquivo client.ts:', error);
}

localStorage.clear();
location.reload(); 