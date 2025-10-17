import AsyncStorage from '@react-native-async-storage/async-storage';

export type User = {
  name: string;
  email: string;
  password: string;
};

const USERS_KEY = 'users';

export async function getUsers(): Promise<User[]> {
  const data = await AsyncStorage.getItem(USERS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function saveUser(user: User): Promise<{ success: boolean; error?: string }> {
  const users = await getUsers();
  if (users.find(u => u.email === user.email)) {
    return { success: false, error: 'E-mail já cadastrado.' };
  }
  users.push(user);
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
  return { success: true };
}

export async function loginUser(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  const users = await getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return { success: false, error: 'E-mail ou senha inválidos.' };
  }
  return { success: true, user };
}
