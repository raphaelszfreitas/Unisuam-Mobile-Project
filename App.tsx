import { AudioProvider } from "./app/context/AudioContext";
import { AuthProvider } from "./app/context/AuthContext";
import MainMenu from "./app/screens/MainMenu";

export default function App() {
  return (
    <AuthProvider>
      <AudioProvider>
        <MainMenu />
      </AudioProvider>
    </AuthProvider>
  );
}
