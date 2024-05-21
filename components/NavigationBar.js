// NavigationBar.js
import React, { useState } from 'react';
import { View, TouchableOpacity, Image, Modal, TouchableWithoutFeedback, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../firebaseData';
import { Ionicons } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign'

const NavigationBar = () => {
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

  return (
    <View style={styles.navBar}>      
      {/* Home Icon */}
      <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.homeIcon}>
        <Ionicons name="home" size={24} color="white" />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.userIcon} onPress={() => setModalVisible(true)}>
        <Ionicons name="person" size={24} color="white" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.userIcon} onPress={() => setModalVisible(true)}>
        <Ionicons name="book" size={24} color="white"  />
      </TouchableOpacity>

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
    </View>
  );
};

const styles = StyleSheet.create({
  navBar: {
    backgroundColor:'#7836b3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    width: '98%',
    height: 60,
    borderTopEndRadius: 15,
    borderTopLeftRadius: 15,
    borderBottomEndRadius: 15,
    borderBottomLeftRadius: 15,
    marginBottom: 10,
    marginLeft: 5,
    marginRight: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
    paddingBottom: 3,
  },
  homeIcon: {
    position: 'absolute',
    left: '55%',
    transform: [{ translateX: -12 }], // Adjust this value based on your icon size
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NavigationBar;
