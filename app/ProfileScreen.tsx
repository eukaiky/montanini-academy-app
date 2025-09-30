import React, { useState, useEffect } from 'react';
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
// 1. IMPORTAR o nosso objeto 'api' centralizado
import api from '../config/apiConfig';

const ProfileScreen = ({ theme }) => {
    const { user, token, updateUser } = useAuth();

    const commonStyles = createStyles(theme);
    const componentStyles = createProfileStyles(theme);

    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [name, setName] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [newAvatarFile, setNewAvatarFile] = useState(null);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setHeight(user.height?.toString() || '');
            setWeight(user.weight?.toString() || '');
        }
    }, [user]);

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

    const handleSaveChanges = async () => {
        if (!name || !height || !weight) {
            Alert.alert('Atenção', 'Nome, altura e peso são obrigatórios.');
            return;
        }
        setIsLoading(true);

        const formData = new FormData();
        formData.append('name', name);
        formData.append('height', height);
        formData.append('weight', weight);

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
                } as any; // Cast to 'any' to match FormData expectation
                formData.append('avatar', fileToUpload);
            }
        }

        try {
            // 2. USAR api.post para enviar os dados, em vez de 'fetch'.
            const profileEndpoint = '/api/students/profile';

            // O Axios precisa que o token de autorização seja passado nos headers.
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // O 'Content-Type': 'multipart/form-data' é adicionado automaticamente pelo Axios
                    // quando ele detecta que o corpo da requisição é um FormData.
                },
            };

            const response = await api.post(profileEndpoint, formData, config);
            const result = response.data; // Com Axios, o resultado já vem em .data

            await updateUser(result.usuario);
            setNewAvatarFile(null);
            setIsEditing(false);

            Alert.alert('Sucesso!', 'O seu perfil foi atualizado.');

        } catch (error: any) {
            // 3. TRATAR os erros no padrão do Axios.
            console.error('--- ERRO DETALHADO AO GUARDAR PERFIL ---', error);
            let errorMessage = 'Ocorreu um erro desconhecido ao tentar salvar.';

            if (error.response) {
                // O servidor respondeu com um erro (ex: 403, 500).
                errorMessage = error.response.data.message || 'Erro do servidor ao atualizar o perfil.';
            } else if (error.request) {
                // A requisição foi feita, mas não houve resposta.
                errorMessage = 'Não foi possível conectar ao servidor. Verifique sua rede e o IP de conexão.';
            } else {
                // Um erro ocorreu ao configurar a requisição.
                errorMessage = error.message;
            }
            Alert.alert('Erro ao Salvar', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = () => { setIsEditing(true); };

    const handleCancel = () => {
        if (user) {
            setName(user.name || '');
            setHeight(user.height?.toString() || '');
            setWeight(user.weight?.toString() || '');
        }
        setNewAvatarFile(null);
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

    return (
        <ScrollView contentContainerStyle={commonStyles.pageContainer} keyboardShouldPersistTaps="handled">
            <Text style={commonStyles.pageTitle}>Meu Perfil</Text>
            <View style={componentStyles.avatarContainer}>
                {renderAvatar()}
                {isEditing && (
                    <TouchableOpacity style={componentStyles.editButton} onPress={handlePickAvatar}>
                        <FeatherIcon name="camera" size={20} color={theme.BACKGROUND_COLOR} />
                    </TouchableOpacity>
                )}
            </View>
            <Text style={componentStyles.sectionTitle}>Dados Pessoais</Text>
            <View style={commonStyles.card}>
                <View style={componentStyles.inputGroup}>
                    <Text style={componentStyles.label}>Nome Completo</Text>
                    <TextInput style={[componentStyles.input, !isEditing && componentStyles.inputDisabled]} value={name} onChangeText={setName} editable={isEditing} />
                </View>
                <View style={componentStyles.inputGroup}>
                    <Text style={componentStyles.label}>Altura (cm)</Text>
                    <TextInput style={[componentStyles.input, !isEditing && componentStyles.inputDisabled]} value={height} onChangeText={setHeight} keyboardType="numeric" editable={isEditing} />
                </View>
                <View style={componentStyles.inputGroup}>
                    <Text style={componentStyles.label}>Peso (kg)</Text>
                    <TextInput style={[componentStyles.input, !isEditing && componentStyles.inputDisabled]} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" editable={isEditing} />
                </View>
            </View>
            {isEditing ? (
                <View style={componentStyles.buttonContainer}>
                    <TouchableOpacity style={componentStyles.cancelButton} onPress={handleCancel} disabled={isLoading}>
                        <Text style={componentStyles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={componentStyles.saveButton} onPress={handleSaveChanges} disabled={isLoading}>
                        {isLoading ? <ActivityIndicator color={theme.BACKGROUND_COLOR} /> : <Text style={componentStyles.saveButtonText}>Salvar</Text>}
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity style={componentStyles.editProfileButton} onPress={handleEdit}>
                    <FeatherIcon name="edit-2" size={20} color={theme.BACKGROUND_COLOR} />
                    <Text style={componentStyles.editProfileButtonText}>Editar Perfil</Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    );
};

const createProfileStyles = (theme) => StyleSheet.create({
    avatarContainer: { alignItems: 'center', marginBottom: 24, },
    avatar: { width: SCREEN_WIDTH * 0.35, height: SCREEN_WIDTH * 0.35, borderRadius: (SCREEN_WIDTH * 0.35) / 2, borderWidth: 4, borderColor: theme.PRIMARY_YELLOW, },
    avatarPlaceholder: { width: SCREEN_WIDTH * 0.35, height: SCREEN_WIDTH * 0.35, borderRadius: (SCREEN_WIDTH * 0.35) / 2, borderWidth: 4, borderColor: theme.PRIMARY_YELLOW, backgroundColor: theme.CARD_COLOR, justifyContent: 'center', alignItems: 'center', },
    avatarPlaceholderText: { color: theme.PRIMARY_YELLOW, fontSize: SCREEN_WIDTH * 0.15, fontWeight: 'bold', },
    editButton: { position: 'absolute', bottom: 5, right: SCREEN_WIDTH * 0.28, backgroundColor: theme.PRIMARY_YELLOW, padding: 10, borderRadius: 20, borderWidth: 2, borderColor: theme.BACKGROUND_COLOR },
    sectionTitle: { fontSize: SCREEN_WIDTH * 0.04, fontWeight: '600', color: theme.TEXT_COLOR_SECONDARY, textTransform: 'uppercase', marginBottom: 12, marginTop: 16, },
    inputGroup: { marginBottom: 16, },
    label: { color: theme.TEXT_COLOR_SECONDARY, fontSize: SCREEN_WIDTH * 0.04, marginBottom: 8, },
    input: { backgroundColor: theme.BACKGROUND_COLOR, color: theme.TEXT_COLOR_PRIMARY, borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: theme.BORDER_COLOR, },
    inputDisabled: {
        backgroundColor: theme.CARD_COLOR,
        color: theme.TEXT_COLOR_PRIMARY,
        borderColor: theme.CARD_COLOR,
    },
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
    editProfileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        backgroundColor: theme.PRIMARY_YELLOW,
        padding: 16,
        borderRadius: 12,
        marginTop: 24,
        marginBottom: 40,
    },
    editProfileButtonText: {
        color: theme.BACKGROUND_COLOR,
        fontWeight: 'bold',
        fontSize: SCREEN_WIDTH * 0.045,
    },
});

export default ProfileScreen;
