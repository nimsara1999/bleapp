import React, { useEffect, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Image,
  ActivityIndicator,
  Keyboard
} from 'react-native';
import { useNavigation } from '@react-navigation/core';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from '../firebaseData';

const themeColor = '#7836b3';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;

const SignupScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reenteredPassword, setReenteredPassword] = useState('');
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [logoPosition] = useState(new Animated.Value(0));
  const navigation = useNavigation();

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow',
      () => {
        setKeyboardVisible(true);
        Animated.timing(logoPosition, {
          toValue: -100,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide',
      () => {
        setKeyboardVisible(false);
        Animated.timing(logoPosition, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleSignUp = () => {
    if (!email || !password || !reenteredPassword) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (!passwordRegex.test(password)) {
      Alert.alert('Invalid Password', 'Password must have at least 8 characters, including at least one uppercase letter, one lowercase letter, and one number.');
      return;
    }

    if (password !== reenteredPassword) {
      Alert.alert('Password Not Matched', 'Please make sure the passwords match.');
      return;
    }

    setLoading(true);

    createUserWithEmailAndPassword(auth, email, password)
      .then(userCredentials => {
        const user = userCredentials.user;
        console.log('Registered with:', user.email);
        setRegistered(true);
        setLoading(false);
        navigation.navigate('Home');
      })
      .catch(error => {
        setLoading(false);
        Alert.alert('Registration Failed', error.message);
      });
  };

  const handleLogin = () => {
    navigation.navigate("Login");
  };

  return (
    <KeyboardAvoidingView style={[styles.container, styles.background]} behavior="padding">
      {!keyboardVisible && (
        <Animated.View style={[styles.boxContainer, styles.box, { transform: [{ translateY: logoPosition }] }]}>
          <Image source={require('../assets/logo1.png')} style={styles.logo} />
        </Animated.View>
      )}
      <Text style={[styles.label, { marginTop: 95 }]}>Email</Text>
      <TextInput
        placeholder="Email*"
        value={email}
        onChangeText={setEmail}
        style={[styles.input, { borderColor: themeColor }]}
      />
      <Text style={styles.label}>Password</Text>
      <TextInput
        placeholder="Password*"
        value={password}
        onChangeText={setPassword}
        style={[styles.input, { borderColor: themeColor }]}
        secureTextEntry
      />
      <TextInput
        placeholder="Re-enter Password*"
        value={reenteredPassword}
        onChangeText={setReenteredPassword}
        style={[styles.input, { borderColor: themeColor, marginTop: -10 }]}
        secureTextEntry
      />
      <TouchableOpacity onPress={handleSignUp} style={[styles.button, { backgroundColor: themeColor }]}>
        {loading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.buttonText}>Register</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={handleLogin}>
        <Text style={[styles.signupText, { color: themeColor }]}>Login ?</Text>
      </TouchableOpacity>
      {registered && (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>Successfully registered</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  boxContainer: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    width: '100%',
  },
  box: {
    backgroundColor: themeColor,
    padding: 25,
    borderBottomEndRadius: 15,
    borderBottomLeftRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
    paddingBottom: 2,
  },
  input: {
    shadowColor: '#000',
    width: '80%',
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 20,
    opacity: 1,
    borderColor: themeColor,
    borderWidth: 1,
  },
  label: {
    alignSelf: 'flex-start',
    marginLeft: '10%',
    marginBottom: 5,
    fontSize: 16,
    fontWeight: '600',
    color: themeColor,
  },
  button: {
    elevation: 1,
    shadowColor: themeColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    width: '80%',
    padding: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  successContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'green',
  },
  logo: {
    height: 100,
    width: 100,
    marginBottom: 20,
  },
  signupText: {
    marginTop: 18,
    fontWeight: '700',
    fontSize: 16,
  },
});
