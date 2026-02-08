# Ecotronics Payment API - Integration Examples

## Overview
This document shows **exactly** how to integrate the Ecotronics payment system from your external portal (ecotronics.texus.io).

---

## Method 1: Direct API Call (Recommended)

### JavaScript/TypeScript Example

```javascript
// File: ecotronics.texus.io/src/payment.js

async function initiateEcotronicsPayment(registrationData) {
  try {
    // Prepare the payment data
    const paymentData = {
      orderId: registrationData.orderId,           // e.g., "ECO-2026-001"
      amount: registrationData.amount,             // e.g., "500" or "1000.50"
      teamName: registrationData.teamName,         // e.g., "Team Innovators"
      email: registrationData.email,               // e.g., "team@example.com"
      phone: registrationData.phone,               // e.g., "9876543210"
      registrationId: registrationData.id,         // Your internal registration ID
      trackType: registrationData.trackType,       // e.g., "hardware" or "software"
      successUrl: "https://ecotronics.texus.io/payment-success",
      failureUrl: "https://ecotronics.texus.io/payment-failure",
      cancelUrl: "https://ecotronics.texus.io/payment-cancelled"
    };

    // Call the API
    const response = await fetch('https://texus.io/api/ecotronics/create-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData)
    });

    const result = await response.json();

    if (result.success) {
      // Redirect user to payment page
      window.location.href = result.paymentUrl;
    } else {
      // Handle error
      alert('Payment initiation failed: ' + result.error);
      console.error('Payment error:', result.error);
    }
  } catch (error) {
    console.error('Error calling payment API:', error);
    alert('An error occurred while initiating payment. Please try again.');
  }
}

// Example usage - call this when user clicks "Pay Now" button
document.getElementById('payNowButton').addEventListener('click', () => {
  const registrationData = {
    orderId: 'ECO-2026-' + Date.now(),          // Generate unique order ID
    amount: '500',                               // Registration fee
    teamName: 'Team Innovators',
    email: 'team@example.com',
    phone: '9876543210',
    id: 'REG-12345',                            // Your registration ID
    trackType: 'hardware'
  };
  
  initiateEcotronicsPayment(registrationData);
});
```

---

## Method 2: Direct URL Redirect (Simple)

### JavaScript Example

```javascript
// File: ecotronics.texus.io/src/simple-payment.js

function redirectToPayment(registrationData) {
  // Build the payment URL with query parameters
  const baseUrl = 'https://texus.io/ecotronics-payment';
  
  const params = new URLSearchParams({
    orderId: registrationData.orderId,
    amount: registrationData.amount,
    teamName: registrationData.teamName,
    email: registrationData.email,
    phone: registrationData.phone,
    registrationId: registrationData.id,
    trackType: registrationData.trackType,
    successUrl: 'https://ecotronics.texus.io/payment-success',
    failureUrl: 'https://ecotronics.texus.io/payment-failure',
    cancelUrl: 'https://ecotronics.texus.io/payment-cancelled'
  });

  // Redirect to payment page
  window.location.href = `${baseUrl}?${params.toString()}`;
}

// Example usage
document.getElementById('payNowButton').addEventListener('click', () => {
  const registrationData = {
    orderId: 'ECO-2026-' + Date.now(),
    amount: '500',
    teamName: 'Team Innovators',
    email: 'team@example.com',
    phone: '9876543210',
    id: 'REG-12345',
    trackType: 'hardware'
  };
  
  redirectToPayment(registrationData);
});
```

---

## Method 3: React/Next.js Example

### React Component

```typescript
// File: ecotronics.texus.io/src/components/PaymentButton.tsx

import { useState } from 'react';

interface RegistrationData {
  orderId: string;
  amount: string;
  teamName: string;
  email: string;
  phone: string;
  id: string;
  trackType: string;
}

export default function PaymentButton({ registrationData }: { registrationData: RegistrationData }) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);

    try {
      const response = await fetch('https://texus.io/api/ecotronics/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: registrationData.orderId,
          amount: registrationData.amount,
          teamName: registrationData.teamName,
          email: registrationData.email,
          phone: registrationData.phone,
          registrationId: registrationData.id,
          trackType: registrationData.trackType,
          successUrl: 'https://ecotronics.texus.io/payment-success',
          failureUrl: 'https://ecotronics.texus.io/payment-failure',
          cancelUrl: 'https://ecotronics.texus.io/payment-cancelled',
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to payment page
        window.location.href = data.paymentUrl;
      } else {
        alert('Payment initiation failed: ' + data.error);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? 'Processing...' : 'Proceed to Payment'}
    </button>
  );
}
```

## Complete API Reference

### Endpoint
```
POST https://texus.io/api/ecotronics/create-payment
```

### Request Headers
```
Content-Type: application/json
```

### Request Body (JSON)
```json
{
  "orderId": "ECO-2026-001",
  "amount": "500",
  "teamName": "Team Innovators",
  "email": "team@example.com",
  "phone": "9876543210",
  "registrationId": "REG-12345",
  "trackType": "hardware",
  "successUrl": "https://ecotronics.texus.io/payment-success",
  "failureUrl": "https://ecotronics.texus.io/payment-failure",
  "cancelUrl": "https://ecotronics.texus.io/payment-cancelled"
}
```

### Field Descriptions

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `orderId` | string | Yes | Unique order identifier | "ECO-2026-001" |
| `amount` | string | Yes | Payment amount (can include decimals) | "500" or "1000.50" |
| `teamName` | string | Yes | Name of the team/participant | "Team Innovators" |
| `email` | string | Yes | Contact email | "team@example.com" |
| `phone` | string | Yes | Contact phone number | "9876543210" |
| `registrationId` | string | Yes | Your internal registration ID | "REG-12345" |
| `trackType` | string | Optional | Hackathon track (hardware/software) | "hardware" |
| `successUrl` | string | Yes | URL to redirect after successful payment | "https://ecotronics.texus.io/success" |
| `failureUrl` | string | Yes | URL to redirect after failed payment | "https://ecotronics.texus.io/failure" |
| `cancelUrl` | string | Yes | URL to redirect after cancelled payment | "https://ecotronics.texus.io/cancel" |

### Success Response (200 OK)
```json
{
  "success": true,
  "paymentUrl": "https://texus.io/ecotronics-payment?orderId=ECO-2026-001&amount=500&..."
}
```

### Error Response (400 Bad Request)
```json
{
  "success": false,
  "error": "Missing required fields"
}
```

---

## Handling Payment Callbacks

When payment is completed, the user will be redirected to your callback URLs with query parameters:

### Success Callback
```
https://ecotronics.texus.io/payment-success?orderId=ECO-2026-001&transactionId=TXN123456&amount=500&paymentMode=Credit+Card&registrationId=REG-12345&trackType=hardware&status=success
```

### Failure Callback
```
https://ecotronics.texus.io/payment-failure?orderId=ECO-2026-001&transactionId=TXN123456&registrationId=REG-12345&trackType=hardware&reason=Insufficient+funds&status=failed
```

### Cancel Callback
```
https://ecotronics.texus.io/payment-cancelled?orderId=ECO-2026-001&registrationId=REG-12345&trackType=hardware&status=cancelled
```

### Example: Handling Success Callback (JavaScript)

```javascript
// File: ecotronics.texus.io/payment-success.html

<script>
  // Parse query parameters
  const urlParams = new URLSearchParams(window.location.search);
  
  const paymentDetails = {
    orderId: urlParams.get('orderId'),
    transactionId: urlParams.get('transactionId'),
    amount: urlParams.get('amount'),
    paymentMode: urlParams.get('paymentMode'),
    registrationId: urlParams.get('registrationId'),
    trackType: urlParams.get('trackType'),
    status: urlParams.get('status')
  };

  // Update your database or show success message
  console.log('Payment successful:', paymentDetails);
  
  // Update registration status in your backend
  fetch('https://ecotronics.texus.io/api/update-registration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      registrationId: paymentDetails.registrationId,
      status: 'paid',
      transactionId: paymentDetails.transactionId
    })
  });
</script>
```


**End of Integration Guide**
