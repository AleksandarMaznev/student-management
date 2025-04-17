import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GradeManagementModal = ({
  visible,
  onClose,
  courseId,
  courseName,
  students,
  assignments,
  onAddGrade,
  onRemoveLastGrade
}) => {
  // State declarations
  const [score, setScore] = useState('');
  const [comment, setComment] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Set the first student as selected by default if only one student is provided
  useEffect(() => {
    if (students && students.length === 1) {
      setSelectedStudent(students[0]);
    }
  }, [students]);

  const getToken = async () => {
    try {
      return await AsyncStorage.getItem('token');
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    // Clear previous messages
    setError('');
    setSuccess('');

    // Validate inputs
    if (!selectedStudent) {
      setError('Please select a student.');
      return;
    }

    if (!score || isNaN(parseFloat(score))) {
      setError('Please enter a valid score.');
      return;
    }

    setLoading(true);

    try {
      const gradeData = {
        studentId: selectedStudent._id,
        courseId: courseId,
        score: parseFloat(score),
        comment: comment,
        assignmentId: selectedAssignment ? selectedAssignment._id : null,
        assignmentName: selectedAssignment ? selectedAssignment.name : "General Assessment"
      };

      // Fix the logging - log the actual gradeData object
      console.log('Preparing to add grade:', gradeData);

      // Make sure onAddGrade exists and is a function
      if (typeof onAddGrade !== 'function') {
        console.error('onAddGrade is not a function:', onAddGrade);
        setError('Internal error: grade handler not available');
        return;
      }

      await onAddGrade(gradeData);

      // Log after successful submission
      console.log('Grade submission completed');

      // Reset form and show success message
      setScore('');
      setComment('');
      setSuccess('Grade added successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);

    } catch (error) {
      setError('Failed to add grade. Please try again.');
      console.error('Error in handleSubmit:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeLastGrade = async () => {
    if (!selectedStudent) {
      setError('Please select a student.');
      return;
    }

    setLoading(true);

    try {
      const token = await getToken();

      // Fetch the latest grade for this student and course
      const response = await fetch(
        `/api/grades/latest?studentId=${selectedStudent._id}&courseId=${courseId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch the latest grade');
      }

      const data = await response.json();

      if (data.grade) {
        await onRemoveLastGrade(data.grade._id);
        setSuccess('Last grade removed successfully!');

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        setError('No grades found to remove.');
      }
    } catch (error) {
      setError('Failed to remove grade. Please try again.');
      console.error('Error in removeLastGrade:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Manage Grades: {courseName}</Text>

          {/* Student selection (if multiple students) */}
          {students && students.length > 1 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Student</Text>
              <ScrollView horizontal style={styles.studentSelector}>
                {students.map(student => (
                  <TouchableOpacity
                    key={student._id}
                    style={[
                      styles.studentItem,
                      selectedStudent && selectedStudent._id === student._id && styles.selectedStudentItem
                    ]}
                    onPress={() => setSelectedStudent(student)}
                  >
                    <Text
                      style={[
                        styles.studentName,
                        selectedStudent && selectedStudent._id === student._id && styles.selectedStudentName
                      ]}
                    >
                      {student.firstName} {student.lastName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Assignment selection */}
          {assignments && assignments.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Assignment (Optional)</Text>
              <ScrollView style={styles.assignmentContainer}>
                <TouchableOpacity
                  style={[
                    styles.assignmentItem,
                    !selectedAssignment && styles.selectedAssignmentItem
                  ]}
                  onPress={() => setSelectedAssignment(null)}
                >
                  <Text
                    style={[
                      styles.assignmentName,
                      !selectedAssignment && styles.selectedAssignmentName
                    ]}
                  >
                    General Assessment (No Assignment)
                  </Text>
                </TouchableOpacity>

                {assignments.map(assignment => (
                  <TouchableOpacity
                    key={assignment._id}
                    style={[
                      styles.assignmentItem,
                      selectedAssignment && selectedAssignment._id === assignment._id && styles.selectedAssignmentItem
                    ]}
                    onPress={() => setSelectedAssignment(assignment)}
                  >
                    <Text
                      style={[
                        styles.assignmentName,
                        selectedAssignment && selectedAssignment._id === assignment._id && styles.selectedAssignmentName
                      ]}
                    >
                      {assignment.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Grade input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Score:</Text>
            <TextInput
              style={styles.input}
              value={score}
              onChangeText={setScore}
              placeholder="Enter score (0-100)"
              keyboardType="numeric"
            />
          </View>

          {/* Comment input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Comment (Optional):</Text>
            <TextInput
              style={[styles.input, styles.commentInput]}
              value={comment}
              onChangeText={setComment}
              placeholder="Add a comment about this grade"
              multiline
            />
          </View>

          {/* Error and success messages */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {success ? <Text style={styles.successText}>{success}</Text> : null}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={removeLastGrade}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Remove Last Grade</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Saving...' : 'Add Grade'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalView: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center'
  },
  section: {
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5
  },
  studentSelector: {
    flexDirection: 'row',
    marginBottom: 10
  },
  studentItem: {
    padding: 8,
    marginRight: 10,
    borderRadius: 5,
    backgroundColor: '#f0f0f0'
  },
  selectedStudentItem: {
    backgroundColor: '#3498db'
  },
  studentName: {
    fontSize: 14
  },
  selectedStudentName: {
    color: 'white'
  },
  assignmentContainer: {
    maxHeight: 120
  },
  assignmentItem: {
    padding: 10,
    marginBottom: 5,
    borderRadius: 5,
    backgroundColor: '#f0f0f0'
  },
  selectedAssignmentItem: {
    backgroundColor: '#3498db'
  },
  assignmentName: {
    fontSize: 14
  },
  selectedAssignmentName: {
    color: 'white'
  },
  inputContainer: {
    marginBottom: 15
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 5
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16
  },
  commentInput: {
    height: 80,
    textAlignVertical: 'top'
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15
  },
  button: {
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelButton: {
    backgroundColor: '#95a5a6'
  },
  deleteButton: {
    backgroundColor: '#e74c3c'
  },
  submitButton: {
    backgroundColor: '#2ecc71'
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: 10
  },
  successText: {
    color: '#2ecc71',
    marginBottom: 10
  }
});

export default GradeManagementModal;