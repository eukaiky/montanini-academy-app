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
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Animatable from 'react-native-animatable';
import { Feather } from '@expo/vector-icons';
import { useAuth } from './context/AuthContext';

/**
 * Envia as credenciais de login para o servidor backend real.
 */
async function loginUser(email: string, senha: string): Promise<any> {
    const apiUrl = 'http://192.168.3.10:3000/api/login';

    console.log(`Enviando para: ${apiUrl}`);
    console.log(`Dados: { email: "${email}", senha: "..." }`);

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.mensagem || 'Erro ao fazer login');
    }
    return data;
}

export default function Login() {
    const router = useRouter();
    const { signIn } = useAuth();

    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [secureText, setSecureText] = useState(true);

    async function handleLogin() {
        setErrorMsg('');

        if (!email || !senha) {
            setErrorMsg('Por favor, preencha o email e a senha.');
            return;
        }

        setLoading(true);
        try {
            const resultado = await loginUser(email.trim(), senha);

            // ALTERAÇÃO 1: Mapear 'id' do backend para 'uid' que o AuthContext espera.
            // Isso garante que o ID do usuário seja consistente em todo o aplicativo.
            const userDataForContext = {
                ...resultado.usuario,
                uid: resultado.usuario.id,
            };

            await signIn(userDataForContext);

            console.log('Login bem-sucedido, usuário salvo no contexto:', userDataForContext);
            // O redirecionamento é gerenciado pelo _layout, então não é necessário aqui.

        } catch (error: any) {
            setLoading(false);
            setErrorMsg(error.message);
            console.error('Falha no login:', error);
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.content}>
                <Animatable.View animation="fadeInDown" style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Feather name="lock" size={40} color="#FFD700" />
                    </View>
                    <Text style={styles.title}>Bem-vindo!</Text>
                    <Text style={styles.subtitle}>Faça login para continuar</Text>
                </Animatable.View>

                <Animatable.View animation="fadeInUp" delay={300} style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Feather name="mail" size={20} color="#888" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#888"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                            editable={!loading}
                            returnKeyType="next"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Feather name="key" size={20} color="#888" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Senha"
                            placeholderTextColor="#888"
                            secureTextEntry={secureText}
                            value={senha}
                            onChangeText={setSenha}
                            editable={!loading}
                            returnKeyType="done"
                            onSubmitEditing={handleLogin}
                        />
                        <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeIcon}>
                            <Feather name={secureText ? "eye-off" : "eye"} size={20} color="#888" />
                        </TouchableOpacity>
                    </View>

                    {errorMsg ? (
                        <Animatable.Text animation="shake" style={styles.errorMsg}>
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
                <TouchableOpacity onPress={() => console.log("Navegar para 'Esqueci a senha'")}>
                    <Text style={styles.footerText}>Esqueceu a senha?</Text>
                </TouchableOpacity>
            </Animatable.View>
        </KeyboardAvoidingView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d0d0d',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoContainer: {
        backgroundColor: '#1f1f1f',
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#FFD700'
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#A0A0A0',
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1C',
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    inputIcon: {
        paddingLeft: 16,
    },
    input: {
        flex: 1,
        color: '#FFF',
        fontSize: 16,
        paddingHorizontal: 12,
        paddingVertical: 14,
        fontWeight: '500',
    },
    eyeIcon: {
        paddingHorizontal: 16,
    },
    errorMsg: {
        color: '#FF6B6B',
        marginBottom: 12,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '500',
    },
    button: {
        backgroundColor: '#FFD700',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        elevation: 3,
        shadowColor: '#FFD700',
        shadowOpacity: 0.4,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
    },
    buttonText: {
        color: '#1C1C1C',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        alignItems: 'center',
        paddingBottom: 32,
        paddingTop: 16,
    },
    footerText: {
        color: '#A0A0A0',
        fontSize: 14,
        marginBottom: 8,
        fontWeight: 'bold',
        textDecorationLine: 'underline'
    },
});
