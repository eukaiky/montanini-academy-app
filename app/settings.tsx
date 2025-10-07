// Importa o básico do React e React Native
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
    // UIManager removido, pois não é usado aqui.
} from 'react-native';
// Ícones
import FeatherIcon from 'react-native-vector-icons/Feather';
// Estilos e Temas personalizados
import { createStyles, darkTheme, lightTheme, SCREEN_WIDTH } from './styles/theme';
// Contexto de autenticação
import { useAuth } from './context/AuthContext';
// Animações
import *as Animatable from 'react-native-animatable';
// Configuração da API
import api from '../config/apiConfig';
// Storage para persistir o tema
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define o componente da tela de Configurações
const Settings = ({ theme, setTheme, onSignOut }) => {
    // Pega dados do usuário
    const { user, token } = useAuth();
    const commonStyles = createStyles(theme);
    const componentStyles = createSettingsStyles(theme);

    // Variáveis de estado para o modal de senha
    const [isPasswordModalVisible, setPasswordModalVisible] = useState(false);
    // Campos do formulário de senha
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Checo se o tema escuro está ativo
    const isDarkMode = theme === darkTheme;

    // Função para alternar o tema (troca instantânea)
    const toggleTheme = async () => {
        const newTheme = isDarkMode ? 'light' : 'dark';

        // A troca é instantânea agora.
        setTheme(newTheme === 'dark' ? darkTheme : lightTheme);
        await AsyncStorage.setItem('theme', newTheme);
    };

    // Abre o modal de mudar senha e limpa os campos antes
    const openPasswordModal = () => {
        setErrorMsg('');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordModalVisible(true);
    }

    // Função que tenta trocar a senha chamando minha API
    const handlePasswordChange = async () => {
        setErrorMsg('');

        if (newPassword !== confirmPassword) {
            setErrorMsg("As novas senhas não batem. Checa aí.");
            return;
        }
        if (!currentPassword || !newPassword) {
            setErrorMsg("Preenche tudo, por favor.");
            return;
        }

        setIsLoading(true);
        try {
            await api.post('/api/students/change-password', {
                userId: user.uid,
                currentPassword,
                newPassword,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Mando o token para autenticar
                }
            });

            setPasswordModalVisible(false);
            Alert.alert("Sucesso!", "Sua senha foi alterada.");

        } catch (error: any) {
            if (error.response && error.response.data && error.response.data.message) {
                setErrorMsg(error.response.data.message);
            } else {
                setErrorMsg('Deu erro para alterar a senha. Vê se a internet tá boa.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Componente para renderizar o modal de alteração de senha
    const renderPasswordModal = () => (
        <Modal
            animationType="fade"
            transparent={true}
            visible={isPasswordModalVisible}
            onRequestClose={() => setPasswordModalVisible(false)}
        >
            <View style={componentStyles.modalOverlay}>
                <Animatable.View animation="zoomIn" duration={400} style={componentStyles.modalContainer}>
                    <View style={componentStyles.modalHeader}>
                        <Text style={componentStyles.modalTitle}>Mudar Senha</Text>
                        <TouchableOpacity onPress={() => setPasswordModalVisible(false)} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                            <FeatherIcon name="x" size={24} color={theme.TEXT_COLOR_SECONDARY} />
                        </TouchableOpacity>
                    </View>

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

                    {errorMsg ? (
                        <Animatable.View animation="shake" style={componentStyles.errorContainer}>
                            <FeatherIcon name="alert-circle" size={16} color={theme.ERROR_COLOR} />
                            <Text style={componentStyles.errorMsg}>{errorMsg}</Text>
                        </Animatable.View>
                    ) : null}

                    <TouchableOpacity style={componentStyles.modalButtonConfirm} onPress={handlePasswordChange} disabled={isLoading}>
                        {isLoading ? <ActivityIndicator color={theme.BACKGROUND_COLOR} /> : <Text style={componentStyles.modalButtonConfirmText}>Salvar Alterações</Text>}
                    </TouchableOpacity>
                </Animatable.View>
            </View>
        </Modal>
    );

    // Linha de opção reutilizável
    const OptionRow = ({ icon, label, value, onPress, children }) => (
        <TouchableOpacity onPress={onPress} style={componentStyles.settingItem} disabled={!onPress}>
            <View style={componentStyles.settingIconContainer}>
                <FeatherIcon name={icon} size={20} color={theme.PRIMARY_YELLOW} />
            </View>
            <Text style={componentStyles.settingLabel}>{label}</Text>
            {/* Ajuste para evitar que o email muito grande quebre o layout */}
            {value && <Text style={componentStyles.settingValue} numberOfLines={1}>{value}</Text>}
            {children || (!value && onPress && <FeatherIcon name="chevron-right" size={20} color={theme.TEXT_COLOR_SECONDARY} />)}
        </TouchableOpacity>
    );

    // --- RENDERIZAÇÃO PRINCIPAL ---
    return (
        <View style={[componentStyles.mainContainer, { backgroundColor: theme.BACKGROUND_COLOR }]}>
            <ScrollView contentContainerStyle={commonStyles.pageContainer} showsVerticalScrollIndicator={false}>

                {/* Logo no topo, separada do título */}
                <View style={componentStyles.logoHeader}>
                    <Image
                        source={require('./montanini.png')}
                        style={componentStyles.logoImage}
                        resizeMode="contain"
                    />
                </View>

                {/* Título principal alinhado ao centro para destaque */}
                <Text style={componentStyles.pageTitle}>Configurações</Text>

                <Animatable.View animation="fadeInUp" duration={500}>

                    {/* Conta */}
                    <Text style={componentStyles.settingsSectionTitle}>Conta</Text>
                    <View style={componentStyles.card}>
                        <OptionRow icon="user" label="Nome" value={user?.name || 'N/A'} />
                        <View style={componentStyles.divider} />
                        <OptionRow icon="mail" label="Email" value={user?.email || 'N/A'} />
                        <View style={componentStyles.divider} />
                        <OptionRow icon="lock" label="Alterar Senha" onPress={openPasswordModal} />
                    </View>

                    {/* Aparência */}
                    <Text style={componentStyles.settingsSectionTitle}>Aparência</Text>
                    <View style={componentStyles.card}>
                        <OptionRow icon={isDarkMode ? "moon" : "sun"} label={`Modo ${isDarkMode ? "Escuro" : "Claro"}`}>
                            <Switch
                                trackColor={{ false: theme.BORDER_COLOR, true: theme.PRIMARY_YELLOW }}
                                thumbColor={isDarkMode ? theme.PRIMARY_YELLOW : "#f4f3f4"}
                                onValueChange={toggleTheme}
                                value={isDarkMode}
                            />
                        </OptionRow>
                    </View>

                    {/* Sair da Conta */}
                    <TouchableOpacity style={componentStyles.logoutButton} onPress={onSignOut} activeOpacity={0.8}>
                        <FeatherIcon name="log-out" size={20} color={theme.ERROR_COLOR} />
                        <Text style={componentStyles.logoutButtonText}>Sair da Conta</Text>
                    </TouchableOpacity>
                </Animatable.View>

                {renderPasswordModal()}
            </ScrollView>
        </View>
    );
};

// --- ESTILOS ---
const createSettingsStyles = (theme) => StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
    logoHeader: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 10,
    },
    logoImage: {
        width: 40,
        height: 40,
        tintColor: theme.PRIMARY_YELLOW,
    },
    pageTitle: {
        fontSize: SCREEN_WIDTH * 0.07,
        fontWeight: '900', // Mais destaque
        color: theme.TEXT_COLOR_PRIMARY,
        marginBottom: 25,
        marginTop: 10,
        textAlign: 'center',
    },
    settingsSectionTitle: {
        fontSize: SCREEN_WIDTH * 0.04,
        fontWeight: 'bold',
        color: theme.TEXT_COLOR_SECONDARY,
        textTransform: 'uppercase',
        marginBottom: 8,
        marginTop: 20,
        marginLeft: 4,
    },
    card: {
        backgroundColor: theme.CARD_COLOR,
        borderRadius: 16,
        overflow: 'hidden',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, },
            android: { elevation: 5, },
        }),
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    divider: {
        height: 1,
        backgroundColor: theme.BORDER_COLOR,
        marginLeft: 60,
        marginRight: 0,
    },
    settingIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    settingLabel: {
        fontSize: SCREEN_WIDTH * 0.042,
        color: theme.TEXT_COLOR_PRIMARY,
        marginLeft: 16,
        fontWeight: '500',
        flex: 1, // Permite que o label ocupe espaço
    },
    settingValue: {
        // AJUSTE PARA EMAILS GRANDES: Largura máxima e texto sem quebra de linha
        maxWidth: SCREEN_WIDTH * 0.35,
        fontSize: SCREEN_WIDTH * 0.038, // Fonte ligeiramente menor para economizar espaço
        color: theme.TEXT_COLOR_SECONDARY,
        marginRight: 8,
        textAlign: 'right', // Garante que o texto se alinhe à direita
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 16,
        marginTop: 30,
        borderRadius: 16,
        backgroundColor: `${theme.ERROR_COLOR}15`,
        marginBottom: 40,
    },
    logoutButtonText: {
        color: theme.ERROR_COLOR,
        fontSize: SCREEN_WIDTH * 0.042,
        fontWeight: '700',
    },
    // --- Estilos do Modal ---
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        backgroundColor: theme.CARD_COLOR,
        borderRadius: 24,
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
        backgroundColor: theme.BACKGROUND_COLOR,
        borderRadius: 12,
        marginBottom: 12,
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
        flex: 1,
    },
    modalButtonConfirm: {
        backgroundColor: theme.PRIMARY_YELLOW,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 15,
        ...Platform.select({
            ios: { shadowColor: theme.PRIMARY_YELLOW, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 5 },
            android: { elevation: 6 },
        }),
    },
    modalButtonConfirmText: {
        color: theme.BACKGROUND_COLOR === darkTheme.BACKGROUND_COLOR ? theme.BACKGROUND_COLOR : lightTheme.TEXT_COLOR_PRIMARY,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

// Exporta o componente com o nome Settings
export default Settings;