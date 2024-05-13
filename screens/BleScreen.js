import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  PermissionsAndroid,
  TouchableOpacity,
  Platform,
} from "react-native";
import { BleManager } from "react-native-ble-plx";
import { atob, btoa } from "react-native-quick-base64";
import NavigationBar from "../components/NavigationBar";

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

  const deviceRef = useRef(null);

  useEffect(() => {
    const searchAndConnectToDevice = () => {
      bleManager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error(error);
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
    searchAndConnectToDevice();
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
        // Monitor new characteristics for notifications
        monitorCharacteristic(BUTTON1_CHAR_UUID);
        monitorCharacteristic(BUTTON2_CHAR_UUID);
      })
      .catch((error) => {
        console.error(error);
        setConnectionStatus("Error in Connection");
      });
  };

  const monitorCharacteristic = (charUuid) => {
    deviceRef.current.monitorCharacteristicForService(SERVICE_UUID, charUuid, (error, characteristic) => {
      if (error) {
        console.error(`Error setting up notification for ${charUuid}:`, error);
        return;
      }
      console.log(`Notification from ${charUuid}:`, atob(characteristic.value));
    });
  };

  useEffect(() => {
    const subscription = bleManager.onDeviceDisconnected(
      deviceID,
      (error, device) => {
        if (error) {
          console.error("Disconnected with error:", error);
        }
        setConnectionStatus("Disconnected");
        console.log("Disconnected device");
        if (deviceRef.current) {
          setConnectionStatus("Reconnecting...");
          connectToDevice(deviceRef.current)
            .then(() => setConnectionStatus("Connected"))
            .catch((error) => {
              console.error("Reconnection failed: ", error);
              setConnectionStatus("Reconnection failed");
            });
        }
      }
    );
    return () => subscription.remove();
  }, [deviceID]);

  const writeGetButton2 = async () => {
    if (!customChar) {
      console.log("Custom characteristic not found");
      return;
    }
    await customChar.writeWithResponse(btoa("get/button2"));
    console.log("Wrote 'get/button2' to BLE device");
  };

  const writeGetButton1 = async () => {
    if (!customChar) {
      console.log("Custom characteristic not found");
      return;
    }
    await customChar.writeWithResponse(btoa("get/button1"));
    console.log("Wrote 'get/button1' to BLE device");
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.connectionStatus}>{connectionStatus}</Text>
        <TouchableOpacity onPress={writeGetButton1} style={styles.button}>
          <Text style={styles.buttonText}>Update Button 1</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={writeGetButton2} style={styles.button}>
          <Text style={styles.buttonText}>Update Button 2</Text>
        </TouchableOpacity>
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
  connectionStatus: {
    fontSize: 20,
    color: "black",
    fontWeight: "bold",
    fontFamily: "System",
  },
  button: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "blue",
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});