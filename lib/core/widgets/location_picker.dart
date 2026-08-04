import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../theme/app_typography.dart';
import '../theme/app_spacing.dart';

const Map<String, List<String>> _indianStatesAndCities = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Kakinada', 'Rajahmundry', 'Kadapa', 'Tirupati', 'Anantapur', 'Vizianagaram'],
  'Arunachal Pradesh': ['Itanagar', 'Tawang', 'Ziro', 'Pasighat', 'Roing', 'Tezu', 'Bomdila', 'Dirang', 'Bhalukpong', 'Along'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Bongaigaon', 'Diphu', 'Dhubri'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif', 'Arrah', 'Begusarai', 'Katihar'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Rajnandgaon', 'Raigarh', 'Jagdalpur', 'Ambikapur', 'Dhamtari', 'Mahasamund'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Bicholim', 'Curchorem', 'Sanquelim', 'Cuncolim', 'Valpoi'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Gandhinagar', 'Nadiad', 'Anand'],
  'Haryana': ['Faridabad', 'Gurugram', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula'],
  'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Palampur', 'Baddi', 'Nahan', 'Paonta Sahib', 'Sundarnagar', 'Chamba'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Phusro', 'Hazaribagh', 'Giridih', 'Ramgarh', 'Medininagar'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi', 'Davanagere', 'Ballari', 'Vijayapura', 'Shivamogga', 'Tumakuru'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Kollam', 'Thrissur', 'Kannur', 'Alappuzha', 'Kottayam', 'Palakkad', 'Manjeri'],
  'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane', 'Aurangabad', 'Solapur', 'Kalyan-Dombivli', 'Vasai-Virar', 'Navi Mumbai'],
  'Manipur': ['Imphal', 'Thoubal', 'Kakching', 'Ukhrul', 'Churachandpur', 'Bishnupur', 'Senapati', 'Tamenglong', 'Chandel', 'Jiribam'],
  'Meghalaya': ['Shillong', 'Tura', 'Nongstoin', 'Jowai', 'Baghmara', 'Williamnagar', 'Nongpoh', 'Resubelpara', 'Khliehriat', 'Mawkyrwat'],
  'Mizoram': ['Aizawl', 'Lunglei', 'Saiha', 'Champhai', 'Kolasib', 'Serchhip', 'Lawngtlai', 'Mamit', 'Hnahthial', 'Khawzawl'],
  'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Zunheboto', 'Phek', 'Mon', 'Kiphire', 'Longleng'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak', 'Baripada', 'Jharsuguda'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Hoshiarpur', 'Mohali', 'Batala', 'Pathankot', 'Moga'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar', 'Sikar', 'Pali'],
  'Sikkim': ['Gangtok', 'Namchi', 'Gyalshing', 'Mangan', 'Singtam', 'Rangpo', 'Jorethang', 'Nayabazar', 'Rhenock', 'Ravangla'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tiruppur', 'Tirunelveli', 'Erode', 'Vellore', 'Thoothukkudi', 'Dindigul', 'Thanjavur', 'Nagercoil', 'Kancheepuram', 'Cuddalore', 'Kumbakonam', 'Tiruvannamalai', 'Karur', 'Rajapalayam', 'Pudukkottai', 'Hosur', 'Ambur', 'Karaikkudi', 'Neyveli', 'Nagapattinam', 'Sivakasi', 'Ranipet'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Ramagundam', 'Khammam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet'],
  'Tripura': ['Agartala', 'Udaipur', 'Dharmanagar', 'Kailashahar', 'Bishalgarh', 'Teliamura', 'Khowai', 'Belonia', 'Melaghar', 'Ambassa'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Prayagraj', 'Bareilly', 'Aligarh', 'Moradabad'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh', 'Ramnagar', 'Pithoragarh', 'Manglaur'],
  'West Bengal': ['Kolkata', 'Asansol', 'Siliguri', 'Durgapur', 'Bardhaman', 'Malda', 'Baharampur', 'Habra', 'Kharagpur', 'Shantipur'],
  'Andaman and Nicobar Islands': ['Port Blair', 'Garacharma', 'Bambooflat', 'Prothrapur', 'Bakultala', 'Mayabunder', 'Diglipur', 'Rangat', 'Hut Bay', 'Malacca'],
  'Chandigarh': ['Chandigarh'],
  'Dadra and Nagar Haveli and Daman and Diu': ['Daman', 'Diu', 'Silvassa', 'Amli', 'Naroli', 'Samarvarni', 'Dunetha', 'Bhimpore', 'Kadaiya', 'Marwad'],
  'Lakshadweep': ['Kavaratti', 'Minicoy', 'Andrott', 'Amini', 'Agatti', 'Kalpeni', 'Kadmat', 'Kiltan', 'Chetlat', 'Bitra'],
  'Delhi': ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Central Delhi', 'Shahdara', 'Rohini', 'Dwarka', 'Karol Bagh'],
  'Puducherry': ['Puducherry', 'Ozhukarai', 'Karaikal', 'Yanam', 'Mahe', 'Villianur', 'Ariyankuppam', 'Kurumbapet', 'Bahour', 'Thirunallar'],
  'Ladakh': ['Leh', 'Kargil', 'Diskit', 'Padum', 'Nyoma', 'Khaltsi', 'Dras', 'Sankoo', 'Zanskar', 'Nubra'],
  'Jammu & Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Kathua', 'Sopore', 'Pulwama', 'Udhampur', 'Poonch', 'Rajouri'],
};

Future<String?> showLocationPicker(BuildContext context) async {
  return showModalBottomSheet<String>(
    context: context,
    backgroundColor: context.colors.background,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (ctx) => const _LocationPickerSheet(),
  );
}

class _LocationPickerSheet extends StatefulWidget {
  const _LocationPickerSheet();

  @override
  State<_LocationPickerSheet> createState() => _LocationPickerSheetState();
}

class _LocationPickerSheetState extends State<_LocationPickerSheet> {
  String? _selectedState;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).extension<AppThemeColors>()!;
    
    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _selectedState == null ? 'Select State' : 'Select City',
                style: AppTypography.titleLarge.copyWith(color: colors.textPrimary),
              ),
              if (_selectedState != null)
                TextButton(
                  onPressed: () => setState(() => _selectedState = null),
                  child: Text('Back to States', style: TextStyle(color: colors.primaryAccent)),
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Expanded(
            child: _selectedState == null 
                ? _buildStateList(colors) 
                : _buildCityList(colors),
          ),
        ],
      ),
    );
  }

  Widget _buildStateList(AppThemeColors colors) {
    final states = _indianStatesAndCities.keys.toList()..sort();
    return ListView.builder(
      itemCount: states.length,
      itemBuilder: (ctx, i) {
        final state = states[i];
        return ListTile(
          title: Text(state, style: AppTypography.bodyMedium.copyWith(color: colors.textPrimary)),
          trailing: Icon(Icons.chevron_right, color: colors.textTertiary),
          onTap: () => setState(() => _selectedState = state),
        );
      },
    );
  }

  Widget _buildCityList(AppThemeColors colors) {
    if (_selectedState == null) return const SizedBox.shrink();
    final cities = List<String>.from(_indianStatesAndCities[_selectedState!]!)..sort();
    return ListView.builder(
      itemCount: cities.length,
      itemBuilder: (ctx, i) {
        final city = cities[i];
        return ListTile(
          title: Text(city, style: AppTypography.bodyMedium.copyWith(color: colors.textPrimary)),
          onTap: () => Navigator.pop(context, '$city, $_selectedState'),
        );
      },
    );
  }
}
