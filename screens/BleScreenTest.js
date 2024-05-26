import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  Animated,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput
} from "react-native";
import Slider from '@react-native-community/slider';
import { BleManager } from "react-native-ble-plx";
import { atob, btoa } from "react-native-quick-base64";
import NavigationBar from "../components/NavigationBar";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';


const bleManager = new BleManager();

async function requestBluetoothPermissions() {
  try {
    const bluetoothPermissions = [
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ];
    const locationPermission = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
    let granted;

    if (Platform.Version >= 31) {
      granted = await PermissionsAndroid.requestMultiple(bluetoothPermissions);
      if (granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("Bluetooth permissions for Android 12+ granted");
      } else {
        console.log("Bluetooth permissions for Android 12+ denied");
      }
    } else {
      granted = await PermissionsAndroid.request(
        locationPermission,
        {
          title: "Location Permission",
          message: "This app needs location access to discover Bluetooth devices.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("Location permission granted");
      } else {
        console.log("Location permission denied");
      }
    }
  } catch (err) {
    console.warn(err);
  }
}

requestBluetoothPermissions();

const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const CUSTOM_CHAR_UUID = "beefcafe-36e1-4688-b7f5-00000000000b";
const BUTTON1_CHAR_UUID = "deadbeef-36e1-4688-b7f5-000000000001";
const BUTTON2_CHAR_UUID = "cafebeef-36e1-4688-b7f5-000000000002";

export default function BleScreen() {
  const [sliderValue, setSliderValue] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [deviceID, setDeviceID] = useState(null);
  const [customChar, setCustomChar] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("Searching...");
  const [lastPressedButton, setLastPressedButton] = useState(null);
  const rotation = useRef(new Animated.Value(0)).current;
  const deviceRef = useRef(null);
  const navigation = useNavigation();

  useEffect(() => {
    const checkConnectedDevice = async () => {
      const connectedDevices = await bleManager.connectedDevices([SERVICE_UUID]);
      if (connectedDevices.length > 0) {
        const connectedDevice = connectedDevices[0];
        connectToDevice(connectedDevice);
      } else {
        console.log("No connected devices found. Searching...");
        searchAndConnectToDevice();
      }
    };

    const searchAndConnectToDevice = () => {
      bleManager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.log(error);
          setConnectionStatus("Error searching for devices");
          return;
        }
        if (device.name === "ESP32_BLE") {
          bleManager.stopDeviceScan();
          setConnectionStatus("Connecting...");
          connectToDevice(device);
        }
      });
    };

    checkConnectedDevice();
  }, []);

  const connectToDevice = (device) => {
    return device
      .connect()
      .then((device) => {
        setDeviceID(device.id);
        setConnectionStatus("Connected");
        deviceRef.current = device;
        return device.discoverAllServicesAndCharacteristics();
      })
      .then((device) => {
        return device.services();
      })
      .then((services) => {
        const service = services.find(s => s.uuid.toUpperCase() === SERVICE_UUID.toUpperCase());
        return service.characteristics();
      })
      .then((characteristics) => {
        const customCharacteristic = characteristics.find(
          char => char.uuid.toUpperCase() === CUSTOM_CHAR_UUID.toUpperCase()
        );
        setCustomChar(customCharacteristic);
        monitorCharacteristic(BUTTON1_CHAR_UUID);
        monitorCharacteristic(BUTTON2_CHAR_UUID);
      })
      .catch((error) => {
        console.log("Error in connection: ", error);
        setConnectionStatus("Error in Connection");
      });
  };

  const monitorCharacteristic = (charUuid) => {
    deviceRef.current.monitorCharacteristicForService(SERVICE_UUID, charUuid, (error, characteristic) => {
      if (error) {
        console.log(`Error setting up notification for ${charUuid}:`, error);
        return;
      }
      
      let readData = atob(characteristic.value);
      let splitData = readData.split('/');
      let key = splitData[0]; // 'volume' or 'flowRate'
      let value = parseInt(splitData[1], 10); // Convert second part to an integer
  
      // Conditional output based on the key
      if (key === 'flowRate') {
        setSliderValue(value);
        console.log('Flow Rate:', value);
      } else if (key === 'volume') {
        setInputValue(value.toString());
        console.log('Volume:', value);
      }
    });
  };
  

  useEffect(() => {
    const subscription = bleManager.onDeviceDisconnected(
      deviceID,
      async (error, device) => {
        if (error) {
          console.log("Disconnected with error:", error);
        }
        setConnectionStatus("Disconnected");
        console.log("Disconnected device");

        try {
          if (deviceRef.current) {
            await bleManager.cancelDeviceConnection(deviceRef.current.id);
            deviceRef.current = null;
          }
        } catch (error) {
          console.log("Error cancelling device connection: ", error);
        }
        Alert.alert('Bluetooth Connection Issue', 'Please check bluetooth connection of your device. Then try again.');
        navigation.navigate('Home');
      }
    );
    return () => subscription.remove();
  }, [deviceID]);
  

  const writeGetButton = async (sendData, buttonId) => {
    if (!customChar) {
      console.log("Custom characteristic not found");
      Alert.alert('Bluetooth Not Connected.', 'Please connect your device to Bluetooth before requesting data.');
      return;
    }
    await customChar.writeWithResponse(btoa(sendData));
    console.log(`Wrote '${sendData}' to BLE device`);
    setLastPressedButton(buttonId); // Update the last pressed button state
  };

  const writeData = async (sendData) => {
    if (!customChar) {
      console.log("Custom characteristic not found");
      Alert.alert('Bluetooth Not Connected.', 'Please connect your device to Bluetooth before requesting data.');
      return;
    }
    await customChar.writeWithResponse(btoa(sendData));
    console.log(`Wrote '${sendData}' to BLE device`);
  };

  const handleInputChange = (text) => {
    // Only allow numbers and limit the range
    const value = parseInt(text);
    if (!isNaN(value) && value >= 1 && value <= 100) {
      setInputValue(text);
    } else {
      // Clear input if it's out of the valid range
      setInputValue('');
      Alert.alert("Invalid Input", "Please enter a number between 1 and 100.");
    }
  };

  const handleSliderChange = (value) => {
    setSliderValue(Math.floor(value)); // Optionally, you can round the value if it's not an integer
    writeData(`set/flowRate/${Math.floor(value)}`);
  };

  const buttonStyle = (buttonId) => ({
    backgroundColor: lastPressedButton === buttonId ? '#7836b3':'#9b37ff', // 'Tomato' for active, purple otherwise
    borderRadius: 10, 
    width: lastPressedButton === buttonId ? 140 : 150,
    height: lastPressedButton === buttonId ? 50 : 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: lastPressedButton === buttonId ? 0 : 6,
  });


  const StatusIcon = () => {
    const spin = rotation.interpolate({ inputRange: [0, 360], outputRange: ["0deg", "360deg"] });

    switch (connectionStatus) {
      case "Searching...":
        return (
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Icon name="reload" size={30} color="#7836b3" />
          </Animated.View>
        );
      case "Connecting...":
        return (
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Icon name="progress-clock" size={30} color="#7836b3" />
          </Animated.View>
        );
      case "Connected":
        return <Icon name="bluetooth-connect" size={25} color="green" />;
      case "Error in Connection":
        return (
          <TouchableOpacity onPress={() => setConnectionStatus("Searching...")}>
            <Icon name="alert-circle" size={30} color="red" />
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 360,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, [connectionStatus]);

  return (
    <View style={styles.container}>
      <View style={styles.statusIcon}>
        <StatusIcon />
      </View>
      <View style={styles.content}>
        {/* Row for Button 1 */}
        <View style={styles.pagination}>

          <View style={styles.row}>
          <Text style={styles.buttonText}>Flow rate: {sliderValue}</Text>
            <Slider
              style={{width: 180, height: 80, sliderColor: 'white'}}
              minimumValue={0}
              maximumValue={100}
              minimumTrackTintColor='white'
              maximumTrackTintColor="white"
              step={1}
              value={sliderValue}
              onValueChange={handleSliderChange}
            />
          </View>

          <View style={styles.row}>
            <TouchableOpacity onPress={() => writeData(`set/volume/${Math.floor(inputValue)}`)} style={styles.button}>
              <Text style={styles.buttonText}>Set volume</Text>
            </TouchableOpacity>
            <TextInput
              style={{ height: 50, borderColor: 'white', borderWidth: 1,  backgroundColor:"white", borderRadius: 10, width: 100, textAlign: 'center', fontSize:20, fontWeight: 'bold'}}
                keyboardType='numeric'
                onChangeText={handleInputChange}
                value={inputValue}
                placeholder= {inputValue}
              />
          </View>
        </View>
        <View style={styles.pagination2}>
          <View style={styles.row2}>
            <TouchableOpacity onPress={() => writeGetButton("get/initialData", 1)} style={buttonStyle(1)}>
              <Text style={styles.buttonText}>Start Infusion</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row2}>
            <TouchableOpacity onPress={() => writeGetButton("set/stop", 2)} style={buttonStyle(2)}>
              <Text style={styles.buttonText}>Stop Infusion</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pagination: {
    backgroundColor: '#7836b3',
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 50,
    paddingTop: 20,
    borderRadius: 20,
    marginTop: -100,
    
  },
  pagination2: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 10,
    paddingTop: 50,
    borderRadius: 10,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    marginTop: 50,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 20,
    width: '100%',
  },
  row2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 10,
    width: '100%',
  },
  label: {
    borderRadius: 5,
    padding: 5,
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
  },
  connectionStatus: {
    fontSize: 20,
    color: "black",
    fontWeight: "bold",
    fontFamily: "System",
    marginBottom: 20,
  },
  statusIcon: {
    position: 'absolute',
    top: 10,
    zIndex: 1,
  },
  button:{
    backgroundColor: '#b368ff',
    borderRadius: 10, 
    width: 100,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: {
    fontSize: 15,
    color: "white",
    fontWeight: "bold",
  },
});
