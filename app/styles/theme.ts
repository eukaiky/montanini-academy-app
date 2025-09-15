import { StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

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

// Export constants to be used across the app
export { darkTheme, lightTheme, SCREEN_WIDTH, SCREEN_HEIGHT, isSmallDevice };

// Common styles function
export const createStyles = (theme) => StyleSheet.create({
    pageContainer: {
        paddingHorizontal: SCREEN_WIDTH * 0.05,
        paddingBottom: 120, // Space for the nav bar
        paddingTop: 20,
        backgroundColor: theme.BACKGROUND_COLOR,
    },
    section: {
        marginBottom: SCREEN_HEIGHT * 0.04,
    },
    sectionTitle: {
        color: theme.TEXT_COLOR_PRIMARY,
        fontSize: SCREEN_WIDTH * 0.055,
        fontWeight: 'bold',
        marginBottom: 16,
    },
});

