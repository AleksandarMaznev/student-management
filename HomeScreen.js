// HomeScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Button, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

const API_URL = 'http://10.0.2.2:5000/api';

export default function HomeScreen({ navigation }) {
  const [students, setStudents] = useState([]);
  const [token, setToken] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);

  useEffect(() => {
    loadTokenAndFetchData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        fetchStudents(token);
      }
    }, [token])
  );


  const loadTokenAndFetchData = async () => {
    const storedToken = await AsyncStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      decodeRole(storedToken);
      fetchStudents(storedToken);
    }
  };

  const decodeRole = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));

      const decoded = JSON.parse(jsonPayload);
      console.log('User role from token:', decoded.role);

      if (decoded.role === 'admin') {
        setIsAdmin(true);
        console.log('Admin status set to true');
      }

      if (decoded.role === 'teacher') {
        setIsTeacher(true);
        console.log('Teacher status set to true');
      }

      // If not admin or teacher, redirect
      if (decoded.role !== 'admin' && decoded.role !== 'teacher') {
        Alert.alert('Access Denied', 'You do not have permission to view this page');
        navigation.navigate('Profile'); // Redirect to profile page
      }
    } catch (error) {
      console.error('Token decoding error', error);
    }
  };

  const fetchStudents = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Access the users array from the response
      setStudents(response.data.users || []);
    } catch (error) {
      console.error('Error fetching students:', error);

      // Handle unauthorized access
      if (error.response && error.response.status === 403) {
        Alert.alert('Access Denied', 'You do not have permission to view this page');
        navigation.navigate('Profile');
      }
    }
  };

  const addStudent = async () => {
    setIsLoading(true); // Add this state variable to your component
    try {
      // Form validation
      if (!firstName.trim() || !lastName.trim() || !studentEmail.trim()) {
        Alert.alert('Error', 'All fields are required');
        setIsLoading(false);
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(studentEmail)) {
        Alert.alert('Error', 'Please enter a valid email address');
        setIsLoading(false);
        return;
      }

      const response = await axios.post(
        `${API_URL}/users`,
        {
          firstName,
          lastName,
          email: studentEmail,
          role: 'student',
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Handle successful response
      const { user } = response.data;
      console.log('Sending data:', { firstName, lastName, email: studentEmail, role: 'student' });

      // Reset form fields
      setFirstName('');
      setLastName('');
      setStudentEmail('');
      setShowAddStudentModal(false);

      // Refresh the student list
      fetchStudents(token);

      // Show success message with credentials
      Alert.alert(
        'Student Added Successfully',
        `Username: ${user.username}\nInitial Password: ${user.initialPassword}\n\nPlease share these credentials with the student.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      // Improved error handling
      console.error('Error adding student:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add student';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Students</Text>
      <FlatList
        data={students}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.studentCard}
            onPress={() => navigation.navigate('StudentDetail', { student: item, token  })}
          >
            <Text>{item.username} - {item.email}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Profile Button */}
      <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile')}>
        <Text style={styles.profileText}>P</Text>
      </TouchableOpacity>

      {/* Add Student Button (Admin only) */}
      {isAdmin && (
        <TouchableOpacity style={styles.floatingAddButton} onPress={() => setShowAddStudentModal(true)}>
          <Text style={styles.addText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Add Student Modal */}
      <Modal visible={showAddStudentModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.header}>Add Student</Text>

            <TextInput
              placeholder="First Name"
              value={firstName}
              onChangeText={setFirstName}
              style={styles.input}
            />

            <TextInput
              placeholder="Last Name"
              value={lastName}
              onChangeText={setLastName}
              style={styles.input}
            />

            <TextInput
              placeholder="Email"
              value={studentEmail}
              onChangeText={setStudentEmail}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.buttonContainer}>
              {isLoading ? (
                <ActivityIndicator size="large" color="#0000ff" />
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={addStudent}
                    disabled={!firstName.trim() || !lastName.trim() || !studentEmail.trim()}
                  >
                    <Text style={styles.buttonText}>Add Student</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowAddStudentModal(false)}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  studentCard: { padding: 10, borderWidth: 1, marginVertical: 5 },
  profileButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'blue',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginVertical: 8,
  },
  buttonContainer: {
    flexDirection: 'column',
    marginTop: 15,
    gap: 10,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelText: {
    color: '#666',
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'green',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addText: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
  },
});
