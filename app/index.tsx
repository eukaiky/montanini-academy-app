import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import * as Animatable from 'react-native-animatable';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

// Custom animation definition for the pulsing glow effect
const pulseGlow = {
    0: {
        transform: [{ scale: 1 }],
        shadowOpacity: 0.5,
        shadowRadius: 15,
    },
    0.5: {
        transform: [{ scale: 1.05 }],
        shadowOpacity: 0.7,
        shadowRadius: 30,
    },
    1: {
        transform: [{ scale: 1 }],
        shadowOpacity: 0.5,
        shadowRadius: 15,
    },
};

export default function WelcomeScreen() {
    const router = useRouter();

    return (
        <LinearGradient colors={['#121212', '#1A1A1A']} style={styles.container}>
            <StatusBar style="light" backgroundColor="#121212" />

            <Animatable.View
                animation="fadeIn"
                duration={1200}
                delay={200}
                style={styles.contentWrapper}
            >
                <Animatable.View
                    animation={pulseGlow}
                    duration={3000}
                    iterationCount="infinite"
                    easing="ease-in-out"
                    style={styles.logoWrapper}
                >
                    <Image
                        source={require('../app/montanini.svg')} // Mantenha o caminho da sua logo
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </Animatable.View>

                <Animatable.View animation="fadeInUp" duration={900} delay={500}>
                    <Text style={styles.title}>Montanini Academy</Text>
                    <Text style={styles.subtitle}>Transforme seu corpo, fortaleça sua mente.</Text>
                </Animatable.View>
            </Animatable.View>

            <Animatable.View
                style={styles.footer}
                animation="fadeInUp"
                duration={900}
                delay={800}
            >
                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={() => router.push('login')}
                    activeOpacity={0.8}
                >
                    <Text style={styles.loginButtonText}>Entrar</Text>
                </TouchableOpacity>
                <Text style={styles.footerText}>© 2025 Montanini Academy</Text>
            </Animatable.View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between', // Alinha o conteúdo principal no topo e o rodapé embaixo
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingTop: 80, // Espaço no topo
        paddingBottom: 40, // Espaço no rodapé
    },
    contentWrapper: {
        alignItems: 'center',
    },
    logoWrapper: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#FFD700',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
        // Sombra para iOS
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        // Sombra para Android (a animação de opacidade e raio não funciona com elevation)
        elevation: 15,
    },
    logo: {
        width: 60,
        height: 60,
        tintColor: '#1C1C1C', // Mantém a cor da logo
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 18,
        color: '#A0A0A0',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    footer: {
        width: '100%',
        alignItems: 'center',
    },
    loginButton: {
        backgroundColor: '#FFD700',
        paddingVertical: 18,
        borderRadius: 35,
        alignItems: 'center',
        width: '100%',
        marginBottom: 25,
        // Sombra para iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        // Sombra para Android
        elevation: 8,
    },
    loginButtonText: {
        color: '#1C1C1C',
        fontWeight: '800',
        fontSize: 20,
    },
    footerText: {
        color: '#666666',
        fontSize: 14,
    },
});
