export interface DriverLocationPayload {
    phone: string;
    lat: string;
    lang: string;
}

export interface OrderAssignedPayload {
    orderId: string;
    customerName: string;
    address: string;
    pickupLat: number;
    pickupLng: number;
    deliveryLat: number;
    deliveryLng: number;
    status: 'pending' | 'accepted' | 'pickedUp' | 'delivered';
}

export interface DriverSocketEvents {
    'riderLocation': DriverLocationPayload;
    'order:assigned': OrderAssignedPayload;
}
