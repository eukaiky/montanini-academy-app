// Começo importando tudo que vou precisar do React e React Native
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Switch,
    Modal,
    TextInput,
    Alert,
    ActivityIndicator,
    Image,
    Platform,
} from 'react-native';
// Ícone da lib Feather Icons, pra dar um toque mais bonito
import FeatherIcon from 'react-native-vector-icons/Feather';
// Meus estilos e temas que criei separado
import { createStyles, darkTheme, lightTheme, SCREEN_WIDTH } from './styles/theme';
// Hook do meu contexto de autenticação pra pegar os dados do usuário
import { useAuth } from './context/AuthContext';
// Lib pra fazer umas animações legais e fluidas
import * as Animatable from 'react-native-animatable';
// Configuração do Axios pra chamar minha API
import api from '../config/apiConfig';
// Pra salvar coisinhas no storage do celular, como o tema preferido do usuário
import AsyncStorage from '@react-native-async-storage/async-storage';

// Defino o componente da tela de Configurações, recebendo as props necessárias
const SettingsScreen = ({ theme, setTheme, onSignOut }) => {
    // Puxo os dados do usuário e o token do meu AuthContext. Assim tenho acesso fácil a eles aqui.
    const { user, token } = useAuth();
    // Crio os estilos comuns e os específicos dessa tela, passando o tema atual
    const commonStyles = createStyles(theme);
    const componentStyles = createSettingsStyles(theme);

    // --- STATES ---
    // State pra controlar se o modal de alterar senha está visível ou não
    const [isPasswordModalVisible, setPasswordModalVisible] = useState(false);
    // States para os campos de senha no modal
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    // State pra mostrar o ActivityIndicator (loading) enquanto a senha está sendo alterada
    const [isLoading, setIsLoading] = useState(false);
    // State pra guardar e exibir qualquer mensagem de erro que acontecer
    const [errorMsg, setErrorMsg] = useState('');

    // Verificação rápida pra saber se o modo escuro está ativo
    const isDarkMode = theme === darkTheme;

    // Função pra trocar o tema (dark/light)
    const toggleTheme = async () => {
        // Defino qual vai ser o novo tema
        const newTheme = isDarkMode ? 'light' : 'dark';
        // Atualizo o state do tema no App.js através da prop setTheme
        setTheme(newTheme === 'dark' ? darkTheme : lightTheme);
        // Salvo a preferência do usuário no AsyncStorage pra ele não ter que escolher de novo quando abrir o app
        await AsyncStorage.setItem('theme', newTheme);
    };

    // Função pra abrir o modal de alterar senha
    const openPasswordModal = () => {
        // Limpo os campos e a mensagem de erro antes de abrir, pra garantir que o modal sempre comece "zerado"
        setErrorMsg('');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordModalVisible(true);
    }

    // Função que lida com a lógica de alteração de senha
    const handlePasswordChange = async () => {
        setErrorMsg(''); // Limpo erros antigos

        // Validações básicas antes de mandar pra API
        if (newPassword !== confirmPassword) {
            setErrorMsg("As novas senhas não coincidem. Tente novamente.");
            return; // Paro a execução aqui se as senhas não baterem
        }
        if (!currentPassword || !newPassword) {
            setErrorMsg("Por favor, preencha todos os campos.");
            return; // Paro se algum campo estiver vazio
        }

        setIsLoading(true); // Ativo o loading
        try {
            // Faço a chamada pra API usando o Axios
            await api.post('/api/students/change-password', {
                userId: user.uid, // Mando o ID do usuário logado
                currentPassword,
                newPassword,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Mando o token de autenticação no header
                }
            });

            // Se deu tudo certo, fecho o modal
            setPasswordModalVisible(false);
            // E mostro um alerta de sucesso pro usuário
            Alert.alert(
                "Sucesso!",
                "Sua senha foi alterada com sucesso."
            );

        } catch (error: any) {
            // Verificamos se o erro veio da resposta da API e se ele tem uma mensagem específica.
            if (error.response && error.response.data && error.response.data.message) {
                // Se a API retornou uma mensagem (ex: "Senha atual incorreta"), usamos ela.
                setErrorMsg(error.response.data.message);
            } else {
                // Caso seja um erro de rede ou outro problema, exibimos uma mensagem genérica.
                setErrorMsg('Ocorreu um erro ao tentar alterar a senha. Verifique sua conexão.');
            }
        } finally {
            // O finally sempre executa, independente de ter dado certo ou errado
            // Então é o lugar perfeito pra parar o loading
            setIsLoading(false);
        }
    };

    // Criei uma função separada só pra renderizar o modal, pra deixar o JSX principal mais limpo
    const renderPasswordModal = () => (
        <Modal
            animationType="fade" // Animação de fade in/out
            transparent={true} // Fundo transparente
            visible={isPasswordModalVisible} // Controlado pelo state
            onRequestClose={() => setPasswordModalVisible(false)} // Permite fechar com o botão de voltar no Android
        >
            {/* Overlay escuro por trás do modal */}
            <View style={componentStyles.modalOverlay}>
                {/* O conteúdo do modal em si, com uma animação de zoomIn */}
                <Animatable.View animation="zoomIn" duration={400} style={componentStyles.modalContainer}>
                    {/* Cabeçalho do modal com título e botão de fechar */}
                    <View style={componentStyles.modalHeader}>
                        <Text style={componentStyles.modalTitle}>Alterar Senha</Text>
                        <TouchableOpacity onPress={() => setPasswordModalVisible(false)} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                            <FeatherIcon name="x" size={24} color={theme.TEXT_COLOR_SECONDARY} />
                        </TouchableOpacity>
                    </View>

                    {/* Agrupo o ícone e o input pra facilitar a estilização */}
                    <View style={componentStyles.inputGroup}>
                        <FeatherIcon name="lock" size={20} color={theme.TEXT_COLOR_SECONDARY} style={componentStyles.inputIcon} />
                        <TextInput style={componentStyles.modalInput} placeholder="Senha Atual" placeholderTextColor={theme.TEXT_COLOR_SECONDARY} secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} />
                    </View>
                    <View style={componentStyles.inputGroup}>
                        <FeatherIcon name="key" size={20} color={theme.TEXT_COLOR_SECONDARY} style={componentStyles.inputIcon} />
                        <TextInput style={componentStyles.modalInput} placeholder="Nova Senha" placeholderTextColor={theme.TEXT_COLOR_SECONDARY} secureTextEntry value={newPassword} onChangeText={setNewPassword} />
                    </View>
                    <View style={componentStyles.inputGroup}>
                        <FeatherIcon name="key" size={20} color={theme.TEXT_COLOR_SECONDARY} style={componentStyles.inputIcon} />
                        <TextInput style={componentStyles.modalInput} placeholder="Confirmar Nova Senha" placeholderTextColor={theme.TEXT_COLOR_SECONDARY} secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
                    </View>

                    {/* Exibo a mensagem de erro somente se ela existir */}
                    {errorMsg ? (
                        <Animatable.View animation="shake" style={componentStyles.errorContainer}>
                            <FeatherIcon name="alert-circle" size={16} color={theme.ERROR_COLOR} />
                            <Text style={componentStyles.errorMsg}>{errorMsg}</Text>
                        </Animatable.View>
                    ) : null}

                    {/* Botão de confirmar, que mostra o loading se isLoading for true */}
                    <TouchableOpacity style={componentStyles.modalButtonConfirm} onPress={handlePasswordChange} disabled={isLoading}>
                        {isLoading ? <ActivityIndicator color={theme.BACKGROUND_COLOR} /> : <Text style={componentStyles.modalButtonConfirmText}>Salvar Alterações</Text>}
                    </TouchableOpacity>
                </Animatable.View>
            </View>
        </Modal>
    );

    // Componente auxiliar pra não repetir código e criar as linhas de opção (Nome, Email, etc)
    // Ele é reutilizável e deixa o JSX principal mais legível
    const OptionRow = ({ icon, label, value, onPress, children }) => (
        <TouchableOpacity onPress={onPress} style={componentStyles.settingItem} disabled={!onPress}>
            {/* Ícone à esquerda */}
            <View style={componentStyles.settingIconContainer}>
                <FeatherIcon name={icon} size={20} color={theme.TEXT_COLOR_SECONDARY} />
            </View>
            {/* Texto principal (label) */}
            <Text style={componentStyles.settingLabel}>{label}</Text>
            {/* Valor opcional, que aparece à direita */}
            {value && <Text style={componentStyles.settingValue}>{value}</Text>}
            {/* 'children' é usado pra passar componentes filhos, como o Switch do modo escuro ou a setinha */}
            {children}
        </TouchableOpacity>
    );

    // --- RENDERIZAÇÃO PRINCIPAL DO COMPONENTE ---
    return (
        <View style={{ flex: 1, backgroundColor: theme.BACKGROUND_COLOR }}>
            <ScrollView contentContainerStyle={commonStyles.pageContainer} showsVerticalScrollIndicator={false}>
                {/* Cabeçalho com a logo */}
                <View style={componentStyles.header}>
                    <Image
                        source={require('./montanini.png')}
                        style={componentStyles.logoImage}
                        resizeMode="contain"
                    />
                </View>
                {/* Título da página */}
                <Text style={componentStyles.pageTitle}>Configurações</Text>

                {/* Envolvo as seções com Animatable.View pra dar um efeito de "subir" quando a tela carrega */}
                <Animatable.View animation="fadeInUp" duration={500}>
                    {/* Seção de Conta */}
                    <Text style={componentStyles.settingsSectionTitle}>Conta</Text>
                    <View style={componentStyles.card}>
                        <OptionRow icon="user" label="Nome" value={user?.name || 'N/A'} />
                        <View style={componentStyles.divider} />
                        <OptionRow icon="mail" label="Email" value={user?.email || 'N/A'} />
                        <View style={componentStyles.divider} />
                        <OptionRow icon="lock" label="Alterar Senha" onPress={openPasswordModal}>
                            {/* Passo o ícone de seta como filho (children) do OptionRow */}
                            <FeatherIcon name="chevron-right" size={20} color={theme.TEXT_COLOR_SECONDARY} />
                        </OptionRow>
                    </View>

                    {/* Seção de Aparência */}
                    <Text style={componentStyles.settingsSectionTitle}>Aparência</Text>
                    <View style={componentStyles.card}>
                        <OptionRow icon={isDarkMode ? "moon" : "sun"} label="Modo Escuro">
                            {/* Passo o Switch como filho (children) do OptionRow */}
                            <Switch
                                trackColor={{ false: "#767577", true: theme.PRIMARY_YELLOW }}
                                thumbColor={isDarkMode ? theme.PRIMARY_YELLOW : "#f4f3f4"}
                                onValueChange={toggleTheme}
                                value={isDarkMode}
                            />
                        </OptionRow>
                    </View>

                    {/* Botão de Logout */}
                    <TouchableOpacity style={componentStyles.logoutButton} onPress={onSignOut}>
                        <FeatherIcon name="log-out" size={20} color={theme.LOGOUT_COLOR} />
                        <Text style={componentStyles.logoutButtonText}>Sair da Conta</Text>
                    </TouchableOpacity>
                </Animatable.View>

                {/* Chamo a função que renderiza o modal aqui. Ele só vai aparecer se isPasswordModalVisible for true */}
                {renderPasswordModal()}
            </ScrollView>
        </View>
    );
};

// Crio uma função separada para os estilos específicos desta tela.
// Ela recebe o tema (light ou dark) como parâmetro, então os estilos se adaptam automaticamente.
const createSettingsStyles = (theme) => StyleSheet.create({
    // Estilos do cabeçalho da página
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 24,
    },
    logoImage: {
        width: 40,
        height: 40,
        // O tintColor permite que eu mude a cor de uma imagem SVG
        tintColor: theme.PRIMARY_YELLOW,
    },
    pageTitle: {
        fontSize: SCREEN_WIDTH * 0.08, // Uso SCREEN_WIDTH pra deixar o tamanho da fonte responsivo
        fontWeight: '900',
        color: theme.TEXT_COLOR_PRIMARY,
        marginBottom: 24,
    },
    settingsSectionTitle: {
        fontSize: SCREEN_WIDTH * 0.04,
        fontWeight: '600',
        color: theme.TEXT_COLOR_SECONDARY,
        textTransform: 'uppercase',
        marginBottom: 12,
        marginTop: 16,
    },
    // Estilo base para os cards que agrupam as opções
    card: {
        backgroundColor: theme.CARD_COLOR,
        borderRadius: 16,
        // Sombra diferente pra iOS e Android
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, },
            android: { elevation: 3, },
        }),
    },
    // Estilo de cada linha de opção dentro do card
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    // A linha que separa as opções
    divider: {
        height: 1,
        backgroundColor: theme.BORDER_COLOR,
        marginLeft: 60, // Dou um marginLeft pra ela não começar do canto
    },
    settingIconContainer: {
        width: 30,
        height: 30,
        borderRadius: 8,
        backgroundColor: `${theme.PRIMARY_YELLOW}20`, // Pego a cor primária e adiciono transparência
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingLabel: {
        fontSize: SCREEN_WIDTH * 0.042,
        color: theme.TEXT_COLOR_PRIMARY,
        marginLeft: 16,
        flex: 1, // 'flex: 1' faz o label ocupar todo o espaço disponível, empurrando o 'value' ou 'children' pra direita
    },
    settingValue: {
        fontSize: SCREEN_WIDTH * 0.04,
        color: theme.TEXT_COLOR_SECONDARY,
        marginRight: 8,
    },
    // Estilo do botão de sair
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12, // Espaçamento entre o ícone e o texto
        padding: 16,
        marginTop: 32,
        borderRadius: 12,
        backgroundColor: `${theme.ERROR_COLOR}20`, // Cor de erro com transparência
        marginBottom: 40,
    },
    logoutButtonText: {
        color: theme.ERROR_COLOR,
        fontSize: SCREEN_WIDTH * 0.04,
        fontWeight: 'bold',
    },
    // --- Estilos do Modal ---
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)', // Fundo preto semi-transparente
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        backgroundColor: theme.CARD_COLOR,
        borderRadius: 20,
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: SCREEN_WIDTH * 0.055,
        fontWeight: 'bold',
        color: theme.TEXT_COLOR_PRIMARY,
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.BACKGROUND_COLOR, // Um pouco diferente do fundo do modal pra dar contraste
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: theme.BORDER_COLOR,
    },
    inputIcon: {
        paddingHorizontal: 16,
    },
    modalInput: {
        flex: 1,
        color: theme.TEXT_COLOR_PRIMARY,
        fontSize: 16,
        paddingVertical: 14,
        paddingRight: 16,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    errorMsg: {
        color: theme.ERROR_COLOR,
        fontSize: 14,
        fontWeight: '500',
        flex: 1, // Permite que a mensagem quebre a linha se for muito grande
    },
    modalButtonConfirm: {
        backgroundColor: theme.PRIMARY_YELLOW,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    modalButtonConfirmText: {
        // Lógica pra cor do texto do botão: se o fundo for escuro, o texto é escuro; senão, é a cor primária de texto do tema claro.
        // Fiz isso pra garantir o contraste no botão amarelo.
        color: theme.BACKGROUND_COLOR === darkTheme.BACKGROUND_COLOR ? theme.BACKGROUND_COLOR : lightTheme.TEXT_COLOR_PRIMARY,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

// Exporto o componente para poder usar em outras partes do app
export default SettingsScreen;