import { Link, useRouter } from 'expo-router';
import { Button } from 'react-native';
import RegisterScreen from '../components/registerScreen';


export default function RegisterPage() {
    const router = useRouter();
    return (
    <> 
    <RegisterScreen onSwitchToLogin={() => router.push('/login')} />
    </>
    );
 }