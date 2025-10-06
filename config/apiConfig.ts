import axios from 'axios';

// URL DO SERVIDOR DE PRODUÇÃO (Render)
// Defino a URL onde meu backend está rodando online.
const RENDER_API_URL = 'https://montanini-academy-app.onrender.com';

// Eu escolhi usar a URL do Render como a URL principal para garantir que o app sempre se conecte.
const API_URL = RENDER_API_URL;

// Isso aqui é só um log para eu ter certeza que a URL correta está sendo usada no console.
console.log(`[API Config] Usando URL fixa: ${API_URL}`);

const api = axios.create({
    // Defino a base URL para todas as requisições (ex: /api/login vira https://montanini.../api/login)
    baseURL: API_URL,
    // Garante que o Axios envie dados de formulário corretamente (como o upload de avatar, que usa Multipart/Form-Data)
    headers: {
        // Tipo de conteúdo padrão para upload de formulário de arquivos
        'Content-Type': 'multipart/form-data',
    }
});

// Exporto a instância configurada do Axios para ser usada em todas as minhas chamadas de rede.
export default api;