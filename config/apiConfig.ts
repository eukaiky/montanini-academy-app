import axios from 'axios';
import { Platform } from 'react-native';

// --- Variáveis de Ambiente Expo ---

const PORT = 3000;
let API_URL = '';

// IP DO COMPUTADOR ONDE O BACKEND ESTÁ RODANDO
const LOCAL_NETWORK_IP = '192.168.3.10';

// Otimização: A URL Base deve ir até a porta, sem o prefixo '/api'
// para evitar que 'http://host:port/api' + '/api/rota' resulte em '/api/api/rota'.

if (Platform.OS === 'web' || (__DEV__ && Platform.OS !== 'android' && Platform.OS !== 'ios')) {
    // 1. WEB & Simulador (Acessa o localhost do computador)
    API_URL = `http://localhost:${PORT}`; // CORRIGIDO: Removido /api
    console.log(`[API Config] Usando modo localhost: ${API_URL}`);
} else {
    // 2. Mobile (Android/iOS) - Usa o IP da rede local para encontrar o computador.
    // O celular DEVE estar na mesma rede Wi-Fi que o computador (192.168.3.x).
    API_URL = `http://${LOCAL_NETWORK_IP}:${PORT}`; // CORRIGIDO: Removido /api
    console.log(`[API Config] Usando IP Local: ${API_URL}`);
}

const api = axios.create({
    baseURL: API_URL,
    // Garante que o Axios envie dados de formulário corretamente (como o upload de avatar)
    headers: {
        // CORRIGIDO: Tipo de conteúdo para upload de formulário de arquivos
        'Content-Type': 'multipart/form-data',
    }
});

export default api;
