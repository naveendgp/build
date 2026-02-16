# Postman cURL Command for Register Complete API

## Copy and paste this into Postman:

```bash
curl --location 'http://localhost:3000/vendor/register-complete' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--form 'shop_name="Clean Laundry Services"' \
--form 'owner_name="John Doe"' \
--form 'gst_number="27ABCDE1234F1Z5"' \
--form 'address_line1="123 Main Street"' \
--form 'pincode="400001"' \
--form 'landmark="Near Metro Station"' \
--form 'latitude="19.076"' \
--form 'longitude="72.8777"' \
--form 'contactNum="+919876543210"' \
--form 'account_holder_name="John Doe"' \
--form 'account_number="1234567890"' \
--form 'ifsc_code="HDFC0001234"' \
--form 'bank_name="HDFC Bank"' \
--form 'branch="Andheri West"' \
--form 'upi_id="vendor@upi"' \
--form 'operating_hours="{\"monday\":{\"open\":\"09:00\",\"close\":\"20:00\"},\"tuesday\":{\"open\":\"09:00\",\"close\":\"20:00\"},\"wednesday\":{\"open\":\"09:00\",\"close\":\"20:00\"},\"thursday\":{\"open\":\"09:00\",\"close\":\"20:00\"},\"friday\":{\"open\":\"09:00\",\"close\":\"20:00\"},\"saturday\":{\"open\":\"10:00\",\"close\":\"18:00\"},\"sunday\":{\"open\":\"10:00\",\"close\":\"18:00\"}}"' \
--form 'aadhaar_card=@"/path/to/aadhaar.jpg"' \
--form 'gst_certificate=@"/path/to/gst.pdf"' \
--form 'pan_card=@"/path/to/pan_card.pdf"' \
--form 'cancelled_cheque=@"/path/to/cheque.jpg"' \
--form 'shop_image=@"/path/to/shop.jpg"' \
--form 'profile_pic=@"/path/to/profile.jpg"'
```

## How to use in Postman:

1. **Open Postman**
2. Click **"Import"** button (top left)
3. Select **"Raw text"** tab
4. **Paste the cURL command above**
5. Click **"Continue"** then **"Import"**
6. Replace `YOUR_JWT_TOKEN` with your actual JWT token
7. Replace file paths (e.g., `"/path/to/aadhaar.jpg"`) with actual file paths or remove `@` to use Postman's file picker
8. Click **"Send"**

## Alternative: Manual Setup in Postman

If you prefer to set up manually:

1. **Method:** `POST`
2. **URL:** `http://localhost:3000/vendor/register-complete`
3. **Headers:**
   - `Authorization`: `Bearer YOUR_JWT_TOKEN`
4. **Body Tab:**
   - Select **"form-data"**
   - Add the following key-value pairs:

| Key                   | Type | Value                                                                                                                                                                                                                                                                                                             |
| --------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shop_name`           | Text | `Clean Laundry Services`                                                                                                                                                                                                                                                                                          |
| `owner_name`          | Text | `John Doe`                                                                                                                                                                                                                                                                                                        |
| `gst_number`          | Text | `27ABCDE1234F1Z5`                                                                                                                                                                                                                                                                                                 |
| `address_line1`       | Text | `123 Main Street`                                                                                                                                                                                                                                                                                                 |
| `pincode`             | Text | `400001`                                                                                                                                                                                                                                                                                                          |
| `landmark`            | Text | `Near Metro Station`                                                                                                                                                                                                                                                                                              |
| `latitude`            | Text | `19.076`                                                                                                                                                                                                                                                                                                          |
| `longitude`           | Text | `72.8777`                                                                                                                                                                                                                                                                                                         |
| `contactNum`          | Text | `+919876543210`                                                                                                                                                                                                                                                                                                   |
| `account_holder_name` | Text | `John Doe`                                                                                                                                                                                                                                                                                                        |
| `account_number`      | Text | `1234567890`                                                                                                                                                                                                                                                                                                      |
| `ifsc_code`           | Text | `HDFC0001234`                                                                                                                                                                                                                                                                                                     |
| `bank_name`           | Text | `HDFC Bank`                                                                                                                                                                                                                                                                                                       |
| `branch`              | Text | `Andheri West`                                                                                                                                                                                                                                                                                                    |
| `upi_id`              | Text | `vendor@upi`                                                                                                                                                                                                                                                                                                      |
| `operating_hours`     | Text | `{"monday":{"open":"09:00","close":"20:00"},"tuesday":{"open":"09:00","close":"20:00"},"wednesday":{"open":"09:00","close":"20:00"},"thursday":{"open":"09:00","close":"20:00"},"friday":{"open":"09:00","close":"20:00"},"saturday":{"open":"10:00","close":"18:00"},"sunday":{"open":"10:00","close":"18:00"}}` |
| `aadhaar_card`        | File | [Select File]                                                                                                                                                                                                                                                                                                     |
| `gst_certificate`     | File | [Select File]                                                                                                                                                                                                                                                                                                     |
| `pan_card`            | File | [Select File]                                                                                                                                                                                                                                                                                                     |
| `cancelled_cheque`    | File | [Select File]                                                                                                                                                                                                                                                                                                     |
| `shop_image`          | File | [Select File]                                                                                                                                                                                                                                                                                                     |
| `profile_pic`         | File | [Select File]                                                                                                                                                                                                                                                                                                     |

## Operating Hours JSON String (for easy copy-paste):

```
{"monday":{"open":"09:00","close":"20:00"},"tuesday":{"open":"09:00","close":"20:00"},"wednesday":{"open":"09:00","close":"20:00"},"thursday":{"open":"09:00","close":"20:00"},"friday":{"open":"09:00","close":"20:00"},"saturday":{"open":"10:00","close":"18:00"},"sunday":{"open":"10:00","close":"18:00"}}
```
