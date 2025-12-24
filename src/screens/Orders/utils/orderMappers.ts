import { VendorOrder } from '../../../apiService/types/ordersTypes';
import { ReceivedOrderCardProps } from '../CardComponents/RecivedOrderCard';
import { CompletedOrderCardProps } from '../CardComponents/CompletedOrderCard';

const formatTime = (dateString?: string) => {
  if (!dateString) {
    return '--:--';
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return '--:--';
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateString?: string) => {
  if (!dateString) {
    return '';
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
};

const formatAddress = (order: VendorOrder) => {
  if (!order || !order.user_address) {
    return 'Address not available';
  }
  const { user_address } = order;
  const parts = [
    user_address.city,
    user_address.state,
  ].filter(Boolean);
  return parts.join(', ') || 'Address not available';
};

const formatStatusLabel = (status: string) =>
  status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const getSectionTitle = (dateString?: string) => {
  if (!dateString) {
    return 'Orders';
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return 'Orders';
  }

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) {
    return 'Today';
  }

  if (isSameDay(date, yesterday)) {
    return 'Yesterday';
  }

  return formatDate(dateString);
};

const buildTimeline = (order: VendorOrder) => {
  if (!order) {
    return [];
  }
  const entries = Object.entries(order.status_timestamps || {}).map(
    ([statusKey, timestamp]) => ({
      status: formatStatusLabel(statusKey),
      date: formatDate(timestamp),
      time: formatTime(timestamp),
      isCompleted: true,
    }),
  );

  if (entries.length === 0) {
    entries.push({
      status: 'Order Created',
      date: formatDate(order.created_at),
      time: formatTime(order.created_at),
      isCompleted: order.status === 'delivered',
    });
  }

  return entries;
};

const buildQuantityLabel = (items: VendorOrder['items'] = []) => {
  const totalQuantity = items.reduce((acc, item) => acc + (item.quantity || 0), 0);
  return `${totalQuantity}`;
};

const buildWeightLabel = (items: VendorOrder['items'] = []) => {
  const totalWeight = items.reduce((acc, item) => acc + (item.weight || 0), 0);
  return `${totalWeight}`;
};

export const mapOrdersToReceivedCards = (
  orders?: VendorOrder[] | null,
): ReceivedOrderCardProps[] => {
  if (!Array.isArray(orders)) {
    return [];
  }

  return orders
    .filter(order => order != null) // Filter out null/undefined orders
    .map(order => {
      const firstItem = order.items?.[0];
      return {
        orderId: order._id ?? "",
        location: formatAddress(order),
        orderType: order.is_express ? 'express' : 'standard',
        customerName: order.user?.name || 'Customer',
        orderNumber: order.order_number,
        time: formatTime(order.created_at),
        expiredTime: formatTime(order.expiry_at),
        serviceQuantity: buildQuantityLabel(order.items),
        serviceType: firstItem?.service_name || 'Service',
        customerNote: order.order_notes,
        totalBill: order.payment_details?.amount_to_vendor_after_commission,
        timer: undefined,
        updateLogs: order.updateLogs,
        vendorOrderData: order,
        isWeightBased: order.service_type === 2 ? true : false,
        isVerified: order.is_verified,
      };
    });
};

export interface CompletedSectionItem {
  card: CompletedOrderCardProps;
  source: VendorOrder;
}

export interface CompletedSection {
  title: string;
  data: CompletedSectionItem[];
}

export const mapOrdersToCompletedSections = (
  orders?: VendorOrder[] | null,
): CompletedSection[] => {
  if (!Array.isArray(orders)) {
    return [];
  }

  const grouped: Record<string, CompletedSectionItem[]> = {};

  orders
    .filter(order => order != null) // Filter out null/undefined orders
    .forEach(order => {
      const firstItem = order.items?.[0];
      const section = getSectionTitle(order.updated_at || order.created_at);
      const entry: CompletedSectionItem = {
        card: {
          orderId: order._id,
          location: formatAddress(order),
          orderType: order.is_express ? 'express' : 'standard',
          serviceQuantity: buildQuantityLabel(order.items),
          serviceType: firstItem?.service_name || 'Service',
          serviceWeight: buildWeightLabel(order.items),
          timeline: buildTimeline(order),
          totalPrice: order.total_amount ? order.total_amount.toFixed(2) : '0.00',
          isWeightBased: order.service_type === 2 ? true : false,
          orderNumber: order.order_number,
        },
        source: order,
      };

      if (!grouped[section]) {
        grouped[section] = [];
      }
      grouped[section].push(entry);
    });

  return Object.entries(grouped).map(([title, data]) => ({
    title,
    data,
  }));
};

export const countOrders = (orders: VendorOrder[] | undefined) =>
  orders?.length ?? 0;

