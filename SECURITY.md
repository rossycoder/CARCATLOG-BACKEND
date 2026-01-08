# Backend Security Implementation

## Overview
This document outlines the security measures implemented in the backend to prevent unauthorized access and data manipulation through tools like Postman or direct API calls.

## Security Layers

### 1. Authentication & Authorization

#### JWT Token Authentication
- All protected routes require a valid JWT token in the Authorization header
- Tokens are signed with a secret key and expire after 30 days
- Token verification happens in `middleware/tradeDealerAuth.js`

```javascript
// Example: Protected route
router.get('/inventory', authenticateTradeDealer, getInventory);
```

#### Role-Based Access Control
- Trade dealer tokens include role information (`trade_dealer` or `trade_admin`)
- Middleware verifies the user's role before granting access
- Regular users cannot access trade dealer endpoints

### 2. Input Validation

#### Comprehensive Validation Middleware
Location: `backend/middleware/inputValidation.js`

**Features:**
- Email format validation
- Password strength requirements (min 8 chars, uppercase, lowercase, number)
- Phone number format validation (UK format)
- Price range validation (0 - 10,000,000)
- Year validation (1900 - current year + 1)
- Mileage validation (0 - 1,000,000)
- URL validation for images
- HTML tag sanitization
- Maximum image limit (20 images)

**Applied to:**
- Trade dealer registration
- Vehicle creation/update
- Login credentials

### 3. Injection Prevention

#### NoSQL Injection Protection
The `preventInjection` middleware scans all incoming requests for:
- MongoDB operators (`$where`, `$ne`, `$gt`, `$lt`, `$or`, `$and`, `$regex`)
- JavaScript execution attempts (`javascript:`, `eval()`)
- SQL injection patterns (`union select`, `drop table`)
- XSS attempts (`<script>` tags)

```javascript
// Automatically applied to all trade routes
router.use(preventInjection);
```

### 4. Rate Limiting

#### Request Throttling
Prevents brute force attacks and API abuse:

**Registration/Password Reset:** 5 requests per hour
**Login:** 10 requests per 15 minutes
**General API:** 100 requests per 15 minutes

```javascript
// Example: Login rate limiting
router.post('/login', rateLimitCheck(10, 15 * 60 * 1000), login);
```

### 5. Account Status Verification

#### Multi-Level Checks
1. **Email Verification:** Account must verify email before login
2. **Account Status:** Only 'active' accounts can access protected routes
3. **Subscription Status:** Certain operations require active subscription

```javascript
// Middleware chain example
router.post('/', 
  authenticateTradeDealer,      // Verify token
  requireActiveSubscription,     // Check subscription
  checkListingLimit,             // Verify listing quota
  validateVehicleData,           // Validate input
  createVehicle                  // Execute
);
```

### 6. Dealer ID Verification

#### Ownership Validation
- All vehicle operations verify that the dealer ID matches the authenticated user
- Prevents dealers from modifying other dealers' listings
- Implemented in controller logic

```javascript
// Example from publishVehicle controller
if (dealerId && dealerId.toString() !== req.dealerId.toString()) {
  return res.status(403).json({ 
    success: false, 
    message: 'Unauthorized - Dealer ID mismatch' 
  });
}
```

## Protected Endpoints

### Trade Dealer Routes (`/api/trade/auth`)

| Endpoint | Method | Protection | Rate Limit |
|----------|--------|------------|------------|
| `/register` | POST | Validation + Injection Prevention | 5/hour |
| `/login` | POST | Validation + Injection Prevention | 10/15min |
| `/verify-email` | POST | Injection Prevention | 10/15min |
| `/forgot-password` | POST | Injection Prevention | 5/hour |
| `/reset-password` | POST | Injection Prevention | 5/hour |
| `/me` | GET | JWT Auth | - |
| `/logout` | POST | JWT Auth | - |

### Trade Inventory Routes (`/api/trade/inventory`)

| Endpoint | Method | Protection | Additional Checks |
|----------|--------|------------|-------------------|
| `/` | GET | JWT Auth + Active Subscription | - |
| `/stats` | GET | JWT Auth + Active Subscription | - |
| `/` | POST | JWT Auth + Active Subscription + Validation | Listing Limit |
| `/:id` | GET | JWT Auth + Active Subscription | Ownership |
| `/:id` | PUT | JWT Auth + Active Subscription + Validation | Ownership |
| `/:id` | DELETE | JWT Auth + Active Subscription | Ownership |
| `/:id/sold` | PATCH | JWT Auth + Active Subscription | Ownership |
| `/publish` | POST | JWT Auth + Validation | Dealer ID Match |

## Testing Security

### Valid Request Example
```bash
curl -X POST http://localhost:5000/api/trade/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dealer@example.com",
    "password": "SecurePass123"
  }'
```

### Invalid Requests (Will Be Blocked)

#### 1. Missing Authentication
```bash
curl -X GET http://localhost:5000/api/trade/inventory
# Response: 401 Unauthorized - Authentication required
```

#### 2. Invalid Email Format
```bash
curl -X POST http://localhost:5000/api/trade/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "not-an-email",
    "password": "SecurePass123"
  }'
# Response: 400 Bad Request - Invalid email format
```

#### 3. Weak Password
```bash
curl -X POST http://localhost:5000/api/trade/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dealer@example.com",
    "password": "weak"
  }'
# Response: 400 Bad Request - Password validation errors
```

#### 4. NoSQL Injection Attempt
```bash
curl -X POST http://localhost:5000/api/trade/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": {"$ne": null},
    "password": {"$ne": null}
  }'
# Response: 400 Bad Request - Invalid input detected
```

#### 5. Rate Limit Exceeded
```bash
# After 10 failed login attempts in 15 minutes
curl -X POST http://localhost:5000/api/trade/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dealer@example.com",
    "password": "wrong"
  }'
# Response: 429 Too Many Requests
```

#### 6. Unauthorized Dealer ID
```bash
curl -X POST http://localhost:5000/api/trade/inventory/publish \
  -H "Authorization: Bearer <valid-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "dealerId": "different-dealer-id",
    "vehicleData": {...}
  }'
# Response: 403 Forbidden - Dealer ID mismatch
```

## Best Practices for Frontend

1. **Always include JWT token** in Authorization header for protected routes
2. **Validate input on frontend** before sending to backend (UX improvement)
3. **Handle rate limit errors** gracefully with retry logic
4. **Store tokens securely** (httpOnly cookies or secure localStorage)
5. **Clear tokens on logout** to prevent unauthorized access
6. **Implement token refresh** before expiration

## Monitoring & Logging

All security-related events are logged:
- Failed authentication attempts
- Injection attack attempts
- Rate limit violations
- Unauthorized access attempts

Check server logs for security incidents:
```bash
# View recent security logs
tail -f logs/security.log
```

## Future Enhancements

1. **IP Whitelisting:** Allow only specific IPs for admin operations
2. **Two-Factor Authentication:** Add 2FA for sensitive operations
3. **CAPTCHA:** Implement CAPTCHA for registration and login
4. **Session Management:** Track active sessions and allow remote logout
5. **Audit Trail:** Detailed logging of all data modifications
6. **Encryption:** Encrypt sensitive data at rest

## Emergency Response

If you suspect a security breach:

1. **Immediately revoke all JWT tokens** by changing JWT_SECRET in .env
2. **Review server logs** for suspicious activity
3. **Notify affected users** if data was compromised
4. **Update security measures** based on the attack vector
5. **Document the incident** for future reference

## Contact

For security concerns or to report vulnerabilities:
- Email: security@carcatalog.com
- Create a private security issue in the repository
