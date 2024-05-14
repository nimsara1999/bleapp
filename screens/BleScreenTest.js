import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  Animated,
  ScrollView
} from "react-native";
import { BleManager } from "react-native-ble-plx";
import { atob, btoa } from "react-native-quick-base64";
import NavigationBar from "../components/NavigationBar";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

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
  const rotation = useRef(new Animated.Value(0)).current;
  const deviceRef = useRef(null);

  useEffect(() => {
    const checkConnectedDevice = async () => {
      const connectedDevices = await bleManager.connectedDevices([SERVICE_UUID]);
      if (connectedDevices.length > 0) {
        const connectedDevice = connectedDevices[0];
        connectToDevice(connectedDevice);
      } else {
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
      let epochTime = parseInt(atob(characteristic.value), 10);
      let date = new Date(epochTime * 1000); // Convert seconds to milliseconds
      let dateString = date.toLocaleString(); // Converts to local date-time string
      setReceivedData(prevData => {
        const updatedData = [...prevData, dateString];
        // Keep only the last 30 entries to maintain 15 rows of 2 columns
        if (updatedData.length > 30) {
          return updatedData.slice(-30);
        }
        return updatedData;
      });
      console.log(`${charUuid}:`, dateString);
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

        if (deviceRef.current) {
          await bleManager.cancelDeviceConnection(deviceRef.current.id);
          deviceRef.current = null;
        }
        
        setConnectionStatus("Searching...");
        searchAndConnectToDevice();
      }
    );
    return () => subscription.remove();
  }, [deviceID]);

  const writeGetButton = async (sendData) => {
    if (!customChar) {
      console.log("Custom characteristic not found");
      return;
    }
    await customChar.writeWithResponse(btoa(sendData));
    console.log(`Wrote '${sendData}' to BLE device`);
  };

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
      <View style={styles.content}>
        <View style={styles.statusIcon}>
          <StatusIcon />
        </View>
        {/* Row for Button 1 */}
        <View style={styles.row}>
          <Text style={styles.label}>Button 1</Text>
          <TouchableOpacity onPress={() => writeGetButton("get/button1/1-30")} style={styles.button}>
            <Text style={styles.buttonText}>1</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => writeGetButton("get/button1/31-60")} style={styles.button}>
            <Text style={styles.buttonText}>2</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => writeGetButton("get/button1/61-90")} style={styles.button}>
            <Text style={styles.buttonText}>3</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => writeGetButton("get/button1/91-120")} style={styles.button}>
            <Text style={styles.buttonText}>4</Text>
          </TouchableOpacity>
        </View>
        {/* Row for Button 2 */}
        <View style={styles.row}>
          <Text style={styles.label}>Button 2</Text>
          <TouchableOpacity onPress={() => writeGetButton("get/button2/1-30")} style={styles.button}>
            <Text style={styles.buttonText}>5</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => writeGetButton("get/button2/31-60")} style={styles.button}>
            <Text style={styles.buttonText}>6</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => writeGetButton("get/button2/61-90")} style={styles.button}>
            <Text style={styles.buttonText}>7</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => writeGetButton("get/button2/91-120")} style={styles.button}>
            <Text style={styles.buttonText}>8</Text>
          </TouchableOpacity>
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
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 10,
    width: '60%',
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
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
    right: -50,
    top: 10,
    zIndex: 1,
  },
  button: {
    padding: 5,
    backgroundColor:'#7836b3',
    borderRadius: 5,
    width: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: "white",
  },
  table: {
    marginTop: 10,
    alignSelf: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 10,
    width: '100%', // Adjusted width for better layout
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  
});
