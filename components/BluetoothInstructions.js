import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const BluetoothInstructions = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bluetooth Connection Instructions</Text>
      <Text style={styles.instruction}>
        1. Make sure Bluetooth is enabled on your device.
      </Text>
      <Text style={styles.instruction}>
        2. Open the settings menu and navigate to Bluetooth.
      </Text>
      <Text style={styles.instruction}>
        3. Select the device you want to connect to.
      </Text>
      <Text style={styles.instruction}>
        4. If prompted, enter the pairing code provided with your device.
      </Text>
      <Text style={styles.note}>
        Note: Make sure the device you're connecting to is in pairing mode.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  instruction: {
    fontSize: 16,
    marginBottom: 10,
    color: '#555',
  },
  note: {
    marginTop: 20,
    fontStyle: 'italic',
    color: '#888',
  },
});

export default BluetoothInstructions;
