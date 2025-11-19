import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export type User = {
  name: string;
  email: string;
  // optional color chosen by the user for their pieces (e.g., "#C8A24B" or "red")
  pieceColor?: string | null;
};

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Restaurar usuário salvo ao iniciar o app
    AsyncStorage.getItem("loggedUser").then((data) => {
      if (data) setUser(JSON.parse(data));
    });
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    AsyncStorage.setItem("loggedUser", JSON.stringify(userData));
  };
  const logout = () => {
    setUser(null);
    AsyncStorage.removeItem("loggedUser");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
