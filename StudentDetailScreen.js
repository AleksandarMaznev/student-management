import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Alert, ScrollView, Modal } from 'react-native';
import axios from 'axios';
import useBackButton from './useBackButton';

const API_URL = 'http://10.0.2.2:5000/api';

// Imported utility functions
const fetchStudentGrades = async (studentId, token) => {
  try {
    const response = await axios.get(
      `${API_URL}/grades/student/${studentId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data;
  } catch (err) {
    console.error('Error fetching grades:', err.response?.data || err.message);
    Alert.alert('Error', 'Failed to fetch student grades');
    return null;
  }
};

const addGrade = async (studentId, courseId, score, comment = "", token) => {
  try {
    const response = await axios.post(
      `${API_URL}/grades`,
      {
        studentId,
        courseId,
        score,
        comment
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    Alert.alert('Success', 'Grade added successfully');
    return response.data.grade;
  } catch (err) {
    console.error('Error adding grade:', err.response?.data || err.message);
    Alert.alert('Error', 'Failed to add grade');
    return null;
  }
};

const updateGrade = async (gradeId, score, comment, token) => {
  try {
    const response = await axios.put(
      `${API_URL}/grades/${gradeId}`,
      {
        score,
        comment
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    Alert.alert('Success', 'Grade updated successfully');
    return response.data.grade;
  } catch (err) {
    console.error('Error updating grade:', err.response?.data || err.message);
    Alert.alert('Error', 'Failed to update grade');
    return null;
  }
};

const fetchCourseStatistics = async (courseId, token) => {
  try {
    const response = await axios.get(
      `${API_URL}/grades/stats/course/${courseId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data;
  } catch (err) {
    console.error('Error fetching course statistics:', err.response?.data || err.message);
    Alert.alert('Error', 'Failed to fetch course statistics');
    return null;
  }
};

const fetchCourseGrades = async (courseId, token) => {
  try {
    const response = await axios.get(
      `${API_URL}/grades/course/${courseId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data;
  } catch (err) {
    console.error('Error fetching course grades:', err.response?.data || err.message);
    Alert.alert('Error', 'Failed to fetch course grades');
    return null;
  }
};

export default function StudentDetailScreen({ route }) {
  const { student, token } = route.params;
  const [subjectsMap, setSubjectsMap] = useState({});
  const [newSubject, setNewSubject] = useState('');
  const [expandedSubjects, setExpandedSubjects] = useState({});
  const [expandedInfractions, setExpandedInfractions] = useState({});
  const [gradeInputs, setGradeInputs] = useState({});
  const [infractions, setInfractions] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [activeTab, setActiveTab] = useState('subjects');
  const [availableCourses, setAvailableCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [newCourse, setNewCourse] = useState({
    name: '',
    courseCode: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });
  const [showNewCourseModal, setShowNewCourseModal] = useState(false);

  const [newInfraction, setNewInfraction] = useState({
    infracType: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [newAbsence, setNewAbsence] = useState({
    date: new Date().toISOString().split('T')[0],
    excused: false
  });

  useBackButton();

  useEffect(() => {
    if (student?.subjects) {
      setSubjectsMap(student.subjects);
    }

    const fetchStudentData = async () => {
      try {
        const response = await axios.get(`${API_URL}/users/${student._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.subjects) {
          setSubjectsMap(response.data.subjects);
        }
      } catch (err) {
        console.error('Error fetching student data:', err.response?.data || err.message);
      }
    };

    const fetchInfractions = async () => {
      try {
        const response = await axios.get(`${API_URL}/infractions`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { studentId: student._id }
        });
        setInfractions(response.data.infractions || []);
      } catch (err) {
        console.error('Error fetching infractions:', err.response?.data || err.message);
      }
    };

    const fetchAbsences = async () => {
      try {
        const response = await axios.get(`${API_URL}/attendance`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { studentId: student._id }
        });
        setAbsences(response.data.attendance || []);
      } catch (err) {
        console.error('Error fetching absences:', err.response?.data || err.message);
      }
    };

    // New function to fetch courses data
    const fetchCoursesData = async () => {
      try {
        // Fetch all available courses
        const coursesResponse = await axios.get(`${API_URL}/courses`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Filter out courses that already have this student
        const allCourses = coursesResponse.data.courses || [];
        const studentEnrolled = allCourses.filter(course =>
          course.students && course.students.includes(student._id)
        );
        const studentNotEnrolled = allCourses.filter(course =>
          !course.students || !course.students.includes(student._id)
        );

        setEnrolledCourses(studentEnrolled);
        setAvailableCourses(studentNotEnrolled);
      } catch (err) {
        console.error('Error fetching courses:', err.response?.data || err.message);
      }
    };

    // Fetch grades using the new utility function
    const loadStudentGrades = async () => {
      const grades = await fetchStudentGrades(student._id, token);
      if (grades && grades.grades) {
        // Process grades data into subjects map if needed
        // This would depend on the format returned by the API
      }
    };

    fetchStudentData();
    fetchInfractions();
    fetchAbsences();
    fetchCoursesData();
    loadStudentGrades();
  }, [student._id, token]);

  const toggleSubject = (subject) => {
    setExpandedSubjects(prev => ({
      ...prev,
      [subject]: !prev[subject],
    }));
  };

  const toggleInfraction = (infractionId) => {
    setExpandedInfractions(prev => ({
      ...prev,
      [infractionId]: !prev[infractionId],
    }));
  };

  const handleAddSubject = async () => {
    if (!newSubject.trim()) return;

    try {
      const response = await axios.post(`${API_URL}/grades`, {
        studentId: student._id,
        subject: newSubject.trim(),
        grade: null // Initially no grade
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state with the response
      const updatedSubjects = {...subjectsMap};
      updatedSubjects[newSubject.trim()] = [];
      setSubjectsMap(updatedSubjects);

      setNewSubject('');
    } catch (err) {
      console.error('Error adding subject:', err.response?.data || err.message);
    }
  };

  const handleAddInfraction = async () => {
    if (!newInfraction.infracType || !newInfraction.description) return;

    try {
      const response = await axios.post(
        `${API_URL}/infractions`,
        {
          ...newInfraction,
          studentId: student._id
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update the infractions list with the new data
      setInfractions(prev => [...prev, response.data.infraction]);

      setNewInfraction({
        infracType: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      console.error('Error adding infraction:', err.response?.data || err.message);
      Alert.alert('Error', 'Failed to add infraction');
    }
  };

  const handleAddAbsence = async () => {
    if (!newAbsence.date) return;

    try {
      const response = await axios.post(
        `${API_URL}/attendance`,
        {
          studentId: student._id,
          date: newAbsence.date,
          status: newAbsence.excused ? 'excused' : 'absent',
          courseId: null // Replace with actual course ID if needed
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAbsences(prev => [...prev, response.data.attendance]);

      setNewAbsence({
        date: new Date().toISOString().split('T')[0],
        excused: false
      });
    } catch (err) {
      console.error('Error adding absence:', err.response?.data || err.message);
      Alert.alert('Error', 'Failed to add absence');
    }
  };

  // Updated to use the new grade function
  const handleAddGrade = async (subject) => {
    const score = gradeInputs[subject];

    if (!score || !score.trim()) return;

    // Find courseId if available (may need to be adjusted based on your data structure)
    const courseId = enrolledCourses.find(course => course.name === subject)?._id || null;

    const newGrade = await addGrade(student._id, courseId, score.trim(), "", token);

    if (newGrade) {
      // Update the local state with the new grade
      const updatedSubjects = {...subjectsMap};
      if (!updatedSubjects[subject]) {
        updatedSubjects[subject] = [];
      }
      updatedSubjects[subject].push(score.trim());
      setSubjectsMap(updatedSubjects);

      setGradeInputs(prev => ({
        ...prev,
        [subject]: '',
      }));
    }
  };

  const handleRemoveLatestGrade = async (subject) => {
    try {
      // Get the grades for this subject and student first
      const response = await axios.get(
        `${API_URL}/grades`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { studentId: student._id, subject }
        }
      );

      // Get the latest grade ID
      const grades = response.data.grades || [];
      if (grades.length > 0) {
        const latestGrade = grades[grades.length - 1];

        // Delete the grade using the DELETE grades/:id route
        await axios.delete(
          `${API_URL}/grades/${latestGrade._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Update local state
        const updatedSubjects = {...subjectsMap};
        if (updatedSubjects[subject] && updatedSubjects[subject].length > 0) {
          updatedSubjects[subject].pop();
          setSubjectsMap(updatedSubjects);
        }
      }
    } catch (err) {
      console.error('Error removing grade:', err.response?.data || err.message);
      Alert.alert('Error', 'Failed to remove grade');
    }
  };

  const handleDeleteInfraction = async (infractionId) => {
    try {
      await axios.delete(
        `${API_URL}/infractions/${infractionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update the local state
      setInfractions(prev => prev.filter(item => item._id !== infractionId));
    } catch (err) {
      console.error('Error deleting infraction:', err.response?.data || err.message);
      Alert.alert('Error', 'Failed to delete infraction');
    }
  };

  const handleDeleteAbsence = async (absenceId) => {
    try {
      await axios.delete(
        `${API_URL}/attendance/${absenceId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update the local state
      setAbsences(prev => prev.filter(item => item._id !== absenceId));
    } catch (err) {
      console.error('Error deleting absence:', err.response?.data || err.message);
      Alert.alert('Error', 'Failed to delete absence');
    }
  };

  // Updated enrollment function using the new utility approach
  const handleEnrollInCourse = async (courseId) => {
    try {
      const response = await axios.post(
        `${API_URL}/courses/${courseId}/enroll`,
        { studentId: student._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Move the course from available to enrolled in the state
      const enrolledCourse = availableCourses.find(course => course._id === courseId);
      if (enrolledCourse) {
        setAvailableCourses(prev => prev.filter(course => course._id !== courseId));
        setEnrolledCourses(prev => [...prev, enrolledCourse]);
      }

      Alert.alert('Success', 'Student enrolled in course successfully');
    } catch (err) {
      console.error('Error enrolling in course:', err.response?.data || err.message);
      Alert.alert('Error', err.response?.data?.message || 'Failed to enroll student in course');
    }
  };

  // Updated unenrollment function using the new API endpoint
  const handleUnenrollFromCourse = async (courseId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/courses/${courseId}/students/${student._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Move the course from enrolled to available in the state
      const unenrolledCourse = enrolledCourses.find(course => course._id === courseId);
      if (unenrolledCourse) {
        setEnrolledCourses(prev => prev.filter(course => course._id !== courseId));
        setAvailableCourses(prev => [...prev, unenrolledCourse]);
      }

      Alert.alert('Success', 'Student unenrolled from course successfully');
    } catch (err) {
      console.error('Error unenrolling from course:', err.response?.data || err.message);
      Alert.alert('Error', err.response?.data?.message || 'Failed to unenroll student from course');
    }
  };

  // New function to create a new course and enroll the student
  const handleCreateAndEnrollCourse = async () => {
    // Validate course data
    if (!newCourse.name || !newCourse.courseCode) {
      Alert.alert('Error', 'Course name and code are required');
      return;
    }

    try {
      // Create the course
      const courseResponse = await axios.post(
        `${API_URL}/courses`,
        newCourse,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const createdCourse = courseResponse.data.course;

      // Enroll the student in the new course
      await axios.post(
        `${API_URL}/courses/${createdCourse._id}/enroll`,
        { studentId: student._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update state with the new enrolled course
      setEnrolledCourses(prev => [...prev, createdCourse]);

      // Reset form and close modal
      setNewCourse({
        name: '',
        courseCode: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: ''
      });
      setShowNewCourseModal(false);

      Alert.alert('Success', 'Course created and student enrolled successfully');
    } catch (err) {
      console.error('Error creating course:', err.response?.data || err.message);
      Alert.alert('Error', 'Failed to create course or enroll student');
    }
  };

  const renderSubjectsContent = () => {
    return (
      <>
        <View style={styles.subheader}>
          <Text style={styles.sectionHeaderText}>Add New Subject</Text>
          <View style={styles.inline}>
            <TextInput
              style={[styles.input, { flex: 2 }]}
              placeholder="Subject name"
              value={newSubject}
              onChangeText={setNewSubject}
            />
            <View style={styles.addButtonContainer}>
              <Button title="Add" onPress={handleAddSubject} />
            </View>
          </View>
        </View>

        {Object.keys(subjectsMap).length === 0 ? (
          <Text style={styles.emptyMessage}>No subjects added yet</Text>
        ) : (
          Object.keys(subjectsMap).map((subject, index) => (
            <View key={`subject-${index}`} style={styles.subjectCard}>
              <TouchableOpacity onPress={() => toggleSubject(subject)}>
                <Text style={styles.subjectTitle}>{subject}</Text>
              </TouchableOpacity>

              {expandedSubjects[subject] && (
                <View>
                  <View style={styles.gradesContainer}>
                    <Text style={styles.gradesTitle}>Grades:</Text>
                    {subjectsMap[subject] && subjectsMap[subject].length > 0 && (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleRemoveLatestGrade(subject)}
                      >
                        <Text style={styles.deleteButtonText}>Remove Latest</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text>
                    {Array.isArray(subjectsMap[subject]) && subjectsMap[subject].length > 0
                      ? subjectsMap[subject].join(', ')
                      : 'No grades yet'}
                  </Text>
                  <View style={styles.inline}>
                    <TextInput
                      style={[styles.input, { flex: 2 }]}
                      placeholder="Enter grade"
                      value={gradeInputs[subject] || ''}
                      onChangeText={(text) => setGradeInputs(prev => ({ ...prev, [subject]: text }))}
                    />
                    <View style={{ marginLeft: 10 }}>
                      <Button title="Add Grade" onPress={() => handleAddGrade(subject)} />
                    </View>
                  </View>
                </View>
              )}
            </View>
          ))
        )}
      </>
    );
  };

  const renderInfractionsContent = () => {
    return (
      <>
        <View style={styles.formContainer}>
          <Text style={styles.sectionHeaderText}>Add New Infraction</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Infraction type"
              value={newInfraction.infracType}
              onChangeText={(text) => setNewInfraction({ ...newInfraction, infracType: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Description"
              value={newInfraction.description}
              onChangeText={(text) => setNewInfraction({ ...newInfraction, description: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Date (YYYY-MM-DD)"
              value={newInfraction.date}
              onChangeText={(text) => setNewInfraction({ ...newInfraction, date: text })}
            />
            <Button title="Add Infraction" onPress={handleAddInfraction} />
          </View>
        </View>

        <Text style={styles.listHeaderText}>Existing Infractions</Text>

        {infractions.length === 0 ? (
          <Text style={styles.emptyMessage}>No infractions recorded</Text>
        ) : (
          infractions.map((item, index) => (
            <View key={`infraction-${index}`} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{item.infracType}</Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteInfraction(item._id)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.itemDate}>Date: {new Date(item.date).toLocaleDateString()}</Text>

              <TouchableOpacity
                style={styles.viewDetailsButton}
                onPress={() => toggleInfraction(item._id)}
              >
                <Text style={styles.viewDetailsText}>
                  {expandedInfractions[item._id] ? 'Hide Details' : 'View Details'}
                </Text>
              </TouchableOpacity>

              {expandedInfractions[item._id] && (
                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionLabel}>Description:</Text>
                  <Text>{item.description}</Text>
                </View>
              )}
            </View>
          ))
        )}
      </>
    );
  };

  const renderAbsencesContent = () => {
    return (
      <>
        <View style={styles.formContainer}>
          <Text style={styles.sectionHeaderText}>Add New Absence</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Date (YYYY-MM-DD)"
              value={newAbsence.date}
              onChangeText={(text) => setNewAbsence({ ...newAbsence, date: text })}
            />
            <TouchableOpacity
              style={[styles.checkboxContainer, newAbsence.excused && styles.checkedBox]}
              onPress={() => setNewAbsence(prev => ({ ...prev, excused: !prev.excused }))}
            >
              <Text>{newAbsence.excused ? '☑' : '☐'} Excused</Text>
            </TouchableOpacity>
            <Button title="Add Absence" onPress={handleAddAbsence} />
          </View>
        </View>

        <Text style={styles.listHeaderText}>Existing Absences</Text>

        {absences.length === 0 ? (
          <Text style={styles.emptyMessage}>No absences recorded</Text>
        ) : (
          absences.map((item, index) => (
            <View key={`absence-${index}`} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>
                  {new Date(item.date).toLocaleDateString()}
                  {item.status === 'excused' ? ' (Excused)' : ' (Unexcused)'}
                </Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteAbsence(item._id)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </>
    );
  };

  // New component to render courses content
  const renderCoursesContent = () => {
    return (
      <>
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowNewCourseModal(true)}
          >
            <Text style={styles.actionButtonText}>Create New Course</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.listHeaderText}>Enrolled Courses</Text>
        {enrolledCourses.length === 0 ? (
          <Text style={styles.emptyMessage}>Not enrolled in any courses</Text>
        ) : (
          enrolledCourses.map((course, index) => (
            <View key={`enrolled-${index}`} style={styles.courseCard}>
              <View style={styles.courseHeader}>
                <Text style={styles.courseTitle}>{course.name}</Text>
                <Text style={styles.courseCode}>{course.courseCode}</Text>
              </View>
              {course.description && (
                <Text style={styles.courseDescription}>{course.description}</Text>
              )}
              <View style={styles.courseFooter}>
                {course.startDate && (
                  <Text style={styles.courseDate}>
                    Start: {new Date(course.startDate).toLocaleDateString()}
                  </Text>
                )}
                {course.endDate && (
                  <Text style={styles.courseDate}>
                    End: {new Date(course.endDate).toLocaleDateString()}
                  </Text>
                )}
                <TouchableOpacity
                  style={styles.unenrollButton}
                  onPress={() => handleUnenrollFromCourse(course._id)}
                >
                  <Text style={styles.buttonText}>Unenroll</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <Text style={styles.listHeaderText}>Available Courses</Text>
        {availableCourses.length === 0 ? (
          <Text style={styles.emptyMessage}>No available courses to enroll in</Text>
        ) : (
          availableCourses.map((course, index) => (
            <View key={`available-${index}`} style={styles.courseCard}>
              <View style={styles.courseHeader}>
                <Text style={styles.courseTitle}>{course.name}</Text>
                <Text style={styles.courseCode}>{course.courseCode}</Text>
              </View>
              {course.description && (
                <Text style={styles.courseDescription}>{course.description}</Text>
              )}
              <View style={styles.courseFooter}>
                {course.startDate && (
                  <Text style={styles.courseDate}>
                    Start: {new Date(course.startDate).toLocaleDateString()}
                  </Text>
                )}
                {course.endDate && (
                  <Text style={styles.courseDate}>
                    End: {new Date(course.endDate).toLocaleDateString()}
                  </Text>
                )}
                <TouchableOpacity
                  style={styles.enrollButton}
                  onPress={() => handleEnrollInCourse(course._id)}
                >
                  <Text style={styles.buttonText}>Enroll</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* New Course Modal */}
        <Modal
          visible={showNewCourseModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowNewCourseModal(false)}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalHeader}>Create New Course</Text>

              <TextInput
                style={styles.input}
                placeholder="Course Name *"
                value={newCourse.name}
                onChangeText={(text) => setNewCourse({...newCourse, name: text})}
              />

              <TextInput
                style={styles.input}
                placeholder="Course Code *"
                value={newCourse.courseCode}
                onChangeText={(text) => setNewCourse({...newCourse, courseCode: text})}
              />

              <TextInput
                style={styles.input}
                placeholder="Description"
                value={newCourse.description}
                onChangeText={(text) => setNewCourse({...newCourse, description: text})}
                multiline={true}
                numberOfLines={3}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowNewCourseModal(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleCreateAndEnrollCourse}
                >
                  <Text style={styles.buttonText}>Create & Enroll</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Student: {student.firstName} {student.lastName}</Text>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={styles.tabButton} onPress={() => setActiveTab('subjects')}>
          <Text style={activeTab === 'subjects' ? styles.activeTabText : undefined}>Subjects</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabButton} onPress={() => setActiveTab('infractions')}>
          <Text style={activeTab === 'infractions' ? styles.activeTabText : undefined}>Infractions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabButton} onPress={() => setActiveTab('absences')}>
          <Text style={activeTab === 'absences' ? styles.activeTabText : undefined}>Absences</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabButton} onPress={() => setActiveTab('courses')}>
          <Text style={activeTab === 'courses' ? styles.activeTabText : undefined}>Courses</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {activeTab === 'subjects' && renderSubjectsContent()}
        {activeTab === 'infractions' && renderInfractionsContent()}
        {activeTab === 'absences' && renderAbsencesContent()}
        {activeTab === 'courses' && renderCoursesContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subheader: {
    marginVertical: 10,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  listHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginVertical: 8,
    borderRadius: 5,
    width: '100%',
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tabButton: {
    padding: 10,
    marginRight: 10,
  },
  activeTabText: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  subjectCard: {
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#eee',
  },
  subjectTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  gradesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  gradesTitle: {
    fontWeight: 'bold',
  },
  formContainer: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  emptyMessage: {
    fontStyle: 'italic',
    color: '#888',
    textAlign: 'center',
    marginVertical: 20,
  },
  itemCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginVertical: 5,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  itemDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  descriptionContainer: {
    marginTop: 8,
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
  },
  descriptionLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'column',
    width: '100%',
  },
  addButtonContainer: {
    marginLeft: 10,
    flexShrink: 0,
  },
  checkboxContainer: {
    marginVertical: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  checkedBox: {
    backgroundColor: '#e0ffe0',
    borderColor: '#aaddaa',
  },
  deleteButton: {
    backgroundColor: '#ff6666',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  viewDetailsButton: {
    backgroundColor: '#f0f0f0',
    padding: 5,
    marginTop: 5,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  viewDetailsText: {
    color: '#2277aa',
    fontSize: 12,
  },
    section: {
      marginTop: 20,
      paddingHorizontal: 10,
    },
    courseCard: {
      backgroundColor: '#f0f9ff',
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#cce6ff',
      padding: 12,
      marginBottom: 10,
    },
    courseTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#005b99',
    },
    courseCode: {
      fontSize: 14,
      color: '#007acc',
      marginTop: 2,
    },
    courseDescription: {
      fontSize: 13,
      color: '#333',
      marginTop: 5,
    },
    courseDates: {
      fontSize: 12,
      color: '#666',
      marginTop: 5,
    },
    courseActionContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 10,
    },
    enrollButton: {
      backgroundColor: '#88cc88',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 4,
    },
    unenrollButton: {
      backgroundColor: '#ff9999',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 4,
    },
    enrollButtonText: {
      color: 'white',
      fontWeight: 'bold',
    },
    createCourseButton: {
      backgroundColor: '#005b99',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignSelf: 'center',
      marginVertical: 15,
    },
    createCourseButtonText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 16,
    },
    modalBackground: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: 'white',
      borderRadius: 10,
      padding: 20,
      width: '90%',
      elevation: 5,
    },
    modalHeader: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 15,
      textAlign: 'center',
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 20,
    },
    modalButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 6,
      marginLeft: 10,
    },
    cancelButton: {
      backgroundColor: '#ccc',
    },
    saveButton: {
      backgroundColor: '#005b99',
    },
    buttonText: {
      color: 'white',
      fontWeight: 'bold',
    },
});