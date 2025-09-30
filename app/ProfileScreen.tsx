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
import { createStyles, SCREEN_WIDTH } from './styles/theme';
import { useAuth } from './context/AuthContext';
import api from '../config/apiConfig';

const ProfileScreen = ({ theme }) => {
    const { user, token, updateUser } = useAuth();

    const commonStyles = createStyles(theme);
    const componentStyles = createProfileStyles(theme);

    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Estado dos campos
    const [name, setName] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [newAvatarFile, setNewAvatarFile] = useState(null);

    // Estado para armazenar erros de validação
    const [validationErrors, setValidationErrors] = useState({ name: '', height: '', weight: '' });

    // Use useCallback para garantir que fetchProfileData seja estável
    const fetchProfileData = useCallback(async () => {
        if (!token) return;

        try {
            console.log("Sincronizando dados do usuário com o backend na montagem...");
            // Chama a rota GET /api/students/profile
            const response = await api.get('/api/students/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // ATUALIZA O ESTADO GLOBAL do app com o perfil mais recente do servidor
            await updateUser(response.data.usuario);

        } catch (error) {
            console.error('Falha ao buscar perfil para sincronização:', error);
            // Poderia mostrar um aviso de que os dados podem estar desatualizados
        }
    }, [token, updateUser]);


    // 1. Efeito para SINCRONIZAÇÃO INICIAL DE DADOS (Roda APENAS na montagem ou quando o token muda)
    useEffect(() => {
        // Chamamos a função de busca de perfil apenas se tivermos um token.
        // Isso inicializa os dados sempre que a tela é montada ou o usuário loga (token muda).
        fetchProfileData();
    }, [fetchProfileData]); // fetchProfileData é estável graças ao useCallback


    // 2. Efeito para POPULAR/RESETAR o Estado Local (Roda quando user muda ou edição é cancelada)
    useEffect(() => {
        if (user) {
            // Se o usuário global muda (via login, edição, ou sincronização), atualizamos o estado local
            setName(user.name || '');
            setHeight(user.height?.toString() || '');
            setWeight(user.weight?.toString() || '');
        }
        // Reseta estados temporários (erros, avatar pendente) ao sair/carregar
        setValidationErrors({ name: '', height: '', weight: '' });
        setNewAvatarFile(null);
    }, [user, isEditing]);

    // Hook para verificar se houve alguma alteração
    const hasChanges = useMemo(() => {
        const initialName = user?.name || '';
        const initialHeight = user?.height?.toString() || '';
        const initialWeight = user?.weight?.toString() || '';

        return (
            name !== initialName ||
            height !== initialHeight ||
            weight !== initialWeight ||
            newAvatarFile !== null
        );
    }, [name, height, weight, newAvatarFile, user]);


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

    const validateForm = () => {
        let isValid = true;
        let errors = { name: '', height: '', weight: '' };

        if (!name.trim()) {
            errors.name = 'O nome completo é obrigatório.';
            isValid = false;
        }
        // Validação mais estrita para altura e peso
        const numHeight = Number(height.trim());
        const numWeight = Number(weight.trim().replace(',', '.')); // Lida com vírgulas

        if (!height.trim() || isNaN(numHeight) || numHeight <= 0) {
            errors.height = 'A altura é obrigatória e deve ser um valor válido.';
            isValid = false;
        }
        if (!weight.trim() || isNaN(numWeight) || numWeight <= 0) {
            errors.weight = 'O peso é obrigatório e deve ser um valor válido.';
            isValid = false;
        }

        setValidationErrors(errors);
        return isValid;
    };

    const handleSaveChanges = async () => {
        if (!validateForm()) {
            return;
        }

        if (!hasChanges) {
            setIsEditing(false);
            return;
        }

        setIsLoading(true);

        const formData = new FormData();
        formData.append('name', name);
        formData.append('height', String(Number(height.trim())));
        formData.append('weight', String(Number(weight.trim().replace(',', '.'))));

        if (newAvatarFile) {
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
                } as any;
                formData.append('avatar', fileToUpload);
            }
        }

        try {
            const profileEndpoint = '/api/students/profile';

            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            };

            const response = await api.post(profileEndpoint, formData, config);
            const result = response.data;

            // O resultado do POST já contém o usuário atualizado (incluindo bodyFat)
            await updateUser(result.usuario);

            // Limpeza de estados após sucesso
            setNewAvatarFile(null);
            setIsEditing(false);
            setValidationErrors({ name: '', height: '', weight: '' });

            Alert.alert('Sucesso!', 'O seu perfil foi atualizado.');

        } catch (error: any) {
            console.error('--- ERRO DETALHADO AO GUARDAR PERFIL ---', error);
            let errorMessage = 'Ocorreu um erro desconhecido ao tentar salvar.';

            if (error.response) {
                errorMessage = error.response.data.message || 'Erro do servidor ao atualizar o perfil.';
            } else if (error.request) {
                errorMessage = 'Não foi possível conectar ao servidor. Verifique sua rede e o IP de conexão.';
            } else {
                errorMessage = error.message;
            }
            Alert.alert('Erro ao Salvar', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = () => { setIsEditing(true); };

    const handleCancel = () => {
        // Ao cancelar, apenas forçamos a saída do modo de edição.
        // O useEffect [user, isEditing] cuidará de resetar os estados locais
        // para os valores do `user` global.
        setIsEditing(false);
    };

    const getInitials = (nameStr) => {
        if (!nameStr) return '?';
        const words = nameStr.split(' ').filter(Boolean);
        if (words.length > 1) { return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase(); }
        if (words.length === 1 && words[0].length > 0) { return words[0][0].toUpperCase(); }
        return '?';
    };

    const renderAvatar = () => {
        const imageSource = newAvatarFile ? { uri: newAvatarFile.uri } : (user?.avatar ? { uri: user.avatar } : null);
        if (imageSource) return <Image source={imageSource} style={componentStyles.avatar} />;
        return (
            <View style={componentStyles.avatarPlaceholder}>
                <Text style={componentStyles.avatarPlaceholderText}>{getInitials(user?.name)}</Text>
            </View>
        );
    };

    // Componente para exibir o Nome Completo (Visualização aprimorada)
    const DisplayField = ({ label, value }) => (
        <View style={componentStyles.displayFieldGroup}>
            <Text style={componentStyles.label}>{label}</Text>
            <Text style={componentStyles.displayValueV2}>
                {value !== undefined && value !== null ? value : 'N/A'}
            </Text>
        </View>
    );

    // Componente para exibir métricas (Altura, Peso, Gordura Corporal) em um card
    const MetricCard = ({ label, value, unit = '', iconName }) => {
        const displayValue = value !== undefined && value !== null
            ? (Number.isInteger(Number(value)) ? String(value) : Number(value).toFixed(1))
            : 'N/A';

        return (
            <View style={[componentStyles.metricCard, componentStyles.metricCardElevated]}>
                <FeatherIcon name={iconName} size={22} color={theme.PRIMARY_YELLOW} style={componentStyles.metricIcon} />
                <Text style={componentStyles.metricLabel}>{label}</Text>
                <Text style={componentStyles.metricValue}>
                    {displayValue !== 'N/A' ? `${displayValue}${unit}` : 'N/A'}
                </Text>
            </View>
        );
    };

    return (
        <ScrollView contentContainerStyle={commonStyles.pageContainer} keyboardShouldPersistTaps="handled">
            {/* Header com Logo no canto superior esquerdo e botão de edição no direito */}
            <View style={componentStyles.header}>
                {/* Logo da Montanini - Posicionada no canto */}
                <Image
                    source={require('./montanini.svg')}
                    style={componentStyles.logoImage}
                    resizeMode="contain"
                />

                <View style={componentStyles.headerActions}>
                    {!isEditing && (
                        <TouchableOpacity
                            style={[componentStyles.subtleEditIconContainer]}
                            onPress={handleEdit}
                        >
                            <FeatherIcon name="edit-2" size={24} color={theme.TEXT_COLOR_PRIMARY} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <Text style={[commonStyles.pageTitle, componentStyles.titleSpacing]}>Meu Perfil</Text>

            <View style={componentStyles.avatarContainer}>
                <View style={componentStyles.avatarWrapper}>
                    {renderAvatar()}
                    {isEditing && (
                        <TouchableOpacity style={componentStyles.cameraEditButton} onPress={handlePickAvatar}>
                            <FeatherIcon name="camera" size={20} color={theme.BACKGROUND_COLOR} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <Text style={componentStyles.sectionTitle}>DADOS PESSOAIS</Text>

            <View style={[commonStyles.card, componentStyles.elevatedCard]}>
                {isEditing ? (
                    <>
                        {/* Nome Completo */}
                        <View style={componentStyles.inputGroup}>
                            <Text style={componentStyles.label}>Nome Completo</Text>
                            <TextInput
                                style={[
                                    componentStyles.input,
                                    componentStyles.inputEditing,
                                    validationErrors.name ? componentStyles.inputError : null
                                ]}
                                value={name}
                                onChangeText={(text) => {
                                    setName(text);
                                    setValidationErrors(prev => ({ ...prev, name: '' }));
                                }}
                                editable={isEditing}
                            />
                            {validationErrors.name ? <Text style={componentStyles.errorText}>{validationErrors.name}</Text> : null}
                        </View>

                        {/* Altura */}
                        <View style={componentStyles.inputGroup}>
                            <Text style={componentStyles.label}>Altura (cm)</Text>
                            <TextInput
                                style={[
                                    componentStyles.input,
                                    componentStyles.inputEditing,
                                    validationErrors.height ? componentStyles.inputError : null
                                ]}
                                value={height}
                                onChangeText={(text) => {
                                    setHeight(text.replace(/[^0-9.]/g, ''));
                                    setValidationErrors(prev => ({ ...prev, height: '' }));
                                }}
                                keyboardType="numeric"
                                editable={isEditing}
                            />
                            {validationErrors.height ? <Text style={componentStyles.errorText}>{validationErrors.height}</Text> : null}
                        </View>

                        {/* Peso */}
                        <View style={componentStyles.inputGroup}>
                            <Text style={componentStyles.label}>Peso (kg)</Text>
                            <TextInput
                                style={[
                                    componentStyles.input,
                                    componentStyles.inputEditing,
                                    validationErrors.weight ? componentStyles.inputError : null
                                ]}
                                value={weight}
                                onChangeText={(text) => {
                                    setWeight(text.replace(/[^0-9,.]/g, ''));
                                    setValidationErrors(prev => ({ ...prev, weight: '' }));
                                }}
                                keyboardType="decimal-pad"
                                editable={isEditing}
                            />
                            {validationErrors.weight ? <Text style={componentStyles.errorText}>{validationErrors.weight}</Text> : null}
                        </View>
                    </>
                ) : (
                    <>
                        {/* Exibição do Nome em modo de visualização - Fundo do Card */}
                        <DisplayField label="Nome Completo" value={user?.name} />

                        {/* MÉTRICAS: Cards de 3 colunas */}
                        <View style={componentStyles.metricsGrid}>
                            <MetricCard label="Altura" value={user?.height} unit=" cm" iconName="maximize-2" />
                            <MetricCard label="Peso" value={user?.weight} unit=" kg" iconName="bar-chart-2" />
                            <MetricCard label="Gordura Corporal" value={user?.bodyFat} unit="%" iconName="target" />
                        </View>
                    </>
                )}
            </View>

            {isEditing && (
                <View style={componentStyles.buttonContainer}>
                    <TouchableOpacity style={componentStyles.cancelButton} onPress={handleCancel} disabled={isLoading}>
                        <Text style={componentStyles.cancelButtonText}>CANCELAR</Text>
                    </TouchableOpacity>
                    {/* Botão Salvar Desativado se estiver carregando OU se não houver alterações */}
                    <TouchableOpacity
                        style={[componentStyles.saveButton, !hasChanges && componentStyles.buttonDisabled]}
                        onPress={handleSaveChanges}
                        disabled={isLoading || !hasChanges}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={theme.BACKGROUND_COLOR} />
                        ) : (
                            <Text style={componentStyles.saveButtonText}>SALVAR</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
};

const createProfileStyles = (theme) => StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    // Posicionamento extremo da logo à esquerda
    logoImage: {
        width: 120,
        height: 30,
        marginLeft: -20, // Ajuste para mover mais para a borda
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    // Estilo aprimorado para o botão de edição (visualização)
    subtleEditIconContainer: {
        backgroundColor: theme.CARD_COLOR,
        borderRadius: 10,
        padding: 6,
        ...Platform.select({
            ios: { shadowColor: theme.TEXT_COLOR_PRIMARY, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, },
            android: { elevation: 3, },
        }),
    },
    titleSpacing: {
        marginBottom: 24,
    },

    avatarContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarWrapper: {
        position: 'relative',
        width: SCREEN_WIDTH * 0.35,
        height: SCREEN_WIDTH * 0.35,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: (SCREEN_WIDTH * 0.35) / 2,
        borderWidth: 4,
        borderColor: theme.PRIMARY_YELLOW,
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: (SCREEN_WIDTH * 0.35) / 2,
        borderWidth: 4,
        borderColor: theme.PRIMARY_YELLOW,
        backgroundColor: theme.CARD_COLOR,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarPlaceholderText: {
        color: theme.PRIMARY_YELLOW,
        fontSize: SCREEN_WIDTH * 0.15,
        fontWeight: 'bold',
    },
    cameraEditButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: theme.PRIMARY_YELLOW,
        padding: 10,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: theme.BACKGROUND_COLOR
    },

    sectionTitle: {
        fontSize: SCREEN_WIDTH * 0.04,
        fontWeight: '600',
        color: theme.TEXT_COLOR_SECONDARY,
        textTransform: 'uppercase',
        marginBottom: 12,
        marginTop: 16,
    },

    elevatedCard: {
        ...Platform.select({
            ios: {
                shadowColor: theme.TEXT_COLOR_PRIMARY,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 6,
            },
            android: {
                elevation: 6,
            },
        }),
    },

    // Estilos de Input (Modo Edição)
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        color: theme.TEXT_COLOR_SECONDARY,
        fontSize: SCREEN_WIDTH * 0.04,
        marginBottom: 8,
    },
    input: {
        backgroundColor: theme.BACKGROUND_COLOR,
        color: theme.TEXT_COLOR_PRIMARY,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: theme.BORDER_COLOR,
    },
    inputEditing: {
        borderColor: theme.PRIMARY_YELLOW,
        borderWidth: 2,
    },
    inputError: {
        borderColor: '#FF4D4D', // Vermelho para erro
        borderWidth: 2,
    },
    errorText: {
        color: '#FF4D4D', // Vermelho para erro
        fontSize: SCREEN_WIDTH * 0.035,
        marginTop: 4,
        marginLeft: 4,
        fontWeight: '500',
    },

    // Estilos para exibição de dados (Modo Visualização)
    displayFieldGroup: {
        marginBottom: 20,
    },
    displayValueV2: { // Nome em destaque
        color: theme.TEXT_COLOR_PRIMARY,
        fontSize: 24, // Maior e mais impactante
        fontWeight: '800',
    },

    // MÉTRICAS
    metricsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        marginBottom: 10,
        marginHorizontal: -4,
    },
    metricCard: {
        flex: 1,
        backgroundColor: theme.BACKGROUND_COLOR,
        padding: 14,
        borderRadius: 12,
        marginHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.BORDER_COLOR,
        minHeight: 110,
    },
    metricCardElevated: {
        ...Platform.select({
            ios: {
                shadowColor: theme.TEXT_COLOR_PRIMARY,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 3,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    metricIcon: {
        marginBottom: 5,
    },
    metricLabel: {
        fontSize: SCREEN_WIDTH * 0.035,
        color: theme.TEXT_COLOR_SECONDARY,
        marginBottom: 2,
        textAlign: 'center',
        fontWeight: '500',
    },
    metricValue: {
        fontSize: SCREEN_WIDTH * 0.055,
        fontWeight: '900',
        color: theme.PRIMARY_YELLOW,
        textAlign: 'center',
    },

    // BOTOES
    buttonContainer: {
        flexDirection: 'row',
        marginTop: 24,
        marginBottom: 40,
        gap: 16,
    },
    cancelButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: theme.CARD_COLOR,
        borderWidth: 1,
        borderColor: theme.BORDER_COLOR
    },
    cancelButtonText: {
        color: theme.TEXT_COLOR_PRIMARY,
        fontWeight: 'bold',
        fontSize: SCREEN_WIDTH * 0.045,
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
        color: theme.BACKGROUND_COLOR,
        fontWeight: 'bold',
        fontSize: SCREEN_WIDTH * 0.045,
    },
    buttonDisabled: {
        backgroundColor: theme.TEXT_COLOR_SECONDARY,
        opacity: 0.6,
    }
});

export default ProfileScreen;
