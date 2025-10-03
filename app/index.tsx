import { Redirect } from 'expo-router';
import React from 'react';

export default function Index() {
    // Este componente redireciona a rota raiz para a página de login.
    // O layout principal (_layout.tsx) irá então lidar com o redirecionamento para a tela inicial
    // se o usuário já estiver autenticado.
    return <Redirect href="/login" />;
}
