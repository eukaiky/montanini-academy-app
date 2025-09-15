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
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { createStyles, darkTheme, lightTheme, SCREEN_WIDTH } from './styles/theme';
import { useAuth } from './context/AuthContext';
import * as Animatable from 'react-native-animatable';

const SettingsScreen = ({ theme, setTheme, onSignOut }) => {
    const { user, token } = useAuth();
    const commonStyles = createStyles(theme);
    const componentStyles = createSettingsStyles(theme);

    const [isPasswordModalVisible, setPasswordModalVisible] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const isDarkMode = theme === darkTheme;

    const toggleTheme = () => {
        setTheme(isDarkMode ? 'light' : 'dark');
    };

    const openPasswordModal = () => {
        setErrorMsg('');
        setPasswordModalVisible(true);
    }

    const handlePasswordChange = async () => {
        setErrorMsg('');

        if (newPassword !== confirmPassword) {
            setErrorMsg("Os campos 'Nova Senha' e 'Confirmar' devem ser iguais.");
            return;
        }
        if (!currentPassword || !newPassword) {
            setErrorMsg("Por favor, preencha todos os campos.");
            return;
        }

        setIsLoading(true);
        try {
            // AQUI ESTÁ A CORREÇÃO: Adicionamos 'userId: user.uid' ao corpo do pedido.
            const response = await fetch(`http://192.168.3.10:3000/api/students/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId: user.uid, // <-- LINHA ADICIONADA
                    currentPassword,
                    newPassword
                }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Ocorreu um erro inesperado.');
            }

            Alert.alert("Sucesso!", result.message);
            setPasswordModalVisible(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

        } catch (error: any) {
            setErrorMsg(error.message);
        } finally {
            setIsLoading(false);
        }
    };

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
                        <Text style={componentStyles.modalTitle}>Alterar Senha</Text>
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
                        <Animatable.Text animation="shake" style={componentStyles.errorMsg}>
                            {errorMsg}
                        </Animatable.Text>
                    ) : null}

                    <TouchableOpacity style={componentStyles.modalButtonConfirm} onPress={handlePasswordChange} disabled={isLoading}>
                        {isLoading ? <ActivityIndicator color={theme.BACKGROUND_COLOR} /> : <Text style={componentStyles.modalButtonConfirmText}>Salvar Alterações</Text>}
                    </TouchableOpacity>
                </Animatable.View>
            </View>
        </Modal>
    );

    return (
        <ScrollView contentContainerStyle={commonStyles.pageContainer} showsVerticalScrollIndicator={false}>
            <Text style={commonStyles.pageTitle}>Configurações</Text>

            <Text style={componentStyles.settingsSectionTitle}>Conta</Text>
            <View style={commonStyles.card}>
                <View style={[componentStyles.settingItem, {borderTopWidth: 0}]}>
                    <FeatherIcon name="user" size={20} color={theme.TEXT_COLOR_SECONDARY} />
                    <Text style={componentStyles.settingLabel}>Nome</Text>
                    <Text style={componentStyles.settingValue}>{user?.name || 'N/A'}</Text>
                </View>
                <View style={componentStyles.settingItem}>
                    <FeatherIcon name="mail" size={20} color={theme.TEXT_COLOR_SECONDARY} />
                    <Text style={componentStyles.settingLabel}>Email</Text>
                    <Text style={componentStyles.settingValue}>{user?.email || 'N/A'}</Text>
                </View>
                <TouchableOpacity style={componentStyles.settingItem} onPress={openPasswordModal}>
                    <FeatherIcon name="lock" size={20} color={theme.TEXT_COLOR_SECONDARY} />
                    <Text style={componentStyles.settingLabel}>Alterar Senha</Text>
                    <FeatherIcon name="chevron-right" size={20} color={theme.TEXT_COLOR_SECONDARY} />
                </TouchableOpacity>
            </View>

            <Text style={componentStyles.settingsSectionTitle}>Aparência</Text>
            <View style={commonStyles.card}>
                <View style={[componentStyles.settingItem, {borderTopWidth: 0}]}>
                    <FeatherIcon name={isDarkMode ? "moon" : "sun"} size={20} color={theme.TEXT_COLOR_SECONDARY} />
                    <Text style={componentStyles.settingLabel}>Modo Escuro</Text>
                    <Switch
                        trackColor={{ false: "#767577", true: theme.PRIMARY_YELLOW }}
                        thumbColor={isDarkMode ? theme.PRIMARY_YELLOW : "#f4f3f4"}
                        onValueChange={toggleTheme}
                        value={isDarkMode}
                    />
                </View>
            </View>

            <TouchableOpacity style={componentStyles.logoutButton} onPress={onSignOut}>
                <FeatherIcon name="log-out" size={20} color={theme.LOGOUT_COLOR} />
                <Text style={componentStyles.logoutButtonText}>Sair da Conta</Text>
            </TouchableOpacity>

            {renderPasswordModal()}
        </ScrollView>
    );
};

const createSettingsStyles = (theme) => StyleSheet.create({
    settingsSectionTitle: {
        fontSize: SCREEN_WIDTH * 0.04,
        fontWeight: '600',
        color: theme.TEXT_COLOR_SECONDARY,
        textTransform: 'uppercase',
        marginBottom: 12,
        marginTop: 24,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: theme.BORDER_COLOR,
    },
    settingLabel: {
        fontSize: SCREEN_WIDTH * 0.045,
        color: theme.TEXT_COLOR_PRIMARY,
        marginLeft: 16,
        flex: 1,
    },
    settingValue: {
        fontSize: SCREEN_WIDTH * 0.04,
        color: theme.TEXT_COLOR_SECONDARY,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 16,
        marginTop: 32,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: `${theme.LOGOUT_COLOR}50`,
        backgroundColor: `${theme.LOGOUT_COLOR}20`,
        marginBottom: 40,
    },
    logoutButtonText: {
        color: theme.LOGOUT_COLOR,
        fontSize: SCREEN_WIDTH * 0.04,
        fontWeight: 'bold',
    },
    // --- Estilos do Modal ---
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
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
        backgroundColor: theme.BACKGROUND_COLOR,
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
    // Estilo da mensagem de erro
    errorMsg: {
        color: theme.LOGOUT_COLOR, // Cor de erro/logout
        marginBottom: 16,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '500',
    },
    modalButtonConfirm: {
        backgroundColor: theme.PRIMARY_YELLOW,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8, // Ajustado para dar espaço para a mensagem de erro
    },
    modalButtonConfirmText: {
        color: theme.BACKGROUND_COLOR === darkTheme.BACKGROUND_COLOR ? darkTheme.BACKGROUND_COLOR : lightTheme.TEXT_COLOR_PRIMARY,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default SettingsScreen;

