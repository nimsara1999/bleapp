// HomeScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BleScreen } from './BleScreen';
import NavigationBar from '../components/NavigationBar';

const HomeScreen = () => {
  const navigation = useNavigation();

  const handleAddDevice = () => {
    navigation.navigate('Ble');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity onPress={handleAddDevice} style={styles.buttonAddDevice}>
          <Text style={styles.buttonText}>Connect device</Text>
        </TouchableOpacity>
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
  buttonAddDevice: {
    backgroundColor: '#7836b3',
    width: '45%',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default HomeScreen;
