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
    Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Animatable from 'react-native-animatable';
import { Feather } from '@expo/vector-icons';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Dependências da aplicação
import { useAuth } from './context/AuthContext';
import api from '../config/apiConfig';
// Importo meus temas e o tamanho da tela
import { lightTheme, darkTheme, SCREEN_WIDTH } from './styles/theme';

/**
 * Minha função de rede para autenticar o usuário, isolada.
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
            throw new Error('Não consegui conectar ao servidor. Checa a sua internet.');
        } else {
            throw new Error('Deu um erro inesperado ao tentar fazer login.');
        }
    }
}

export default function Login() {
    const router = useRouter();
    // Pego o método de login do meu contexto de autenticação
    const { signIn } = useAuth();

    // Estado do Tema (Começa com Dark, mas carrega o salvo do usuário)
    const [theme, setTheme] = useState(darkTheme);

    // Variáveis de estado que controlam o que o usuário digita
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    // Variáveis de estado para a UI
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false); // Para mostrar a bolinha de loading
    const [secureText, setSecureText] = useState(true); // Para esconder/mostrar a senha
    const [emailFocused, setEmailFocused] = useState(false); // Para mudar a borda do input
    const [senhaFocused, setSenhaFocused] = useState(false); // Para mudar a borda do input

    // Estado para mostrar o modal de recuperação de senha
    const [isRecoveryModalVisible, setRecoveryModalVisible] = useState(false);

    // Efeito que roda uma vez só para carregar o tema que o usuário salvou no AsyncStorage
    useEffect(() => {
        const loadTheme = async () => {
            const savedTheme = await AsyncStorage.getItem('theme');
            setTheme(savedTheme === 'light' ? lightTheme : darkTheme);
        };
        loadTheme();
    }, []);

    // Gero os estilos baseado no tema que foi carregado
    const styles = createLoginStyles(theme);

    // Função principal de login
    async function handleLogin() {
        setErrorMsg(''); // Limpo os erros antigos
        if (!email || !senha) {
            setErrorMsg('Por favor, preencha o email e a senha.');
            return;
        }

        setLoading(true);
        try {
            // Chamo a função de rede para tentar logar
            const resultado = await loginUser(email.trim(), senha);
            // Se der certo, salvo as credenciais no contexto
            if (resultado.usuario && resultado.token) {
                await signIn(resultado.usuario, resultado.token);
            } else {
                throw new Error("Resposta inválida do servidor.");
            }
        } catch (error) {
            // Se der errado, mostro o erro na tela
            setErrorMsg(error.message);
        } finally {
            // Desligo o loading no final, independente do resultado
            setLoading(false);
        }
    }

    // Componente: Modal de Recuperação de Senha (O "Quadrado Top" elegante)
    const renderRecoveryModal = () => (
        <Modal
            animationType="fade"
            transparent={true}
            visible={isRecoveryModalVisible}
            onRequestClose={() => setRecoveryModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <Animatable.View animation="bounceIn" duration={400} style={styles.recoveryModalContainer}>
                    <View style={styles.modalHeader}>
                        <MaterialCommunityIcon name="shield-lock-outline" size={30} color={theme.PRIMARY_YELLOW} />
                        <Text style={styles.modalTitle}>Recuperação de Acesso</Text>
                    </View>

                    <Text style={styles.modalMessage}>
                        Para recuperar sua senha, contate a administração da Montanini Academy. Este processo é obrigatório para garantir a segurança de seus dados.
                    </Text>

                    <TouchableOpacity
                        style={styles.modalButtonClose}
                        onPress={() => setRecoveryModalVisible(false)}
                    >
                        <Text style={styles.modalButtonCloseText}>Compreendo</Text>
                    </TouchableOpacity>
                </Animatable.View>
            </View>
        </Modal>
    );


    // Função para aplicar o estilo de foco (borda amarela) no input
    const inputStyle = (isFocused) => [
        styles.inputContainer,
        isFocused ? styles.inputContainerFocused : null,
    ];

    return (
        <View style={styles.container}>
            {/* KeyboardAvoidingView para garantir que o teclado não cubra o input */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollViewContent} keyboardShouldPersistTaps="handled">
                    <View style={styles.content}>
                        {/* Seção de cabeçalho com animação */}
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

                        {/* Formulário com animação */}
                        <Animatable.View animation="fadeInUp" delay={200} duration={800} style={styles.form}>

                            {/* Input de Email */}
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
                                    onFocus={() => setEmailFocused(true)} // Ativa o foco
                                    onBlur={() => setEmailFocused(false)} // Desativa o foco
                                />
                            </View>

                            {/* Input de Senha */}
                            <View style={inputStyle(senhaFocused)}>
                                <Feather name="key" size={20} color={senhaFocused ? theme.PRIMARY_YELLOW : theme.TEXT_COLOR_SECONDARY} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Senha"
                                    placeholderTextColor={theme.TEXT_COLOR_SECONDARY}
                                    secureTextEntry={secureText} // Controla se esconde ou não a senha
                                    value={senha}
                                    onChangeText={setSenha}
                                    editable={!loading}
                                    returnKeyType="done"
                                    onSubmitEditing={handleLogin}
                                    onFocus={() => setSenhaFocused(true)}
                                    onBlur={() => setSenhaFocused(false)}
                                />
                                {/* Botão para mostrar/esconder a senha */}
                                <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeIcon}>
                                    <Feather name={secureText ? "eye-off" : "eye"} size={20} color={theme.TEXT_COLOR_SECONDARY} />
                                </TouchableOpacity>
                            </View>

                            {/* Mensagem de Erro (aparece com animação de tremer) */}
                            {errorMsg ? (
                                <Animatable.Text animation="shake" duration={500} style={styles.errorMsg}>
                                    {errorMsg}
                                </Animatable.Text>
                            ) : null}

                            {/* Botão de Entrar */}
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

                    {/* Footer com link para recuperação de senha */}
                    <Animatable.View animation="fadeInUp" delay={400} duration={800} style={styles.footer}>
                        {/* Abre o modal ao clicar */}
                        <TouchableOpacity onPress={() => setRecoveryModalVisible(true)}>
                            <Text style={styles.footerText}>Esqueceu a senha?</Text>
                        </TouchableOpacity>
                    </Animatable.View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Renderiza o modal fora do ScrollView para ficar por cima de tudo */}
            {renderRecoveryModal()}
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
        width: 90,
        height: 90,
        tintColor: theme.PRIMARY_YELLOW,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: theme.TEXT_COLOR_PRIMARY,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 16,
        color: theme.TEXT_COLOR_SECONDARY,
        letterSpacing: 0.5,
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
        borderColor: theme.CARD_COLOR, // Começa com a borda sutil
    },
    inputContainerFocused: {
        borderColor: theme.PRIMARY_YELLOW, // Borda amarela quando o usuário clica
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
        // Sombra forte para o botão principal
        shadowColor: theme.PRIMARY_YELLOW,
        shadowOpacity: 0.6,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 15,
        elevation: 12,
    },
    buttonText: {
        // Garante contraste: texto escuro no botão amarelo
        color: theme.BACKGROUND_COLOR,
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
        textDecorationLine: 'underline', // Destaca que é um link
    },

    // ESTILOS DO MODAL DE RECUPERAÇÃO DE SENHA
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    recoveryModalContainer: {
        width: '100%',
        maxWidth: 350,
        backgroundColor: theme.CARD_COLOR,
        borderRadius: 20,
        padding: 25,
        alignItems: 'center',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10 },
            android: { elevation: 15 },
        }),
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.TEXT_COLOR_PRIMARY,
        marginLeft: 10,
    },
    modalMessage: {
        fontSize: 16,
        color: theme.TEXT_COLOR_PRIMARY,
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 24,
    },
    modalButtonClose: {
        backgroundColor: theme.PRIMARY_YELLOW,
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
    },
    modalButtonCloseText: {
        color: theme.BACKGROUND_COLOR,
        fontSize: 16,
        fontWeight: 'bold',
    },
});