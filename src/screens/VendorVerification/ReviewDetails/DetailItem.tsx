import React from 'react';
import { View } from 'react-native';
import CustomText from '../../../components/Text';
import styles from './style';

interface DetailItemProps {
  label: string;
  value: string | null | undefined;
  isFile?: boolean;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, isFile = false }) => {
  // Don't render if label is empty (used for nested file items)
  if (!label) {
    return null;
  }

  return (
    <View style={styles.detailItem}>
      <CustomText style={styles.label}>{label}</CustomText>
      {isFile ? (
        <CustomText style={styles.fileName}>{value || 'Filename.Pdf'}</CustomText>
      ) : (
        <CustomText style={styles.value}>{value || '-'}</CustomText>
      )}
    </View>
  );
};

export default DetailItem;

