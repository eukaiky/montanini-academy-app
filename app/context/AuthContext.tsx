import React, {
    createContext,
    useState,
    useContext,
    useEffect,
    ReactNode
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. Tipagem mais específica para o usuário
type UserType = {
    uid: string;
    name: string;
    email: string;
    theme?: 'light' | 'dark';
    [key: string]: any;
};

// 2. Tipagem para os valores do contexto
type AuthContextType = {
    user: UserType | null;
    signIn: (userData: UserType) => Promise<void>;
    signOut: () => Promise<void>;
    updateUserData: (newData: Partial<UserType>) => Promise<void>;
    isAuthReady: boolean; // Estado para saber se a autenticação foi checada
};

// 3. Criação do Contexto
const AuthContext = createContext<AuthContextType | null>(null);

// 4. Componente Provedor (Provider)
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserType | null>(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    // Efeito para carregar o usuário do AsyncStorage na inicialização do app
    useEffect(() => {
        async function loadCurrentUser() {
            try {
                const uid = await AsyncStorage.getItem('@auth/current_uid');
                if (uid) {
                    const stored = await AsyncStorage.getItem(`@auth/user_${uid}`);
                    if (stored) {
                        const parsedUser = JSON.parse(stored);
                        setUser(parsedUser);
                    }
                }
            } catch (e) {
                console.error('Erro ao carregar usuário:', e);
            } finally {
                // Marca que a verificação inicial foi concluída
                setIsAuthReady(true);
            }
        }

        loadCurrentUser();
    }, []);

    // Função de login: salva o usuário no estado e no AsyncStorage
    const signIn = async (userData: UserType) => {
        try {
            await AsyncStorage.setItem(`@auth/user_${userData.uid}`, JSON.stringify(userData));
            await AsyncStorage.setItem('@auth/current_uid', userData.uid);
            setUser(userData);
        } catch (e) {
            console.error('Erro ao fazer login:', e);
        }
    };

    // Função para atualizar dados do usuário
    const updateUserData = async (newData: Partial<UserType>) => {
        if (!user) return;
        const updated = { ...user, ...newData };
        setUser(updated);
        await AsyncStorage.setItem(`@auth/user_${user.uid}`, JSON.stringify(updated));
    };

    // Função de logout: remove o usuário do estado e do AsyncStorage
    const signOut = async () => {
        if (!user) return;
        await AsyncStorage.removeItem('@auth/current_uid');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, signIn, signOut, updateUserData, isAuthReady }}>
            {children}
        </AuthContext.Provider>
    );
}

// 5. Hook customizado para usar o contexto
export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    // Garante que o hook seja usado dentro de um AuthProvider
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
}

