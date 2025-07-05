import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    SafeAreaView,
    Image,
    TouchableOpacity,
    ImageBackground,
    Modal,
    Dimensions,
    LayoutAnimation,
    UIManager,
    Platform,
    Animated,
    StatusBar,
    Switch,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

// --- Dependências de Ícones ---
import FeatherIcon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

// --- Habilitar LayoutAnimation para Android ---
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Constantes de Layout ---
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

// --- Paletas de Cores para os Temas ---
const darkTheme = {
    PRIMARY_YELLOW: '#FBBF24',
    BACKGROUND_COLOR: '#0A0A0A',
    CARD_COLOR: '#1A1A1A',
    TEXT_COLOR_PRIMARY: '#FFFFFF',
    TEXT_COLOR_SECONDARY: '#A0A0A0',
    BORDER_COLOR: '#2A2A2A',
    SUCCESS_COLOR: '#34D399',
    ERROR_COLOR: '#EF4444',
};

const lightTheme = {
    PRIMARY_YELLOW: '#F59E0B',
    BACKGROUND_COLOR: '#F3F4F6',
    CARD_COLOR: '#FFFFFF',
    TEXT_COLOR_PRIMARY: '#111827',
    TEXT_COLOR_SECONDARY: '#6B7280',
    BORDER_COLOR: '#E5E7EB',
    SUCCESS_COLOR: '#10B981',
    ERROR_COLOR: '#EF4444',
};

// --- Dados Mock ---
const workoutData = [
    { id: 'A', title: 'TREINO A', focus: 'Peito & Tríceps', duration: '60 min', difficulty: 'Intermediário', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', exercises: [ { name: 'Supino Reto', sets: 4, reps: '8-12', weight: '80kg', image: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' }, { name: 'Crucifixo Inclinado', sets: 3, reps: '10-15', weight: '14kg', image: 'https://images.unsplash.com/photo-1594737625787-a8a121c44856?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' }, { name: 'Tríceps Pulley', sets: 4, reps: '10', weight: '25kg', image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' }, { name: 'Flexão de Braço', sets: 3, reps: 'Até a falha', weight: 'Corporal', image: 'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' } ] },
    { id: 'B', title: 'TREINO B', focus: 'Costas & Bíceps', duration: '65 min', difficulty: 'Avançado', image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', exercises: [ { name: 'Barra Fixa', sets: 4, reps: 'Até a falha', weight: 'Corporal', image: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' } ] },
    { id: 'C', title: 'TREINO C', focus: 'Pernas & Ombros', duration: '70 min', difficulty: 'Avançado', image: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', exercises: [ { name: 'Agachamento Livre', sets: 5, reps: '8', weight: '100kg', image: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' } ] },
];
const todayWorkout = workoutData[0];

// --- Componentes Reutilizáveis ---

const WorkoutPlayerScreen = ({ visible, onClose, onFinish, workout, theme }) => {
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [completedExercises, setCompletedExercises] = useState(new Set());
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const styles = createStyles(theme);

    useEffect(() => {
        if (visible) {
            setCurrentExerciseIndex(0);
            setCompletedExercises(new Set());
            Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start();
        } else {
            Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 400, useNativeDriver: true }).start();
        }
    }, [visible, slideAnim]);

    if (!workout) return null;

    const handleFinishWorkout = () => { onFinish(); onClose(); };
    const handleNext = () => { currentExerciseIndex < workout.exercises.length - 1 ? setCurrentExerciseIndex(prev => prev + 1) : handleFinishWorkout(); };
    const handlePrevious = () => currentExerciseIndex > 0 && setCurrentExerciseIndex(prev => prev - 1);
    const toggleComplete = (exerciseName) => {
        const newSet = new Set(completedExercises);
        newSet.has(exerciseName) ? newSet.delete(exerciseName) : newSet.add(exerciseName);
        setCompletedExercises(newSet);
    };

    const currentExercise = workout.exercises[currentExerciseIndex];
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
                            <View style={styles.playerDetailItem}><Text style={styles.playerDetailLabel}>Carga</Text><Text style={styles.playerDetailValue}>{currentExercise.weight}</Text></View>
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

const PlaceholderScreen = ({ title, theme }) => {
    const styles = createStyles(theme);
    return (
        <View style={styles.placeholderContainer}>
            <MaterialCommunityIcon name="hammer-wrench" size={60} color={theme.PRIMARY_YELLOW} />
            <Text style={styles.placeholderTitle}>{title}</Text>
            <Text style={styles.tipText}>Esta área está em desenvolvimento.</Text>
        </View>
    );
};

const SettingsScreen = ({ theme, setTheme }) => {
    const styles = createStyles(theme);
    const isDarkMode = theme === darkTheme;
    const toggleTheme = () => {
        setTheme(isDarkMode ? 'light' : 'dark');
    };
    return (
        <View style={styles.settingsContainer}>
            <Text style={styles.sectionTitle}>Configurações</Text>
            <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Modo Escuro</Text>
                <Switch
                    trackColor={{ false: "#767577", true: theme.PRIMARY_YELLOW }}
                    thumbColor={isDarkMode ? theme.PRIMARY_YELLOW : "#f4f3f4"}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={toggleTheme}
                    value={isDarkMode}
                />
            </View>
        </View>
    );
};


const TrainingScreen = ({ onStartWorkout, theme }) => {
    const styles = createStyles(theme);
    const [completedWorkouts, setCompletedWorkouts] = useState(7);
    const totalWorkouts = 39;
    const progress = completedWorkouts / totalWorkouts;
    const radius = SCREEN_WIDTH * 0.14;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (circumference * progress);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        ).start();
    }, [pulseAnim]);

    return (
        <ScrollView contentContainerStyle={styles.scrollContentContainer}>
            <View style={styles.greetingHeader}>
                <View><Text style={styles.greetingText}>Olá, Carlos</Text><Text style={styles.motivationText}>Pronto para esmagar?</Text></View>
                <TouchableOpacity><FeatherIcon name="bell" size={24} color={theme.TEXT_COLOR_SECONDARY} /></TouchableOpacity>
            </View>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Seu Treino de Hoje</Text>
                <TouchableOpacity activeOpacity={0.8} onPress={() => onStartWorkout(todayWorkout)}>
                    <ImageBackground source={{ uri: todayWorkout.image }} style={styles.todayWorkoutCard} imageStyle={styles.cardImageStyle}>
                        <View style={styles.cardOverlay} /><Text style={styles.workoutBgLetter}>{todayWorkout.id}</Text>
                        <View style={styles.todayWorkoutHeader}><Text style={styles.workoutTitle}>{todayWorkout.title}</Text><Text style={styles.workoutFocus}>{todayWorkout.focus}</Text></View>
                        <Animated.View style={[styles.todayWorkoutFooter, {transform: [{scale: pulseAnim}]}]}>
                            <View style={styles.workoutInfo}>
                                <View style={styles.infoItem}><FeatherIcon name="clock" size={14} color={darkTheme.TEXT_COLOR_PRIMARY} /><Text style={styles.infoText}>{todayWorkout.duration}</Text></View>
                                <View style={styles.infoItem}><MaterialCommunityIcon name="fire" size={14} color={darkTheme.TEXT_COLOR_PRIMARY} /><Text style={styles.infoText}>{todayWorkout.difficulty}</Text></View>
                            </View>
                            <View style={styles.startButton}><Text style={styles.startButtonText}>Começar</Text><FeatherIcon name="play" size={16} color={darkTheme.BACKGROUND_COLOR} /></View>
                        </Animated.View>
                    </ImageBackground>
                </TouchableOpacity>
            </View>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Outros Treinos</Text>
                {workoutData.slice(1).map(workout => (
                    <TouchableOpacity key={workout.id} style={styles.otherWorkoutCard} activeOpacity={0.7} onPress={() => onStartWorkout(workout)}>
                        <Image source={{ uri: workout.image }} style={styles.otherWorkoutImage} />
                        <View style={styles.otherWorkoutDetails}>
                            <Text style={styles.otherWorkoutTitle} numberOfLines={2}>{workout.title}: {workout.focus}</Text>
                            <View style={styles.workoutInfo}>
                                <View style={styles.infoItem}><FeatherIcon name="clock" size={12} color={theme.TEXT_COLOR_SECONDARY} /><Text style={styles.infoTextSmall}>{workout.duration}</Text></View>
                                <View style={styles.infoItem}><MaterialCommunityIcon name="fire" size={12} color={theme.TEXT_COLOR_SECONDARY} /><Text style={styles.infoTextSmall}>{workout.difficulty}</Text></View>
                            </View>
                        </View>
                        <View style={styles.otherWorkoutGo}><FeatherIcon name="chevron-right" size={24} color={theme.PRIMARY_YELLOW} /></View>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Seu Progresso</Text>
                <View style={styles.progressCard}>
                    <View style={styles.progressCircleContainer}>
                        <Svg height={radius * 2 + 20} width={radius * 2 + 20} viewBox={`0 0 ${radius * 2 + 20} ${radius * 2 + 20}`}>
                            <Defs><LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={theme.PRIMARY_YELLOW} /><Stop offset="1" stopColor={darkTheme.PRIMARY_YELLOW} /></LinearGradient></Defs>
                            <Circle cx={radius + 10} cy={radius + 10} r={radius} stroke={theme.BORDER_COLOR} strokeWidth="12" fill="transparent" />
                            <Circle cx={radius + 10} cy={radius + 10} r={radius} stroke="url(#grad)" strokeWidth="12" fill="transparent" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} transform={`rotate(-90 ${radius + 10} ${radius + 10})`} />
                        </Svg>
                        <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
                    </View>
                    <View style={styles.progressDetails}>
                        <Text style={styles.progressLabel}>Plano de Hipertrofia</Text>
                        <Text style={styles.progressCount}><Text style={{ color: theme.PRIMARY_YELLOW }}>{completedWorkouts}</Text> / {totalWorkouts} treinos</Text>
                        <View style={styles.progressBar}><View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} /></View>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

// --- Componente Principal do App ---
export default function App() {
    const [theme, setTheme] = useState('dark');
    const [activeTab, setActiveTab] = useState('Feed');
    const [isWorkoutVisible, setWorkoutVisible] = useState(false);
    const [selectedWorkout, setSelectedWorkout] = useState(null);

    const themeColors = theme === 'dark' ? darkTheme : lightTheme;
    const styles = createStyles(themeColors);

    const handleFinishWorkout = () => { /* Lógica pode ser adicionada aqui se necessário */ };
    const handleStartWorkout = (workout) => { setSelectedWorkout(workout); setWorkoutVisible(true); };

    const renderContent = () => {
        switch (activeTab) {
            case 'Treino': return <TrainingScreen onStartWorkout={handleStartWorkout} theme={themeColors} />;
            case 'Feed': return <PlaceholderScreen title="Feed" theme={themeColors} />;
            case 'Avaliações': return <PlaceholderScreen title="Avaliações" theme={themeColors} />;
            case 'Perfil': return <PlaceholderScreen title="Perfil" theme={themeColors} />;
            case 'Config': return <SettingsScreen theme={themeColors} setTheme={setTheme} />;
            default: return <PlaceholderScreen title="Feed" theme={themeColors} />;
        }
    };

    const NavItem = ({ name, icon, iconType = 'MaterialCommunity' }) => {
        const isActive = activeTab === name;
        const IconComponent = iconType === 'Feather' ? FeatherIcon : MaterialCommunityIcon;
        return (
            <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab(name)}>
                <IconComponent name={icon} size={isActive ? 28 : 26} color={isActive ? themeColors.PRIMARY_YELLOW : themeColors.TEXT_COLOR_SECONDARY} />
                {isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar hidden />
            <View style={{ flex: 1 }}>{renderContent()}</View>
            <WorkoutPlayerScreen visible={isWorkoutVisible} onClose={() => setWorkoutVisible(false)} onFinish={handleFinishWorkout} workout={selectedWorkout} theme={themeColors} />
            <View style={styles.navBarContainer}>
                <View style={styles.navBar}>
                    <NavItem name="Feed" icon="home-outline" />
                    <NavItem name="Avaliações" icon="clipboard-text-outline" />
                    <View style={styles.navItem} />
                    <NavItem name="Perfil" icon="account-outline" />
                    <NavItem name="Config" icon="cog-outline" />
                </View>
                <TouchableOpacity style={styles.navBarCenterButton} onPress={() => setActiveTab('Treino')}>
                    <MaterialCommunityIcon name="weight-lifter" size={32} color={themeColors.BACKGROUND_COLOR === darkTheme.BACKGROUND_COLOR ? darkTheme.BACKGROUND_COLOR : lightTheme.TEXT_COLOR_PRIMARY} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

// --- Folha de Estilos Dinâmica ---
const createStyles = (theme) => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.BACKGROUND_COLOR },
    scrollContentContainer: { paddingHorizontal: SCREEN_WIDTH * 0.05, paddingBottom: 120, paddingTop: 20 },
    section: { marginBottom: SCREEN_HEIGHT * 0.04 },
    sectionTitle: { color: theme.TEXT_COLOR_PRIMARY, fontSize: SCREEN_WIDTH * 0.055, fontWeight: 'bold', marginBottom: 16 },
    greetingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    greetingText: { color: theme.TEXT_COLOR_SECONDARY, fontSize: SCREEN_WIDTH * 0.04 },
    motivationText: { color: theme.TEXT_COLOR_PRIMARY, fontSize: SCREEN_WIDTH * 0.07, fontWeight: 'bold' },
    todayWorkoutCard: { height: SCREEN_HEIGHT * 0.45, borderRadius: 24, padding: 20, justifyContent: 'flex-end', overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 15 }, android: { elevation: 10 } }) },
    cardImageStyle: { borderRadius: 24 },
    cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 24 },
    todayWorkoutHeader: { position: 'absolute', top: 20, left: 20 },
    workoutTitle: { color: darkTheme.TEXT_COLOR_PRIMARY, fontSize: SCREEN_WIDTH * 0.075, fontWeight: 'bold', textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: {width: -1, height: 1}, textShadowRadius: 10 },
    workoutFocus: { color: darkTheme.PRIMARY_YELLOW, fontSize: SCREEN_WIDTH * 0.045, fontWeight: '600', textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: {width: -1, height: 1}, textShadowRadius: 10 },
    workoutBgLetter: { position: 'absolute', right: 0, top: 0, fontSize: SCREEN_WIDTH * 0.3, fontWeight: 'bold', color: 'rgba(255, 255, 255, 0.05)', transform: [{translateX: 20}, {translateY: -20}] },
    todayWorkoutFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    workoutInfo: { gap: 12 },
    infoItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    infoText: { color: darkTheme.TEXT_COLOR_PRIMARY, fontSize: SCREEN_WIDTH * 0.035, fontWeight: '500' },
    infoTextSmall: { color: theme.TEXT_COLOR_SECONDARY, fontSize: SCREEN_WIDTH * 0.03 },
    startButton: { backgroundColor: darkTheme.PRIMARY_YELLOW, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 8 },
    startButtonText: { color: darkTheme.BACKGROUND_COLOR, fontSize: SCREEN_WIDTH * 0.04, fontWeight: 'bold' },
    otherWorkoutCard: { backgroundColor: theme.CARD_COLOR, borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    otherWorkoutImage: { width: SCREEN_WIDTH * 0.15, height: SCREEN_WIDTH * 0.15, borderRadius: 12 },
    otherWorkoutDetails: { flex: 1, marginLeft: 12 },
    otherWorkoutTitle: { color: theme.TEXT_COLOR_PRIMARY, fontSize: SCREEN_WIDTH * 0.04, fontWeight: 'bold', marginBottom: 4 },
    otherWorkoutGo: { backgroundColor: theme.BORDER_COLOR, padding: 8, borderRadius: 99 },
    progressCard: { backgroundColor: theme.CARD_COLOR, borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 20 },
    progressCircleContainer: { justifyContent: 'center', alignItems: 'center' },
    progressText: { position: 'absolute', color: theme.TEXT_COLOR_PRIMARY, fontSize: SCREEN_WIDTH * 0.07, fontWeight: 'bold' },
    progressDetails: { flex: 1 },
    progressLabel: { color: theme.TEXT_COLOR_SECONDARY, fontSize: SCREEN_WIDTH * 0.04 },
    progressCount: { color: theme.TEXT_COLOR_PRIMARY, fontSize: SCREEN_WIDTH * 0.05, fontWeight: 'bold', marginVertical: 8 },
    progressBar: { height: 8, backgroundColor: theme.BORDER_COLOR, borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: theme.PRIMARY_YELLOW, borderRadius: 4 },
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
    navBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', height: 110 },
    navBar: { flexDirection: 'row', backgroundColor: theme.CARD_COLOR, height: 65, width: '90%', maxWidth: 400, borderRadius: 32.5, position: 'absolute', bottom: Platform.OS === 'ios' ? 30 : 20, alignItems: 'center', paddingHorizontal: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 10 },
    navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    activeDot: { height: 4, width: 20, backgroundColor: theme.PRIMARY_YELLOW, borderRadius: 2, marginTop: 4 },
    navBarCenterButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.PRIMARY_YELLOW, justifyContent: 'center', alignItems: 'center', position: 'absolute', bottom: Platform.OS === 'ios' ? 55 : 45, borderWidth: 5, borderColor: theme.BACKGROUND_COLOR, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 11 },
    placeholderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, gap: 16, backgroundColor: theme.BACKGROUND_COLOR },
    placeholderTitle: { color: theme.TEXT_COLOR_PRIMARY, fontSize: SCREEN_WIDTH * 0.06, fontWeight: 'bold' },
    tipText: { color: theme.TEXT_COLOR_SECONDARY, fontSize: SCREEN_WIDTH * 0.04, lineHeight: 22, textAlign: 'center' },
    settingsContainer: { flex: 1, paddingTop: 30, paddingHorizontal: 20, backgroundColor: theme.BACKGROUND_COLOR },
    settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.BORDER_COLOR },
    settingLabel: { fontSize: SCREEN_WIDTH * 0.045, color: theme.TEXT_COLOR_PRIMARY },
});
