import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function useBackButton() {
  const navigation = useNavigation();

  useEffect(() => {
    // Function to handle back button press
    const handleBackPress = () => {
      navigation.goBack();
      return true;
    };

    // Add event listener for the hardware back button
    BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    // Clean up the event listener when component unmounts
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    };
  }, [navigation]);
}