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
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
// Mock import for context - replace with your actual implementation
const useAuth = () => ({ user: { name: 'Alex', email: 'alex@email.com', id: 'cne20s3cu0001l15048qujegy' }, signOut: () => console.log('Signed out') });


// --- Dependências de Ícones ---
// Make sure to have react-native-vector-icons installed and linked
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
    LOGOUT_COLOR: '#EF4444',
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
    LOGOUT_COLOR: '#EF4444',
};

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

    if (!workout || !workout.exercises || workout.exercises.length === 0) return null;

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

const SettingsScreen = ({ theme, setTheme, user, onSignOut }) => {
    const styles = createStyles(theme);
    const isDarkMode = theme === darkTheme;
    const [isPasswordModalVisible, setPasswordModalVisible] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const toggleTheme = () => {
        setTheme(isDarkMode ? 'light' : 'dark');
    };

    const handlePasswordChange = () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert("Erro", "Por favor, preencha todos os campos.");
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert("Erro", "As novas senhas não correspondem.");
            return;
        }
        // Lógica para chamar a API de alteração de senha
        console.log({
            userId: user.id,
            currentPassword,
            newPassword
        });
        Alert.alert("Sucesso", "Senha alterada com sucesso! (Simulação)");
        setPasswordModalVisible(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const renderPasswordModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isPasswordModalVisible}
            onRequestClose={() => setPasswordModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Alterar Senha</Text>
                    <TextInput
                        style={styles.modalInput}
                        placeholder="Senha Atual"
                        placeholderTextColor={theme.TEXT_COLOR_SECONDARY}
                        secureTextEntry
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                    />
                    <TextInput
                        style={styles.modalInput}
                        placeholder="Nova Senha"
                        placeholderTextColor={theme.TEXT_COLOR_SECONDARY}
                        secureTextEntry
                        value={newPassword}
                        onChangeText={setNewPassword}
                    />
                    <TextInput
                        style={styles.modalInput}
                        placeholder="Confirmar Nova Senha"
                        placeholderTextColor={theme.TEXT_COLOR_SECONDARY}
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                    />
                    <View style={styles.modalButtonContainer}>
                        <TouchableOpacity style={styles.modalButtonCancel} onPress={() => setPasswordModalVisible(false)}>
                            <Text style={styles.modalButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalButtonConfirm} onPress={handlePasswordChange}>
                            <Text style={styles.modalButtonConfirmText}>Salvar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    return (
        <ScrollView style={styles.settingsContainer}>
            <Text style={styles.pageTitle}>Configurações</Text>

            {/* Seção da Conta */}
            <Text style={styles.settingsSectionTitle}>Conta</Text>
            <View style={styles.settingsCard}>
                <View style={styles.settingItem}>
                    <FeatherIcon name="user" size={20} color={theme.TEXT_COLOR_SECONDARY} />
                    <Text style={styles.settingLabel}>Nome</Text>
                    <Text style={styles.settingValue}>{user?.name || 'N/A'}</Text>
                </View>
                <View style={styles.settingItem}>
                    <FeatherIcon name="mail" size={20} color={theme.TEXT_COLOR_SECONDARY} />
                    <Text style={styles.settingLabel}>Email</Text>
                    <Text style={styles.settingValue}>{user?.email || 'N/A'}</Text>
                </View>
                <TouchableOpacity style={styles.settingItem} onPress={() => setPasswordModalVisible(true)}>
                    <FeatherIcon name="lock" size={20} color={theme.TEXT_COLOR_SECONDARY} />
                    <Text style={styles.settingLabel}>Alterar Senha</Text>
                    <FeatherIcon name="chevron-right" size={20} color={theme.TEXT_COLOR_SECONDARY} />
                </TouchableOpacity>
            </View>

            {/* Seção de Aparência */}
            <Text style={styles.settingsSectionTitle}>Aparência</Text>
            <View style={styles.settingsCard}>
                <View style={styles.settingItem}>
                    <FeatherIcon name={isDarkMode ? "moon" : "sun"} size={20} color={theme.TEXT_COLOR_SECONDARY} />
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

            {/* Botão de Sair */}
            <TouchableOpacity style={styles.logoutButton} onPress={onSignOut}>
                <FeatherIcon name="log-out" size={20} color={theme.LOGOUT_COLOR} />
                <Text style={styles.logoutButtonText}>Sair da Conta</Text>
            </TouchableOpacity>

            {renderPasswordModal()}
        </ScrollView>
    );
};


const TrainingScreen = ({ onStartWorkout, theme, user }) => {
    const styles = createStyles(theme);
    const [workouts, setWorkouts] = useState([]);
    const [todayWorkout, setTodayWorkout] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [completedWorkoutsCount, setCompletedWorkoutsCount] = useState(7);
    const totalWorkouts = 39;
    const progress = completedWorkoutsCount / totalWorkouts;
    const radius = SCREEN_WIDTH * 0.14;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (circumference * progress);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const dayOfWeekMap = { 0: 'Domingo', 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado' };
    const weekOrder = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];


    useEffect(() => {
        const fetchWorkouts = async () => {
            if (!user?.id) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                // IMPORTANT: Replace 'YOUR_SERVER_IP' with the IP address of the machine running the server.
                const response = await fetch(`http://YOUR_SERVER_IP:3000/api/workouts/${user.id}`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();

                const sortedWorkouts = data.sort((a, b) => weekOrder.indexOf(a.dayOfWeek) - weekOrder.indexOf(b.dayOfWeek));
                setWorkouts(sortedWorkouts);

                const currentDayName = dayOfWeekMap[new Date().getDay()];
                const workoutForToday = data.find(w => w.dayOfWeek === currentDayName);
                setTodayWorkout(workoutForToday);

            } catch (error) {
                console.error("Failed to fetch workouts:", error);
                Alert.alert("Erro", "Não foi possível carregar os treinos. Verifique sua conexão e o IP do servidor.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchWorkouts();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        ).start();
    }, [user, pulseAnim]);

    const renderTodayWorkout = () => {
        if (isLoading) {
            return <ActivityIndicator size="large" color={theme.PRIMARY_YELLOW} style={{ height: SCREEN_HEIGHT * 0.45 }} />;
        }

        if (!todayWorkout) {
            return (
                <View style={[styles.todayWorkoutCard, styles.restDayCard]}>
                    <MaterialCommunityIcon name="bed" size={60} color={theme.PRIMARY_YELLOW} />
                    <Text style={styles.workoutTitle}>Dia de Descanso</Text>
                    <Text style={styles.workoutFocus}>Aproveite para recarregar as energias!</Text>
                </View>
            );
        }

        return (
            <TouchableOpacity activeOpacity={0.8} onPress={() => onStartWorkout(todayWorkout)}>
                <ImageBackground source={{ uri: todayWorkout.image }} style={styles.todayWorkoutCard} imageStyle={styles.cardImageStyle}>
                    <View style={styles.cardOverlay} />
                    <Text style={styles.workoutBgLetter}>{todayWorkout.title.charAt(todayWorkout.title.length - 1)}</Text>
                    <View style={styles.todayWorkoutHeader}>
                        <Text style={styles.workoutTitle}>{todayWorkout.title}</Text>
                        <Text style={styles.workoutFocus}>{todayWorkout.focus}</Text>
                    </View>
                    <Animated.View style={[styles.todayWorkoutFooter, {transform: [{scale: pulseAnim}]}]}>
                        <View style={styles.workoutInfo}>
                            <View style={styles.infoItem}><FeatherIcon name="clock" size={14} color={darkTheme.TEXT_COLOR_PRIMARY} /><Text style={styles.infoText}>{todayWorkout.duration}</Text></View>
                            <View style={styles.infoItem}><MaterialCommunityIcon name="fire" size={14} color={darkTheme.TEXT_COLOR_PRIMARY} /><Text style={styles.infoText}>{todayWorkout.difficulty}</Text></View>
                        </View>
                        <TouchableOpacity style={styles.startButton} onPress={() => onStartWorkout(todayWorkout)} >
                            <Text style={styles.startButtonText}>Começar</Text>
                            <FeatherIcon name="play" size={16} color={darkTheme.BACKGROUND_COLOR} />
                        </TouchableOpacity>
                    </Animated.View>
                </ImageBackground>
            </TouchableOpacity>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.scrollContentContainer}>
            <View style={styles.greetingHeader}>
                <View><Text style={styles.greetingText}>Olá, {user ? user.name.split(' ')[0] : 'Usuário'}</Text><Text style={styles.motivationText}>Pronto para esmagar?</Text></View>
                <TouchableOpacity><FeatherIcon name="bell" size={24} color={theme.TEXT_COLOR_SECONDARY} /></TouchableOpacity>
            </View>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Seu Treino de Hoje</Text>
                {renderTodayWorkout()}
            </View>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Treinos da Semana</Text>
                {isLoading ? (
                    <View style={{paddingVertical: 40}}>
                        <ActivityIndicator size="large" color={theme.PRIMARY_YELLOW} />
                    </View>
                ) : (
                    workouts.map(workout => (
                        <TouchableOpacity key={workout.id} style={styles.otherWorkoutCard} activeOpacity={0.7} onPress={() => onStartWorkout(workout)}>
                            <Image source={{ uri: workout.image }} style={styles.otherWorkoutImage} />
                            <View style={styles.otherWorkoutDetails}>
                                <Text style={styles.otherWorkoutDay}>{workout.dayOfWeek}</Text>
                                <Text style={styles.otherWorkoutTitle} numberOfLines={1}>{workout.title}: {workout.focus}</Text>
                            </View>
                            <View style={styles.otherWorkoutGo}><FeatherIcon name="chevron-right" size={24} color={theme.PRIMARY_YELLOW} /></View>
                        </TouchableOpacity>
                    ))
                )}
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
                        <Text style={styles.progressCount}><Text style={{ color: theme.PRIMARY_YELLOW }}>{completedWorkoutsCount}</Text> / {totalWorkouts} treinos</Text>
                        <View style={styles.progressBar}><View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} /></View>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

// --- Componente Principal do App ---
export default function App() {
    const { user, signOut } = useAuth();
    const [theme, setTheme] = useState('dark');
    const [activeTab, setActiveTab] = useState('Treino');
    const [isWorkoutVisible, setWorkoutVisible] = useState(false);
    const [selectedWorkout, setSelectedWorkout] = useState(null);

    const themeColors = theme === 'dark' ? darkTheme : lightTheme;
    const styles = createStyles(themeColors);

    const handleFinishWorkout = () => { /* Lógica pode ser adicionada aqui se necessário */ };
    const handleStartWorkout = (workout) => {
        if (!workout.exercises || workout.exercises.length === 0) {
            Alert.alert("Sem Exercícios", "Este treino ainda não possui exercícios cadastrados.");
            return;
        }
        setSelectedWorkout(workout);
        setWorkoutVisible(true);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'Treino': return <TrainingScreen onStartWorkout={handleStartWorkout} theme={themeColors} user={user} />;
            case 'Feed': return <PlaceholderScreen title="Feed" theme={themeColors} />;
            case 'Avaliações': return <PlaceholderScreen title="Avaliações" theme={themeColors} />;
            case 'Perfil': return <PlaceholderScreen title="Perfil" theme={themeColors} />;
            case 'Config': return <SettingsScreen theme={themeColors} setTheme={setTheme} user={user} onSignOut={signOut} />;
            default: return <TrainingScreen onStartWorkout={handleStartWorkout} theme={themeColors} user={user} />;
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
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={themeColors.BACKGROUND_COLOR} />
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
    restDayCard: { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.CARD_COLOR, gap: 10 },
    cardImageStyle: { borderRadius: 24 },
    cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 24 },
    todayWorkoutHeader: { position: 'absolute', top: 20, left: 20 },
    workoutTitle: { color: darkTheme.TEXT_COLOR_PRIMARY, fontSize: SCREEN_WIDTH * 0.075, fontWeight: 'bold', textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: {width: -1, height: 1}, textShadowRadius: 10, textAlign: 'center' },
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
    otherWorkoutDetails: { flex: 1, marginLeft: 12, marginRight: 8 },
    otherWorkoutDay: { color: theme.PRIMARY_YELLOW, fontSize: SCREEN_WIDTH * 0.035, fontWeight: 'bold', marginBottom: 2 },
    otherWorkoutTitle: { color: theme.TEXT_COLOR_PRIMARY, fontSize: SCREEN_WIDTH * 0.04, fontWeight: '600' },
    otherWorkoutGo: { backgroundColor: `${theme.PRIMARY_YELLOW}20`, padding: 8, borderRadius: 99 },
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
    settingsContainer: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 20, paddingHorizontal: 20, backgroundColor: theme.BACKGROUND_COLOR },
    pageTitle: { fontSize: SCREEN_WIDTH * 0.08, fontWeight: 'bold', color: theme.TEXT_COLOR_PRIMARY, marginBottom: 24,},
    settingsSectionTitle: { fontSize: SCREEN_WIDTH * 0.04, fontWeight: '600', color: theme.TEXT_COLOR_SECONDARY, textTransform: 'uppercase', marginBottom: 12, marginTop: 16, },
    settingsCard: { backgroundColor: theme.CARD_COLOR, borderRadius: 16, marginBottom: 16, },
    settingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: theme.BORDER_COLOR, },
    settingLabel: { fontSize: SCREEN_WIDTH * 0.045, color: theme.TEXT_COLOR_PRIMARY, marginLeft: 16, flex: 1, },
    settingValue: { fontSize: SCREEN_WIDTH * 0.04, color: theme.TEXT_COLOR_SECONDARY, },
    logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16, marginTop: 24, borderRadius: 12, backgroundColor: `${theme.LOGOUT_COLOR}20`, marginBottom: 40, },
    logoutButtonText: { color: theme.LOGOUT_COLOR, fontSize: SCREEN_WIDTH * 0.04, fontWeight: 'bold', },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20, },
    modalContainer: { width: '100%', backgroundColor: theme.CARD_COLOR, borderRadius: 20, padding: 24, },
    modalTitle: { fontSize: SCREEN_WIDTH * 0.055, fontWeight: 'bold', color: theme.TEXT_COLOR_PRIMARY, marginBottom: 20, textAlign: 'center', },
    modalInput: { backgroundColor: theme.BACKGROUND_COLOR, color: theme.TEXT_COLOR_PRIMARY, borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.BORDER_COLOR, },
    modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, },
    modalButtonCancel: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, },
    modalButtonConfirm: { backgroundColor: theme.PRIMARY_YELLOW, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, },
    modalButtonText: { color: theme.TEXT_COLOR_SECONDARY, fontWeight: 'bold', fontSize: 16, },
    modalButtonConfirmText: { color: theme.BACKGROUND_COLOR, fontWeight: 'bold', fontSize: 16, },
});
