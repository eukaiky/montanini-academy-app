import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

/**
 * Componente de Layout Inicial
 * Este é o coração do redirecionamento. Ele "observa" o estado de autenticação
 * e a rota atual para decidir para onde o usuário deve ir.
 */
const InitialLayout = () => {
    const { user, isAuthReady } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        // Se o contexto ainda não verificou se há um usuário salvo, não faz nada.
        if (!isAuthReady) {
            return;
        }

        // Verifica se a rota atual está dentro de uma tela protegida (ex: 'home')
        const inProtectedGroup = segments[0] === 'home';

        if (user && !inProtectedGroup) {
            // Se o usuário ESTÁ logado, mas NÃO está em uma tela protegida (ex: está na tela de login),
            // redireciona para a tela 'home'.
            router.replace('/home');
        } else if (!user && inProtectedGroup) {
            // Se o usuário NÃO ESTÁ logado, mas está tentando acessar uma tela protegida,
            // redireciona para a tela de 'login'.
            router.replace('/login');
        }

    }, [user, isAuthReady, segments]); // Roda o efeito sempre que o usuário, a prontidão ou a rota mudam

    // Mostra um indicador de carregamento enquanto o AuthContext verifica o AsyncStorage.
    if (!isAuthReady) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0d0d0d' }}>
                <ActivityIndicator size="large" color="#FBBF24" />
            </View>
        );
    }

    // Depois de carregado, renderiza as telas normalmente. O useEffect cuida do resto.
    return (
        <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="home" options={{ headerShown: false }} />
        </Stack>
    );
};


/**
 * Layout Principal do App
 * Envolve o InitialLayout com o AuthProvider para que todo o app
 * ganha acesso ao contexto de autenticação.
 */
export default function AppLayout() {
    return (
        <AuthProvider>
            <InitialLayout />
        </AuthProvider>
    );
}
