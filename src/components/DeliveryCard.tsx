// src/components/DeliveryCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Delivery } from '../store/useStore';

interface Props {
  delivery: Delivery;
  onPress: () => void;
}

const DeliveryCard: React.FC<Props> = ({ delivery, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <Text style={styles.text}>Pickup: {delivery.pickup}</Text>
    <Text style={styles.text}>Drop: {delivery.drop}</Text>
    <Text style={styles.text}>Status: {delivery.status}</Text>
  </TouchableOpacity>
);

export default DeliveryCard;

const styles = StyleSheet.create({
  card: {
    padding: 15,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  text: { fontSize: 14 },
});
