export interface Order {
  id: string;
  price: number;
  fromLocation: {
    primary: string;
    secondary: string;
  };
  toLocation: {
    primary: string;
    secondary: string;
  };
  status: 'pending' | 'in_progress' | 'completed';
  customerName?: string;
}
