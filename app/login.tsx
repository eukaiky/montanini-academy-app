import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Animatable from 'react-native-animatable';
import { StatusBar } from 'expo-status-bar';

/**
 * Envia as credenciais de login para o servidor backend.
 * @param email O email do usuário.
 * @param senha A senha do usuário.
 */
async function loginUser(email: string, senha: string): Promise<any> { // Alterado para retornar os dados do usuário
    // Conexão com o servidor local (localhost)
    const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.mensagem || 'Erro ao fazer login');
    }

    return data; // Retorna os dados em caso de sucesso
}

export default function Login() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleLogin() {
        setErrorMsg('');

        if (!email || !senha) {
            setErrorMsg('Por favor, preencha o email e a senha.');
            return;
        }

        setLoading(true);
        try {
            const resultado = await loginUser(email.trim(), senha);
            setLoading(false);
            console.log('Login bem-sucedido:', resultado.usuario);
            // Navega para a página home após o login bem-sucedido
            router.replace('/home');
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
            <StatusBar style="light" backgroundColor="#121212" translucent={false} />

            <Animatable.View animation="fadeInDown" style={styles.header}>
                <Text style={styles.title}>Login</Text>
                <Text style={styles.subtitle}>Entre para continuar</Text>
            </Animatable.View>

            <Animatable.View animation="fadeInUp" delay={300} style={styles.form}>
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
                <TextInput
                    style={styles.input}
                    placeholder="Senha"
                    placeholderTextColor="#888"
                    secureTextEntry
                    value={senha}
                    onChangeText={setSenha}
                    editable={!loading}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin} // Permite logar com a tecla "Enter"
                />

                {errorMsg ? (
                    <Animatable.Text animation="fadeIn" style={styles.errorMsg}>
                        {errorMsg}
                    </Animatable.Text>
                ) : null}

                <TouchableOpacity
                    style={[styles.button, loading && { opacity: 0.6 }]}
                    onPress={handleLogin}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
                </TouchableOpacity>
            </Animatable.View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        padding: 20,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFD700',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 16,
        color: '#CCCCCC',
        fontStyle: 'italic',
    },
    form: {
        width: '100%',
    },
    input: {
        backgroundColor: '#1C1C1C',
        color: '#FFF',
        fontSize: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 16,
        fontWeight: '500',
    },
    button: {
        backgroundColor: '#FFD700',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
        elevation: 5,
        shadowColor: '#FFD700',
        shadowOpacity: 0.7,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
    },
    buttonText: {
        color: '#1C1C1C',
        fontSize: 18,
        fontWeight: '700',
    },
    errorMsg: {
        color: '#FF5555',
        marginBottom: 10,
        textAlign: 'center',
    },
});