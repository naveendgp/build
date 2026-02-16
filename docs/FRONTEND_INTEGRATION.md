# Frontend Integration Example for Register Complete API

## Plain JavaScript Example

```javascript
// Function to submit vendor registration form
async function submitVendorRegistration() {
  // Get form data from your form elements
  const formData = new FormData();

  // Required fields
  formData.append('shop_name', document.getElementById('shop_name').value);
  formData.append('owner_name', document.getElementById('owner_name').value);
  formData.append('gst_number', document.getElementById('gst_number').value);
  formData.append(
    'address_line1',
    document.getElementById('address_line1').value,
  );
  formData.append('pincode', document.getElementById('pincode').value);
  formData.append('landmark', document.getElementById('landmark').value);
  formData.append('latitude', document.getElementById('latitude').value);
  formData.append('longitude', document.getElementById('longitude').value);

  // Optional fields
  const email = document.getElementById('email').value;
  if (email) formData.append('email', email);

  const panNumber = document.getElementById('pan_number').value;
  if (panNumber) formData.append('pan_number', panNumber);

  const shopLicenseNumber = document.getElementById(
    'shop_license_number',
  ).value;
  if (shopLicenseNumber)
    formData.append('shop_license_number', shopLicenseNumber);

  const aadhaarNumber = document.getElementById('aadhaar_number').value;
  if (aadhaarNumber) formData.append('aadhaar_number', aadhaarNumber);

  const addressLine2 = document.getElementById('address_line2').value;
  if (addressLine2) formData.append('address_line2', addressLine2);

  const city = document.getElementById('city').value;
  if (city) formData.append('city', city);

  const state = document.getElementById('state').value;
  if (state) formData.append('state', state);

  const contactNum = document.getElementById('contactNum').value;
  if (contactNum) formData.append('contactNum', contactNum);

  // Bank details (all optional)
  const accountHolderName = document.getElementById(
    'account_holder_name',
  ).value;
  if (accountHolderName)
    formData.append('account_holder_name', accountHolderName);

  const accountNumber = document.getElementById('account_number').value;
  if (accountNumber) formData.append('account_number', accountNumber);

  const ifscCode = document.getElementById('ifsc_code').value;
  if (ifscCode) formData.append('ifsc_code', ifscCode);

  const bankName = document.getElementById('bank_name').value;
  if (bankName) formData.append('bank_name', bankName);

  const branch = document.getElementById('branch').value;
  if (branch) formData.append('branch', branch);

  const upiId = document.getElementById('upi_id').value;
  if (upiId) formData.append('upi_id', upiId);

  // Operating hours as a single nested object
  const operatingHours = {};
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  days.forEach(day => {
    const openTime = document.getElementById(`${day}_open`).value;
    const closeTime = document.getElementById(`${day}_close`).value;
    
    if (openTime && closeTime) {
      operatingHours[day] = {
        open: openTime,
        close: closeTime
      };
    }
  });

  // Append operating hours as a single JSON string
  if (Object.keys(operatingHours).length > 0) {
    formData.append('operating_hours', JSON.stringify(operatingHours));
  }

  // File uploads - get files from file input elements
  const aadhaarCardFile = document.getElementById('aadhaar_card').files[0];
  if (aadhaarCardFile) {
    formData.append('aadhaar_card', aadhaarCardFile);
  }

  const gstCertificateFile =
    document.getElementById('gst_certificate').files[0];
  if (gstCertificateFile) {
    formData.append('gst_certificate', gstCertificateFile);
  }

  const panCardFile = document.getElementById('pan_card').files[0];
  if (panCardFile) {
    formData.append('pan_card', panCardFile);
  }

  const cancelledChequeFile =
    document.getElementById('cancelled_cheque').files[0];
  if (cancelledChequeFile) {
    formData.append('cancelled_cheque', cancelledChequeFile);
  }

  const shopImageFile = document.getElementById('shop_image').files[0];
  if (shopImageFile) {
    formData.append('shop_image', shopImageFile);
  }

  const profilePicFile = document.getElementById('profile_pic').files[0];
  if (profilePicFile) {
    formData.append('profile_pic', profilePicFile);
  }

  // Get JWT token from localStorage or wherever you store it
  const token = localStorage.getItem('vendor_token'); // or sessionStorage, etc.

  try {
    const response = await fetch(
      'http://your-api-url/vendor/register-complete',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type header - browser will set it automatically with boundary
        },
        body: formData,
      },
    );

    const result = await response.json();

    if (response.ok) {
      console.log('Registration successful:', result);
      alert('Registration completed successfully!');
      // Handle success (redirect, show message, etc.)
    } else {
      console.error('Registration failed:', result);
      alert('Registration failed: ' + (result.message || 'Unknown error'));
      // Handle error
    }
  } catch (error) {
    console.error('Error submitting form:', error);
    alert('Error submitting form. Please try again.');
  }
}
```

## Complete Example with All Operating Hours

```javascript
// Complete example with all operating hours
async function submitVendorRegistration() {
  const formData = new FormData();

  // Required fields
  formData.append('shop_name', 'Clean Laundry Services');
  formData.append('owner_name', 'John Doe');
  formData.append('gst_number', '27ABCDE1234F1Z5');
  formData.append('address_line1', '123 Main Street');
  formData.append('pincode', '400001');
  formData.append('landmark', 'Near Metro Station');
  formData.append('latitude', '19.076');
  formData.append('longitude', '72.8777');

  // Optional text fields
  formData.append('email', 'vendor@example.com');
  formData.append('pan_number', 'ABCDE1234F');
  formData.append('shop_license_number', 'LIC123456');
  formData.append('aadhaar_number', '123456789012');
  formData.append('address_line2', 'Near Market');
  formData.append('city', 'Mumbai');
  formData.append('state', 'Maharashtra');
  formData.append('contactNum', '+919876543210');

  // Bank details
  formData.append('account_holder_name', 'John Doe');
  formData.append('account_number', '1234567890');
  formData.append('ifsc_code', 'HDFC0001234');
  formData.append('bank_name', 'HDFC Bank');
  formData.append('branch', 'Andheri West');
  formData.append('upi_id', 'vendor@upi');

  // Operating hours - build as a single nested object
  const operatingHours = {};
  const operatingDays = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  operatingDays.forEach((day) => {
    const openTime = document.getElementById(`${day}_open`).value;
    const closeTime = document.getElementById(`${day}_close`).value;

    if (openTime && closeTime) {
      operatingHours[day] = {
        open: openTime,
        close: closeTime,
      };
    }
  });

  // Append operating hours as a single JSON string
  if (Object.keys(operatingHours).length > 0) {
    formData.append('operating_hours', JSON.stringify(operatingHours));
  }

  // File uploads
  const files = {
    aadhaar_card: document.getElementById('aadhaar_card'),
    gst_certificate: document.getElementById('gst_certificate'),
    pan_card: document.getElementById('pan_card'),
    cancelled_cheque: document.getElementById('cancelled_cheque'),
    shop_image: document.getElementById('shop_image'),
    profile_pic: document.getElementById('profile_pic'),
  };

  Object.keys(files).forEach((key) => {
    const fileInput = files[key];
    if (fileInput && fileInput.files && fileInput.files[0]) {
      formData.append(key, fileInput.files[0]);
    }
  });

  // Send request
  const token = localStorage.getItem('vendor_token');

  try {
    const response = await fetch(
      'http://your-api-url/vendor/register-complete',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      },
    );

    const result = await response.json();

    if (response.ok) {
      console.log('Success:', result);
      return result;
    } else {
      throw new Error(result.message || 'Registration failed');
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
```

## Using with HTML Form

```html
<form id="vendorRegistrationForm" enctype="multipart/form-data">
  <!-- Required Fields -->
  <input type="text" id="shop_name" name="shop_name" required />
  <input type="text" id="owner_name" name="owner_name" required />
  <input type="text" id="gst_number" name="gst_number" required />
  <input type="text" id="address_line1" name="address_line1" required />
  <input type="text" id="pincode" name="pincode" required />
  <input type="text" id="landmark" name="landmark" required />
  <input type="number" id="latitude" name="latitude" step="any" required />
  <input type="number" id="longitude" name="longitude" step="any" required />

  <!-- Optional Fields -->
  <input type="email" id="email" name="email" />
  <input type="text" id="pan_number" name="pan_number" />
  <input type="text" id="aadhaar_number" name="aadhaar_number" />
  <input type="text" id="city" name="city" />
  <input type="text" id="state" name="state" />
  <input type="tel" id="contactNum" name="contactNum" />

  <!-- File Uploads -->
  <input
    type="file"
    id="aadhaar_card"
    name="aadhaar_card"
    accept="image/*,.pdf"
  />
  <input
    type="file"
    id="gst_certificate"
    name="gst_certificate"
    accept="image/*,.pdf"
  />
  <input
    type="file"
    id="pan_card"
    name="pan_card"
    accept="image/*,.pdf"
  />
  <input
    type="file"
    id="cancelled_cheque"
    name="cancelled_cheque"
    accept="image/*,.pdf"
  />
  <input type="file" id="shop_image" name="shop_image" accept="image/*" />
  <input type="file" id="profile_pic" name="profile_pic" accept="image/*" />

  <!-- Operating Hours -->
  <input type="time" id="monday_open" />
  <input type="time" id="monday_close" />
  <!-- ... more time inputs for other days ... -->

  <button type="button" onclick="submitVendorRegistration()">Submit</button>
</form>

<script>
  // Prevent default form submission
  document
    .getElementById('vendorRegistrationForm')
    .addEventListener('submit', (e) => {
      e.preventDefault();
      submitVendorRegistration();
    });

  // Use the function from above
</script>
```

## Important Notes:

1. **Don't set Content-Type header manually** - Browser automatically sets it with the correct boundary for multipart/form-data
2. **FormData automatically handles files** - Just append the File object directly
3. **Operating hours should be JSON strings** - Use `JSON.stringify()` for nested objects
4. **Include JWT token** - Add Authorization header with Bearer token
5. **Handle errors** - Wrap in try-catch for network errors
6. **Check file existence** - Verify files exist before appending to avoid errors
