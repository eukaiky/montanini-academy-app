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
import FeatherIcon from 'react-native-vector-icons/Feather'; // Para ícones dentro de componentes (como o Player)
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons'; // Ícones principais da navbar
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur'; // Efeito de desfoque no iOS
import * as NavigationBar from 'expo-navigation-bar'; // Para controlar a barra de navegação do Android

// Hooks e Telas
import { useAuth } from './context/AuthContext';
import { useRouter } from 'expo-router';
// Importo minhas três telas principais
import TrainingScreen from './training';
import SettingsScreen from './settings';
import ProfileScreen from './profile';

// Estilos e Temas
import { darkTheme, lightTheme, SCREEN_WIDTH, SCREEN_HEIGHT, isSmallDevice } from './styles/theme';

// --- Componente de Placeholder para telas em desenvolvimento ---
const PlaceholderScreen = ({ title, theme }) => {
    // Estilos simples e limpos para o placeholder
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

// --- Componente do Player de Treino (Modal que desliza) ---
const WorkoutPlayerScreen = ({ visible, onClose, onFinish, workout, theme }) => {
    // Estados para controlar o exercício atual e quais foram concluídos
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [completedExercises, setCompletedExercises] = useState(new Set());
    // Variável de animação para o deslize vertical do modal
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const styles = createPlayerStyles(theme);

    // Efeito para deslizar o modal para cima (abrir) ou para baixo (fechar)
    useEffect(() => {
        if (visible) {
            // Reseta o estado quando abre
            setCurrentExerciseIndex(0);
            setCompletedExercises(new Set());
            Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start();
        } else {
            Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 400, useNativeDriver: true }).start();
        }
    }, [visible, slideAnim]);

    if (!workout || !workout.exercises || workout.exercises.length === 0) return null;

    const currentExercise = workout.exercises[currentExerciseIndex];

    // Finaliza o treino e fecha o player
    const handleFinishWorkout = () => {
        onFinish(workout.id);
        onClose();
    };

    // Passa para o próximo exercício ou finaliza o treino
    const handleNext = () => {
        if (currentExerciseIndex < workout.exercises.length - 1) {
            setCurrentExerciseIndex(prev => prev + 1);
        } else {
            handleFinishWorkout();
        }
    };

    // Volta para o exercício anterior
    const handlePrevious = () => {
        if (currentExerciseIndex > 0) {
            setCurrentExerciseIndex(prev => prev - 1);
        }
    };

    // Marca ou desmarca o exercício atual como concluído
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
            {/* O container animado que desliza */}
            <Animated.View style={[styles.playerContainer, { transform: [{ translateY: slideAnim }] }]}>
                <SafeAreaView style={{ flex: 1, backgroundColor: theme.BACKGROUND_COLOR }}>
                    {/* Cabeçalho do player */}
                    <View style={styles.playerHeader}>
                        <TouchableOpacity onPress={onClose} style={styles.playerHeaderButton}><FeatherIcon name="x" size={24} color={theme.TEXT_COLOR_SECONDARY} /></TouchableOpacity>
                        <View>
                            <Text style={styles.playerTitle}>{workout.title}</Text>
                            <Text style={styles.playerSubtitle}>{`${currentExerciseIndex + 1} / ${workout.exercises.length}`}</Text>
                        </View>
                        <TouchableOpacity onPress={handleFinishWorkout}><Text style={styles.playerFinishText}>Finalizar</Text></TouchableOpacity>
                    </View>

                    {/* Conteúdo principal do exercício */}
                    <View style={styles.playerContent}>
                        {/* Imagem de fundo do exercício */}
                        <ImageBackground source={{ uri: currentExercise.image }} style={styles.playerExerciseImage} imageStyle={styles.playerExerciseImageStyle}>
                            <View style={styles.playerImageOverlay} />
                            <Text style={styles.playerExerciseName}>{currentExercise.name}</Text>
                        </ImageBackground>

                        {/* Detalhes de Séries, Reps e Carga */}
                        <View style={styles.playerExerciseDetails}>
                            <View style={styles.playerDetailItem}><Text style={styles.playerDetailLabel}>Séries</Text><Text style={styles.playerDetailValue}>{currentExercise.sets}</Text></View>
                            <View style={styles.playerDetailItem}><Text style={styles.playerDetailLabel}>Reps</Text><Text style={styles.playerDetailValue}>{currentExercise.reps}</Text></View>
                            <View style={styles.playerDetailItem}><Text style={styles.playerDetailLabel}>Carga</Text><Text style={styles.playerDetailValue}>{currentExercise.weight || 'N/A'}</Text></View>
                        </View>

                        {/* Botão de Conclusão */}
                        <TouchableOpacity style={[styles.playerCompleteButton, isCompleted && styles.playerCompleteButtonChecked]} onPress={() => toggleComplete(currentExercise.name)}>
                            <FeatherIcon name={isCompleted ? "check-circle" : "circle"} size={24} color={isCompleted ? theme.SUCCESS_COLOR : theme.TEXT_COLOR_SECONDARY} />
                            <Text style={[styles.playerCompleteButtonText, isCompleted && { color: theme.SUCCESS_COLOR }]}>{isCompleted ? 'Exercício Concluído' : 'Marcar como Concluído'}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Barra de Navegação do Player */}
                    <View style={styles.playerNav}>
                        {/* Botão Voltar */}
                        <TouchableOpacity onPress={handlePrevious} disabled={currentExerciseIndex === 0} style={[styles.playerNavButton, currentExerciseIndex === 0 && styles.playerNavButtonDisabled]}>
                            <FeatherIcon name="arrow-left" size={24} color={theme.TEXT_COLOR_PRIMARY} />
                        </TouchableOpacity>

                        {/* Botão Próximo/Finalizar */}
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


// --- Componente Principal: HomeScreen (Navbar) ---
export default function HomeScreen() {
    // Pego as funções de usuário e logout do meu AuthContext
    const { user, signOut: contextSignOut } = useAuth();
    const router = useRouter();

    // Estado para controlar qual aba está ativa por padrão é 'Treino'
    const [activeTab, setActiveTab] = useState('Treino');
    // Controle de visibilidade do player de treino
    const [isWorkoutVisible, setWorkoutVisible] = useState(false);
    // Armazena o treino que foi clicado para ser executado
    const [selectedWorkout, setSelectedWorkout] = useState(null);
    // Guarda um Set de IDs dos treinos concluídos (para marcar na tela de Treinos)
    const [completedWorkouts, setCompletedWorkouts] = useState(new Set());
    // O tema atual (Dark ou Light)
    const [theme, setTheme] = useState(lightTheme);

    // Efeito para carregar o tema salvo e configurar a barra de navegação nativa (Android)
    useEffect(() => {
        const loadTheme = async () => {
            const savedTheme = await AsyncStorage.getItem('theme');
            const currentTheme = savedTheme === 'dark' ? darkTheme : lightTheme;
            setTheme(currentTheme);

            if (Platform.OS === 'android') {
                // Configuro a cor de fundo e os ícones da barra de status do Android
                NavigationBar.setBackgroundColorAsync(currentTheme.BACKGROUND_COLOR);
                NavigationBar.setButtonStyleAsync(savedTheme === 'dark' ? 'light' : 'dark');
            }
        };
        loadTheme();
    }, []);

    // Função para fazer logout e redirecionar para a tela de login
    const handleSignOut = async () => {
        try {
            await contextSignOut();
            router.replace('/login');
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
            Alert.alert("Erro", "Não foi possível sair. Tente novamente.");
        }
    };

    // Abre o player de treino se o treino tiver exercícios
    const handleStartWorkout = (workout) => {
        if (!workout.exercises || workout.exercises.length === 0) {
            Alert.alert("Sem Exercícios", "Este treino ainda não possui exercícios cadastrados.");
            return;
        }
        setSelectedWorkout(workout);
        setWorkoutVisible(true);
    };

    // Adiciona o ID do treino concluído ao nosso Set
    const handleFinishWorkout = (workoutId) => {
        setCompletedWorkouts(prev => new Set(prev).add(workoutId));
    };

    // Renderiza o conteúdo da tela baseado na aba ativa
    const renderContent = () => {
        switch (activeTab) {
            // Passo as props necessárias para cada tela (theme, user, handlers, etc.)
            case 'Treino': return <TrainingScreen onStartWorkout={handleStartWorkout} theme={theme} user={user} completedWorkouts={completedWorkouts} onNavigateToProfile={() => setActiveTab('Perfil')} />;
            case 'Perfil': return <ProfileScreen theme={theme} />;
            case 'Config': return <SettingsScreen theme={theme} setTheme={setTheme} onSignOut={handleSignOut} />;
            default: return <PlaceholderScreen title={activeTab} theme={theme} />;
        }
    };

    // Componente auxiliar para renderizar os ícones da barra de navegação
    const NavItem = ({ name, icon }) => {
        const isActive = activeTab === name;
        return (
            <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab(name)}>
                <MaterialCommunityIcon name={icon} size={28} color={isActive ? theme.PRIMARY_YELLOW : theme.TEXT_COLOR_SECONDARY} />
            </TouchableOpacity>
        );
    };

    // Gero os estilos da aplicação principal
    const styles = createAppStyles(theme);

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Configuro a barra de status (cor e ícones) */}
            <StatusBar barStyle={theme === darkTheme ? 'light-content' : 'dark-content'} backgroundColor={theme.BACKGROUND_COLOR} />

            {/* Área de conteúdo principal (Treino, Perfil, Config) */}
            <View style={{ flex: 1, paddingTop: 20 }}>{renderContent()}</View>

            {/* O Modal do Player de Treino */}
            <WorkoutPlayerScreen
                visible={isWorkoutVisible}
                onClose={() => setWorkoutVisible(false)}
                onFinish={handleFinishWorkout}
                workout={selectedWorkout}
                theme={theme}
            />

            {/* A BARRA DE NAVEGAÇÃO CUSTOMIZADA */}
            <View style={styles.navBarContainer}>
                {/* O background da barra (usando BlurView no iOS e View simples no Android) */}
                {Platform.OS === 'ios' ? (
                    <BlurView intensity={80} tint={theme === darkTheme ? 'dark' : 'light'} style={styles.navBarBlurBackground}>
                        <View style={styles.navBarContent}>
                            {/* Ícones laterais. Deixo um espaço no meio para o botão central */}
                            <NavItem name="Perfil" icon="account" />
                            <NavItem name="Config" icon="cog" />
                        </View>
                    </BlurView>
                ) : (
                    <View style={styles.navBarBackground}>
                        <View style={styles.navBarContent}>
                            {/* Ícones laterais para Android */}
                            <NavItem name="Perfil" icon="account" />
                            <NavItem name="Config" icon="cog" />
                        </View>
                    </View>
                )}

                {/* O BOTÃO CENTRAL DE DESTAQUE (HALTEER) */}
                <TouchableOpacity onPress={() => setActiveTab('Treino')} style={styles.centerButtonWrapper}>
                    <View style={[styles.centerButton, activeTab === 'Treino' && styles.centerButtonActive]}>
                        <MaterialCommunityIcon
                            name="dumbbell"
                            size={32}
                            color={activeTab === 'Treino' ? (theme === darkTheme ? theme.BACKGROUND_COLOR : theme.TEXT_COLOR_PRIMARY) : theme.TEXT_COLOR_SECONDARY}
                        />
                    </View>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

// --- Funções de Estilo ---
const createAppStyles = (theme) => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.BACKGROUND_COLOR },

    // Container principal da barra de navegação (segura o background e o botão central)
    navBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        // Altura maior para iOS para acomodar a área segura inferior
        height: Platform.OS === 'ios' ? 120 : 100,
        backgroundColor: 'transparent',
    },
    // Background com Blur para iOS
    navBarBlurBackground: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 60 : 50,
        height: 65,
        width: '90%',
        maxWidth: 400,
        borderRadius: 32.5,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        justifyContent: 'center',
    },
    // Background simples para Android
    navBarBackground: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 60 : 50,
        height: 65,
        width: '90%',
        maxWidth: 400,
        borderRadius: 32.5,
        backgroundColor: theme.CARD_COLOR,
        elevation: 10,
        justifyContent: 'center',
    },
    // Onde os ícones laterais ficam
    navBarContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
        width: '100%',
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
    },
    // Wrapper que posiciona o botão central fora da barra
    centerButtonWrapper: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 60 + 5 : 50 + 5, // Eleva o botão
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
        zIndex: 1,
    },
    // O botão central em si
    centerButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.CARD_COLOR,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: theme.BACKGROUND_COLOR, // Borda que 'recorta' o botão do fundo
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5 },
            android: { elevation: 8 },
        }),
    },
    // Estilo do botão central quando a aba Treino está ativa
    centerButtonActive: {
        backgroundColor: theme.PRIMARY_YELLOW,
    },
});

// O código de createPlayerStyles continua o mesmo
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