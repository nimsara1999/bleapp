import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/core';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputsFilled, setInputsFilled] = useState(false); // State to track if inputs are filled
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        navigation.replace("Home");
      }
    });
    return unsubscribe;
  }, []);

  // Function to handle login button press
  const handleLogin = async () => {
    if (email.trim() === '' || password.trim() === '') { // Check if inputs are filled
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
      <TouchableOpacity onPress={handleSignUp} style={styles.loginButton}>
        <Text style={[styles.signupText, { color: 'white' }]}>Register ?</Text>
      </TouchableOpacity>
      <Image source={require('../assets/logo1.png')} style={styles.logo} />
      <View style={[styles.inputContainer, styles.box]}>
        <TextInput
          placeholder="Email *"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <TextInput
          placeholder="Password *"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
        />
        <TouchableOpacity onPress={handleLogin} style={[styles.button]}>
          <Text style={styles.buttonOutlineText}>Login</Text>
        </TouchableOpacity>
      </View>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#745e96" />
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
    backgroundColor: '#b9a5e2', // Lavender color
  },
  inputContainer: {
    width: '80%',
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // Transparent white background
  },
  box: {
    shadowRadius: 2,
    opacity: 0.9, // For Android shadow
    shadowColor: '#000',    // Black color for shadow
    shadowOffset: { width: 0, height: 4 }, // More vertical offset
    shadowOpacity: 0.3,    // More opaque shadow
    shadowRadius: 6,       // Smoother shadow border
    elevation: 3,         // Higher elevation for Android
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 5,
    opacity: 0.9,
  },
  button: {
    backgroundColor: '#902bf5',
    width: '50%',
    padding: 11,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonOutline: {
    backgroundColor: 'white',
    borderColor: '#902bf5',
    borderWidth: 2,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#902bf5',
  },
  loginButton: {
    shadowRadius: 2,
    opacity: 0.9, // For Android shadow
    shadowColor: '#000',    // Black color for shadow
    shadowOffset: { width: 0, height: 4 }, // More vertical offset
    shadowOpacity: 0.3,    // More opaque shadow
    shadowRadius: 6,       // Smoother shadow border
    elevation: 10,         // Higher elevation for Android
    width: '22%',
    padding: 5,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#902bf5',
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1, // Ensure button appears above other elements
  },
  signupText: {
    fontWeight: '700',
    fontSize: 14,
  },
  logo: {
    height: 100,
    width: 100,
    marginBottom: 20,
  },
});
