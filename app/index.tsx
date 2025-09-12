import React from 'react';
import IndexScreen from '../app/components/indexHomeScreen';
import { View, Text } from 'react-native';
import LoginScreen from './components/loginScreen';
import { Link, useRouter } from 'expo-router';
import RegisterScreen from './components/registerScreen';


 const IndexHomeScreen = () => {
  return <IndexScreen />;
};

 export default IndexHomeScreen;


 //export default function LoginPage() {
    //const router = useRouter();
    //return (
      //<LoginScreen onSwitchToRegister={() => router.push('/register')} />
    //);
 //}


//  export default function RegisterPage() {
//    const router = useRouter();
//    return (
//     <> 
//       {/* <RegisterScreen onSwitchToLogin={() => router.push('/login')} /> */}

//     </>
//    );
//  }

