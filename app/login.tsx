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
const PRIMARY_COLOR = '#FFD700'; // Ouro/Amarelo Principal
const DARK_BG = '#0A0A0A'; // Fundo mais escuro
const CARD_BG = '#1A1A1A'; // Cor de Fundo de Inputs/Cartões
const TEXT_LIGHT = '#FFFFFF';
const TEXT_MUTED = '#A0A0A0';
const ERROR_COLOR = '#FF6B6B';

/**
 * Envia as credenciais de login para o servidor backend.
 */
async function loginUser(email: string, senha: string): Promise<any> {
    const loginEndpoint = '/api/login';

    console.log(`Enviando POST para: ${loginEndpoint}`);

    try {
        // Força o Content-Type para application/json.
        const response = await api.post(loginEndpoint, { email, senha }, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        return response.data;

    } catch (error: any) {
        if (error.response) {
            throw new Error(error.response.data.mensagem || 'Erro do servidor');
        } else if (error.request) {
            throw new Error('Não foi possível conectar ao servidor. Verifique sua rede e o IP de conexão.');
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

    // Estados de Foco mantidos para estilização
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
                const userDataForContext = {
                    ...resultado.usuario,
                    uid: resultado.usuario.uid,
                };

                await signIn(userDataForContext, resultado.token);
                // Navegação automática ou outra ação pós-login
            } else {
                throw new Error("Resposta inválida do servidor ao fazer login.");
            }

        } catch (error: any) {
            setLoading(false);
            const message = error.message || 'Falha na comunicação com a API.';
            setErrorMsg(message);
            console.error('Falha no login:', message, error);
        }
    }

    // A função de estilo agora usa os estados de foco (emailFocused, senhaFocused)
    const inputStyle = (isFocused) => [
        styles.inputContainer,
        isFocused ? styles.inputContainerFocused : null,
    ];

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                <View style={styles.content}>
                    <Animatable.View animation="fadeInDown" style={styles.header}>
                        {/* CONTAINER DA LOGO: Simplificado, sem borda circular */}
                        <View style={styles.logoContainer}>
                            {/* LOGO */}
                            <Image
                                source={require('./montanini.svg')}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.title}>Bem-vindo!</Text>
                        <Text style={styles.subtitle}>Faça login para continuar</Text>
                    </Animatable.View>

                    <Animatable.View animation="fadeInUp" delay={300} style={styles.form}>

                        {/* INPUT EMAIL */}
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

                        {/* INPUT SENHA */}
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

                <Animatable.View animation="fadeInUp" delay={500} style={styles.footer}>
                    <TouchableOpacity onPress={() => Alert.alert("Em breve", "A funcionalidade de recuperação de senha será implementada.")}>
                        <Text style={styles.footerText}>Esqueceu a senha?</Text>
                    </TouchableOpacity>
                </Animatable.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DARK_BG,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 30, // Aumenta o padding lateral
        paddingTop: Platform.OS === 'android' ? 50 : 0, // Garante que não cole no topo do Android
    },
    header: {
        alignItems: 'center',
        marginBottom: 50,
    },
    // Estilo da logo - Apenas para centralizar e dar margem, sem borda ou fundo
    logoContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30, // Um pouco mais de margem
    },
    // Estilo da imagem para que ela tenha um tamanho visível, já sem o container delimitador
    logoImage: {
        width: 100, // Tamanho ajustado para visibilidade
        height: 100, // Tamanho ajustado para visibilidade
    },
    title: {
        fontSize: 38, // Maior e mais impactante
        fontWeight: '900',
        color: TEXT_LIGHT,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: TEXT_MUTED,
        fontWeight: '500',
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: CARD_BG,
        borderRadius: 15, // Mais arredondado
        marginBottom: 16,
        borderWidth: 1,
        borderColor: CARD_BG,
        // Efeito de sombra leve para profundidade
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    // Estilo de foco (aplicado pelo estado)
    inputContainerFocused: {
        borderColor: PRIMARY_COLOR, // Borda amarela quando focado
        borderWidth: 2,
    },
    inputIcon: {
        paddingLeft: 16,
    },
    input: {
        flex: 1,
        color: TEXT_LIGHT,
        fontSize: 17,
        paddingHorizontal: 12,
        paddingVertical: 16, // Padding vertical maior
        fontWeight: '500',
    },
    eyeIcon: {
        paddingHorizontal: 16,
    },
    errorMsg: {
        color: ERROR_COLOR,
        marginBottom: 16, // Mais espaçamento
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '600',
    },
    button: {
        backgroundColor: PRIMARY_COLOR,
        paddingVertical: 18, // Mais alto
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        elevation: 6,
        shadowColor: PRIMARY_COLOR,
        shadowOpacity: 0.6,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
    },
    buttonText: {
        color: DARK_BG,
        fontSize: 19,
        fontWeight: '900', // Mais forte
    },
    footer: {
        alignItems: 'center',
        paddingBottom: 32,
        paddingTop: 16,
    },
    footerText: {
        color: TEXT_MUTED,
        fontSize: 14,
        fontWeight: 'bold',
        textDecorationLine: 'underline'
    },
});
