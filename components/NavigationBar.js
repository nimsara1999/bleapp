// NavigationBar.js
import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const NavigationBar = ({ onPressUserIcon }) => {
  return (
    <View style={styles.navBar}>
      <Image source={require('../assets/logo.png')} style={styles.logo} />
      <TouchableOpacity style={styles.userIcon} onPress={onPressUserIcon}>
        <Ionicons name="person" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = {
  navBar: {
    backgroundColor: '#7836b3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    width: '100%',
    height: 50,
  },
  userIcon: {
    marginLeft: 20,
  },
  logo: {
    width: 40,
    height: 40,
  },
};

export default NavigationBar;
