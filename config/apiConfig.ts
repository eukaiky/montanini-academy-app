/**
 * apiConfig.ts
 *
 * Este arquivo importa a URL base do arquivo de configuração
 * e cria uma instância do Axios pré-configurada.
 *
 * Usar uma instância centralizada facilita a manutenção,
 * como adicionar headers de autenticação no futuro.
 */
import axios from 'axios';

// --- CONFIGURAÇÃO DE AMBIENTE ---
// Mantenha as URLs base aqui, SEM o '/api'.
// O '/api' será adicionado nas chamadas de cada serviço.

// URL para o ambiente de desenvolvimento (seu computador)
// IMPORTANTE: Altere o IP para o endereço IPv4 da sua máquina.
const devBaseURL = 'http://192.168.3.10:3000'; // <-- MUDE ESTE IP PARA O SEU!

// URL para o ambiente de produção (quando o app for publicado)
const prodBaseURL = 'https://montanini-academy.vercel.app';

// O código abaixo seleciona a URL correta automaticamente.
const baseURL = process.env.NODE_ENV === 'development' ? devBaseURL : prodBaseURL;

// --- CRIAÇÃO DA INSTÂNCIA DO AXIOS ---
// Cria uma instância do Axios com a baseURL definida.
// Todas as requisições feitas com 'api' usarão este endereço como base.
const api = axios.create({
    baseURL: baseURL,
});

// Adiciona um 'interceptor' para logs (opcional, mas muito útil para debugar).
// Isso irá mostrar no console todas as requisições que estão sendo feitas.
api.interceptors.request.use(request => {
    // Adiciona um log para vermos a URL final que está sendo chamada.
    console.log('Starting Request:', `${request.baseURL}${request.url}`);
    return request;
});

// Exporta a INSTÂNCIA configurada para ser usada em outros serviços.
export default api;

