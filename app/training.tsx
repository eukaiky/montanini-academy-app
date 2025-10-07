import React, { useState, useEffect, memo, useMemo } from 'react';
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
// Importo meus estilos customizados
import { createStyles, SCREEN_WIDTH } from './styles/theme';
// Importo minha configuração de API
import api from '../config/apiConfig';
// Uso o Animatable para dar umas animacões legais
import * as Animatable from 'react-native-animatable';


// Mapinha para converter o número do dia em texto (1 = Segunda, 7 = Domingo)
const DAY_OF_WEEK_MAP = {
    1: 'Segunda-feira',
    2: 'Terça-feira',
    3: 'Quarta-feira',
    4: 'Quinta-feira',
    5: 'Sexta-feira',
    6: 'Sábado',
    7: 'Domingo',
};

// Frases motivacionais que aparecem aleatoriamente
const motivationalQuotes = [
    "No Pain No Gain. Lute pelo que você quer!", // Essa não pode faltar!
    "O corpo alcança o que a mente acredita. A sua batalha real é na cabeça.",
    "A dor que você sente hoje é a força que você terá amanhã. Não pare!",
    "Se você não suar, não conta. O trabalho duro é o atalho.",
    "A consistência de uma tartaruga sempre vence a intermitência de uma lebre.",
    "Não é sobre ter tempo, é sobre criar tempo. A prioridade é sua.",
    "Lembre-se: 100% dos seus treinos perdidos não trouxeram resultados. **Apareça.**",
    "Pequenos ajustes diários fazem grandes diferenças invisíveis.",
    "A única sessão ruim é a que não acontece. Foco no próximo passo.",
    "O peso mais pesado que você levanta é a bunda do sofá. Venceu essa, venceu o treino.",
    "Você não falha na dieta, você planeja falhar. Simplifique e vá para cima.",
    "O seu corpo é o reflexo dos seus hábitos. Escolha bem.",
    "A diferença entre quem você é e quem você quer ser está no que você faz agora.",
];


// Este é o item individual de exercício. Usei memo para ele ser bem rápido.
const ExerciseItem = memo(({ exercise, theme, isWorkoutExpanded }) => {
    const styles = createTrainingStyles(theme);
    // Controla se este exercício específico está aberto (virou um 'quadradão')
    const [isExpanded, setIsExpanded] = useState(false);

    // Se o treino principal fechar, eu fecho todos os exercícios que estavam abertos dentro dele
    useEffect(() => {
        if (!isWorkoutExpanded) {
            setIsExpanded(false);
        }
    }, [isWorkoutExpanded]);

    // Função para abrir/fechar o exercício com uma animação suave
    const handleToggleDetails = () => {
        // MANTENDO LayoutAnimation aqui, pois o crash estava só na inicialização global
        if (Platform.OS !== 'web') {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        }
        setIsExpanded(prev => !prev);
    };

    // Defino os estilos baseados no estado 'isExpanded'
    const containerStyle = isExpanded ? styles.exerciseItemExpanded : styles.exerciseItem;
    const imageStyle = isExpanded ? styles.exerciseImageExpanded : styles.exerciseImage;
    const detailsStyle = isExpanded ? styles.exerciseDetailsExpanded : styles.exerciseDetails;

    return (
        // Animação para o item aparecer
        <Animatable.View animation="fadeIn" duration={300}>
            {/* O item clicável que tem toda a mágica do 'quadradão' */}
            <TouchableOpacity style={containerStyle} onPress={handleToggleDetails} activeOpacity={0.8}>

                {/* Imagem do Exercício: ela aumenta e usa 'contain' para não cortar a foto */}
                <Image
                    source={{ uri: exercise.image || 'https://via.placeholder.com/150' }}
                    style={imageStyle}
                    resizeMode={isExpanded ? 'contain' : 'cover'}
                />

                {/* Detalhes do Exercício */}
                <View style={detailsStyle}>
                    <Text
                        // O nome fica maior e em destaque no modo expandido
                        style={isExpanded ? styles.exerciseNameLarge : styles.exerciseName}
                        numberOfLines={isExpanded ? 2 : 1}
                    >
                        {exercise.name}
                    </Text>

                    {/* Linha das Repetições */}
                    <View style={styles.exerciseInfoRow}>
                        <FeatherIcon
                            // O ícone também aumenta no modo expandido
                            name="repeat"
                            size={isExpanded ? 18 : 14}
                            color={isExpanded ? theme.PRIMARY_YELLOW : theme.TEXT_COLOR_SECONDARY}
                        />
                        <Text
                            // O texto das repetições fica bem grande e em foco
                            style={isExpanded ? styles.exerciseInfoTextLarge : styles.exerciseInfoText}
                        >
                            {exercise.sets} séries x {exercise.reps} reps
                        </Text>
                    </View>
                </View>

            </TouchableOpacity>

            {/* Divisor simples (não aparece quando o item está expandido) */}
            {!isExpanded && <View style={styles.exerciseDivider} />}
        </Animatable.View>
    );
});

// Essa é a minha tela principal de treinos.
const Training = ({ theme, user, onNavigateToProfile, completedWorkouts }) => {
    // Uso os estilos do tema atual
    const commonStyles = createStyles(theme);
    const componentStyles = createTrainingStyles(theme);

    // Variáveis de estado
    const [workouts, setWorkouts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    // Guardo qual treino (card pai) está expandido
    const [expandedWorkoutId, setExpandedWorkoutId] = useState(null);

    // Lógica para pegar uma frase motivacional aleatória toda vez que a tela carrega
    // O useMemo garante que só sorteie uma vez por carga de tela (o que é o ideal para "dailyMotivation")
    const dailyMotivation = useMemo(() => {
        const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
        return motivationalQuotes[randomIndex];
    }, []);

    // Função para pegar as iniciais do nome para o avatar placeholder
    const getInitials = (nameStr) => {
        if (!nameStr) return '?';
        const words = nameStr.split(' ').filter(Boolean);
        if (words.length > 1) { return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase(); }
        if (words.length === 1 && words[0].length > 0) { return words[0][0].toUpperCase(); }
        return '?';
    };

    // Decide se mostra a foto do perfil ou as iniciais
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

    // useEffect para buscar os treinos na API quando o componente monta
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
                    // Ordeno os treinos por dia da semana para exibir na ordem certa
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

    // Função para abrir ou fechar o card de treino com animação
    const handleToggleWorkout = (workoutId) => {
        // CORREÇÃO: Mantemos o LayoutAnimation aqui para a expansão do treino, mas o problema estava nos estilos.
        if (Platform.OS !== 'web') {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        }
        // Se já estiver aberto, fecha. Se não, abre.
        setExpandedWorkoutId(prevId => (prevId === workoutId ? null : workoutId));
    };

    // Renderiza cada treino na lista
    const renderWorkoutItem = (workout) => {
        const isExpanded = expandedWorkoutId === workout.id;
        const dayName = DAY_OF_WEEK_MAP[workout.dayOfWeek] || 'Dia';
        const isCompleted = completedWorkouts.has(workout.id);

        // Se não tiver título, é dia de descanso. Mostro um card diferente.
        if (!workout.title) {
            return (
                <Animatable.View key={workout.dayOfWeek} animation="fadeInUp" duration={500} useNativeDriver={true}>
                    <View style={[componentStyles.workoutCard, componentStyles.restDayCard]}>
                        <MaterialCommunityIcon name="bed" size={24} color={theme.PRIMARY_YELLOW} style={{ marginRight: 16 }} />
                        <View style={componentStyles.workoutDetails}>
                            <Text style={componentStyles.workoutDay}>{dayName}</Text>
                            <Text style={componentStyles.workoutTitle}>Descanso Ativo. Recarregue as energias!</Text>
                        </View>
                    </View>
                </Animatable.View>
            );
        }

        // Se for dia de treino, mostro o card interativo
        return (
            <Animatable.View
                key={workout.id}
                animation="fadeInUp"
                duration={500}
                delay={100}
                // CORREÇÃO: Aplicamos o fundo SÓLIDO e removemos o 'overflow: hidden' no estilo CSS para evitar o bug visual.
                style={[componentStyles.workoutCardContainer, isExpanded && componentStyles.workoutCardContainerExpanded, { backgroundColor: theme.CARD_COLOR }]}
                useNativeDriver={true}
            >
                <TouchableOpacity
                    style={componentStyles.workoutCard}
                    activeOpacity={0.8}
                    onPress={() => handleToggleWorkout(workout.id)}>
                    <View style={componentStyles.workoutIconWrapper}>
                        {/* Ícone de check se completo, ou halter se normal */}
                        {isCompleted
                            ? <FeatherIcon name="check-circle" size={24} color={theme.SUCCESS_COLOR} />
                            : <MaterialCommunityIcon name="dumbbell" size={24} color={theme.PRIMARY_YELLOW} />
                        }
                    </View>
                    <View style={componentStyles.workoutDetails}>
                        <Text style={componentStyles.workoutDay}>{dayName}</Text>
                        <Text style={componentStyles.workoutTitle} numberOfLines={1}>{workout.title}</Text>
                        <Text style={componentStyles.workoutFocus} numberOfLines={1}>{workout.focus}</Text>
                    </View>
                    {/* Seta para indicar se está aberto ou fechado */}
                    <FeatherIcon name={isExpanded ? "chevron-up" : "chevron-down"} size={24} color={theme.TEXT_COLOR_SECONDARY} />
                </TouchableOpacity>

                {/* Área de conteúdo expandido (a lista de exercícios) */}
                {isExpanded && (
                    <View style={componentStyles.expandedContent}>
                        {workout.exercises && workout.exercises.length > 0
                            ? workout.exercises.map((ex, index) => <ExerciseItem key={`${workout.id}-ex-${index}`} exercise={ex} theme={theme} isWorkoutExpanded={isExpanded} />)
                            : <Text style={componentStyles.noExercisesText}>Nenhum exercício cadastrado.</Text>
                        }
                    </View>
                )}
            </Animatable.View>
        );
    };

    // O que mostrar na tela: loading, estado vazio ou a lista de treinos
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

    // A estrutura final da minha tela
    return (
        <ScrollView contentContainerStyle={commonStyles.pageContainer} showsVerticalScrollIndicator={false}>
            {/* Cabeçalho com logo e avatar */}
            <Animatable.View animation="fadeInDown" duration={500} style={componentStyles.header}>
                <Image
                    source={require('./montanini.png')}
                    style={componentStyles.logoImage}
                    resizeMode="contain"
                />
                {/* Botão do avatar que me leva para o perfil */}
                <TouchableOpacity onPress={onNavigateToProfile} activeOpacity={0.8}>
                    {renderAvatar()}
                </TouchableOpacity>
            </Animatable.View>

            {/* Saudação */}
            <Animatable.View animation="fadeIn" duration={600} delay={100} style={componentStyles.greetingTextContainer}>
                <Text style={componentStyles.greetingText}>Bem-vindo de volta,</Text>
                <Text style={componentStyles.userName}>{user ? user.name.split(' ')[0] : 'Usuário'}</Text>
            </Animatable.View>

            {/* Inspiração do Dia (Frase Motivacional) */}
            <Animatable.View animation="fadeInUp" duration={500} delay={300} style={componentStyles.motivationContainer}>
                <View style={componentStyles.motivationCard}>
                    <MaterialCommunityIcon
                        name="rocket-launch"
                        size={24}
                        color={theme.PRIMARY_YELLOW}
                        style={componentStyles.motivationIcon}
                    />
                    <Text style={componentStyles.motivationText}>{dailyMotivation}</Text>
                </View>
            </Animatable.View>


            {/* Seção de Treinos da Semana */}
            <View style={commonStyles.section}>
                <View style={componentStyles.sectionHeader}>
                    <Text style={commonStyles.sectionTitle}>Treinos da Semana</Text>
                </View>
                {renderContent()}
            </View>
        </ScrollView>
    );
};


// Estilos específicos da tela
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

    greetingTextContainer: {
        marginBottom: 15,
        marginTop: 10,
    },
    greetingText: {
        color: theme.TEXT_COLOR_SECONDARY,
        fontSize: SCREEN_WIDTH * 0.042
    },
    userName: {
        color: theme.TEXT_COLOR_PRIMARY,
        fontSize: SCREEN_WIDTH * 0.065,
        fontWeight: 'bold'
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        marginTop: 15,
    },

    // ESTILOS PARA INSPIRAÇÃO DO DIA
    motivationContainer: {
        marginBottom: 15,
    },
    motivationCard: {
        backgroundColor: theme.CARD_COLOR,
        borderRadius: 16,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 5,
        borderLeftColor: theme.PRIMARY_YELLOW,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, },
            android: { elevation: 3, },
        }),
    },
    motivationIcon: {
        marginRight: 12,
        paddingVertical: 2,
    },
    motivationText: {
        flex: 1,
        fontSize: SCREEN_WIDTH * 0.04,
        color: theme.TEXT_COLOR_PRIMARY,
        lineHeight: 20,
        fontWeight: '500',
    },
    // FIM DOS ESTILOS DE MOTIVAÇÃO

    workoutCardContainer: {
        borderRadius: 12,
        marginBottom: 8,
        // REMOVIDO: 'overflow: hidden' para evitar o bug de renderização no Android
        // overflow: 'hidden',
    },
    // O estilo para o card que está aberto (com borda amarela de destaque)
    workoutCardContainerExpanded: {
        borderWidth: 2,
        borderColor: theme.PRIMARY_YELLOW,
        marginBottom: 8,
    },
    workoutCard: {
        backgroundColor: theme.CARD_COLOR, // Fundo sólido
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    workoutIconWrapper: {
        marginRight: 16,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.BACKGROUND_COLOR,
        alignItems: 'center',
        justifyContent: 'center',
    },
    restDayCard: {
        backgroundColor: theme.CARD_COLOR,
        borderRadius: 12,
        marginBottom: 8,
        opacity: 0.9,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: theme.BORDER_COLOR,
        // Sombra suave
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, },
            android: { elevation: 1, },
        }),
    },
    workoutDetails: { flex: 1, marginHorizontal: 0 },
    workoutDay: { color: theme.PRIMARY_YELLOW, fontSize: SCREEN_WIDTH * 0.035, fontWeight: '700', marginBottom: 2 },
    workoutTitle: { color: theme.TEXT_COLOR_PRIMARY, fontSize: SCREEN_WIDTH * 0.045, fontWeight: '700' }, // Mais destaque
    workoutFocus: { color: theme.TEXT_COLOR_SECONDARY, fontSize: SCREEN_WIDTH * 0.035, marginTop: 2 },

    expandedContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 10,
        backgroundColor: theme.CARD_COLOR, // Fundo sólido
    },
    // Container não expandido do exercício (linha pequena)
    exerciseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        justifyContent: 'flex-start',
    },
    // O 'quadradão' que aparece ao clicar no exercício
    exerciseItemExpanded: {
        flexDirection: 'column',
        alignItems: 'center',
        padding: 16,
        margin: 8,
        backgroundColor: theme.BACKGROUND_COLOR, // Fundo sólido
        borderRadius: 10,
        // Sombra para destacar que é um card sobreposto
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, },
            android: { elevation: 4, },
        }),
    },
    exerciseDivider: {
        height: 1,
        backgroundColor: theme.BORDER_COLOR,
        marginHorizontal: 12,
        marginBottom: 4,
    },
    exerciseImage: {
        width: 45,
        height: 45,
        borderRadius: 6,
        backgroundColor: theme.BACKGROUND_COLOR,
    },
    // Imagem ampliada no 'quadradão'
    exerciseImageExpanded: {
        width: '100%',
        height: SCREEN_WIDTH * 0.3,
        borderRadius: 8,
        marginBottom: 10,
    },
    exerciseDetails: {
        flex: 1,
        marginLeft: 12,
    },
    // Detalhes do Exercício quando está expandido
    exerciseDetailsExpanded: {
        alignItems: 'center',
        marginTop: 5,
        width: '100%',
        marginLeft: 0,
    },
    exerciseName: {
        color: theme.TEXT_COLOR_PRIMARY,
        fontSize: SCREEN_WIDTH * 0.04,
        fontWeight: '600',
        marginBottom: 3,
    },
    // Nome do Exercício em fonte maior
    exerciseNameLarge: {
        color: theme.TEXT_COLOR_PRIMARY,
        fontSize: SCREEN_WIDTH * 0.05,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
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
    // Repetições em fonte maior
    exerciseInfoTextLarge: {
        color: theme.TEXT_COLOR_PRIMARY,
        fontSize: SCREEN_WIDTH * 0.045,
        fontWeight: 'bold',
    },
    noExercisesText: {
        color: theme.TEXT_COLOR_SECONDARY,
        textAlign: 'center',
        paddingVertical: 20,
        fontStyle: 'italic',
    },
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
        backgroundColor: theme.CARD_COLOR,
        borderRadius: 16,
        marginTop: 20
    },
    emptyStateText: {
        marginTop: 16,
        fontSize: SCREEN_WIDTH * 0.04,
        color: theme.TEXT_COLOR_PRIMARY,
        fontWeight: 'bold',
        textAlign: 'center'
    },
    emptyStateSubText: {
        marginTop: 8,
        fontSize: SCREEN_WIDTH * 0.035,
        color: theme.TEXT_COLOR_SECONDARY,
        textAlign: 'center',
        paddingHorizontal: 20
    },
});

export default Training;