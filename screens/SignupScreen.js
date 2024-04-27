import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/core';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";

const SignupScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reenteredPassword, setReenteredPassword] = useState('');
  const [registered, setRegistered] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        navigation.replace("Home");
      }
    });

    return unsubscribe;
  }, []);

  const handleSignUp = () => {
    if (!email || !password || !reenteredPassword) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    if (password !== reenteredPassword) {
      Alert.alert('Password Not Matched', 'Please make sure the passwords match.');
      return;
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then(userCredentials => {
        const user = userCredentials.user;
        console.log('Registered with:', user.email);
        setRegistered(true);
      })
      .catch(error => {
        setRegistered(false);
        alert(error.message);
      });
  };

  const handleLogin = () => {
    navigation.navigate("Login");
  };

  return (
    <KeyboardAvoidingView style={[styles.container, styles.background]}>
      <TouchableOpacity onPress={handleLogin} style={styles.loginButton}>
        <Text style={[styles.signupText, { color: 'white' }]}>Login ?</Text>
      </TouchableOpacity>
      <Image source={require('../assets/logo1.png')} style={styles.logo} />
      <View style={[styles.inputContainer, styles.box]}>
        <TextInput
          placeholder="Email*"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <TextInput
          placeholder="Password*"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
        />
        <TextInput
          placeholder="Re-enter Password*"
          value={reenteredPassword}
          onChangeText={setReenteredPassword}
          style={styles.input}
          secureTextEntry
        />
        <TouchableOpacity onPress={handleSignUp} style={[styles.button, styles.buttonOutline]}>
          <Text style={styles.buttonOutlineText}>Register</Text>
        </TouchableOpacity>
      </View>
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
  buttonContainer: {
    width: '50%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  button: {
    backgroundColor: '#0782F9',
    width: '60%',
    padding: 10,
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
    color: '#902bf5',
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
  signupButton: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  signupText: {
    color: '#902bf5',
    fontWeight: '700',
    fontSize: 14,
  },
  loginButton: {
    shadowRadius: 2,
    opacity: 0.9, // For Android shadow
    shadowColor: '#000',    // Black color for shadow
    shadowOffset: { width: 0, height: 4 }, // More vertical offset
    shadowOpacity: 0.3,    // More opaque shadow
    shadowRadius: 6,       // Smoother shadow border
    elevation: 10,         // Higher elevation for Android
    shadowColor: '#000',
    shadowOpacity: 0.5,
    width: '18%',
    padding: 5,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#902bf5',
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1, // Ensure button appears above other elements
  },
  logo: {
    height: 100,
    width: 100,
    marginBottom: 20,
  },
});
