import React, { useState, useEffect, memo } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    Platform,
    UIManager,
    LayoutAnimation,
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { createStyles, SCREEN_WIDTH } from './styles/theme';
import api from '../config/apiConfig';
import * as Animatable from 'react-native-animatable';


// Habilito a animação de layout no Android para uma transição mais suave ao expandir os cards.
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Criei um mapa para traduzir o número do dia da semana para o nome correspondente.
const DAY_OF_WEEK_MAP = {
    1: 'Segunda-feira',
    2: 'Terça-feira',
    3: 'Quarta-feira',
    4: 'Quinta-feira',
    5: 'Sexta-feira',
    6: 'Sábado',
    7: 'Domingo',
};


// Este é o componente para cada exercício individual na lista.
// Usei o 'memo' para otimizar a performance, evitando que ele renderize novamente se as props não mudarem.
const ExerciseItem = memo(({ exercise, theme }) => {
    const styles = createTrainingStyles(theme);
    return (
        <View style={styles.exerciseItem}>
            <Image
                source={{ uri: exercise.image || 'https://via.placeholder.com/150' }}
                style={styles.exerciseImage}
            />
            <View style={styles.exerciseDetails}>
                <Text style={styles.exerciseName} numberOfLines={1}>{exercise.name}</Text>
                <View style={styles.exerciseInfoRow}>
                    <FeatherIcon name="repeat" size={14} color={theme.TEXT_COLOR_SECONDARY} />
                    <Text style={styles.exerciseInfoText}>{exercise.sets} séries x {exercise.reps} reps</Text>
                </View>
            </View>
        </View>
    );
});

// Essa é a tela principal de treinos.
const TrainingScreen = ({ theme, user, onNavigateToProfile, completedWorkouts }) => {
    const commonStyles = createStyles(theme);
    const componentStyles = createTrainingStyles(theme);

    // Estados para controlar os treinos, o carregamento e qual card está expandido.
    const [workouts, setWorkouts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedWorkoutId, setExpandedWorkoutId] = useState(null);

    // Função simples para pegar as iniciais do nome do usuário para o avatar.
    const getInitials = (nameStr) => {
        if (!nameStr) return '?';
        const words = nameStr.split(' ').filter(Boolean);
        if (words.length > 1) { return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase(); }
        if (words.length === 1 && words[0].length > 0) { return words[0][0].toUpperCase(); }
        return '?';
    };

    // Decide se renderiza a imagem do avatar do usuário ou as iniciais.
    const renderAvatar = () => {
        if (user?.avatar) {
            return <Image source={{ uri: user.avatar }} style={componentStyles.avatar} />;
        }
        return (
            <View style={componentStyles.avatarPlaceholder}>
                <Text style={componentStyles.avatarPlaceholderText}>{getInitials(user?.name)}</Text>
            </View>
        );
    };

    // Efeito para buscar os treinos na API assim que a tela é montada ou o ID do usuário muda.
    useEffect(() => {
        const fetchWorkouts = async () => {
            if (!user?.uid) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const response = await api.get(`/api/workouts/${user.uid}`);
                const data = response.data;
                if (data && Array.isArray(data)) {
                    // Ordeno os treinos pelo dia da semana antes de salvar no estado.
                    const sortedWorkouts = data.sort((a, b) => Number(a.dayOfWeek) - Number(b.dayOfWeek));
                    setWorkouts(sortedWorkouts);
                } else {
                    setWorkouts([]);
                }
            } catch (error) {
                Alert.alert("Erro", "Não foi possível carregar os treinos.");
                console.error("Erro ao buscar treinos:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchWorkouts();
    }, [user?.uid]);

    // Função para controlar a expansão e o recolhimento dos cards de treino.
    const handleToggleWorkout = (workoutId) => {
        if (Platform.OS !== 'web') {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        }
        setExpandedWorkoutId(prevId => (prevId === workoutId ? null : workoutId));
    };

    // Renderiza cada item da lista de treinos, incluindo os dias de descanso.
    const renderWorkoutItem = (workout) => {
        const isExpanded = expandedWorkoutId === workout.id;
        const dayName = DAY_OF_WEEK_MAP[workout.dayOfWeek] || 'Dia';
        const isCompleted = completedWorkouts.has(workout.id);

        // Se o treino não tiver um título, considero como um dia de descanso.
        if (!workout.title) {
            return (
                <Animatable.View key={workout.dayOfWeek} animation="fadeInUp" duration={500} useNativeDriver={true}>
                    <View style={[componentStyles.workoutCard, componentStyles.restDayCard]}>
                        <MaterialCommunityIcon name="bed" size={24} color={theme.TEXT_COLOR_SECONDARY} style={{ marginRight: 16 }} />
                        <View style={componentStyles.workoutDetails}>
                            <Text style={componentStyles.workoutDay}>{dayName}</Text>
                            <Text style={componentStyles.workoutTitle}>Dia de Descanso</Text>
                        </View>
                    </View>
                </Animatable.View>
            );
        }

        // Se for um dia de treino normal, renderiza o card interativo.
        return (
            <Animatable.View key={workout.id} animation="fadeInUp" duration={500} delay={100} style={componentStyles.workoutCardContainer} useNativeDriver={true}>
                <TouchableOpacity
                    style={componentStyles.workoutCard}
                    activeOpacity={0.8}
                    onPress={() => handleToggleWorkout(workout.id)}>
                    <View style={{ marginRight: 16 }}>
                        {isCompleted
                            ? <FeatherIcon name="check-circle" size={24} color={theme.SUCCESS_COLOR} />
                            : <MaterialCommunityIcon name="weight-lifter" size={24} color={theme.PRIMARY_YELLOW} />
                        }
                    </View>
                    <View style={componentStyles.workoutDetails}>
                        <Text style={componentStyles.workoutDay}>{dayName}</Text>
                        <Text style={componentStyles.workoutTitle} numberOfLines={1}>{workout.title}: {workout.focus}</Text>
                    </View>
                    <FeatherIcon name={isExpanded ? "chevron-up" : "chevron-down"} size={24} color={theme.TEXT_COLOR_SECONDARY} />
                </TouchableOpacity>

                {isExpanded && (
                    <View style={componentStyles.expandedContent}>
                        {workout.exercises && workout.exercises.length > 0
                            ? workout.exercises.map((ex, index) => <ExerciseItem key={`${workout.id}-ex-${index}`} exercise={ex} theme={theme} />)
                            : <Text style={componentStyles.noExercisesText}>Nenhum exercício cadastrado.</Text>
                        }
                    </View>
                )}
            </Animatable.View>
        );
    };

    // Controla o que é exibido: o loader, a mensagem de estado vazio ou a lista de treinos.
    const renderContent = () => {
        if (isLoading) {
            return <ActivityIndicator size="large" color={theme.PRIMARY_YELLOW} style={{ marginTop: 50 }} />;
        }
        if (workouts.length === 0) {
            return (
                <View style={componentStyles.emptyStateContainer}>
                    <MaterialCommunityIcon name="clipboard-text-off-outline" size={50} color={theme.TEXT_COLOR_SECONDARY} />
                    <Text style={componentStyles.emptyStateText}>Nenhum treino encontrado.</Text>
                    <Text style={componentStyles.emptyStateSubText}>Seu plano de treinos aparecerá aqui.</Text>
                </View>
            );
        }
        return workouts.map(renderWorkoutItem);
    };

    // Aqui monto a estrutura final da tela.
    return (
        <ScrollView contentContainerStyle={commonStyles.pageContainer} showsVerticalScrollIndicator={false}>
            <View style={componentStyles.header}>
                <Image
                    source={require('./montanini.png')}
                    style={componentStyles.logoImage}
                    resizeMode="contain"
                />
                <TouchableOpacity onPress={onNavigateToProfile} activeOpacity={0.8}>
                    {renderAvatar()}
                </TouchableOpacity>
            </View>

            <View style={componentStyles.greetingTextContainer}>
                <Text style={componentStyles.greetingText}>Bem-vindo de volta,</Text>
                <Text style={componentStyles.userName}>{user ? user.name.split(' ')[0] : 'Usuário'}</Text>
            </View>

            <View style={commonStyles.section}>
                <View style={componentStyles.sectionHeader}>
                    <Text style={commonStyles.sectionTitle}>Treinos da Semana</Text>
                </View>
                {renderContent()}
            </View>
        </ScrollView>
    );
};


// Folha de estilos específica para esta tela.
const createTrainingStyles = (theme) => StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 10,
    },
    logoImage: {
        width: 40,
        height: 40,
        tintColor: theme.PRIMARY_YELLOW,
    },
    avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: theme.PRIMARY_YELLOW },
    avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.CARD_COLOR, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.PRIMARY_YELLOW },
    avatarPlaceholderText: { color: theme.PRIMARY_YELLOW, fontWeight: 'bold', fontSize: 16 },

    greetingTextContainer: { marginBottom: 32, marginTop: 16 },
    greetingText: { color: theme.TEXT_COLOR_SECONDARY, fontSize: SCREEN_WIDTH * 0.045 },
    userName: { color: theme.TEXT_COLOR_PRIMARY, fontSize: SCREEN_WIDTH * 0.07, fontWeight: 'bold' },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },

    workoutCardContainer: {
        backgroundColor: theme.CARD_COLOR,
        borderRadius: 16,
        marginBottom: 12,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, },
            android: { elevation: 3, },
        }),
    },
    workoutCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    restDayCard: {
        backgroundColor: theme.CARD_COLOR,
        borderRadius: 16,
        marginBottom: 12,
        opacity: 0.8,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: theme.BORDER_COLOR
    },
    workoutDetails: { flex: 1, marginHorizontal: 0 },
    workoutDay: { color: theme.TEXT_COLOR_SECONDARY, fontSize: SCREEN_WIDTH * 0.035, fontWeight: 'bold', marginBottom: 2 },
    workoutTitle: { color: theme.TEXT_COLOR_PRIMARY, fontSize: SCREEN_WIDTH * 0.04, fontWeight: '600' },

    expandedContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderTopColor: theme.BORDER_COLOR,
        marginTop: 8,
    },
    exerciseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    exerciseImage: {
        width: 50,
        height: 50,
        borderRadius: 8,
        backgroundColor: theme.BACKGROUND_COLOR,
    },
    exerciseDetails: {
        flex: 1,
        marginLeft: 12,
    },
    exerciseName: {
        color: theme.TEXT_COLOR_PRIMARY,
        fontSize: SCREEN_WIDTH * 0.038,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    exerciseInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    exerciseInfoText: {
        color: theme.TEXT_COLOR_SECONDARY,
        fontSize: SCREEN_WIDTH * 0.035,
    },
    noExercisesText: {
        color: theme.TEXT_COLOR_SECONDARY,
        textAlign: 'center',
        paddingVertical: 20,
        fontStyle: 'italic',
    },
    emptyStateContainer: { alignItems: 'center', justifyContent: 'center', padding: 30, backgroundColor: theme.CARD_COLOR, borderRadius: 16, marginTop: 20 },
    emptyStateText: { marginTop: 16, fontSize: SCREEN_WIDTH * 0.04, color: theme.TEXT_COLOR_PRIMARY, fontWeight: 'bold', textAlign: 'center' },
    emptyStateSubText: { marginTop: 8, fontSize: SCREEN_WIDTH * 0.035, color: theme.TEXT_COLOR_SECONDARY, textAlign: 'center', paddingHorizontal: 20 },
});

export default TrainingScreen;
