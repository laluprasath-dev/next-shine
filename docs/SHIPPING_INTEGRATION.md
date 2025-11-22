# Dynamic Shipping Integration

This document explains the dynamic shipping charge and delivery options integration in the checkout process.

## Overview

The shipping integration allows users to:

1. See real-time shipping charges based on their delivery address
2. Choose from multiple courier options with different delivery speeds and costs
3. View estimated delivery dates for each option
4. Complete checkout with the selected shipping option

## Components

### 1. Shipping Service (`src/services/shippingService.ts`)

**Purpose**: Handles communication with Supabase Edge Functions for shipping calculations.

**Key Features**:

- Authenticates with Shiprocket API
- Calculates shipping charges based on cart items and delivery address
- Formats courier options for display
- Handles error cases gracefully

**API Endpoints Used**:

- `shiprocket-auth`: Authenticates with Shiprocket
- `get-shipping-charge`: Calculates shipping costs

### 2. Shipping Options Component (`src/components/shop/ShippingOptions.tsx`)

**Purpose**: Displays available courier options as radio buttons.

**Features**:

- Shows courier logos, names, and rates
- Displays delivery speed (Fast/Standard/Economy)
- Shows estimated delivery dates
- Indicates COD availability
- Auto-selects first option
- Handles loading and error states

### 3. Updated Cart Summary (`src/components/shop/CartSummary.tsx`)

**Changes**:

- Accepts `selectedCourier` prop
- Uses dynamic shipping cost instead of fixed rates
- Shows selected courier information
- Disables checkout until courier is selected

### 4. Updated Checkout Page (`src/pages/Checkout.tsx`)

**Changes**:

- Added shipping options section
- Manages courier selection state
- Resets courier selection when address changes
- Includes shipping info in order creation

## Data Flow

1. **User selects delivery address** → Triggers shipping calculation
2. **Shipping service calls Edge Functions** → Gets courier options
3. **User selects courier** → Updates cart summary with shipping cost
4. **User proceeds to payment** → Order includes shipping information

## Product Requirements

Products must have the following shipping properties:

- `weight`: Product weight in kg
- `length`: Product length in cm
- `breadth`: Product breadth in cm
- `height`: Product height in cm
- `pickup_postcode`: Pickup location postcode

## Environment Variables

The following environment variables are required for Shiprocket integration:

- `SHIPROCKET_EMAIL`: Shiprocket account email
- `SHIPROCKET_PASSWORD`: Shiprocket account password

## Error Handling

The integration handles various error scenarios:

- Network failures
- Invalid addresses
- No courier options available
- Authentication failures
- Missing product shipping data

## UI/UX Features

- **Loading States**: Shows spinner while calculating shipping
- **Error Messages**: Clear error messages with retry options
- **Auto-selection**: Automatically selects first available option
- **Visual Indicators**: Different colors for delivery speeds
- **Responsive Design**: Works on mobile and desktop
- **Accessibility**: Proper labels and keyboard navigation

## Testing

To test the integration:

1. Add products to cart (ensure they have shipping properties)
2. Go to checkout
3. Select a delivery address
4. Wait for shipping options to load
5. Select a courier option
6. Verify shipping cost updates in summary
7. Complete checkout

## Future Enhancements

Potential improvements:

- Caching of shipping rates
- Bulk shipping calculations
- International shipping support
- Real-time tracking integration
- Shipping insurance options

