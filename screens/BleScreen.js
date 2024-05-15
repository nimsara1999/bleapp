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
} from "react-native";
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
  const [deviceID, setDeviceID] = useState(null);
  const [customChar, setCustomChar] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("Searching...");
  const [receivedData, setReceivedData] = useState([]);
  const [lastPressedButton, setLastPressedButton] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // State to control the loading animation
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
        setIsLoading(false); // Stop loading animation on error
        return;
      }
      setIsLoading(true);
      let epochTime = parseInt(atob(characteristic.value), 10);
      let date = new Date(epochTime * 1000); // Convert seconds to milliseconds
      let dateString = date.toLocaleString(); // Converts to local date-time string
      setReceivedData(prevData => {
        const updatedData = [...prevData, dateString];
        if(updatedData.length >=26) {
          setIsLoading(false);
        }
        if (updatedData.length > 30) {
          return updatedData.slice(30);
        }
        return updatedData;
      });
      //console.log(`${charUuid}:`, dateString);
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


  
  const writeEpochToEsp32 = async () => {
    if (!customChar) {
      console.log("Custom characteristic not found");
      Alert.alert('Bluetooth Not Connected.', 'Please connect your device to Bluetooth before requesting data.');
      return;
    }
    
    const currentTime = new Date(); // Get the current local time
    const epochTime = Math.floor(currentTime.getTime() / 1000); // Convert to epoch timestamp in seconds
    const epochTimeString = epochTime.toString(); // Convert the epoch time to string
    
    try {
      await customChar.writeWithResponse(btoa(epochTimeString)); // Convert string to base64 and write to the BLE device
      console.log(`Wrote '${epochTimeString}' (epoch time) to BLE device`);
    } catch (error) {
      console.error("Failed to write epoch time to BLE device: ", error);
      Alert.alert('Write Error', 'Failed to write data to the Bluetooth device. Please try again.');
    }
  };
  

  const writeGetButton = async (sendData, buttonId) => {
    writeEpochToEsp32();
    if (!customChar) {
      console.log("Custom characteristic not found");
      Alert.alert('Bluetooth Not Connected.', 'Please connect your device to Bluetooth before requesting data.');
      return;
    }
    await customChar.writeWithResponse(btoa(sendData));
    console.log(`Wrote '${sendData}' to BLE device`);
    setLastPressedButton(buttonId); // Update the last pressed button state
  };

  const buttonStyle = (buttonId) => ({
    padding: 8,
    backgroundColor: lastPressedButton === buttonId ? '#b368ff' : '#9b37ff', // 'Tomato' for active, purple otherwise
    borderRadius: 10,
    width: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  });

  const renderTable = () => {
    // Ensure there are always 30 entries (15 rows of 2 columns)
    let displayData = receivedData.slice(-30); // Keep the last 30 entries
    let rowData = [];
    for (let i = 0; i < displayData.length; i += 2) {
      rowData.push({
        left: displayData[i],
        right: displayData[i + 1] ? displayData[i + 1] : "",
      });
    }
    return (
      <View style={styles.table}>
        {rowData.map((pair, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={[styles.tableCell, { marginRight: 30 }]}>{pair.left}</Text>
            <Text style={styles.tableCell}>{pair.right}</Text>
          </View>
        ))}
      </View>
    );
  };

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
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="xl" color="#7836b3" />
        </View>
      )}
      <View style={styles.content}>
        {/* Row for Button 1 */}
        <View style={styles.pagination}>
          <View style={styles.row}>
            <Text style={styles.label}>BUTTON ONE</Text>
            <TouchableOpacity onPress={() => writeGetButton("get/button1/1-30", 1)} style={buttonStyle(1)}>
              <Text style={styles.buttonText}>1</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => writeGetButton("get/button1/31-60", 2)} style={buttonStyle(2)}>
              <Text style={styles.buttonText}>2</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => writeGetButton("get/button1/61-90", 3)} style={buttonStyle(3)}>
              <Text style={styles.buttonText}>3</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => writeGetButton("get/button1/91-120", 4)} style={buttonStyle(4)}>
              <Text style={styles.buttonText}>4</Text>
            </TouchableOpacity>
          </View>
          {/* Row for Button 2 */}
          <View style={styles.row}>
            <Text style={styles.label}>BUTTON TWO</Text>
            <TouchableOpacity onPress={() => writeGetButton("get/button2/1-30", 5)} style={buttonStyle(5)}>
              <Text style={styles.buttonText}>1</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => writeGetButton("get/button2/31-60", 6)} style={buttonStyle(6)}>
              <Text style={styles.buttonText}>2</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => writeGetButton("get/button2/61-90", 7)} style={buttonStyle(7)}>
              <Text style={styles.buttonText}>3</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => writeGetButton("get/button2/91-120", 8)} style={buttonStyle(8)}>
              <Text style={styles.buttonText}>4</Text>
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView style={{ width: '100%' }}>
          {renderTable()}
        </ScrollView>
      </View>
      <NavigationBar />
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
    paddingBottom: 10,
    paddingTop: 5,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
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
    marginTop: 5,
    width: '89%',
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
  buttonText: {
    fontSize: 12,
    color: "white",
    fontWeight: "bold",
  },
  table: {
    marginTop: 20,
    alignSelf: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 5,
    width: '100%', // Adjusted width for better layout
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  tableCell: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});
