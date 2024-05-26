// HomeScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BleScreen } from './BleScreen';
import NavigationBar from '../components/NavigationBar'; 
import BluetoothInstructions from '../components/BluetoothInstructions';

const HomeScreen = () => {
  const navigation = useNavigation();

  const handleAddDevice = () => {
    navigation.navigate('Ble');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor='white' />
      <View style={styles.content}>
        <TouchableOpacity onPress={handleAddDevice} style={styles.buttonAddDevice}>
          <Text style={styles.buttonText}>Connect device</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content2}>
      <BluetoothInstructions />
      </View>
      <NavigationBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content2: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 50,
    borderRadius: 10,
  },
  buttonAddDevice: {
    backgroundColor: '#7836b3',
    width: '45%',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
    
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default HomeScreen;
