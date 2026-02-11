import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { COLORS } from "../../constants";
import ExpressIcon from "../../assets/auto-generated-svg-icons/ExpressIcon";
import LocationLine from "../../assets/auto-generated-svg-icons/LocationLine";
import CardStar from "../../assets/auto-generated-svg-icons/CardStar";
import RightArrow from "../../assets/auto-generated-svg-icons/RightArrow";
import Discount from "../../assets/auto-generated-svg-icons/Discount";
import { Vendor } from "../../types/services/services";
import { styles } from "./styles/laundryServiceCardStyles";
import SvgTimerIcon from "../../assets/auto-generated-svg-icons/TimerIcon";

interface LaundryServiceCardProps {
  vendor: Vendor;
  onPress: () => void;
  fromPage: string
}

const LaundryServiceCard = ({ vendor, onPress, fromPage }: LaundryServiceCardProps) => {

  const isExpress = vendor?.express_status;

  const timeValue = isExpress
    ? vendor?.min_express_time
    : vendor?.min_standard_time;

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      style={styles.card}>
      <View style={{ paddingHorizontal: 12 }}>
        {vendor.express_status && (
          <LinearGradient
            colors={["#F1DF1F", "#F6F6F6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.expressTag}
          >
            <ExpressIcon width={14} height={14} />
            <Text style={styles.expressText}> Express</Text>
          </LinearGradient>
        )}

        <View style={styles.headerContainer}>
          {/* Left: Title & Subtitle */}
          <View style={styles.textContainer}>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.title}>{vendor.shop_name}</Text>

              {vendor.rating?.average && vendor.rating?.average > 0 ? (
                <View style={[styles.rating]}>
                  <CardStar />
                  <Text style={styles.ratingText}>
                    {vendor.rating?.average !== undefined && vendor.rating?.average !== null
                      ? vendor.rating.average.toFixed(1)
                      : '0.0'}
                  </Text>
                </View>
              ) : null}


            </View>


            <View style={styles.subtitleContainer}>

              {timeValue ?
                (<><View style={styles.subtitleItem}>
                  <SvgTimerIcon width={14} height={14} style={styles.timeIcon} />
                  <Text style={styles.subtitle}>{timeValue}</Text>
                </View>
                  <Text style={styles.separator}>|</Text>
                </>) : null
              }

              <View style={styles.subtitleItem}>
                <LocationLine
                  width={14}
                  height={14}
                  style={styles.locationIcon}
                />
                <Text style={styles.subtitle}>
                  {vendor.distance !== undefined && vendor.distance !== null
                    ? `${vendor.distance}`
                    : 'N/A'}
                </Text>
              </View>
            </View>
          </View>


        </View>

        {vendor.services_offered && vendor.services_offered.length > 0 && <View style={styles.servicesRow}>
          {vendor.services_offered.map((srv, index) => (
            <View key={srv || `srv-${index}`} style={styles.serviceTag}>
              <Text style={styles.serviceTagText}>{srv}</Text>
            </View>
          ))}
        </View>}
      </View>
      <View
        style={{
          height: 1,
          backgroundColor: "#D1D1D1",
          marginHorizontal: 12,
          marginBottom: 12,
        }}
      />

      <View style={styles.footer}>
        {fromPage == 'home' ? (
          <View style={styles.priceContainer}>
            <Text style={styles.startsAtText}>View</Text>
            <Text style={styles.priceAmountText}>More</Text>
          </View>
        ) : vendor?.startsAt !== undefined && vendor?.startsAt !== null && vendor?.startsAt !== 0 ? (
          <View style={styles.priceContainer}>
            <Text style={styles.startsAtText}>Starts at</Text>
            <Text style={styles.priceAmountText}>₹ {vendor?.startsAt}</Text>
          </View>
        ) : <View style={styles.priceContainer}>
          <Text style={styles.startsAtText}>View</Text>
          <Text style={styles.priceAmountText}>More</Text>
        </View>}

        <View style={styles.arrowButton}>
          <RightArrow width={27} height={27} />
        </View>
      </View>

      {vendor.is_offer && vendor.max_offer_percentage?.total_percentage && (<View style={styles.discountBox}>
        <Discount />
        <Text style={styles.discountText}> {'Flat ' + (vendor.max_offer_percentage?.total_percentage || 0) + '% off, up to ₹' + vendor.max_offer_percentage?.max_cap}  </Text>
      </View>)}
    </TouchableOpacity>
  );
};



export default LaundryServiceCard;

