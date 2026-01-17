# SalesCare API Collection

Quick copy-paste examples for testing with Postman, Thunder Client, or curl.

## 🔧 Setup

**Base URL**: `http://localhost:5000`

**Environment Variables** (create in Postman):
- `BASE_URL` = `http://localhost:5000`
- `TOKEN` = (set after login)

---

## 📡 API Endpoints

### 1. Health Check

**GET** `/health`

```bash
curl http://localhost:5000/health
```

**Expected Response** (200 OK):
```json
{
  "status": "OK",
  "timestamp": "2025-01-17T12:00:00.000Z",
  "uptime": 123.456,
  "environment": "development"
}
```

---

### 2. Login

**POST** `/api/auth/login`

**Body** (JSON):
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**curl**:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTY...",
    "user": {
      "user_id": 1,
      "username": "admin",
      "full_name": "System Administrator",
      "email": "admin@salescare.com",
      "phone": "03001234567",
      "role": "admin"
    }
  }
}
```

**Error Response** (401 Unauthorized):
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**⚠️ Important**: Copy the `token` value for subsequent requests!

---

### 3. Get Current User

**GET** `/api/auth/me`

**Headers**:
```
Authorization: Bearer <YOUR_TOKEN_HERE>
```

**curl**:
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "user_id": 1,
      "username": "admin",
      "full_name": "System Administrator",
      "email": "admin@salescare.com",
      "phone": "03001234567",
      "role": "admin",
      "is_active": true
    }
  }
}
```

**Error Response** (401 Unauthorized):
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

---

### 4. Change Password

**PUT** `/api/auth/change-password`

**Headers**:
```
Authorization: Bearer <YOUR_TOKEN_HERE>
Content-Type: application/json
```

**Body** (JSON):
```json
{
  "currentPassword": "admin123",
  "newPassword": "newpassword123"
}
```

**curl**:
```bash
curl -X PUT http://localhost:5000/api/auth/change-password \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "admin123",
    "newPassword": "newpassword123"
  }'
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses**:

Invalid current password (401):
```json
{
  "success": false,
  "message": "Current password is incorrect"
}
```

Password too short (400):
```json
{
  "success": false,
  "message": "New password must be at least 6 characters"
}
```

---

### 5. List Users (Admin Only)

**GET** `/api/users`

**Headers**:
```
Authorization: Bearer <YOUR_TOKEN_HERE>
```

**curl**:
```bash
curl http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "User routes - Coming soon"
}
```

**Error Response** (403 Forbidden) - if not admin/manager:
```json
{
  "success": false,
  "message": "Access denied. Insufficient permissions."
}
```

---

### 6-14. Other Module Endpoints (Placeholders)

All these endpoints require authentication:

**GET** `/api/customers`
**GET** `/api/complaints`
**GET** `/api/invoices`
**GET** `/api/inventory`
**GET** `/api/purchase-orders`
**GET** `/api/requisitions`
**GET** `/api/delivery-orders`
**GET** `/api/reports`

**Headers**:
```
Authorization: Bearer <YOUR_TOKEN_HERE>
```

**Current Response** (200 OK):
```json
{
  "success": true,
  "message": "<Module> routes - Coming soon"
}
```

---

## 🧪 Testing Workflow

### Step 1: Test Server Health
```bash
curl http://localhost:5000/health
```

### Step 2: Login as Admin
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Copy the token from response**

### Step 3: Get Current User Info
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_COPIED_TOKEN"
```

### Step 4: Test Protected Routes
```bash
curl http://localhost:5000/api/complaints \
  -H "Authorization: Bearer YOUR_COPIED_TOKEN"
```

---

## 🔐 Test Different User Roles

### Admin User
```json
{
  "username": "admin",
  "password": "admin123"
}
```
**Can access**: Everything

### Manager User
```json
{
  "username": "manager1",
  "password": "admin123"
}
```
**Can access**: Users, Complaints, Reports (not Settings)

### Technician User
```json
{
  "username": "tech1",
  "password": "admin123"
}
```
**Can access**: Assigned Complaints, MRQS/MRTS

### Receptionist User
```json
{
  "username": "reception1",
  "password": "admin123"
}
```
**Can access**: Complaints, Counter Sales, Customers

---

## 📋 Postman Collection JSON

Save this as `SalesCare.postman_collection.json`:

```json
{
  "info": {
    "name": "SalesCare API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "BASE_URL",
      "value": "http://localhost:5000"
    },
    {
      "key": "TOKEN",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "{{BASE_URL}}/health"
      }
    },
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "url": "{{BASE_URL}}/api/auth/login",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"username\": \"admin\",\n  \"password\": \"admin123\"\n}"
        }
      }
    },
    {
      "name": "Get Current User",
      "request": {
        "method": "GET",
        "url": "{{BASE_URL}}/api/auth/me",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{TOKEN}}"
          }
        ]
      }
    }
  ]
}
```

---

## 🐛 Common Issues

### 401 Unauthorized
- Token missing or invalid
- Token expired (7 days default)
- User account inactive

**Solution**: Login again to get new token

### 403 Forbidden
- User doesn't have required role
- Trying to access admin-only endpoint

**Solution**: Login with appropriate user role

### 404 Not Found
- Wrong endpoint URL
- Server not running

**Solution**: Check endpoint path and server status

### 500 Internal Server Error
- Database connection issue
- Server-side error

**Solution**: Check server logs and database

---

## 📝 Response Format

All API responses follow this format:

**Success Response**:
```json
{
  "success": true,
  "message": "Operation description",
  "data": {
    // Response data
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "message": "Error description"
}
```

**Development Environment** (includes stack trace):
```json
{
  "success": false,
  "message": "Error description",
  "stack": "Error: ...\n    at ..."
}
```

---

## 🚀 Quick Test Script

Save as `quick-test.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:5000"

echo "1. Testing health..."
curl -s $BASE_URL/health | jq

echo -e "\n2. Testing login..."
TOKEN=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.data.token')

echo "Token: ${TOKEN:0:30}..."

echo -e "\n3. Testing authenticated route..."
curl -s $BASE_URL/api/auth/me \
  -H "Authorization: Bearer $TOKEN" \
  | jq

echo -e "\nDone!"
```

Run with:
```bash
chmod +x quick-test.sh
./quick-test.sh
```

---

**💡 Tip**: Use Postman environments to switch between development, staging, and production easily!