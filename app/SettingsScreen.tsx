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
import FeatherIcon from 'react-native-vector-icons/Feather';
import { createStyles, darkTheme, lightTheme, SCREEN_WIDTH } from './styles/theme';
import { useAuth } from './context/AuthContext';
import * as Animatable from 'react-native-animatable';
import api from '../config/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

    const toggleTheme = async () => {
        const newTheme = isDarkMode ? 'light' : 'dark';
        setTheme(newTheme === 'dark' ? darkTheme : lightTheme);
        await AsyncStorage.setItem('theme', newTheme);
    };

    const openPasswordModal = () => {
        setErrorMsg('');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordModalVisible(true);
    }

    const handlePasswordChange = async () => {
        setErrorMsg('');

        if (newPassword !== confirmPassword) {
            setErrorMsg("As senhas não coincidem. Tente novamente.");
            return;
        }
        if (!currentPassword || !newPassword) {
            setErrorMsg("Por favor, preencha todos os campos.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.post('/api/students/change-password', {
                userId: user.uid,
                currentPassword,
                newPassword,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                }
            });

            const result = response.data;
            if (response.status !== 200) {
                throw new Error(result.message || 'Ocorreu um erro inesperado.');
            }

            setPasswordModalVisible(false);
            Alert.alert(
                "Sucesso!",
                "Sua senha foi alterada com sucesso."
            );

        } catch (error: any) {
            setErrorMsg(error.message || 'Ocorreu um erro ao tentar alterar a senha.');
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

    const OptionRow = ({ icon, label, value, onPress, children }) => (
        <TouchableOpacity onPress={onPress} style={componentStyles.settingItem} disabled={!onPress}>
            <View style={componentStyles.settingIconContainer}>
                <FeatherIcon name={icon} size={20} color={theme.TEXT_COLOR_SECONDARY} />
            </View>
            <Text style={componentStyles.settingLabel}>{label}</Text>
            {value && <Text style={componentStyles.settingValue}>{value}</Text>}
            {children}
        </TouchableOpacity>
    );

    return (
        <View style={{ flex: 1, backgroundColor: theme.BACKGROUND_COLOR }}>
            <ScrollView contentContainerStyle={commonStyles.pageContainer} showsVerticalScrollIndicator={false}>
                <View style={componentStyles.header}>
                    <Image
                        source={require('./montanini.svg')}
                        style={componentStyles.logoImage}
                        resizeMode="contain"
                    />
                </View>
                <Text style={componentStyles.pageTitle}>Configurações</Text>

                <Animatable.View animation="fadeInUp" duration={500}>
                    <Text style={componentStyles.settingsSectionTitle}>Conta</Text>
                    <View style={componentStyles.card}>
                        <OptionRow icon="user" label="Nome" value={user?.name || 'N/A'} />
                        <View style={componentStyles.divider} />
                        <OptionRow icon="mail" label="Email" value={user?.email || 'N/A'} />
                        <View style={componentStyles.divider} />
                        <OptionRow icon="lock" label="Alterar Senha" onPress={openPasswordModal}>
                            <FeatherIcon name="chevron-right" size={20} color={theme.TEXT_COLOR_SECONDARY} />
                        </OptionRow>
                    </View>

                    <Text style={componentStyles.settingsSectionTitle}>Aparência</Text>
                    <View style={componentStyles.card}>
                        <OptionRow icon={isDarkMode ? "moon" : "sun"} label="Modo Escuro">
                            <Switch
                                trackColor={{ false: "#767577", true: theme.PRIMARY_YELLOW }}
                                thumbColor={isDarkMode ? theme.PRIMARY_YELLOW : "#f4f3f4"}
                                onValueChange={toggleTheme}
                                value={isDarkMode}
                            />
                        </OptionRow>
                    </View>

                    <TouchableOpacity style={componentStyles.logoutButton} onPress={onSignOut}>
                        <FeatherIcon name="log-out" size={20} color={theme.LOGOUT_COLOR} />
                        <Text style={componentStyles.logoutButtonText}>Sair da Conta</Text>
                    </TouchableOpacity>
                </Animatable.View>

                {renderPasswordModal()}
            </ScrollView>
        </View>
    );
};

const createSettingsStyles = (theme) => StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 24,
    },
    logoImage: {
        width: 40,
        height: 40,
        tintColor: theme.PRIMARY_YELLOW,
    },
    pageTitle: {
        fontSize: SCREEN_WIDTH * 0.08,
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
    card: {
        backgroundColor: theme.CARD_COLOR,
        borderRadius: 16,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, },
            android: { elevation: 3, },
        }),
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    divider: {
        height: 1,
        backgroundColor: theme.BORDER_COLOR,
        marginLeft: 60,
    },
    settingIconContainer: {
        width: 30,
        height: 30,
        borderRadius: 8,
        backgroundColor: `${theme.PRIMARY_YELLOW}20`,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingLabel: {
        fontSize: SCREEN_WIDTH * 0.042,
        color: theme.TEXT_COLOR_PRIMARY,
        marginLeft: 16,
        flex: 1,
    },
    settingValue: {
        fontSize: SCREEN_WIDTH * 0.04,
        color: theme.TEXT_COLOR_SECONDARY,
        marginRight: 8,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 16,
        marginTop: 32,
        borderRadius: 12,
        backgroundColor: `${theme.ERROR_COLOR}20`,
        marginBottom: 40,
    },
    logoutButtonText: {
        color: theme.ERROR_COLOR,
        fontSize: SCREEN_WIDTH * 0.04,
        fontWeight: 'bold',
    },
    // Modal Styles
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
        marginTop: 8,
    },
    modalButtonConfirmText: {
        color: theme.BACKGROUND_COLOR === darkTheme.BACKGROUND_COLOR ? theme.BACKGROUND_COLOR : lightTheme.TEXT_COLOR_PRIMARY,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default SettingsScreen;

