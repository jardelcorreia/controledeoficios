import webpush from 'web-push';
import fs from 'fs';
import path from 'path';

// Gera as chaves VAPID
const vapidKeys = webpush.generateVAPIDKeys();

console.log('Chaves VAPID Geradas:');
console.log('Chave Pública:', vapidKeys.publicKey);
console.log('Chave Privada:', vapidKeys.privateKey);

const envFilePath = path.resolve(process.cwd(), '.env');

let envFileContent = '';
try {
    if (fs.existsSync(envFilePath)) {
        envFileContent = fs.readFileSync(envFilePath, 'utf-8');
    }
} catch (error) {
    console.warn(`Não foi possível ler o arquivo .env existente em ${envFilePath}. Um novo será criado.`);
}


// Atualiza ou adiciona as chaves VAPID
const keysToUpdate = {
    'NEXT_PUBLIC_VAPID_PUBLIC_KEY': vapidKeys.publicKey,
    'VAPID_PRIVATE_KEY': vapidKeys.privateKey,
};

let updatedContent = envFileContent;

for (const [key, value] of Object.entries(keysToUpdate)) {
    const keyRegex = new RegExp(`^${key}=.*$`, 'm');
    if (keyRegex.test(updatedContent)) {
        // A chave existe, então a substitui
        updatedContent = updatedContent.replace(keyRegex, `${key}="${value}"`);
    } else {
        // A chave não existe, então a adiciona
        updatedContent += `\n${key}="${value}"`;
    }
}

// Garante que não haja linhas em branco extras no início
updatedContent = updatedContent.trim();


try {
    fs.writeFileSync(envFilePath, updatedContent + '\n', 'utf-8');
    console.log(`\nArquivo .env em ${envFilePath} foi atualizado com sucesso.`);
    console.log('\nPassos seguintes:');
    console.log('1. Use a chave privada para configurar suas variáveis de ambiente no seu provedor de nuvem (ex: Firebase Functions, Vercel).');
    console.log('2. Reimplante suas funções de back-end para que elas usem a nova chave.');

} catch (error) {
    console.error(`\nErro ao escrever no arquivo .env:`, error);
    console.log('Por favor, adicione as seguintes linhas ao seu arquivo .env manualmente:');
    console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"`);
    console.log(`VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"`);
}
