
const MSG91APIKEY = {
    MSG91_AUTH_KEY: '473878AdvCVMHZfS691da39cP1',
    MSG91_TEMPLATE_ID_LOGIN: '691eb8e6e2209e39083345c5',
};

const OTPConfig = {
    OTP_LENGTH: 4,
    OTP_EXPIRY: 10, // Increased for testing
};

const phoneNumber = process.argv[2];

if (!phoneNumber) {
    console.error('Usage: node scripts/debug-otp.js <mobile_number>');
    process.exit(1);
}

async function testOtp() {
    const baseUrl = 'https://control.msg91.com/api/v5/otp';

    console.log(`Testing OTP for mobile: 91${phoneNumber}`);
    console.log(`Using Auth Key: ${MSG91APIKEY.MSG91_AUTH_KEY.substring(0, 5)}...`);
    console.log(`Using Template ID: ${MSG91APIKEY.MSG91_TEMPLATE_ID_LOGIN}`);

    const headers = {
        'Content-Type': 'application/json',
        authkey: MSG91APIKEY.MSG91_AUTH_KEY,
    };

    const data = {
        template_id: MSG91APIKEY.MSG91_TEMPLATE_ID_LOGIN,
        mobile: '91' + phoneNumber,
        otp_length: OTPConfig.OTP_LENGTH,
        otp_expiry: OTPConfig.OTP_EXPIRY,
    };

    try {
        console.log('Sending request to MSG91...');
        const response = await fetch(baseUrl, {
            headers,
            method: 'POST',
            body: JSON.stringify(data),
        });

        const responseText = await response.text();
        console.log('Response Status:', response.status);
        console.log('Response Body:', responseText);

        try {
            const json = JSON.parse(responseText);
            if (json.type === 'success') {
                console.log('✅ OTP Sent Successfully!');
            } else {
                console.log('❌ OTP Send Failed:', json.message);
            }
        } catch (e) {
            console.log('❌ Could not parse JSON response');
        }

    } catch (error) {
        console.error('❌ Network/Script Error:', error);
    }
}

testOtp();
