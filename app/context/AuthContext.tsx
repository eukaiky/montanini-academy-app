import React, {
    createContext,
    useState,
    useContext,
    useEffect,
    ReactNode
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tipagem para os dados do usuário
type UserType = {
    uid: string;
    name: string;
    email: string;
    avatar?: string | null;
    height?: number | null;
    weight?: number | null;
};

// Tipagem para os valores do contexto
type AuthContextType = {
    user: UserType | null;
    token: string | null;
    signIn: (userData: UserType, token: string) => Promise<void>;
    signOut: () => Promise<void>;
    updateUser: (newUserData: Partial<UserType>) => Promise<void>;
    isAuthReady: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Componente Provedor
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserType | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    // Carrega o usuário e o token do AsyncStorage na inicialização
    useEffect(() => {
        async function loadStoredAuth() {
            try {
                const storedToken = await AsyncStorage.getItem('@auth/token');
                const storedUser = await AsyncStorage.getItem('@auth/user');
                if (storedToken && storedUser) {
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                }
            } catch (e) {
                console.error('Falha ao carregar dados de autenticação:', e);
            } finally {
                setIsAuthReady(true);
            }
        }
        loadStoredAuth();
    }, []);

    // Função de login: agora salva o usuário E o token
    const signIn = async (userData: UserType, authToken: string) => {
        try {
            await AsyncStorage.setItem('@auth/user', JSON.stringify(userData));
            await AsyncStorage.setItem('@auth/token', authToken);
            setUser(userData);
            setToken(authToken);
        } catch (e) {
            console.error('Falha ao fazer login:', e);
        }
    };

    // Função de logout: limpa tudo
    const signOut = async () => {
        try {
            await AsyncStorage.removeItem('@auth/user');
            await AsyncStorage.removeItem('@auth/token');
            setUser(null);
            setToken(null);
        } catch (e) {
            console.error('Falha ao fazer logout:', e);
        }
    };

    // Função para atualizar os dados do usuário no estado e no AsyncStorage
    const updateUser = async (newUserData: Partial<UserType>) => {
        if (!user) return;
        try {
            const updatedUser = { ...user, ...newUserData };
            await AsyncStorage.setItem('@auth/user', JSON.stringify(updatedUser));
            setUser(updatedUser); // Atualiza o estado após salvar
        } catch (e) {
            console.error('Falha ao atualizar dados do usuário:', e);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, signIn, signOut, updateUser, isAuthReady }}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook customizado para usar o contexto
export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
}

