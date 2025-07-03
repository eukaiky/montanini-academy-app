// /app/_layout.tsx
import { Stack } from 'expo-router';

export default function AppLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    title: 'Início',
                    headerShown: false, // oculta a barra na tela inicial
                }}
            />
            <Stack.Screen
                name="login"
                options={{
                    title: 'Fazer Login',
                    headerTintColor: '#FFD700',
                    headerStyle: { backgroundColor: '#121212' },
                }}
            />
            <Stack.Screen
                name="register"
                options={{
                    title: 'Registrar',
                    headerTintColor: '#FFD700',
                    headerStyle: { backgroundColor: '#121212' },
                }}
            />
        </Stack>
    );
}
