import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { styles } from "./styles/laundryPickupStyles";
import { Service } from "../../types/services/services";
import { useNavigation } from "@react-navigation/native";

interface LaundryPickupComponentProps {
  services: Service[];
}

const LaundryPickupComponent: React.FC<LaundryPickupComponentProps> = ({ services }) => {
  const navigation = useNavigation();
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>What Are We Picking Up Today?</Text>
      <View style={styles.grid}>
        {services.map((service, index) => (
          <TouchableOpacity key={service._id || index}
            onPress={() => (navigation as any).navigate('ServiceList' as never, { serviceId: service._id } as never)}
            style={styles.card}>
            <Text style={styles.title}>{service.service_name}</Text>
            <Image
              source={{ uri: service.image_url }}
              style={styles.image}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};



export default LaundryPickupComponent;
