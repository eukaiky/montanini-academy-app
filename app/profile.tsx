import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
    Alert,
    ActivityIndicator,
    Platform
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import * as ImagePicker from 'expo-image-picker';
import * as Animatable from 'react-native-animatable';
import { createStyles, SCREEN_WIDTH } from './styles/theme';
import { useAuth } from './context/AuthContext';
import api from '../config/apiConfig';

/**
 * Compara o usuário local com o do servidor para evitar atualizações desnecessárias.
 * Ignora a ordem das chaves e normaliza os valores para uma comparação mais robusta.
 */
const areUsersEqual = (user1, user2) => {
    if (!user1 || !user2) return false;
    const keysToCompare = ['uid', 'name', 'email', 'avatar', 'height', 'weight', 'bodyFat'];

    for (const key of keysToCompare) {
        const val1 = String(user1[key] ?? '').trim();
        const val2 = String(user2[key] ?? '').trim();
        if (val1 !== val2) {
            // Log para debug em caso de divergência
            // console.log(`Diferença detectada na chave: ${key}. Local: "${val1}", Servidor: "${val2}"`);
            return false;
        }
    }
    return true;
};

const Profile = ({ theme }) => {
    // Hooks de contexto e estilos
    const { user, token, updateUser } = useAuth();
    const commonStyles = createStyles(theme);
    const componentStyles = createProfileStyles(theme);

    // Estados de controle da UI
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Estados dos campos do formulário
    const [name, setName] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [newAvatarFile, setNewAvatarFile] = useState(null);
    const [validationErrors, setValidationErrors] = useState({ name: '', height: '', weight: '' });

    // Sincroniza os dados do perfil com o servidor ao carregar o componente.
    const fetchProfileData = useCallback(async () => {
        if (!token) return;
        try {
            const response = await api.get('/api/students/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const serverUser = response.data.usuario;
            // Atualiza o contexto local apenas se houver diferenças
            if (!areUsersEqual(user, serverUser)) {
                await updateUser(serverUser);
            }
        } catch (error) {
            console.error('Falha ao buscar perfil para sincronização:', error);
        }
    }, [token, user, updateUser]);

    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]);

    // Popula o formulário com os dados do usuário do contexto.
    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setHeight(user.height?.toString() || '');
            setWeight(user.weight?.toString() || '');
        }
        // Reseta estados de edição ao receber novos dados
        setValidationErrors({ name: '', height: '', weight: '' });
        setNewAvatarFile(null);
    }, [user]);

    // Verifica se existem alterações no formulário para habilitar o botão de salvar.
    const hasChanges = useMemo(() => {
        const initialName = user?.name || '';
        const initialHeight = user?.height?.toString() || '';
        const initialWeight = user?.weight?.toString() || '';
        const currentWeight = weight.trim().replace(',', '.');
        const initialWeightNormalized = initialWeight.trim().replace(',', '.');

        return (
            name.trim() !== initialName.trim() ||
            height.trim() !== initialHeight.trim() ||
            currentWeight !== initialWeightNormalized ||
            newAvatarFile !== null
        );
    }, [name, height, weight, newAvatarFile, user]);

    // Abre a galeria para seleção de um novo avatar.
    const handlePickAvatar = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permissão necessária', 'Precisamos da sua permissão para aceder à galeria.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setNewAvatarFile(result.assets[0]);
        }
    };

    // Validação dos campos do formulário antes do envio.
    const validateForm = () => {
        let isValid = true;
        let errors = { name: '', height: '', weight: '' };
        if (!name.trim()) {
            errors.name = 'O nome completo é obrigatório.';
            isValid = false;
        }
        const numHeight = Number(height.trim());
        if (!height.trim() || isNaN(numHeight) || numHeight <= 0) {
            errors.height = 'A altura é obrigatória e deve ser um valor válido.';
            isValid = false;
        }
        const numWeight = Number(weight.trim().replace(',', '.'));
        if (!weight.trim() || isNaN(numWeight) || numWeight <= 0) {
            errors.weight = 'O peso é obrigatório e deve ser um valor válido.';
            isValid = false;
        }
        setValidationErrors(errors);
        return isValid;
    };

    // Envia as alterações para a API.
    const handleSaveChanges = async () => {
        if (!validateForm() || !hasChanges) {
            if (!hasChanges) setIsEditing(false);
            return;
        }
        setIsLoading(true);

        const formData = new FormData();
        formData.append('name', name.trim());
        formData.append('height', String(Number(height.trim())));
        formData.append('weight', String(Number(weight.trim().replace(',', '.'))));

        if (newAvatarFile) {
            // Tratamento de upload de imagem para Web e Nativo.
            if (Platform.OS === 'web') {
                const response = await fetch(newAvatarFile.uri);
                const blob = await response.blob();
                const uriParts = newAvatarFile.uri.split('.');
                const fileType = uriParts[uriParts.length - 1];
                const fileName = `photo.${fileType}`;
                formData.append('avatar', blob, fileName);
            } else {
                const uriParts = newAvatarFile.uri.split('.');
                const fileType = uriParts[uriParts.length - 1];
                const fileToUpload = {
                    uri: newAvatarFile.uri,
                    name: `photo.${fileType}`,
                    type: newAvatarFile.mimeType || `image/${fileType}`,
                };
                formData.append('avatar', fileToUpload as any);
            }
        }

        try {
            const response = await api.post('/api/students/profile', formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            await updateUser(response.data.usuario);
            setIsEditing(false);
            Alert.alert('Sucesso!', 'O seu perfil foi atualizado.');
        } catch (error: any) {
            let errorMessage = 'Ocorreu um erro desconhecido ao tentar salvar.';
            if (error.response) errorMessage = error.response.data.message || 'Erro do servidor.';
            else if (error.request) errorMessage = 'Não foi possível conectar ao servidor.';
            else errorMessage = error.message;
            Alert.alert('Erro ao Salvar', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Ações dos botões
    const handleEdit = () => setIsEditing(true);

    const handleCancel = () => {
        if (user) {
            setName(user.name || '');
            setHeight(user.height?.toString() || '');
            setWeight(user.weight?.toString() || '');
        }
        setNewAvatarFile(null);
        setValidationErrors({ name: '', height: '', weight: '' });
        setIsEditing(false);
    };

    // Gera as iniciais do usuário para o avatar placeholder.
    const getInitials = (nameStr) => {
        if (!nameStr) return '?';
        const words = nameStr.split(' ').filter(Boolean);
        if (words.length > 1) return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
        if (words.length === 1 && words[0].length > 0) return words[0][0].toUpperCase();
        return '?';
    };

    // Componentes de renderização
    const renderAvatar = () => {
        const imageSource = newAvatarFile ? { uri: newAvatarFile.uri } : (user?.avatar ? { uri: user.avatar } : null);
        if (imageSource) {
            return <Image source={imageSource} style={componentStyles.avatar} />;
        }
        return (
            <View style={componentStyles.avatarPlaceholder}>
                <Text style={componentStyles.avatarPlaceholderText}>{getInitials(user?.name)}</Text>
            </View>
        );
    };

    const MetricCard = ({ label, value, unit = '', iconName }) => {
        const displayValue = value !== undefined && value !== null
            ? (Number.isInteger(Number(value)) ? String(value) : Number(value).toFixed(1))
            : 'N/A';
        return (
            <View style={componentStyles.metricCard}>
                <FeatherIcon name={iconName} size={20} color={theme.PRIMARY_YELLOW} />
                <Text style={componentStyles.metricValue}>{displayValue}{unit}</Text>
                <Text style={componentStyles.metricLabel}>{label}</Text>
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.BACKGROUND_COLOR }}>
            <ScrollView contentContainerStyle={commonStyles.pageContainer} keyboardShouldPersistTaps="handled">
                {/* Cabeçalho */}
                <View style={componentStyles.header}>
                    <Image
                        source={require('./montanini.png')}
                        style={componentStyles.logoImage}
                        resizeMode="contain"
                    />
                    {!isEditing && (
                        <TouchableOpacity style={componentStyles.editButton} onPress={handleEdit}>
                            <FeatherIcon name="edit-2" size={20} color={theme.TEXT_COLOR_PRIMARY} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Informações do Perfil */}
                <Animatable.View animation="fadeInUp" duration={600} style={componentStyles.profileHeader}>
                    <View style={componentStyles.avatarWrapper}>
                        {renderAvatar()}
                        {isEditing && (
                            <TouchableOpacity style={componentStyles.cameraEditButton} onPress={handlePickAvatar}>
                                <FeatherIcon name="camera" size={18} color={theme.BACKGROUND_COLOR} />
                            </TouchableOpacity>
                        )}
                    </View>
                    {!isEditing && (
                        <View style={componentStyles.profileInfo}>
                            <Text style={componentStyles.profileName}>{user?.name || 'Carregando...'}</Text>
                            <Text style={componentStyles.profileEmail}>{user?.email}</Text>
                        </View>
                    )}
                </Animatable.View>

                {/* Alterna entre o modo de edição e visualização */}
                {isEditing ? (
                    // Formulário de Edição
                    <Animatable.View animation="fadeIn" duration={400} style={componentStyles.editingContainer}>
                        <View style={componentStyles.inputGroup}>
                            <Text style={componentStyles.label}>Nome Completo</Text>
                            <TextInput
                                style={[componentStyles.input, validationErrors.name ? componentStyles.inputError : null]}
                                value={name} onChangeText={setName}
                            />
                            {validationErrors.name && <Text style={componentStyles.errorText}>{validationErrors.name}</Text>}
                        </View>
                        <View style={componentStyles.inputGroup}>
                            <Text style={componentStyles.label}>Altura (cm)</Text>
                            <TextInput
                                style={[componentStyles.input, validationErrors.height ? componentStyles.inputError : null]}
                                value={height} onChangeText={(t) => setHeight(t.replace(/[^0-9.]/g, ''))}
                                keyboardType="numeric"
                            />
                            {validationErrors.height && <Text style={componentStyles.errorText}>{validationErrors.height}</Text>}
                        </View>
                        <View style={componentStyles.inputGroup}>
                            <Text style={componentStyles.label}>Peso (kg)</Text>
                            <TextInput
                                style={[componentStyles.input, validationErrors.weight ? componentStyles.inputError : null]}
                                value={weight} onChangeText={(t) => setWeight(t.replace(/[^0-9,.]/g, ''))}
                                keyboardType="decimal-pad"
                            />
                            {validationErrors.weight && <Text style={componentStyles.errorText}>{validationErrors.weight}</Text>}
                        </View>
                    </Animatable.View>
                ) : (
                    // Visualização das Métricas
                    <Animatable.View animation="fadeIn" duration={400}>
                        <Text style={componentStyles.sectionTitle}>Métricas</Text>
                        <View style={componentStyles.metricsGrid}>
                            <MetricCard label="Altura" value={user?.height} unit=" cm" iconName="chevrons-up" />
                            <MetricCard label="Peso" value={user?.weight} unit=" kg" iconName="bar-chart-2" />
                            <MetricCard label="Gordura Corporal" value={user?.bodyFat} unit="%" iconName="target" />
                        </View>
                    </Animatable.View>
                )}

                {/* Botões de Ação no modo de edição */}
                {isEditing && (
                    <Animatable.View animation="fadeInUp" delay={200} style={componentStyles.buttonContainer}>
                        <TouchableOpacity style={componentStyles.cancelButton} onPress={handleCancel} disabled={isLoading}>
                            <Text style={componentStyles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[componentStyles.saveButton, (!hasChanges || isLoading) && componentStyles.buttonDisabled]}
                            onPress={handleSaveChanges} disabled={isLoading || !hasChanges}
                        >
                            {isLoading
                                ? <ActivityIndicator color={theme.BACKGROUND_COLOR} />
                                : <Text style={componentStyles.saveButtonText}>Salvar</Text>
                            }
                        </TouchableOpacity>
                    </Animatable.View>
                )}
            </ScrollView>
        </View>
    );
};

// Estilos específicos do componente
const createProfileStyles = (theme) => StyleSheet.create({
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
    editButton: {
        backgroundColor: `${theme.PRIMARY_YELLOW}20`,
        padding: 10,
        borderRadius: 20,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarWrapper: {
        position: 'relative',
        width: SCREEN_WIDTH * 0.3,
        height: SCREEN_WIDTH * 0.3,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: (SCREEN_WIDTH * 0.3) / 2,
        borderWidth: 4,
        borderColor: theme.PRIMARY_YELLOW,
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: (SCREEN_WIDTH * 0.3) / 2,
        borderWidth: 4,
        borderColor: theme.PRIMARY_YELLOW,
        backgroundColor: theme.CARD_COLOR,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarPlaceholderText: {
        color: theme.PRIMARY_YELLOW,
        fontSize: SCREEN_WIDTH * 0.12,
        fontWeight: 'bold',
    },
    cameraEditButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: theme.PRIMARY_YELLOW,
        padding: 8,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: theme.BACKGROUND_COLOR,
    },
    profileInfo: {
        alignItems: 'center',
        marginTop: 16,
    },
    profileName: {
        fontSize: SCREEN_WIDTH * 0.065,
        fontWeight: 'bold',
        color: theme.TEXT_COLOR_PRIMARY,
    },
    profileEmail: {
        fontSize: SCREEN_WIDTH * 0.04,
        color: theme.TEXT_COLOR_SECONDARY,
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: SCREEN_WIDTH * 0.045,
        fontWeight: '600',
        color: theme.TEXT_COLOR_SECONDARY,
        marginBottom: 16,
    },
    editingContainer: {
        backgroundColor: theme.CARD_COLOR,
        borderRadius: 16,
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        color: theme.TEXT_COLOR_SECONDARY,
        fontSize: SCREEN_WIDTH * 0.038,
        marginBottom: 8,
    },
    input: {
        backgroundColor: theme.BACKGROUND_COLOR,
        color: theme.TEXT_COLOR_PRIMARY,
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        borderWidth: 1,
        borderColor: theme.BORDER_COLOR,
    },
    inputError: {
        borderColor: theme.ERROR_COLOR,
    },
    errorText: {
        color: theme.ERROR_COLOR,
        fontSize: SCREEN_WIDTH * 0.032,
        marginTop: 6,
    },
    metricsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    metricCard: {
        flex: 1,
        backgroundColor: theme.CARD_COLOR,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, },
            android: { elevation: 3, },
        }),
    },
    metricValue: {
        fontSize: SCREEN_WIDTH * 0.05,
        fontWeight: 'bold',
        color: theme.TEXT_COLOR_PRIMARY,
        marginTop: 8,
    },
    metricLabel: {
        fontSize: SCREEN_WIDTH * 0.035,
        color: theme.TEXT_COLOR_SECONDARY,
        marginTop: 2,
    },
    buttonContainer: {
        flexDirection: 'row',
        marginTop: 32,
        marginBottom: 40,
        gap: 16,
    },
    cancelButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: theme.CARD_COLOR,
    },
    cancelButtonText: {
        color: theme.TEXT_COLOR_PRIMARY,
        fontWeight: 'bold',
        fontSize: SCREEN_WIDTH * 0.04,
    },
    saveButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.PRIMARY_YELLOW,
    },
    saveButtonText: {
        color: theme.BACKGROUND_COLOR === '#0A0A0A' ? theme.BACKGROUND_COLOR : theme.TEXT_COLOR_PRIMARY,
        fontWeight: 'bold',
        fontSize: SCREEN_WIDTH * 0.04,
    },
    buttonDisabled: {
        backgroundColor: theme.BORDER_COLOR,
    }
});

export default Profile;
