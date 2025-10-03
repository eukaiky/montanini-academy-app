import axios from 'axios';

// URL DO SERVIDOR DE PRODUÇÃO (Render)
const RENDER_API_URL = 'https://montanini-academy-app.onrender.com';

// Define a URL da API para ser sempre a do Render.
const API_URL = RENDER_API_URL;

console.log(`[API Config] Usando URL fixa: ${API_URL}`);

const api = axios.create({
    baseURL: API_URL,
    // Garante que o Axios envie dados de formulário corretamente (como o upload de avatar)
    headers: {
        // Tipo de conteúdo padrão para upload de formulário de arquivos
        'Content-Type': 'multipart/form-data',
    }
});

export default api;
