import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import * as Animatable from 'react-native-animatable';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
    const router = useRouter();

    return (
        <LinearGradient colors={['#121212', '#1C1C1C']} style={styles.container}>
            <StatusBar style="light" backgroundColor="#121212" translucent={false} />

            <Animatable.View
                animation="bounceIn"
                delay={300}
                style={styles.logoWrapper}
                iterationCount="infinite"
                direction="alternate"
            >
                <View style={styles.circle}>
                    <Image
                        source={require('../app/montanini.svg')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>
            </Animatable.View>

            <Animatable.View animation="fadeInUp" delay={600} style={styles.textWrapper}>
                <Text style={styles.title}>Montanini Academy</Text>
                <Text style={styles.subtitle}>Transforme seu corpo, fortaleça sua mente.</Text>
            </Animatable.View>

            <Animatable.View animation="fadeInUp" delay={900} style={styles.buttonsColumn}>
                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={() => router.push('login')}
                    activeOpacity={0.85}
                >
                    <Text style={styles.loginButtonText}>Entrar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.registerButton}
                    onPress={() => router.push('register')}
                    activeOpacity={0.85}
                >
                    <Text style={styles.registerButtonText}>Registrar</Text>
                </TouchableOpacity>
            </Animatable.View>

            <Animatable.View animation="fadeIn" delay={1300} style={styles.footer}>
                <Text style={styles.footerText}>© 2025 Montanini Academy</Text>
            </Animatable.View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 30,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#121212',
    },
    logoWrapper: {
        marginBottom: 40,
    },
    circle: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: '#FFD700',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 10,
        shadowColor: '#FFD700',
        shadowOpacity: 0.85,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 7 },
    },
    logo: {
        width: 60,
        height: 60,
        tintColor: '#1C1C1C',
    },
    textWrapper: {
        marginBottom: 50,
        alignItems: 'center',
    },
    title: {
        fontSize: 30,
        fontWeight: '800',
        color: '#FFD700',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 17,
        color: '#CCCCCC',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    buttonsColumn: {
        width: '100%',
    },
    loginButton: {
        backgroundColor: '#FFD700',
        paddingVertical: 18,
        borderRadius: 35,
        alignItems: 'center',
        marginBottom: 18,
        elevation: 8,
        shadowColor: '#FFD700',
        shadowOpacity: 0.85,
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 14,
    },
    loginButtonText: {
        color: '#1C1C1C',
        fontWeight: '800',
        fontSize: 20,
    },
    registerButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#FFD700',
        paddingVertical: 18,
        borderRadius: 35,
        alignItems: 'center',
    },
    registerButtonText: {
        color: '#FFD700',
        fontWeight: '800',
        fontSize: 20,
    },
    footer: {
        position: 'absolute',
        bottom: 25,
    },
    footerText: {
        color: '#666666',
        fontSize: 14,
    },
});
