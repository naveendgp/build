# Review System Implementation

## Overview

A simple review system has been implemented that allows users to rate orders and stores the average rating in vendors.

## Features Implemented

### 1. Review Schema (`src/schemas/reviews.schema.ts`)

- Stores user reviews for orders
- Links reviews to users, vendors, and orders
- Includes rating (1-5), optional comment, and verification status
- Ensures one review per order with unique index

### 2. Review DTOs (`src/user/dto.ts`)

- `CreateReviewDto`: For submitting reviews with order ID, rating, and optional comment
- `GetVendorReviewsDto`: For pagination when retrieving vendor reviews

### 3. Review Service Methods (`src/user/user.service.ts`)

- `createReview()`: Creates a review for a delivered order
- `getVendorReviews()`: Retrieves paginated reviews for a vendor
- `getUserReviews()`: Retrieves paginated reviews by a user
- `updateVendorRating()`: Calculates and updates vendor average rating

### 4. Review Controller Endpoints (`src/user/user.controller.ts`)

- `POST /user/create-review`: Submit a review for an order
- `GET /user/my-reviews`: Get user's reviews (authenticated)
- `GET /user/vendor/:vendorId/reviews`: Get vendor reviews (public)

## API Endpoints

### Create Review

```
POST /user/create-review
Authorization: Bearer <token>
Body: {
  "orderId": "string",
  "rating": number (1-5),
  "comment": "string" (optional)
}
```

### Get User Reviews

```
GET /user/my-reviews?page=1&limit=10
Authorization: Bearer <token>
```

### Get Vendor Reviews

```
GET /user/vendor/{vendorId}/reviews?page=1&limit=10
```

## Business Logic

1. **Review Creation**:
   - Only delivered orders can be reviewed
   - One review per order maximum
   - Order must belong to the authenticated user
   - Automatically marks order as reviewed

2. **Rating Calculation**:
   - Average rating calculated from all verified reviews
   - Rounded to 1 decimal place
   - Updates vendor's rating.total_reviews count
   - Stores last 10 reviews in vendor document for performance

3. **Data Validation**:
   - Rating must be between 1-5
   - Order must exist and belong to user
   - Order must be in 'delivered' status
   - Prevents duplicate reviews

## Integration

The review system integrates with:

- **User Module**: Added review schemas and services
- **Vendor Schema**: Uses existing rating structure
- **Order Schema**: Uses existing rating_given field
- **Authentication**: Protected endpoints use UserAuthGuard

## Database Changes

- New `reviews` collection with unique index on `order_id`
- Updates to `vendors` collection rating fields
- Updates to `orders` collection rating_given field
