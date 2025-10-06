import { StyleSheet, Dimensions } from 'react-native';

// Pego as dimensões da tela do dispositivo para usar em cálculos responsivos
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// Defino uma flag para dispositivos menores (útil para ajustes finos de layout)
const isSmallDevice = SCREEN_WIDTH < 375;

// --- Tema Escuro (darkTheme) ---
const darkTheme = {
    // Cor de destaque principal (Amarelo)
    PRIMARY_YELLOW: '#FBBF24',
    // Fundo principal da aplicação (quase preto)
    BACKGROUND_COLOR: '#0A0A0A',
    // Cor dos cards, botões secundários ou áreas de conteúdo (cinza escuro)
    CARD_COLOR: '#1A1A1A',
    // Cor principal do texto (Branco)
    TEXT_COLOR_PRIMARY: '#FFFFFF',
    // Cor do texto secundário ou placeholders (cinza claro)
    TEXT_COLOR_SECONDARY: '#A0A0A0',
    // Cor das bordas ou divisores em temas escuros
    BORDER_COLOR: '#2A2A2A',
    // Cor para mensagens de sucesso (Verde/Ciano)
    SUCCESS_COLOR: '#34D399',
    // Cor para mensagens de erro (Vermelho)
    ERROR_COLOR: '#EF4444',
    // Cor específica para o botão de logout
    LOGOUT_COLOR: '#EF4444',
};

// --- Tema Claro (lightTheme) ---
const lightTheme = {
    // Cor de destaque principal (Amarelo)
    PRIMARY_YELLOW: '#F59E0B',
    // Fundo principal da aplicação (cinza muito claro)
    BACKGROUND_COLOR: '#F3F4F6',
    // Cor dos cards e áreas de conteúdo (Branco)
    CARD_COLOR: '#FFFFFF',
    // Cor principal do texto (Preto/Cinza escuro)
    TEXT_COLOR_PRIMARY: '#111827',
    // Cor do texto secundário (Cinza médio)
    TEXT_COLOR_SECONDARY: '#6B7280',
    // Cor das bordas ou divisores em temas claros
    BORDER_COLOR: '#E5E7EB',
    // Cor para mensagens de sucesso (Verde)
    SUCCESS_COLOR: '#10B981',
    // Cor para mensagens de erro (Vermelho)
    ERROR_COLOR: '#EF4444',
    // Cor específica para o botão de logout
    LOGOUT_COLOR: '#EF4444',
};

// Exporto todas as minhas constantes de tema e dimensão para serem usadas em qualquer arquivo
export { darkTheme, lightTheme, SCREEN_WIDTH, SCREEN_HEIGHT, isSmallDevice };

// Função para criar estilos comuns que dependem do tema (uso isso na maioria das telas)
export const createStyles = (theme) => StyleSheet.create({
    // Estilo base para o container de todas as páginas
    pageContainer: {
        // Padding lateral responsivo (5% da largura da tela)
        paddingHorizontal: SCREEN_WIDTH * 0.05,
        // Garanto um espaço no final para a barra de navegação flutuante
        paddingBottom: 120,
        paddingTop: 20,
        // Uso a cor de fundo do tema atual
        backgroundColor: theme.BACKGROUND_COLOR,
    },
    // Estilo para agrupar seções dentro de uma tela
    section: {
        // Margem inferior responsiva
        marginBottom: SCREEN_HEIGHT * 0.04,
    },
    // Estilo padrão para títulos de seção
    sectionTitle: {
        color: theme.TEXT_COLOR_PRIMARY,
        // Tamanho de fonte responsivo
        fontSize: SCREEN_WIDTH * 0.055,
        fontWeight: 'bold',
        marginBottom: 16,
    },
});