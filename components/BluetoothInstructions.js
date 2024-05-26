import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const BluetoothInstructions = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bluetooth Instructions.</Text>
      <Text style={styles.instruction}>
        1. Turn on Bluetooth on your mobile phone.
      </Text>
      <Text style={styles.instructionNotice}>
        ( Notice: No need to pair the device, just turn on Bluetooth ).
      </Text>
      <Text style={styles.instruction}>
        2. Turn on Bluetooth from the device.
      </Text>
      <Text style={styles.instruction}>
        3. Press "Connect device" button above.
      </Text>
      <Text style={styles.instruction}>
        4. You will navigate to Bluetooth page.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginBottom: 80,
    marginTop: -45,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  instruction: {
    fontSize: 16,
    marginBottom: 15,
    color: '#555',
  },
  instructionNotice: {
    fontSize: 13,
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
