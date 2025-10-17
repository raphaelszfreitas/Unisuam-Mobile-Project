import MainMenu from "./app/screens/MainMenu";
import { AuthProvider } from "./app/context/AuthContext";

export default function App() {
    return (
        <AuthProvider>
            <MainMenu />
        </AuthProvider>
    );
}
