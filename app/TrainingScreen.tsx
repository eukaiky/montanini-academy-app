import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Image,
    ImageBackground,
    Animated,
    Alert,
    ActivityIndicator,
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { createStyles, SCREEN_WIDTH, SCREEN_HEIGHT, darkTheme, lightTheme } from './styles/theme';

// Helper hook to get the previous value of a prop or state
const usePrevious = (value) => {
    const ref = useRef();
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
};

// Componente de Cabeçalho com Avatar
const GreetingHeader = ({ user, theme, onNavigateToProfile }) => {
    const componentStyles = createTrainingStyles(theme);
    const getInitials = (nameStr) => {
        if (!nameStr) return '?';
        const words = nameStr.split(' ').filter(Boolean);
        if (words.length > 1) { return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase(); }
        if (words.length === 1 && words[0].length > 0) { return words[0][0].toUpperCase(); }
        return '?';
    };

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

    return (
        <View style={componentStyles.greetingHeader}>
            <TouchableOpacity onPress={onNavigateToProfile} activeOpacity={0.8}>
                {renderAvatar()}
            </TouchableOpacity>

            <View style={componentStyles.greetingTextContainer}>
                <Text style={componentStyles.greetingText}>Bem-vindo de volta,</Text>
                <Text style={componentStyles.userName}>{user ? user.name.split(' ')[0] : 'Usuário'}</Text>
            </View>
        </View>
    );
};

const WorkoutCompletionCard = ({ theme }) => {
    const componentStyles = createTrainingStyles(theme);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <Animated.View style={[componentStyles.completionCard, { opacity: fadeAnim }]}>
            <FeatherIcon name="check-circle" size={24} color={theme.SUCCESS_COLOR} />
            <View style={componentStyles.completionTextContainer}>
                <Text style={componentStyles.completionTitle}>Parabéns!</Text>
                <Text style={componentStyles.completionSubtitle}>Você concluiu o treino de hoje.</Text>
            </View>
        </Animated.View>
    );
};

// *** NOVO COMPONENTE: Card de Progresso da Semana ***
const WeeklyProgressCard = ({ theme, workouts, completedWorkouts }) => {
    const styles = createTrainingStyles(theme);
    const [progress, setProgress] = useState(0);
    const [completedCount, setCompletedCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        const activeWorkouts = workouts.filter(w => w.title); // Exclui dias de descanso
        const total = activeWorkouts.length;

        const weeklyWorkoutIds = new Set(activeWorkouts.map(w => w.id));
        const completed = [...completedWorkouts].filter(id => weeklyWorkoutIds.has(id)).length;

        setTotalCount(total);
        setCompletedCount(completed);
        setProgress(total > 0 ? (completed / total) * 100 : 0);
    }, [workouts, completedWorkouts]);

    const getMotivationalMessage = () => {
        if (progress === 0) return "Vamos começar a semana com tudo!";
        if (progress > 0 && progress < 50) return "Ótimo começo, continue assim!";
        if (progress >= 50 && progress < 100) return "Você está na metade, força!";
        if (progress === 100) return "Semana concluída com sucesso. Parabéns!";
        return "Continue focado no seu objetivo!";
    };

    return (
        <View style={styles.progressCardContainer}>
            <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Progresso da Semana</Text>
                <Text style={styles.progressFraction}>{completedCount} / {totalCount}</Text>
            </View>
            <View style={styles.progressBarBackground}>
                <Animated.View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressMessage}>{getMotivationalMessage()}</Text>
        </View>
    );
};


const TrainingScreen = ({ onStartWorkout, theme, user, completedWorkouts, onNavigateToProfile }) => {
    const commonStyles = createStyles(theme);
    const componentStyles = createTrainingStyles(theme);

    const [workouts, setWorkouts] = useState([]);
    const [todayWorkout, setTodayWorkout] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showCompletionMessage, setShowCompletionMessage] = useState(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const prevCompletedWorkouts = usePrevious(completedWorkouts);

    const dayOfWeekMap = { 0: 'Domingo', 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado' };
    const weekOrder = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

    useEffect(() => {
        const fetchWorkouts = async () => {
            if (!user?.uid) { setIsLoading(false); return; }
            setIsLoading(true);
            try {
                const response = await fetch(`http://192.168.3.10:3000/api/workouts/${user.uid}`);
                if (!response.ok) throw new Error('A resposta da rede não foi OK');

                const data = await response.json();
                const sortedWorkouts = data.sort((a, b) => weekOrder.indexOf(a.dayOfWeek) - weekOrder.indexOf(b.dayOfWeek));
                setWorkouts(sortedWorkouts);

                const currentDayName = dayOfWeekMap[new Date().getDay()];
                const workoutForToday = data.find(w => w.dayOfWeek === currentDayName);
                setTodayWorkout(workoutForToday);

            } catch (error) {
                console.error("Falha ao buscar treinos:", error);
                Alert.alert("Erro", "Não foi possível carregar os treinos.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchWorkouts();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.03, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        ).start();
    }, [user]);

    useEffect(() => {
        if (prevCompletedWorkouts && todayWorkout) {
            const justCompletedToday = !prevCompletedWorkouts.has(todayWorkout.id) && completedWorkouts.has(todayWorkout.id);
            if (justCompletedToday) {
                setShowCompletionMessage(true);
                const timer = setTimeout(() => setShowCompletionMessage(false), 4000);
                return () => clearTimeout(timer);
            }
        }
    }, [completedWorkouts, prevCompletedWorkouts, todayWorkout]);

    const renderWorkoutList = () => {
        if (isLoading) { return <ActivityIndicator size="large" color={theme.PRIMARY_YELLOW} style={{ marginTop: 50 }} />; }
        if (workouts.length === 0) {
            return (
                <View style={componentStyles.emptyStateContainer}>
                    <MaterialCommunityIcon name="clipboard-text-off-outline" size={50} color={theme.TEXT_COLOR_SECONDARY} />
                    <Text style={componentStyles.emptyStateText}>Nenhum treino encontrado para esta semana.</Text>
                </View>
            );
        }

        const isTodayWorkoutCompleted = todayWorkout && completedWorkouts.has(todayWorkout.id);

        return (
            <>
                {!isTodayWorkoutCompleted && todayWorkout && (
                    <TouchableOpacity activeOpacity={0.9} onPress={() => onStartWorkout(todayWorkout)}>
                        <ImageBackground source={{ uri: todayWorkout.image }} style={componentStyles.todayCard} imageStyle={componentStyles.todayCardImage}>
                            <View style={componentStyles.cardOverlay} />
                            <View style={componentStyles.todayTag}><Text style={componentStyles.todayTagText}>TREINO DE HOJE</Text></View>
                            <View style={componentStyles.todayCardContent}>
                                <Text style={componentStyles.todayTitle}>{todayWorkout.title}</Text>
                                <Text style={componentStyles.todayFocus}>{todayWorkout.focus}</Text>
                                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                                    <TouchableOpacity style={componentStyles.startButton} onPress={() => onStartWorkout(todayWorkout)}>
                                        <Text style={componentStyles.startButtonText}>Começar Treino</Text>
                                        <FeatherIcon name="play" size={16} color={theme.BACKGROUND_COLOR} />
                                    </TouchableOpacity>
                                </Animated.View>
                            </View>
                        </ImageBackground>
                    </TouchableOpacity>
                )}

                {workouts.map(workout => {
                    if (workout.id === todayWorkout?.id && !isTodayWorkoutCompleted) { return null; }
                    const isCompleted = completedWorkouts.has(workout.id);
                    if (!workout.title) {
                        return (
                            <View key={workout.dayOfWeek} style={[componentStyles.otherWorkoutCard, componentStyles.restDayCard]}>
                                <View style={componentStyles.otherWorkoutIcon}><MaterialCommunityIcon name="bed" size={24} color={theme.TEXT_COLOR_SECONDARY} /></View>
                                <View style={componentStyles.otherWorkoutDetails}><Text style={componentStyles.otherWorkoutDay}>{workout.dayOfWeek}</Text><Text style={componentStyles.otherWorkoutTitle}>Dia de Descanso</Text></View>
                            </View>
                        )
                    }
                    return (
                        <TouchableOpacity key={workout.id} style={[componentStyles.otherWorkoutCard, isCompleted && componentStyles.completedWorkoutCard]} activeOpacity={0.7} onPress={() => onStartWorkout(workout)}>
                            <View style={componentStyles.otherWorkoutIcon}>{isCompleted? <FeatherIcon name="check-circle" size={24} color={theme.SUCCESS_COLOR} />: <MaterialCommunityIcon name="weight-lifter" size={24} color={theme.TEXT_COLOR_SECONDARY} />}</View>
                            <View style={componentStyles.otherWorkoutDetails}><Text style={componentStyles.otherWorkoutDay}>{workout.dayOfWeek}</Text><Text style={componentStyles.otherWorkoutTitle} numberOfLines={1}>{workout.title}: {workout.focus}</Text></View>
                            <FeatherIcon name="chevron-right" size={24} color={theme.TEXT_COLOR_SECONDARY} />
                        </TouchableOpacity>
                    );
                })}
            </>
        )
    };

    return (
        <ScrollView contentContainerStyle={commonStyles.pageContainer} showsVerticalScrollIndicator={false}>
            <GreetingHeader user={user} theme={theme} onNavigateToProfile={onNavigateToProfile} />

            {showCompletionMessage && <WorkoutCompletionCard theme={theme} />}

            <View style={commonStyles.section}>
                <View style={componentStyles.sectionHeader}><FeatherIcon name="list" size={18} color={theme.TEXT_COLOR_SECONDARY} /><Text style={commonStyles.sectionTitle}>Seus Treinos</Text></View>
                {renderWorkoutList()}
            </View>

            <View style={commonStyles.section}>
                <View style={componentStyles.sectionHeader}><MaterialCommunityIcon name="chart-donut" size={18} color={theme.TEXT_COLOR_SECONDARY} /><Text style={commonStyles.sectionTitle}>Sua Performance</Text></View>
                <WeeklyProgressCard theme={theme} workouts={workouts} completedWorkouts={completedWorkouts} />
            </View>
        </ScrollView>
    );
}

const createTrainingStyles = (theme) => StyleSheet.create({
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    // --- Cabeçalho ---
    greetingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: theme.PRIMARY_YELLOW,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: theme.CARD_COLOR,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: theme.PRIMARY_YELLOW,
    },
    avatarPlaceholderText: {
        color: theme.PRIMARY_YELLOW,
        fontWeight: 'bold',
        fontSize: 18,
    },
    greetingTextContainer: {
        flex: 1,
        marginLeft: 16,
    },
    greetingText: {
        color: theme.TEXT_COLOR_SECONDARY,
        fontSize: SCREEN_WIDTH * 0.04,
    },
    userName: {
        color: theme.TEXT_COLOR_PRIMARY,
        fontSize: SCREEN_WIDTH * 0.055,
        fontWeight: 'bold',
    },

    // --- Card de Conclusão ---
    completionCard: {
        backgroundColor: `${theme.SUCCESS_COLOR}20`,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.SUCCESS_COLOR,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    completionTextContainer: {
        marginLeft: 12,
    },
    completionTitle: {
        color: theme.SUCCESS_COLOR,
        fontSize: SCREEN_WIDTH * 0.04,
        fontWeight: 'bold',
    },
    completionSubtitle: {
        color: theme.TEXT_COLOR_PRIMARY,
        fontSize: SCREEN_WIDTH * 0.035,
    },

    // --- Card de Hoje ---
    todayCard: {
        height: SCREEN_HEIGHT * 0.35,
        borderRadius: 24,
        padding: 20,
        justifyContent: 'flex-end',
        overflow: 'hidden',
        marginBottom: 16,
    },
    todayCardImage: {
        borderRadius: 24,
    },
    cardOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.65)',
        borderRadius: 24,
    },
    todayTag: {
        position: 'absolute',
        top: 20,
        left: 20,
        backgroundColor: theme.PRIMARY_YELLOW,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    todayTagText: {
        color: theme.BACKGROUND_COLOR === darkTheme.BACKGROUND_COLOR ? darkTheme.BACKGROUND_COLOR : lightTheme.TEXT_COLOR_PRIMARY,
        fontWeight: 'bold',
        fontSize: SCREEN_WIDTH * 0.03,
        letterSpacing: 1,
    },
    todayCardContent: {
        alignItems: 'center',
    },
    todayTitle: {
        color: darkTheme.TEXT_COLOR_PRIMARY,
        fontSize: SCREEN_WIDTH * 0.07,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    todayFocus: {
        color: theme.PRIMARY_YELLOW,
        fontSize: SCREEN_WIDTH * 0.04,
        fontWeight: '600',
        marginBottom: 24,
    },
    startButton: {
        backgroundColor: theme.PRIMARY_YELLOW,
        borderRadius: 99,
        paddingVertical: 14,
        paddingHorizontal: 32,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    startButtonText: {
        color: theme.BACKGROUND_COLOR === darkTheme.BACKGROUND_COLOR ? darkTheme.BACKGROUND_COLOR : lightTheme.TEXT_COLOR_PRIMARY,
        fontSize: SCREEN_WIDTH * 0.04,
        fontWeight: 'bold',
    },

    // --- Cards da Semana ---
    otherWorkoutCard: {
        backgroundColor: theme.CARD_COLOR,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    completedWorkoutCard: {
        backgroundColor: `${theme.SUCCESS_COLOR}20`,
    },
    restDayCard: {
        backgroundColor: theme.CARD_COLOR,
        opacity: 0.6,
    },
    otherWorkoutIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.BACKGROUND_COLOR,
        alignItems: 'center',
        justifyContent: 'center',
    },
    otherWorkoutDetails: {
        flex: 1,
        marginLeft: 16,
        marginRight: 8,
    },
    otherWorkoutDay: {
        color: theme.TEXT_COLOR_SECONDARY,
        fontSize: SCREEN_WIDTH * 0.035,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    otherWorkoutTitle: {
        color: theme.TEXT_COLOR_PRIMARY,
        fontSize: SCREEN_WIDTH * 0.04,
        fontWeight: '600',
    },

    // --- Estado Vazio ---
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
        backgroundColor: theme.CARD_COLOR,
        borderRadius: 16,
        marginTop: 20,
    },
    emptyStateText: {
        marginTop: 16,
        fontSize: SCREEN_WIDTH * 0.04,
        color: theme.TEXT_COLOR_SECONDARY,
        textAlign: 'center',
        paddingHorizontal: 20,
    },

    // *** NOVOS ESTILOS: Card de Progresso Semanal ***
    progressCardContainer: {
        backgroundColor: theme.CARD_COLOR,
        borderRadius: 16,
        padding: 20,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    progressTitle: {
        color: theme.TEXT_COLOR_PRIMARY,
        fontSize: SCREEN_WIDTH * 0.04,
        fontWeight: 'bold',
    },
    progressFraction: {
        color: theme.TEXT_COLOR_SECONDARY,
        fontSize: SCREEN_WIDTH * 0.04,
        fontWeight: 'bold',
    },
    progressBarBackground: {
        height: 10,
        backgroundColor: theme.BACKGROUND_COLOR,
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: theme.SUCCESS_COLOR,
        borderRadius: 5,
    },
    progressMessage: {
        color: theme.TEXT_COLOR_SECONDARY,
        fontSize: SCREEN_WIDTH * 0.035,
        marginTop: 12,
        fontStyle: 'italic',
        textAlign: 'center',
    },
});

export default TrainingScreen;

