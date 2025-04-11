// ProfileScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import useBackButton from './useBackButton'; // Import the hook

const API_URL = 'http://10.0.2.2:5000/api';

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserInfo();
  }, []);

  useBackButton();

  const fetchUserInfo = async () => {
    try {
      setLoading(true);

      // Get the token and user data from AsyncStorage
      const token = await AsyncStorage.getItem('token');
      const userString = await AsyncStorage.getItem('user');

      if (!token || !userString) {
        setError('Not logged in');
        setLoading(false);
        return;
      }

      // Parse the stored user data
      const storedUser = JSON.parse(userString);

      // Make a request to get the full user profile
      const response = await axios.get(`${API_URL}/users/${storedUser.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Set the user data from response
      setUserData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
      setLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Back to Login" onPress={logout} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>User Profile</Text>
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Username:</Text>
        <Text style={styles.value}>{userData?.username}</Text>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Name:</Text>
        <Text style={styles.value}>{userData?.firstName} {userData?.lastName}</Text>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{userData?.email}</Text>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Role:</Text>
        <Text style={styles.value}>{userData?.role}</Text>
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Logout" onPress={logout} />
        <Button title="Back to Home" onPress={() => navigation.goBack()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff'
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  },
  infoContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontWeight: 'bold',
    width: 100,
  },
  value: {
    flex: 1,
  },
  buttonContainer: {
    marginTop: 30,
    gap: 10,
  },
  errorText: {
    color: 'red',
    marginBottom: 20,
  }
});