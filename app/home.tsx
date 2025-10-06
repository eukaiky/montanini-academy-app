import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    SafeAreaView,
    TouchableOpacity,
    ImageBackground,
    Modal,
    Animated,
    UIManager,
    Platform,
    StatusBar,
    Text,
    Alert,
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Hooks e Telas
import { useAuth } from './context/AuthContext';
import { useRouter } from 'expo-router';
import TrainingScreen from './training';
import SettingsScreen from './settings';
import ProfileScreen from './profile';

// Estilos e Temas
import { darkTheme, lightTheme, SCREEN_WIDTH, SCREEN_HEIGHT, isSmallDevice } from './styles/theme';

// Habilita animações no Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Componente genérico para telas em desenvolvimento
const PlaceholderScreen = ({ title, theme }) => {
    const styles = StyleSheet.create({
        placeholderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, gap: 16, backgroundColor: theme.BACKGROUND_COLOR },
        placeholderTitle: { color: theme.TEXT_COLOR_PRIMARY, fontSize: SCREEN_WIDTH * 0.06, fontWeight: 'bold' },
        tipText: { color: theme.TEXT_COLOR_SECONDARY, fontSize: SCREEN_WIDTH * 0.04, lineHeight: 22, textAlign: 'center' },
    });
    return (
        <View style={styles.placeholderContainer}>
            <MaterialCommunityIcon name="hammer-wrench" size={60} color={theme.PRIMARY_YELLOW} />
            <Text style={styles.placeholderTitle}>{title}</Text>
            <Text style={styles.tipText}>Esta área está em desenvolvimento.</Text>
        </View>
    );
};

// Componente do Player de Treino (Modal)
const WorkoutPlayerScreen = ({ visible, onClose, onFinish, workout, theme }) => {
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [completedExercises, setCompletedExercises] = useState(new Set());
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const styles = createPlayerStyles(theme);

    // Controla a animação de entrada e saída do modal
    useEffect(() => {
        if (visible) {
            setCurrentExerciseIndex(0);
            setCompletedExercises(new Set());
            Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start();
        } else {
            Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 400, useNativeDriver: true }).start();
        }
    }, [visible, slideAnim]);

    if (!workout || !workout.exercises || workout.exercises.length === 0) return null;

    const currentExercise = workout.exercises[currentExerciseIndex];

    const handleFinishWorkout = () => {
        onFinish(workout.id);
        onClose();
    };
    const handleNext = () => {
        if (currentExerciseIndex < workout.exercises.length - 1) {
            setCurrentExerciseIndex(prev => prev + 1);
        } else {
            handleFinishWorkout();
        }
    };
    const handlePrevious = () => {
        if (currentExerciseIndex > 0) {
            setCurrentExerciseIndex(prev => prev - 1);
        }
    };
    const toggleComplete = (exerciseName) => {
        const newSet = new Set(completedExercises);
        if (newSet.has(exerciseName)) {
            newSet.delete(exerciseName);
        } else {
            newSet.add(exerciseName);
        }
        setCompletedExercises(newSet);
    };

    if (!currentExercise) return null;

    const isCompleted = completedExercises.has(currentExercise.name);

    return (
        <Modal transparent={true} visible={visible} onRequestClose={onClose}>
            <Animated.View style={[styles.playerContainer, { transform: [{ translateY: slideAnim }] }]}>
                <SafeAreaView style={{ flex: 1, backgroundColor: theme.BACKGROUND_COLOR }}>
                    <View style={styles.playerHeader}>
                        <TouchableOpacity onPress={onClose} style={styles.playerHeaderButton}><FeatherIcon name="x" size={24} color={theme.TEXT_COLOR_SECONDARY} /></TouchableOpacity>
                        <View>
                            <Text style={styles.playerTitle}>{workout.title}</Text>
                            <Text style={styles.playerSubtitle}>{`${currentExerciseIndex + 1} / ${workout.exercises.length}`}</Text>
                        </View>
                        <TouchableOpacity onPress={handleFinishWorkout}><Text style={styles.playerFinishText}>Finalizar</Text></TouchableOpacity>
                    </View>

                    <View style={styles.playerContent}>
                        <ImageBackground source={{ uri: currentExercise.image }} style={styles.playerExerciseImage} imageStyle={styles.playerExerciseImageStyle}>
                            <View style={styles.playerImageOverlay} />
                            <Text style={styles.playerExerciseName}>{currentExercise.name}</Text>
                        </ImageBackground>

                        <View style={styles.playerExerciseDetails}>
                            <View style={styles.playerDetailItem}><Text style={styles.playerDetailLabel}>Séries</Text><Text style={styles.playerDetailValue}>{currentExercise.sets}</Text></View>
                            <View style={styles.playerDetailItem}><Text style={styles.playerDetailLabel}>Reps</Text><Text style={styles.playerDetailValue}>{currentExercise.reps}</Text></View>
                            <View style={styles.playerDetailItem}><Text style={styles.playerDetailLabel}>Carga</Text><Text style={styles.playerDetailValue}>{currentExercise.weight || 'N/A'}</Text></View>
                        </View>

                        <TouchableOpacity style={[styles.playerCompleteButton, isCompleted && styles.playerCompleteButtonChecked]} onPress={() => toggleComplete(currentExercise.name)}>
                            <FeatherIcon name={isCompleted ? "check-circle" : "circle"} size={24} color={isCompleted ? theme.SUCCESS_COLOR : theme.TEXT_COLOR_SECONDARY} />
                            <Text style={[styles.playerCompleteButtonText, isCompleted && { color: theme.SUCCESS_COLOR }]}>{isCompleted ? 'Exercício Concluído' : 'Marcar como Concluído'}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.playerNav}>
                        <TouchableOpacity onPress={handlePrevious} disabled={currentExerciseIndex === 0} style={[styles.playerNavButton, currentExerciseIndex === 0 && styles.playerNavButtonDisabled]}>
                            <FeatherIcon name="arrow-left" size={24} color={theme.TEXT_COLOR_PRIMARY} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleNext} style={styles.playerNextButton}>
                            <Text style={styles.playerNextButtonText}>{currentExerciseIndex === workout.exercises.length - 1 ? 'Finalizar Treino' : 'Próximo'}</Text>
                            <FeatherIcon name="arrow-right" size={20} color={theme === darkTheme ? theme.BACKGROUND_COLOR : theme.TEXT_COLOR_PRIMARY} />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Animated.View>
        </Modal>
    );
};

export default function HomeScreen() {
    const { user, signOut: contextSignOut } = useAuth();
    const router = useRouter();

    // Estados da UI
    const [activeTab, setActiveTab] = useState('Treino');
    const [isWorkoutVisible, setWorkoutVisible] = useState(false);
    const [selectedWorkout, setSelectedWorkout] = useState(null);
    const [completedWorkouts, setCompletedWorkouts] = useState(new Set());
    const [theme, setTheme] = useState(lightTheme); // Padrão inicial

    // Carrega o tema salvo ao iniciar
    useEffect(() => {
        const loadTheme = async () => {
            const savedTheme = await AsyncStorage.getItem('theme');
            setTheme(savedTheme === 'dark' ? darkTheme : lightTheme);
        };
        loadTheme();
    }, []);

    const handleSignOut = async () => {
        try {
            await contextSignOut();
            router.replace('/login');
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
            Alert.alert("Erro", "Não foi possível sair. Tente novamente.");
        }
    };

    const handleStartWorkout = (workout) => {
        if (!workout.exercises || workout.exercises.length === 0) {
            Alert.alert("Sem Exercícios", "Este treino ainda não possui exercícios cadastrados.");
            return;
        }
        setSelectedWorkout(workout);
        setWorkoutVisible(true);
    };

    const handleFinishWorkout = (workoutId) => {
        setCompletedWorkouts(prev => new Set(prev).add(workoutId));
    };

    // Renderiza a tela ativa com base na aba selecionada
    const renderContent = () => {
        switch (activeTab) {
            case 'Treino': return <TrainingScreen onStartWorkout={handleStartWorkout} theme={theme} user={user} completedWorkouts={completedWorkouts} onNavigateToProfile={() => setActiveTab('Perfil')} />;
            case 'Perfil': return <ProfileScreen theme={theme} />;
            case 'Config': return <SettingsScreen theme={theme} setTheme={setTheme} onSignOut={handleSignOut} />;
            default: return <PlaceholderScreen title={activeTab} theme={theme} />;
        }
    };

    // Componente para item da barra de navegação
    const NavItem = ({ name, icon }) => {
        const isActive = activeTab === name;
        return (
            <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab(name)}>
                <FeatherIcon name={icon} size={26} color={isActive ? theme.PRIMARY_YELLOW : theme.TEXT_COLOR_SECONDARY} />
            </TouchableOpacity>
        );
    };

    const styles = createAppStyles(theme);

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle={theme === darkTheme ? 'light-content' : 'dark-content'} backgroundColor={theme.BACKGROUND_COLOR} />

            <View style={{ flex: 1 }}>{renderContent()}</View>

            <WorkoutPlayerScreen
                visible={isWorkoutVisible}
                onClose={() => setWorkoutVisible(false)}
                onFinish={handleFinishWorkout}
                workout={selectedWorkout}
                theme={theme}
            />

            {/* Barra de Navegação Customizada */}
            <View style={styles.navBarContainer}>
                <View style={styles.navBar}>
                    <NavItem name="Perfil" icon="user" />
                    <View style={{ width: 60 }} />
                    <NavItem name="Config" icon="settings" />
                </View>
                <TouchableOpacity onPress={() => setActiveTab('Treino')} style={styles.centerButtonWrapper}>
                    <View style={[styles.centerButton, activeTab === 'Treino' && styles.centerButtonActive]}>
                        <MaterialCommunityIcon
                            name="weight-lifter"
                            size={32}
                            color={activeTab === 'Treino' ? (theme === darkTheme ? theme.BACKGROUND_COLOR : theme.TEXT_COLOR_PRIMARY) : theme.TEXT_COLOR_SECONDARY}
                        />
                    </View>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

// Estilos da Aplicação Principal
const createAppStyles = (theme) => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.BACKGROUND_COLOR },
    navBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        height: 100,
    },
    navBar: {
        flexDirection: 'row',
        backgroundColor: theme.CARD_COLOR,
        height: 65,
        width: '90%',
        maxWidth: 400,
        borderRadius: 32.5,
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 30 : 20,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 30,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1, shadowRadius: 10, },
            android: { elevation: 10, },
        }),
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerButtonWrapper: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 30 : 20,
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: theme.CARD_COLOR,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: theme.BACKGROUND_COLOR,
        transform: [{ translateY: -20 }],
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, },
            android: { elevation: 8, },
        }),
    },
    centerButtonActive: {
        backgroundColor: theme.PRIMARY_YELLOW,
    },
});

// Estilos do Player de Treino
const createPlayerStyles = (theme) => StyleSheet.create({
    playerContainer: { flex: 1, backgroundColor: theme.BACKGROUND_COLOR },
    playerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10 },
    playerHeaderButton: { padding: 8 },
    playerFinishText: { color: theme.PRIMARY_YELLOW, fontSize: SCREEN_WIDTH * 0.04, fontWeight: 'bold' },
    playerTitle: { color: theme.TEXT_COLOR_PRIMARY, fontSize: SCREEN_WIDTH * 0.045, fontWeight: 'bold', textAlign: 'center' },
    playerSubtitle: { color: theme.TEXT_COLOR_SECONDARY, fontSize: SCREEN_WIDTH * 0.035, textAlign: 'center' },
    playerContent: { flex: 1, padding: 16, justifyContent: 'center' },
    playerExerciseImage: { height: SCREEN_HEIGHT * 0.4, borderRadius: 20, justifyContent: 'flex-end', padding: 20 },
    playerExerciseImageStyle: { borderRadius: 20 },
    playerImageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20 },
    playerExerciseName: { color: darkTheme.TEXT_COLOR_PRIMARY, fontSize: SCREEN_WIDTH * 0.08, fontWeight: 'bold', lineHeight: SCREEN_WIDTH * 0.09 },
    playerExerciseDetails: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: theme.CARD_COLOR, borderRadius: 16, padding: 20, marginVertical: 24 },
    playerDetailItem: { alignItems: 'center' },
    playerDetailLabel: { color: theme.TEXT_COLOR_SECONDARY, fontSize: SCREEN_WIDTH * 0.035, marginBottom: 4 },
    playerDetailValue: { color: theme.TEXT_COLOR_PRIMARY, fontSize: SCREEN_WIDTH * 0.05, fontWeight: 'bold' },
    playerCompleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16, borderRadius: 16, borderWidth: 2, borderColor: theme.BORDER_COLOR },
    playerCompleteButtonChecked: { borderColor: theme.SUCCESS_COLOR, backgroundColor: `${theme.SUCCESS_COLOR}1A` },
    playerCompleteButtonText: { color: theme.TEXT_COLOR_SECONDARY, fontSize: SCREEN_WIDTH * 0.04, fontWeight: 'bold' },
    playerNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: isSmallDevice ? 20 : 32 },
    playerNavButton: { padding: 16, backgroundColor: theme.CARD_COLOR, borderRadius: 99 },
    playerNavButtonDisabled: { opacity: 0.5 },
    playerNextButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.PRIMARY_YELLOW, marginLeft: 16, paddingVertical: 16, borderRadius: 99 },
    playerNextButtonText: { color: theme === darkTheme ? theme.BACKGROUND_COLOR : lightTheme.TEXT_COLOR_PRIMARY, fontSize: SCREEN_WIDTH * 0.045, fontWeight: 'bold' },
});
