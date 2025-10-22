import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomText from '../../components/Text';
import styles from './styles';
import { useProfileStore } from '../../apiService/store/useProfileStore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import CustomBtn from '../../components/CustomBtn';
import { VendorProfile } from '../../apiService/types/profileTypes';
import Toolbar from '../../components/Toolbar';

type WalletNavProp = NativeStackNavigationProp<RootStackParamList, 'Wallet'>;

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

const WalletScreen: React.FC = () => {
  const navigation = useNavigation<WalletNavProp>();
  const { profile } = useProfileStore();

  const handleAddMoney = () => {
    // TODO: Implement add money functionality
    console.log('Add money to wallet');
  };

  const handleWithdraw = () => {
    // TODO: Implement withdraw functionality
    console.log('Withdraw from wallet');
  };

  const transactions: Transaction[] = [
    {
      id: '1',
      type: 'credit',
      amount: 500,
      description: 'Order Payment',
      date: '2024-01-15',
      status: 'completed',
    },
    {
      id: '2',
      type: 'debit',
      amount: 50,
      description: 'Service Fee',
      date: '2024-01-14',
      status: 'completed',
    },
    {
      id: '3',
      type: 'credit',
      amount: 1200,
      description: 'Order Payment',
      date: '2024-01-13',
      status: 'completed',
    },
  ];

  const renderTransaction = (transaction: Transaction) => (
    <View key={transaction.id} style={styles.transactionCard}>
      <View style={styles.transactionInfo}>
        <CustomText style={styles.transactionDescription}>
          {transaction.description}
        </CustomText>
        <CustomText style={styles.transactionDate}>
          {transaction.date}
        </CustomText>
      </View>
      
      <View style={styles.transactionAmount}>
        <CustomText style={[
          styles.transactionValue,
          { color: transaction.type === 'credit' ? '#34C759' : '#FF3B30' }
        ]}>
          {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount}
        </CustomText>
        <CustomText style={styles.transactionStatus}>
          {transaction.status}
        </CustomText>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Toolbar title="Wallet" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <CustomText style={styles.sectionTitle}>Wallet Balance</CustomText>
          
          <View style={styles.balanceCard}>
            <CustomText style={styles.balanceLabel}>Available Balance</CustomText>
            <CustomText style={styles.balanceAmount}>
              ₹{profile?.wallet?.balance || 0}
            </CustomText>
            <CustomText style={styles.balanceCurrency}>
              {profile?.wallet?.currency || 'INR'}
            </CustomText>
          </View>
        </View>

        <View style={styles.section}>
          <CustomText style={styles.sectionTitle}>Quick Actions</CustomText>
          
          <View style={styles.actionsContainer}>
            <CustomBtn
              title="Add Money"
              onPress={handleAddMoney}
            />
            
            <CustomBtn
              title="Withdraw"
              onPress={handleWithdraw}
            />
          </View>
        </View>

        <View style={styles.section}>
          <CustomText style={styles.sectionTitle}>Recent Transactions</CustomText>
          
          {transactions.map(renderTransaction)}
        </View>

        <View style={styles.section}>
          <CustomText style={styles.sectionTitle}>Wallet Statistics</CustomText>
          
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <CustomText style={styles.statValue}>₹2,500</CustomText>
              <CustomText style={styles.statLabel}>Total Earned</CustomText>
            </View>
            
            <View style={styles.statItem}>
              <CustomText style={styles.statValue}>₹150</CustomText>
              <CustomText style={styles.statLabel}>Total Withdrawn</CustomText>
            </View>
            
            <View style={styles.statItem}>
              <CustomText style={styles.statValue}>₹2,350</CustomText>
              <CustomText style={styles.statLabel}>Net Balance</CustomText>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WalletScreen;
