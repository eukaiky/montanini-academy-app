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
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import * as Animatable from 'react-native-animatable';
import * as Haptics from 'expo-haptics';
// Meus estilos customizados e cores
import { createStyles, SCREEN_WIDTH, darkTheme } from './styles/theme';
// O contexto de autenticação para pegar o user e token
import { useAuth } from './context/AuthContext';
// Minha configuração de API
import api from '../config/apiConfig';

// Função para checar se os dados do usuário mudaram entre o frontend e o servidor
const areUsersEqual = (user1, user2) => {
    if (!user1 || !user2) return false;
    // As chaves que eu quero comparar para ver se precisa atualizar
    const keysToCompare = ['uid', 'name', 'email', 'avatar', 'height', 'weight', 'bodyFat'];

    for (const key of keysToCompare) {
        const val1 = String(user1[key] ?? '').trim();
        const val2 = String(user2[key] ?? '').trim();
        if (val1 !== val2) {
            return false;
        }
    }
    return true;
};

const Profile = ({ theme }) => {
    // Pego o usuário, token e a função para atualizar o estado global do usuário
    const { user, token, updateUser } = useAuth();
    // Gero os estilos baseados no tema atual
    const commonStyles = createStyles(theme);
    const componentStyles = createProfileStyles(theme);

    // --- Variáveis de Estado ---
    // Se estou no modo de edição
    const [isEditing, setIsEditing] = useState(false);
    // Se está salvando ou carregando dados
    const [isLoading, setIsLoading] = useState(false);
    // Campos do formulário
    const [name, setName] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    // O valor do percentual de gordura (é só para exibir, não edito)
    const [bodyFat, setBodyFat] = useState('');
    // Se o usuário selecionou uma nova foto de perfil
    const [newAvatarFile, setNewAvatarFile] = useState(null);
    // Mensagens de erro de validação para cada campo
    const [validationErrors, setValidationErrors] = useState({ name: '', height: '', weight: '' });

    // Função para buscar os dados mais recentes do perfil no servidor (sincronização)
    const fetchProfileData = useCallback(async () => {
        if (!token) return;
        try {
            const response = await api.get('/api/students/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const serverUser = response.data.usuario;
            // Se os dados do servidor forem diferentes do que eu tenho localmente, eu atualizo
            if (!areUsersEqual(user, serverUser)) {
                await updateUser(serverUser);
            }
        } catch (error) {
            console.error('Falha ao buscar perfil para sincronização:', error);
        }
    }, [token, user, updateUser]);

    // Chamo a função de sincronização quando a tela carrega
    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]);

    // Reseto os campos do formulário sempre que o objeto 'user' muda ou quando o modo edição é cancelado
    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setHeight(user.height?.toString() || '');
            setWeight(user.weight?.toString() || '');
            setBodyFat(user.bodyFat?.toString() || ''); // Inicializa bodyFat
        }
        // Limpo os erros e a foto nova
        setValidationErrors({ name: '', height: '', weight: '' });
        setNewAvatarFile(null);
    }, [user]);

    // Hook que checa se houve alguma alteração no formulário
    // Uso useMemo para calcular isso só quando as dependências mudam
    const hasChanges = useMemo(() => {
        const initialName = user?.name || '';
        const initialHeight = user?.height?.toString() || '';
        const initialWeight = user?.weight?.toString() || '';
        const currentWeight = weight.trim().replace(',', '.');
        const initialWeightNormalized = initialWeight.trim().replace(',', '.');

        // Retorna true se qualquer campo mudou ou se uma nova foto foi selecionada
        return (
            name.trim() !== initialName.trim() ||
            height.trim() !== initialHeight.trim() ||
            currentWeight !== initialWeightNormalized ||
            newAvatarFile !== null
        );
    }, [name, height, weight, newAvatarFile, user]);

    // Função para abrir a galeria e escolher uma nova foto de perfil
    const handlePickAvatar = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

    // Função para validar se os campos estão preenchidos corretamente antes de salvar
    const validateForm = () => {
        let isValid = true;
        let errors = { name: '', height: '', weight: '' };

        // Validação do nome
        if (!name.trim()) {
            errors.name = 'O nome completo é obrigatório.';
            isValid = false;
        }

        // Validação da altura
        const numHeight = Number(height.trim());
        if (!height.trim() || isNaN(numHeight) || numHeight <= 0) {
            errors.height = 'A altura é obrigatória e deve ser um valor válido.';
            isValid = false;
        }

        // Validação do peso
        const numWeight = Number(weight.trim().replace(',', '.'));
        if (!weight.trim() || isNaN(numWeight) || numWeight <= 0) {
            errors.weight = 'O peso é obrigatório e deve ser um valor válido.';
            isValid = false;
        }

        setValidationErrors(errors);
        return isValid;
    };

    // Função que envia os dados alterados (incluindo a nova foto) para a API
    const handleSaveChanges = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        if (!validateForm() || !hasChanges) {
            if (!hasChanges) setIsEditing(false);
            return;
        }

        setIsLoading(true);
        // Uso FormData porque vou mandar uma imagem
        const formData = new FormData();
        formData.append('name', name.trim());
        formData.append('height', String(Number(height.trim())));
        formData.append('weight', String(Number(weight.trim().replace(',', '.'))));

        // bodyFat não é enviado, pois não é editável pelo usuário

        // Lógica para anexar a nova foto
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
                const fileToUpload = { uri: newAvatarFile.uri, name: `photo.${fileType}`, type: newAvatarFile.mimeType || `image/${fileType}` };
                formData.append('avatar', fileToUpload as any);
            }
        }

        try {
            const response = await api.post('/api/students/profile', formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // Atualizo o usuário no contexto após o sucesso
            await updateUser(response.data.usuario);
            setIsEditing(false);
            Alert.alert('Sucesso!', 'O seu perfil foi atualizado.');
        } catch (error: any) {
            // Lógica para tratar erros da API e exibir uma mensagem amigável
            let errorMessage = 'Ocorreu um erro desconhecido ao tentar salvar.';
            if (error.response) errorMessage = error.response.data.message || 'Erro do servidor.';
            else if (error.request) errorMessage = 'Não foi possível conectar ao servidor.';
            else errorMessage = error.message;
            Alert.alert('Erro ao Salvar', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Entra no modo de edição
    const handleEdit = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsEditing(true);
    };

    // Cancela o modo de edição e reseta os campos para os valores originais
    const handleCancel = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (user) {
            setName(user.name || '');
            setHeight(user.height?.toString() || '');
            setWeight(user.weight?.toString() || '');
            setBodyFat(user.bodyFat?.toString() || ''); // Reseta bodyFat
        }
        setNewAvatarFile(null);
        setValidationErrors({ name: '', height: '', weight: '' });
        setIsEditing(false);
    };

    // Função para gerar as iniciais para o placeholder da foto
    const getInitials = (nameStr) => {
        if (!nameStr) return '?';
        const words = nameStr.split(' ').filter(Boolean);
        if (words.length > 1) return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
        if (words.length === 1 && words[0].length > 0) return words[0][0].toUpperCase();
        return '?';
    };

    // Decide se renderiza a foto atual ou o placeholder
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

    // Frase fixa para simular a data de afiliação (mantida como exemplo)
    const affiliationText = useMemo(() => {
        return "Membro ativo desde Janeiro de 2023";
    }, []);


    // Componente reutilizável para renderizar cada métrica (Peso, Altura, Gordura)
    const MetricCard = ({ label, value, unit = '', iconName, animation = "zoomIn", delay = 0, isLarge = false }) => {
        // Formata o valor para 1 casa decimal ou N/A se for nulo
        const displayValue = value !== undefined && value !== null
            ? (Number.isInteger(Number(value)) ? String(value) : Number(value).toFixed(1))
            : 'N/A';
        return (
            <Animatable.View animation={animation} delay={delay} duration={500} style={isLarge ? componentStyles.largeMetricCardAnimatable : { flex: 1 }}>
                <TouchableOpacity onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)} style={isLarge ? componentStyles.largeMetricCard : componentStyles.metricCard}>
                    <MaterialCommunityIcon name={iconName} size={isLarge ? 32 : 24} color={theme.PRIMARY_YELLOW} />
                    <View style={componentStyles.metricTextContainer}>
                        <Text style={isLarge ? componentStyles.largeMetricValue : componentStyles.metricValue}>{displayValue}{unit}</Text>
                        <Text style={isLarge ? componentStyles.largeMetricLabel : componentStyles.metricLabel}>{label}</Text>
                    </View>
                </TouchableOpacity>
            </Animatable.View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.BACKGROUND_COLOR }}>
            <ScrollView contentContainerStyle={commonStyles.pageContainer} keyboardShouldPersistTaps="handled">
                <View style={componentStyles.header}>
                    {/* Logo no topo */}
                    <Image source={require('./montanini.png')} style={componentStyles.logoImage} resizeMode="contain" />
                </View>

                {/* Card principal do perfil */}
                <Animatable.View animation="fadeIn" duration={600} style={componentStyles.profileCard}>
                    <View style={componentStyles.profileHeader}>
                        {/* Avatar */}
                        <View style={componentStyles.avatarWrapper}>
                            {renderAvatar()}
                            {/* Botão da câmera aparece só no modo edição */}
                            {isEditing && (
                                <TouchableOpacity style={componentStyles.cameraEditButton} onPress={handlePickAvatar}>
                                    <MaterialCommunityIcon name="camera" size={18} color={theme.BACKGROUND_COLOR} />
                                </TouchableOpacity>
                            )}
                        </View>
                        {/* Exibe nome ou o cabeçalho 'Editar Perfil' */}
                        <View style={componentStyles.profileInfo}>
                            {isEditing ? (
                                <>
                                    <Text style={componentStyles.profileName}>Editar Perfil</Text>
                                    {/* A frase de sub-título de edição */}
                                    <Text style={componentStyles.profileAffiliation}>Atualize suas informações.</Text>
                                </>
                            ) : (
                                <>
                                    <Text style={componentStyles.profileName}>{user?.name || 'Carregando...'}</Text>
                                    {/* LINHA DO EMAIL REMOVIDA - ESPAÇO FICA VAZIO */}
                                </>
                            )}
                        </View>
                    </View>
                    {/* Botão de edição (lápis) aparece só se não estiver editando */}
                    {!isEditing && (
                        <TouchableOpacity style={componentStyles.editButton} onPress={handleEdit}>
                            <MaterialCommunityIcon name="pencil" size={20} color={theme.TEXT_COLOR_PRIMARY} />
                        </TouchableOpacity>
                    )}
                </Animatable.View>

                {isEditing ? (
                    /* Bloco de Edição (aparece se isEditing for true) */
                    <Animatable.View animation="fadeIn" duration={400} style={componentStyles.editingContainer}>
                        {/* Campo Nome */}
                        <View style={componentStyles.inputGroup}>
                            <Text style={componentStyles.label}>Nome Completo</Text>
                            <TextInput style={[componentStyles.input, validationErrors.name ? componentStyles.inputError : null]} value={name} onChangeText={setName} />
                            {validationErrors.name && <Text style={componentStyles.errorText}>{validationErrors.name}</Text>}
                        </View>
                        {/* Campo Altura */}
                        <View style={componentStyles.inputGroup}>
                            <Text style={componentStyles.label}>Altura (cm)</Text>
                            <TextInput style={[componentStyles.input, validationErrors.height ? componentStyles.inputError : null]} value={height} onChangeText={(t) => setHeight(t.replace(/[^0-9.]/g, ''))} keyboardType="numeric" />
                            {validationErrors.height && <Text style={componentStyles.errorText}>{validationErrors.height}</Text>}
                        </View>
                        {/* Campo Peso */}
                        <View style={componentStyles.inputGroup}>
                            <Text style={componentStyles.label}>Peso (kg)</Text>
                            <TextInput style={[componentStyles.input, validationErrors.weight ? componentStyles.inputError : null]} value={weight} onChangeText={(t) => setWeight(t.replace(/[^0-9,.]/g, ''))} keyboardType="decimal-pad" />
                            {validationErrors.weight && <Text style={componentStyles.errorText}>{validationErrors.weight}</Text>}
                        </View>

                        {/* Campo Gordura Corporal (SOMENTE LEITURA) */}
                        <View style={componentStyles.inputGroup}>
                            <Text style={componentStyles.label}>Gordura Corporal (%)</Text>
                            <TextInput
                                style={[componentStyles.input, componentStyles.inputDisabled]}
                                value={bodyFat}
                                editable={false} // Desabilita a edição
                            />
                            {/* Mensagem de restrição */}
                            <Text style={componentStyles.adminOnlyText}>Editável apenas pelo painel de administração.</Text>
                        </View>

                    </Animatable.View>
                ) : (
                    /* Bloco de Visualização (aparece se isEditing for false) */
                    <View>
                        <Animatable.View animation="fadeIn" duration={400}>
                            <Text style={componentStyles.sectionTitle}>Suas Métricas</Text>
                            {/* Layout dos cards de métricas (1 card grande + 2 pequenos empilhados) */}
                            <View style={componentStyles.metricsLayout}>
                                {/* Card de Peso em destaque */}
                                <MetricCard label="Peso" value={user?.weight} unit=" kg" iconName="weight-kilogram" delay={100} isLarge={true} />
                                {/* Cards de Altura e Gordura Corporal */}
                                <View style={componentStyles.stackedMetrics}>
                                    <MetricCard label="Altura" value={user?.height} unit=" cm" iconName="human-male-height" delay={200} />
                                    <MetricCard label="Gordura Corporal" value={user?.bodyFat} unit="%" iconName="percent-outline" delay={300} />
                                </View>
                            </View>
                        </Animatable.View>
                    </View>
                )}

                {/* Botões de Salvar/Cancelar (aparecem só no modo edição) */}
                {isEditing && (
                    <Animatable.View animation="fadeInUp" delay={200} style={componentStyles.buttonContainer}>
                        <TouchableOpacity style={componentStyles.cancelButton} onPress={handleCancel} disabled={isLoading}>
                            <Text style={componentStyles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[componentStyles.saveButton, (!hasChanges || isLoading) && componentStyles.buttonDisabled]}
                            onPress={handleSaveChanges} disabled={isLoading || !hasChanges}
                        >
                            {isLoading ? <ActivityIndicator color={theme.BACKGROUND_COLOR} /> : <Text style={componentStyles.saveButtonText}>Salvar</Text>}
                        </TouchableOpacity>
                    </Animatable.View>
                )}
            </ScrollView>
        </View>
    );
};

const createProfileStyles = (theme) => StyleSheet.create({
    header: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 16,
    },
    logoImage: {
        width: 40,
        height: 40,
        tintColor: theme.PRIMARY_YELLOW,
    },
    profileCard: {
        backgroundColor: theme.CARD_COLOR,
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
            android: { elevation: 5 },
        }),
    },
    editButton: {
        backgroundColor: theme.BACKGROUND_COLOR,
        padding: 12,
        borderRadius: 99,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarWrapper: {
        position: 'relative',
        width: SCREEN_WIDTH * 0.2,
        height: SCREEN_WIDTH * 0.2,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: (SCREEN_WIDTH * 0.2) / 2,
        borderWidth: 3,
        borderColor: theme.PRIMARY_YELLOW,
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: (SCREEN_WIDTH * 0.2) / 2,
        borderWidth: 3,
        borderColor: theme.PRIMARY_YELLOW,
        backgroundColor: theme.BACKGROUND_COLOR,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarPlaceholderText: {
        color: theme.PRIMARY_YELLOW,
        fontSize: SCREEN_WIDTH * 0.08,
        fontWeight: 'bold',
    },
    cameraEditButton: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        backgroundColor: theme.PRIMARY_YELLOW,
        padding: 6,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: theme.CARD_COLOR,
    },
    profileInfo: {
        alignItems: 'flex-start',
        marginLeft: 16,
        flex: 1,
        // Ocupa o espaço restante para empurrar o botão de lápis para a borda
        marginRight: 45,
        // Permito o crescimento vertical se houver mais conteúdo
        justifyContent: 'center',
    },
    profileName: {
        fontSize: SCREEN_WIDTH * 0.055,
        fontWeight: 'bold',
        color: theme.TEXT_COLOR_PRIMARY,
    },
    // Estilo que era do email (agora é usado para o subtítulo no modo edição)
    profileAffiliation: {
        fontSize: SCREEN_WIDTH * 0.038,
        color: theme.TEXT_COLOR_SECONDARY,
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: SCREEN_WIDTH * 0.05,
        fontWeight: 'bold',
        color: theme.TEXT_COLOR_PRIMARY,
        marginBottom: 12,
        marginTop: 12,
        textAlign: 'center',
        paddingHorizontal: 4,
    },
    editingContainer: {
        backgroundColor: theme.CARD_COLOR,
        borderRadius: 16,
        padding: 20,
    },
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        color: theme.TEXT_COLOR_SECONDARY,
        fontSize: SCREEN_WIDTH * 0.038,
        marginBottom: 6,
    },
    input: {
        backgroundColor: theme.BACKGROUND_COLOR,
        color: theme.TEXT_COLOR_PRIMARY,
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: theme.BORDER_COLOR,
    },
    inputError: {
        borderColor: theme.ERROR_COLOR,
    },
    // Estilo para o campo desabilitado
    inputDisabled: {
        backgroundColor: theme.BORDER_COLOR, // Fundo cinza/escurecido para indicar desativação
        color: theme.TEXT_COLOR_SECONDARY,
        opacity: 0.8,
    },
    // Mensagem de campo editável apenas por admin
    adminOnlyText: {
        color: theme.TEXT_COLOR_SECONDARY,
        fontSize: SCREEN_WIDTH * 0.032,
        marginTop: 4,
        paddingLeft: 4,
    },
    errorText: {
        color: theme.ERROR_COLOR,
        fontSize: SCREEN_WIDTH * 0.032,
        marginTop: 4,
    },
    // NOVA ESTRUTURA DE LAYOUT PARA AS MÉTRICAS
    metricsLayout: {
        flexDirection: 'row', // Cards lado a lado
        justifyContent: 'space-between',
        gap: 10,
        marginBottom: 10,
        alignItems: 'stretch',
    },
    // Estilo para o Animatable.View do card grande para que ele ocupe 50%
    largeMetricCardAnimatable: {
        flex: 0.5,
    },
    // Estilo para o card grande de Peso (REDUÇÃO DE ALTURA)
    largeMetricCard: {
        flex: 1,
        backgroundColor: theme.CARD_COLOR,
        paddingHorizontal: 16,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
            android: { elevation: 2 },
        }),
    },
    largeMetricValue: {
        fontSize: SCREEN_WIDTH * 0.065,
        fontWeight: 'bold',
        color: theme.TEXT_COLOR_PRIMARY,
        marginTop: 0,
        marginBottom: 0,
        textAlign: 'center',
    },
    largeMetricLabel: {
        fontSize: SCREEN_WIDTH * 0.04,
        color: theme.TEXT_COLOR_SECONDARY,
        textAlign: 'center',
        marginTop: 6,
    },
    // Container para os dois cards menores empilhados
    stackedMetrics: {
        flex: 0.5,
        justifyContent: 'space-between',
        gap: 10,
    },
    // Estilo para os cards menores (Altura e Gordura Corporal) (REDUÇÃO DE ALTURA)
    metricCard: {
        flex: 1,
        backgroundColor: theme.CARD_COLOR,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
            android: { elevation: 2 },
        }),
    },
    metricTextContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 6,
    },
    metricValue: {
        fontSize: SCREEN_WIDTH * 0.055,
        fontWeight: 'bold',
        color: theme.TEXT_COLOR_PRIMARY,
        marginTop: 0,
        marginBottom: 0,
        textAlign: 'center',
    },
    metricLabel: {
        fontSize: SCREEN_WIDTH * 0.035,
        color: theme.TEXT_COLOR_SECONDARY,
        textAlign: 'center',
        marginTop: 4,
    },
    buttonContainer: {
        flexDirection: 'row',
        marginTop: 25,
        marginBottom: 30,
        gap: 16,
    },
    cancelButton: {
        flex: 1,
        padding: 14,
        borderRadius: 99,
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
        padding: 14,
        borderRadius: 99,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.PRIMARY_YELLOW,
    },
    saveButtonText: {
        color: theme.BACKGROUND_COLOR === darkTheme.BACKGROUND_COLOR ? theme.BACKGROUND_COLOR : theme.TEXT_COLOR_PRIMARY,
        fontWeight: 'bold',
        fontSize: SCREEN_WIDTH * 0.04,
    },
    buttonDisabled: {
        backgroundColor: theme.BORDER_COLOR,
        opacity: 0.7,
    }
});

export default Profile;