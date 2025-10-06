import React, {
    createContext,
    useState,
    useContext,
    useEffect,
    ReactNode
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tipagem para os dados básicos do usuário que vamos armazenar
type UserType = {
    uid: string; // ID único
    name: string;
    email: string;
    avatar?: string | null; // A interrogação indica que é opcional
    height?: number | null;
    weight?: number | null;
};

// Tipagem para TUDO que o nosso Hook 'useAuth' vai fornecer
type AuthContextType = {
    user: UserType | null; // O objeto do usuário ou nulo se deslogado
    token: string | null; // O token de autenticação
    signIn: (userData: UserType, token: string) => Promise<void>; // Função de login
    signOut: () => Promise<void>; // Função de logout
    updateUser: (newUserData: Partial<UserType>) => Promise<void>; // Função para atualizar dados do usuário
    isAuthReady: boolean; // Flag para saber se a checagem inicial do storage já terminou
};

// Crio o contexto. O valor inicial é nulo, e o Hook 'useAuth' vai checar isso.
const AuthContext = createContext<AuthContextType | null>(null);

// Componente Provedor (É ele quem envolve toda a aplicação)
export function AuthProvider({ children }: { children: ReactNode }) {
    // Estado que guarda o objeto do usuário logado
    const [user, setUser] = useState<UserType | null>(null);
    // Estado que guarda o token de autenticação (JWT)
    const [token, setToken] = useState<string | null>(null);
    // Estado para saber se já terminei de carregar o usuário e token do AsyncStorage
    const [isAuthReady, setIsAuthReady] = useState(false);

    // Efeito que roda uma única vez na inicialização do app para tentar logar o usuário
    useEffect(() => {
        async function loadStoredAuth() {
            try {
                // Tenta pegar o token e o usuário salvos
                const storedToken = await AsyncStorage.getItem('@auth/token');
                const storedUser = await AsyncStorage.getItem('@auth/user');

                // Se encontrar os dois, atualiza os estados
                if (storedToken && storedUser) {
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                }
            } catch (e) {
                console.error('Falha ao carregar dados de autenticação:', e);
            } finally {
                // Muito importante: indica que a checagem inicial terminou (seja logado ou não)
                setIsAuthReady(true);
            }
        }
        loadStoredAuth();
    }, []); // Array vazio garante que rode apenas na montagem

    // Função de login: recebe os dados e o token
    const signIn = async (userData: UserType, authToken: string) => {
        try {
            // Salvo o usuário e o token no armazenamento persistente (AsyncStorage)
            await AsyncStorage.setItem('@auth/user', JSON.stringify(userData));
            await AsyncStorage.setItem('@auth/token', authToken);
            // Atualizo os estados do contexto para o app reagir
            setUser(userData);
            setToken(authToken);
        } catch (e) {
            console.error('Falha ao fazer login:', e);
        }
    };

    // Função de logout: limpa os dados salvos e os estados
    const signOut = async () => {
        try {
            await AsyncStorage.removeItem('@auth/user');
            await AsyncStorage.removeItem('@auth/token');
            // Zera os estados
            setUser(null);
            setToken(null);
        } catch (e) {
            console.error('Falha ao fazer logout:', e);
        }
    };

    // Função para atualizar dados do usuário (ex: se ele mudar o nome no perfil)
    const updateUser = async (newUserData: Partial<UserType>) => {
        if (!user) return; // Se não estiver logado, nem faz nada
        try {
            // Crio um novo objeto de usuário, misturando os dados antigos com os novos
            const updatedUser = { ...user, ...newUserData };
            // Salvo a versão atualizada no AsyncStorage
            await AsyncStorage.setItem('@auth/user', JSON.stringify(updatedUser));
            // Atualizo o estado para refletir a mudança imediatamente
            setUser(updatedUser);
        } catch (e) {
            console.error('Falha ao atualizar dados do usuário:', e);
        }
    };

    return (
        // Passo todos os valores e funções para os componentes filhos
        <AuthContext.Provider value={{ user, token, signIn, signOut, updateUser, isAuthReady }}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook customizado que os componentes usarão para acessar a autenticação
export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    // Checagem de segurança: garante que o hook não seja chamado fora do AuthProvider
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
}