import { Link, useRouter } from 'expo-router';
import LoginScreen from '../components/loginScreen';
import { Button } from 'react-native';

export default function LoginPage() {
    const router = useRouter();
    return (
      <LoginScreen onSwitchToRegister={() => router.push('/register')} />
    );
 }