import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { COLORS, FONTFAMILY } from "../../../constants";
import CustomText from "../../../components/Text";
import NotificationIcon from "../../../assets/auto-generated-svg-icons/NotificationIcon";
import Toolbar from "../../../components/Toolbar";
import { useNotifications } from "./hooks/useNotifications";
import { useNotificationDateHandling, NotificationItem } from "./hooks/useNotificationDateHandling";
import BackgroundGradient from "../../../components/backgroundGradient";
import ErrorState from "../../../components/ErrorState";
import { getErrorMessageFromMultiple } from "../../../utils/errorUtils";

const NotificationCard: React.FC<{ item: NotificationItem }> = ({ item }) => {
  return (
    <TouchableOpacity activeOpacity={0.8} style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.iconCircle}>
          <NotificationIcon width={20} height={20} />
        </View>
        <View style={styles.cardTextCol}>
          <CustomText style={styles.cardMessage}>{item.message}</CustomText>
          <CustomText style={styles.cardTime}>{item.time}</CustomText>
        </View>
      </View>
      {/* {!item.isRead && <View style={styles.unreadDot} />} */}
    </TouchableOpacity>
  );
};

const NotificationScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { notifications, isLoading, error, refetch } = useNotifications();
  const { sections } = useNotificationDateHandling(notifications);

  return (
    <View style={{ flex: 1, width: '100%', height: '100%', backgroundColor: COLORS.WHITE }}>
      <BackgroundGradient />
      <View
        style={[styles.root]}
      >
        <Toolbar title="Notifications" />

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.THEME_GREEN} />
          </View>
        ) : error ? (
          <ErrorState onRetry={refetch}
            retryButtonText="Retry"
            message={getErrorMessageFromMultiple([error])} />
        ) : sections.length === 0 ? (
          <View style={styles.emptyContainer}>
            <CustomText style={styles.emptyText}>No notifications yet</CustomText>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
            showsVerticalScrollIndicator={false}
          >
            {sections.map((section) => (
              <View key={section.id} style={styles.sectionBlock}>
                <CustomText style={styles.sectionHeader}>{section.label}</CustomText>
                {section.items.map((item) => (
                  <NotificationCard key={item.id} item={item} />
                ))}
              </View>
            ))}
            {/* Bottom Spacing */}
            <View style={{ height: 24 }} />
          </ScrollView>
        )}
      </View>
    </View>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'absolute', width: '100%', height: '100%'
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: COLORS.BUTTON_BACKGROUND,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
    marginHorizontal: 12, marginTop: 24
  },
  sectionBlock: {
    marginBottom: 0,
  },
  sectionHeader: {
    color: '#717171',
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontSize: 14,
    marginBottom: 16,
    marginLeft: 4,
  },
  card: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 16,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
  },
  cardLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  cardTextCol: { flex: 1, marginLeft: 12 },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#D9D9D9",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    color: COLORS.INPUT_TEXT,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    fontSize: 14,
    marginBottom: 4,
  },
  cardTime: {
    color: '#717171',
    fontFamily: FONTFAMILY.INTER_REGULAR,
    fontSize: 12,
    marginTop: 2,
  },
  cardMessage: {
    color: COLORS.TEXT_GRAY,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.THEME_GREEN,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%'
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.TEXT_GRAY,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 20,
  },
  errorText: {
    color: COLORS.ERROR,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.THEME_GREEN,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.WHITE,
    fontFamily: FONTFAMILY.INTER_SEMIBOLD,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: COLORS.TEXT_GRAY,
    fontFamily: FONTFAMILY.INTER_REGULAR,
    fontSize: 14,
  },
});
