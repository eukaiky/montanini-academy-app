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

// Hooks de autenticação e navegação
import { useAuth } from './context/AuthContext';
import { useRouter } from 'expo-router';

// Telas separadas
import TrainingScreen from './TrainingScreen';
import SettingsScreen from './SettingsScreen';
import ProfileScreen from './ProfileScreen';

// Estilos e Temas
import { darkTheme, lightTheme, SCREEN_WIDTH, SCREEN_HEIGHT, isSmallDevice } from './styles/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Componente para telas em desenvolvimento
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

    const handleFinishWorkout = () => { onFinish(workout.id); onClose(); };
    const handleNext = () => { currentExerciseIndex < workout.exercises.length - 1 ? setCurrentExerciseIndex(prev => prev + 1) : handleFinishWorkout(); };
    const handlePrevious = () => currentExerciseIndex > 0 && setCurrentExerciseIndex(prev => prev - 1);
    const toggleComplete = (exerciseName) => {
        const newSet = new Set(completedExercises);
        newSet.has(exerciseName) ? newSet.delete(exerciseName) : newSet.add(exerciseName);
        setCompletedExercises(newSet);
    };

    const currentExercise = workout.exercises[currentExerciseIndex];

    // *** CORREÇÃO APLICADA AQUI ***
    // Esta verificação impede o app de quebrar se 'currentExercise' for indefinido.
    if (!currentExercise) {
        return null;
    }

    const isCompleted = completedExercises.has(currentExercise.name);

    return (
        <Modal transparent={true} visible={visible} onRequestClose={onClose}>
            <Animated.View style={[styles.playerContainer, { transform: [{ translateY: slideAnim }] }]}>
                <SafeAreaView style={{ flex: 1, backgroundColor: theme.BACKGROUND_COLOR }}>
                    <View style={styles.playerHeader}>
                        <TouchableOpacity onPress={onClose} style={styles.playerHeaderButton}><FeatherIcon name="x" size={24} color={theme.TEXT_COLOR_SECONDARY} /></TouchableOpacity>
                        <View><Text style={styles.playerTitle}>{workout.title}</Text><Text style={styles.playerSubtitle}>{`${currentExerciseIndex + 1} / ${workout.exercises.length}`}</Text></View>
                        <TouchableOpacity onPress={handleFinishWorkout}><Text style={styles.playerFinishText}>Finalizar</Text></TouchableOpacity>
                    </View>
                    <View style={styles.playerContent}>
                        <ImageBackground source={{ uri: currentExercise.image }} style={styles.playerExerciseImage} imageStyle={styles.playerExerciseImageStyle}>
                            <View style={styles.playerImageOverlay} /><Text style={styles.playerExerciseName}>{currentExercise.name}</Text>
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
                            <Text style={styles.playerNextButtonText}>{currentExerciseIndex === workout.exercises.length - 1 ? 'Finalizar' : 'Próximo'}</Text>
                            <FeatherIcon name="arrow-right" size={20} color={theme.BACKGROUND_COLOR === darkTheme.BACKGROUND_COLOR ? darkTheme.BACKGROUND_COLOR : lightTheme.TEXT_COLOR_PRIMARY } />
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
    const [theme, setTheme] = useState('dark');
    const [activeTab, setActiveTab] = useState('Treino');
    const [isWorkoutVisible, setWorkoutVisible] = useState(false);
    const [selectedWorkout, setSelectedWorkout] = useState(null);
    const [completedWorkouts, setCompletedWorkouts] = useState(new Set());

    const themeColors = theme === 'dark' ? darkTheme : lightTheme;
    const styles = createAppStyles(themeColors);

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

    const renderContent = () => {
        switch (activeTab) {
            case 'Treino': return <TrainingScreen onStartWorkout={handleStartWorkout} theme={themeColors} user={user} completedWorkouts={completedWorkouts} />;
            case 'Perfil': return <ProfileScreen theme={themeColors} user={user} />;
            case 'Config': return <SettingsScreen theme={themeColors} setTheme={setTheme} user={user} onSignOut={handleSignOut} />;
            default: return <TrainingScreen onStartWorkout={handleStartWorkout} theme={themeColors} user={user} completedWorkouts={completedWorkouts} />;
        }
    };

    const NavItem = ({ name, icon }) => {
        const isActive = activeTab === name;
        return (
            <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab(name)}>
                <MaterialCommunityIcon name={icon} size={isActive ? 30 : 28} color={isActive ? themeColors.PRIMARY_YELLOW : themeColors.TEXT_COLOR_SECONDARY} />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={themeColors.BACKGROUND_COLOR} />
            <View style={{ flex: 1 }}>{renderContent()}</View>
            <WorkoutPlayerScreen visible={isWorkoutVisible} onClose={() => setWorkoutVisible(false)} onFinish={handleFinishWorkout} workout={selectedWorkout} theme={themeColors} />
            <View style={styles.navBarContainer}>
                <View style={styles.navBar}>
                    <NavItem name="Perfil" icon="account-outline" />
                    <View style={styles.navItem} />
                    <NavItem name="Config" icon="cog-outline" />
                </View>
                <TouchableOpacity style={styles.navBarCenterButton} onPress={() => setActiveTab('Treino')}>
                    <MaterialCommunityIcon name="weight-lifter" size={32} color={themeColors.BACKGROUND_COLOR === darkTheme.BACKGROUND_COLOR ? darkTheme.BACKGROUND_COLOR : lightTheme.TEXT_COLOR_PRIMARY} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const createAppStyles = (theme) => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.BACKGROUND_COLOR },
    navBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', height: 110 },
    navBar: { flexDirection: 'row', backgroundColor: theme.CARD_COLOR, height: 65, width: '90%', maxWidth: 400, borderRadius: 32.5, position: 'absolute', bottom: Platform.OS === 'ios' ? 30 : 20, alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 20 },
    navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    navBarCenterButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.PRIMARY_YELLOW, justifyContent: 'center', alignItems: 'center', position: 'absolute', bottom: Platform.OS === 'ios' ? 55 : 45, borderWidth: 5, borderColor: theme.BACKGROUND_COLOR, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 11 },
});

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
    playerNextButtonText: { color: theme.BACKGROUND_COLOR === darkTheme.BACKGROUND_COLOR ? darkTheme.BACKGROUND_COLOR : lightTheme.TEXT_COLOR_PRIMARY, fontSize: SCREEN_WIDTH * 0.045, fontWeight: 'bold' },
});

