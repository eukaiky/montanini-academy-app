import React, { useState, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';

// Dependências da aplicação
import { useAuth } from './context/AuthContext';
import api from '../config/apiConfig';
import { lightTheme, darkTheme } from './styles/theme';

/**
 * Realiza a chamada de API para autenticar o utilizador.
 */
async function loginUser(email, senha) {
    try {
        const response = await api.post('/api/login', { email, senha }, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data.mensagem || 'Credenciais inválidas.');
        } else if (error.request) {
            throw new Error('Não foi possível ligar ao servidor. Verifique a sua rede.');
        } else {
            throw new Error('Ocorreu um erro inesperado ao tentar fazer login.');
        }
    }
}

export default function Login() {
    const router = useRouter();
    const { signIn } = useAuth();

    // Estado do Tema
    const [theme, setTheme] = useState(lightTheme);

    // Estados do formulário e UI
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [secureText, setSecureText] = useState(true);
    const [emailFocused, setEmailFocused] = useState(false);
    const [senhaFocused, setSenhaFocused] = useState(false);

    // Carrega o tema salvo no AsyncStorage ao iniciar o ecrã.
    useEffect(() => {
        const loadTheme = async () => {
            const savedTheme = await AsyncStorage.getItem('theme');
            setTheme(savedTheme === 'dark' ? darkTheme : lightTheme);
        };
        loadTheme();
    }, []);

    // Função para lidar com o processo de login
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
            } else {
                throw new Error("Resposta inválida do servidor.");
            }
        } catch (error) {
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    }

    const styles = createLoginStyles(theme);

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
                                    source={require('./montanini.png')}
                                    style={styles.logoImage}
                                    resizeMode="contain"
                                />
                            </View>
                            <Text style={styles.title}>Bem-vindo!</Text>
                            <Text style={styles.subtitle}>Faça login para continuar</Text>
                        </Animatable.View>

                        <Animatable.View animation="fadeInUp" delay={200} duration={800} style={styles.form}>
                            <View style={inputStyle(emailFocused)}>
                                <Feather name="mail" size={20} color={emailFocused ? theme.PRIMARY_YELLOW : theme.TEXT_COLOR_SECONDARY} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email"
                                    placeholderTextColor={theme.TEXT_COLOR_SECONDARY}
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
                                <Feather name="key" size={20} color={senhaFocused ? theme.PRIMARY_YELLOW : theme.TEXT_COLOR_SECONDARY} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Senha"
                                    placeholderTextColor={theme.TEXT_COLOR_SECONDARY}
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
                                    <Feather name={secureText ? "eye-off" : "eye"} size={20} color={theme.TEXT_COLOR_SECONDARY} />
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
                                    <ActivityIndicator size="small" color={theme.BACKGROUND_COLOR} />
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

// Função que cria os estilos baseados no tema recebido
const createLoginStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.BACKGROUND_COLOR,
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
        // No tema claro, a logo pode precisar de um tintColor se for branca
        tintColor: theme === darkTheme ? theme.PRIMARY_YELLOW : undefined,
    },
    title: {
        fontSize: 36,
        fontWeight: '800',
        color: theme.TEXT_COLOR_PRIMARY,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: theme.TEXT_COLOR_SECONDARY,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.CARD_COLOR,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: theme.CARD_COLOR,
    },
    inputContainerFocused: {
        borderColor: theme.BORDER_COLOR,
    },
    inputIcon: {
        paddingLeft: 16,
    },
    input: {
        flex: 1,
        color: theme.TEXT_COLOR_PRIMARY,
        fontSize: 16,
        paddingHorizontal: 12,
        paddingVertical: 16,
    },
    eyeIcon: {
        paddingHorizontal: 16,
    },
    errorMsg: {
        color: theme.ERROR_COLOR,
        marginBottom: 16,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '500',
    },
    button: {
        backgroundColor: theme.PRIMARY_YELLOW,
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        shadowColor: theme.PRIMARY_YELLOW,
        shadowOpacity: 0.4,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
        elevation: 8,
    },
    buttonText: {
        color: theme.BACKGROUND_COLOR === darkTheme.BACKGROUND_COLOR ? darkTheme.BACKGROUND_COLOR : lightTheme.TEXT_COLOR_PRIMARY,
        fontSize: 18,
        fontWeight: '700',
    },
    footer: {
        alignItems: 'center',
        paddingBottom: 40,
        paddingTop: 20,
    },
    footerText: {
        color: theme.TEXT_COLOR_SECONDARY,
        fontSize: 14,
        fontWeight: '500',
    },
});

