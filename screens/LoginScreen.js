import React, { useEffect, useState } from 'react';
import { Animated, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/core';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";

// Theme color variable
const themeColor = '#7836b3';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [logoPosition] = useState(new Animated.Value(0));
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        setLoading(true); // Set loading to true when auto-logging in
        navigation.navigate('Home');
      }
    });

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
      unsubscribe();
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleLogin = async () => {
    if (email.trim() === '' || password.trim() === '') {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      const userCredentials = await signInWithEmailAndPassword(auth, email, password);
      console.log('Logged in with:', userCredentials.user.email);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    navigation.navigate("Signup");
  };

  return (
    <KeyboardAvoidingView style={[styles.container, styles.background]} behavior="padding">
      {!keyboardVisible && (
        <Animated.View style={[styles.boxContainer, styles.box, { transform: [{ translateY: logoPosition }] }]}>
          <Image source={require('../assets/logo1.png')} style={styles.logo} />
        </Animated.View>
      )}
      <Text style={styles.label}>Email</Text>
      <TextInput
        placeholder="Email *"
        value={email}
        onChangeText={setEmail}
        style={[styles.input, styles.textInput]}
      />
      <Text style={styles.label}>Password</Text>
      <TextInput
        placeholder="Password *"
        value={password}
        onChangeText={setPassword}
        style={[styles.input, styles.textInput]}
        secureTextEntry
      />
      <TouchableOpacity onPress={handleLogin} style={styles.button}>
        <Text style={styles.buttonOutlineText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleSignUp} style={[styles.signupButton]}>
        <Text style={[styles.signupText, { color: themeColor }]}>            Register ?</Text>
      </TouchableOpacity>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColor} />
          <Text style={styles.loadingText}>Logging in...</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    backgroundColor: 'rgba(249, 242, 255)', // Lavender color
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
  textInput: {
    alignSelf: 'center',
  },
  button: {
    elevation: 1,
    shadowColor: themeColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    backgroundColor: themeColor,
    width: '80%',
    padding: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonOutlineText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: themeColor,
  },
  loginButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    zIndex: 1,
    padding: 5,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: themeColor,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  signupButton: {
    bottom: 'auto',
    left: 'auto',
    top: 20,
    right: 20,
  },
  signupText: {
    fontWeight: '700',
    fontSize: 16,
  },
  logo: {
    height: 100,
    width: 100,
    marginBottom: 20,
  },
  label: {
    alignSelf: 'flex-start',
    marginLeft: '10%',
    marginBottom: 5,
    fontSize: 16,
    fontWeight: '600',
    color: themeColor,
  },
});
