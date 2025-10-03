import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    ScrollView,
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Animatable from 'react-native-animatable';
import { Feather } from '@expo/vector-icons';
import { useAuth } from './context/AuthContext';
import api from '../config/apiConfig';

// Constantes de estilo
const PRIMARY_COLOR = '#FBBF24'; // Amarelo Principal
const DARK_BG = '#0A0A0A'; // Fundo mais escuro, igual às outras telas
const CARD_BG = '#1F1F1F';
const TEXT_LIGHT = '#FFFFFF';
const TEXT_MUTED = '#A0A0A0';
const ERROR_COLOR = '#FF6B6B';

async function loginUser(email, senha) {
    const loginEndpoint = '/api/login';
    try {
        const response = await api.post(loginEndpoint, { email, senha }, {
            headers: { 'Content-Type': 'application/json' },
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data.mensagem || 'Erro do servidor');
        } else if (error.request) {
            throw new Error('Não foi possível conectar ao servidor. Verifique sua rede.');
        } else {
            throw new Error('Ocorreu um erro inesperado.');
        }
    }
}

export default function Login() {
    const router = useRouter();
    const { signIn } = useAuth();

    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [secureText, setSecureText] = useState(true);
    const [emailFocused, setEmailFocused] = useState(false);
    const [senhaFocused, setSenhaFocused] = useState(false);

    async function handleLogin() {
        setErrorMsg('');
        if (!email || !senha) {
            setErrorMsg('Por favor, preencha o email e a senha.');
            return;
        }
        setLoading(true);
        try {
            const resultado = await loginUser(email.trim(), senha);
            if (resultado.usuario && resultado.token) {
                await signIn(resultado.usuario, resultado.token);
                // A navegação será tratada pelo _layout.tsx
            } else {
                throw new Error("Resposta inválida do servidor.");
            }
        } catch (error) {
            setLoading(false);
            setErrorMsg(error.message);
        }
    }

    // O estilo de foco foi removido do container, agora afeta apenas o ícone.
    const inputStyle = (isFocused) => [
        styles.inputContainer,
        isFocused ? styles.inputContainerFocused : null,
    ];

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollViewContent} keyboardShouldPersistTaps="handled">
                    <View style={styles.content}>
                        <Animatable.View animation="fadeInDown" duration={800} style={styles.header}>
                            <View style={styles.logoContainer}>
                                <Image
                                    source={require('./montanini.svg')}
                                    style={styles.logoImage}
                                    resizeMode="contain"
                                />
                            </View>
                            <Text style={styles.title}>Bem-vindo!</Text>
                            <Text style={styles.subtitle}>Faça login para continuar</Text>
                        </Animatable.View>

                        <Animatable.View animation="fadeInUp" delay={200} duration={800} style={styles.form}>
                            <View style={inputStyle(emailFocused)}>
                                <Feather name="mail" size={20} color={emailFocused ? PRIMARY_COLOR : TEXT_MUTED} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email"
                                    placeholderTextColor={TEXT_MUTED}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    value={email}
                                    onChangeText={setEmail}
                                    editable={!loading}
                                    returnKeyType="next"
                                    onFocus={() => setEmailFocused(true)}
                                    onBlur={() => setEmailFocused(false)}
                                />
                            </View>

                            <View style={inputStyle(senhaFocused)}>
                                <Feather name="key" size={20} color={senhaFocused ? PRIMARY_COLOR : TEXT_MUTED} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Senha"
                                    placeholderTextColor={TEXT_MUTED}
                                    secureTextEntry={secureText}
                                    value={senha}
                                    onChangeText={setSenha}
                                    editable={!loading}
                                    returnKeyType="done"
                                    onSubmitEditing={handleLogin}
                                    onFocus={() => setSenhaFocused(true)}
                                    onBlur={() => setSenhaFocused(false)}
                                />
                                <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeIcon}>
                                    <Feather name={secureText ? "eye-off" : "eye"} size={20} color={TEXT_MUTED} />
                                </TouchableOpacity>
                            </View>

                            {errorMsg ? (
                                <Animatable.Text animation="shake" duration={500} style={styles.errorMsg}>
                                    {errorMsg}
                                </Animatable.Text>
                            ) : null}

                            <TouchableOpacity
                                style={[styles.button, loading && { opacity: 0.8 }]}
                                onPress={handleLogin}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#1C1C1C" />
                                ) : (
                                    <Text style={styles.buttonText}>Entrar</Text>
                                )}
                            </TouchableOpacity>
                        </Animatable.View>
                    </View>

                    <Animatable.View animation="fadeInUp" delay={400} duration={800} style={styles.footer}>
                        <TouchableOpacity onPress={() => Alert.alert("Em breve", "A funcionalidade de recuperação de senha será implementada.")}>
                            <Text style={styles.footerText}>Esqueceu a senha?</Text>
                        </TouchableOpacity>
                    </Animatable.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DARK_BG,
    },
    scrollViewContent: {
        flexGrow: 1,
        justifyContent: 'space-between',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    logoImage: {
        width: 100,
        height: 100,
    },
    title: {
        fontSize: 36,
        fontWeight: '800',
        color: TEXT_LIGHT,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: TEXT_MUTED,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: CARD_BG,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: CARD_BG, // Borda da mesma cor do fundo para um look 'sem borda'
    },
    inputContainerFocused: {
        // Sem estilos de borda ou sombra para evitar o realce amarelo
        borderColor: CARD_BG,
    },
    inputIcon: {
        paddingLeft: 16,
    },
    input: {
        flex: 1,
        color: TEXT_LIGHT,
        fontSize: 16,
        paddingHorizontal: 12,
        paddingVertical: 16,
    },
    eyeIcon: {
        paddingHorizontal: 16,
    },
    errorMsg: {
        color: ERROR_COLOR,
        marginBottom: 16,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '500',
    },
    button: {
        backgroundColor: PRIMARY_COLOR,
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        shadowColor: PRIMARY_COLOR,
        shadowOpacity: 0.4,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
        elevation: 8,
    },
    buttonText: {
        color: '#1C1C1C',
        fontSize: 18,
        fontWeight: '700',
    },
    footer: {
        alignItems: 'center',
        paddingBottom: 40,
        paddingTop: 20,
    },
    footerText: {
        color: TEXT_MUTED,
        fontSize: 14,
        fontWeight: '500',
    },
});

