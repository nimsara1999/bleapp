import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Modal, TouchableWithoutFeedback, Image,Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../firebase';
import { BleScreen } from './BleScreen';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons from Expo

const HomeScreen = () => {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);

  const handleSignOut = () => {
    auth
      .signOut()
      .then(() => {
        navigation.replace('Login');
      })
      .catch(error => alert(error.message));
  };

  const handleAddDevice = () => {
    navigation.navigate('Ble');
  };

  return (
    <View style={styles.container}>
      {/* Navigation Bar */}
      <View style={styles.navBar}>
        <Image source={require('../assets/logo.png')} style={styles.logo} />
        <TouchableOpacity style={styles.userIcon} onPress={() => setModalVisible(true)}>
          <Ionicons name="person" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalBackground}>
            <View style={styles.centeredView}>
              <View style={styles.modalView}>
                <TouchableOpacity onPress={handleSignOut} style={styles.buttonSignOut}>
                  <Text style={styles.buttonText}>Sign out</Text>
                </TouchableOpacity>
                <Text>Email: {auth.currentUser?.email}</Text>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <TouchableOpacity onPress={handleAddDevice} style={styles.buttonAddDevice}>
        <Text style={styles.buttonText}>Add device</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white', // Added white background for the screen
  },
  navBar: {
    backgroundColor:'#902bf5', // Blue color for the navigation bar
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    width: '100%',
    height: 50, // Set desired height for the navigation bar
  },
  navTitle: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  userIcon: {
    marginLeft: 20,
  },
  logo: {
    width: 40,
    height: 40,
  },
  buttonSignOut: {
    backgroundColor: 'red',
    width: '100%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  buttonAddDevice: {
    backgroundColor: '#902bf5',
    width: '50%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 40,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background when modal is open
    justifyContent: 'center',
    alignItems: 'center',
  },
});
