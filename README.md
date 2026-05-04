# SalesCare Service Center Management System

A comprehensive ERP system for managing service center operations including complaints, inventory, invoicing, and material requisitions.

live Demo : https://salescare.netlify.app/

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Business Workflows](#business-workflows)
- [User Roles](#user-roles)
- [Testing](#testing)
- [Development Guide](#development-guide)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

SalesCare Service Center Management System is a full-stack application designed to manage the complete lifecycle of service center operations for appliance service and repair businesses.

### Key Capabilities

- **Complaint Management**: Track customer complaints from registration to resolution
- **Inventory Management**: Real-time stock tracking with automated inventory updates
- **Material Requisition**: MRQS (Material Requisition Slip) and MRTS (Material Return Slip)
- **Purchase Management**: Purchase orders and goods receipt management
- **Invoicing**: Generate invoices for both counter sales and service complaints
- **Service Tariffs**: Dynamic pricing based on product type and service category
- **User Management**: Role-based access control (Admin, Manager, Technician, Receptionist)
- **Reporting**: Comprehensive reports and analytics

---

## ✨ Features

### Complaint Management
- Create and track customer complaints
- Assign technicians to complaints
- Track warranty status (In Warranty, Out of Warranty, Contract)
- Service scheduling and completion tracking
- Status management (Open, Assigned, In Progress, Completed)
- Link complaints to invoices and material requisitions

### Inventory Management
- Multi-location inventory tracking
- Real-time stock levels per operational area
- Automated inventory updates on transactions
- Item master with pricing
- Stock-in-hand reports
- Transaction history and audit trail

### Material Requisition System
- **MRQS (Material Requisition Slip)**: Request parts for complaint resolution
- **MRTS (Material Return Slip)**: Return unused parts
- Item status tracking (UW/OPB/Con W/Con P)
- Approval workflow
- Automatic inventory deduction on issue

### Purchase & Goods Receipt
- Create purchase orders with vendors
- Multi-item purchase orders
- Goods receipt against purchase orders
- FOC (Free of Cost) and OPB (Opening Balance) tracking
- Vendor management

### Invoicing System
- **Counter Sale Invoices**: Direct sales to walk-in customers
- **Complaint Invoices**: Service charges + parts charges
- Delivery orders for counter sales
- GST and FST calculations
- Discount and waive-off management
- Auto-number generation

### Service Tariffs
- Product-specific pricing
- Multiple charge types:
  - Visit charges (24h/48h)
  - Gas charges
  - Inspection charges
  - Washing/service charges
  - Transport charges per km
  - Dismantling charges
  - Re-installation charges

---

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js v18+
- **Framework**: Express.js v4.18+
- **Database**: PostgreSQL 14+
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Security**: Helmet, CORS
- **Logging**: Morgan

### Frontend (Planned)
- **Framework**: React.js v18+
- **UI Library**: Tailwind CSS
- **State Management**: React Context / Redux
- **HTTP Client**: Axios
- **Routing**: React Router v6

### Development Tools
- **Process Manager**: Nodemon
- **Version Control**: Git
- **API Testing**: Postman / Thunder Client

---

## 📁 Project Structure

```
salescare-service-center/
│
├── backend/
│   ├── config/
│   │   ├── database.js              # PostgreSQL connection pool
│   │   └── constants.js             # Application constants
│   │
│   ├── middleware/
│   │   ├── auth.js                  # JWT authentication & authorization
│   │   ├── validation.js            # Request validation (planned)
│   │   └── errorHandler.js          # Global error handling (planned)
│   │
│   ├── controllers/
│   │   ├── authController.js        # Authentication logic
│   │   ├── complaintController.js   # Complaint CRUD (planned)
│   │   ├── invoiceController.js     # Invoice generation (planned)
│   │   ├── inventoryController.js   # Inventory operations (planned)
│   │   └── ...
│   │
│   ├── routes/
│   │   ├── auth.routes.js           # Auth endpoints
│   │   ├── complaint.routes.js      # Complaint endpoints
│   │   ├── invoice.routes.js        # Invoice endpoints
│   │   ├── inventory.routes.js      # Inventory endpoints
│   │   └── ...
│   │
│   ├── services/
│   │   ├── inventoryService.js      # Inventory business logic (planned)
│   │   ├── invoiceService.js        # Invoice calculations (planned)
│   │   └── ...
│   │
│   ├── migrations/
│   │   └── initial_schema.sql       # Database schema
│   │
│   ├── scripts/
│   │   ├── migrate.js               # Run migrations
│   │   └── seed.js                  # Seed sample data
│   │
│   ├── .env                         # Environment variables
│   ├── .env.example                 # Environment template
│   ├── package.json                 # Dependencies
│   ├── server.js                    # Express app entry point
│   └── test-api.js                  # API testing script
│
├── frontend/                        # React app (planned)
│   └── ...
│
├── docs/                            # Documentation
│   ├── API.md                       # API documentation
│   └── WORKFLOWS.md                 # Business workflows
│
└── README.md                        # This file
```

---

## 🗄 Database Schema

### Core Tables

**Master Data**
- `users` - System users with role-based access
- `customers` - Customer information
- `vendors` - Supplier/vendor details
- `operational_areas` - Service center locations
- `products` - Appliance/product catalog
- `service_tariffs` - Pricing for services per product
- `items` - Spare parts and inventory items

**Operational**
- `complaints` - Customer service complaints
- `material_requisitions` - MRQS for parts
- `material_returns` - MRTS for returned parts
- `purchase_orders` - Purchase orders to vendors
- `goods_receipts` - Goods received from vendors
- `delivery_orders` - Counter sale orders
- `invoices` - All invoice types
- `inventory` - Current stock levels per location

**Supporting**
- `inventory_transactions` - Complete audit trail of inventory movements
- Various junction tables for relationships

### Key Relationships

```
complaints → material_requisitions → inventory_transactions → inventory
complaints → invoices
delivery_orders → invoices
purchase_orders → goods_receipts → inventory_transactions → inventory
```

For complete schema, see `backend/migrations/initial_schema.sql`

---

## 🚀 Installation

### Prerequisites

1. **Node.js** v18+ and npm
   ```bash
   node --version  # Should be v18 or higher
   npm --version
   ```

2. **PostgreSQL** v14+
   ```bash
   psql --version  # Should be 14 or higher
   ```

3. **Git** (for cloning)

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd salescare-service-center
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 3: Create PostgreSQL Database

**Option A: Using pgAdmin 4**
1. Open pgAdmin 4
2. Right-click "Databases" → "Create" → "Database"
3. Database name: `salescare_db`
4. Owner: `postgres`
5. Click "Save"

**Option B: Using psql**
```bash
psql -U postgres
CREATE DATABASE salescare_db;
\q
```

### Step 4: Configure Environment Variables

Create `.env` file in `backend/` folder:

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=salescare_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_super_secret_key_at_least_32_characters_long
JWT_EXPIRE=7d

# Application
COMPANY_NAME=SalesCare Service Center
DEFAULT_AREA=Rawalpindi, PEL Service Center
```

**⚠️ Important**: Change `DB_PASSWORD` and `JWT_SECRET` to your own values!

### Step 5: Run Database Migrations

**Option A: Using Scripts (Recommended)**
```bash
npm run db:migrate
```

**Option B: Using pgAdmin**
1. Open pgAdmin 4
2. Select `salescare_db` database
3. Tools → Query Tool
4. Copy entire content from `backend/migrations/initial_schema.sql`
5. Paste and Execute (F5)

### Step 6: Seed Sample Data

```bash
npm run db:seed
```

This creates:
- 5 test users (admin, tech1, tech2, reception1, manager1)
- 17 products
- 10 inventory items with stock
- 3 sample customers
- 3 operational areas
- 2 vendors
- Service tariffs

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DB_HOST` | PostgreSQL host | localhost | Yes |
| `DB_PORT` | PostgreSQL port | 5432 | Yes |
| `DB_NAME` | Database name | salescare_db | Yes |
| `DB_USER` | Database user | postgres | Yes |
| `DB_PASSWORD` | Database password | - | Yes |
| `PORT` | Server port | 5000 | No |
| `NODE_ENV` | Environment | development | No |
| `JWT_SECRET` | JWT signing key | - | Yes |
| `JWT_EXPIRE` | Token expiry | 7d | No |

### Default Users

After seeding, you can login with these accounts:

| Username | Password | Role | Description |
|----------|----------|------|-------------|
| admin | admin123 | admin | Full system access |
| tech1 | admin123 | technician | Service technician |
| tech2 | admin123 | technician | Service technician |
| reception1 | admin123 | receptionist | Front desk |
| manager1 | admin123 | manager | Service manager |

**⚠️ Important**: Change these passwords in production!

---

## 🏃 Running the Application

### Development Mode

```bash
cd backend
npm run dev
```

Server starts on `http://localhost:5000` with auto-reload on file changes.

### Production Mode

```bash
cd backend
npm start
```

### Verify Server is Running

**Method 1: Browser**
Open `http://localhost:5000/health`

**Method 2: Curl**
```bash
curl http://localhost:5000/health
```

**Method 3: Test Script**
```bash
node test-api.js
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-01-17T12:00:00.000Z",
  "uptime": 5.123,
  "environment": "development"
}
```

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication

All protected endpoints require JWT token in header:
```
Authorization: Bearer <token>
```

### Endpoints Overview

#### Authentication (`/api/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/login` | User login | Public |
| GET | `/me` | Get current user | Private |
| PUT | `/change-password` | Change password | Private |

#### Users (`/api/users`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | List all users | Admin, Manager |

#### Customers (`/api/customers`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | List customers | Authenticated |

#### Complaints (`/api/complaints`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | List complaints | Authenticated |
| POST | `/` | Create complaint | Authenticated |
| GET | `/:id` | Get complaint | Authenticated |
| PUT | `/:id` | Update complaint | Authenticated |

#### Invoices (`/api/invoices`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | List invoices | Authenticated |
| POST | `/counter-sale` | Create counter sale invoice | Authenticated |
| POST | `/complaint` | Create complaint invoice | Authenticated |
| GET | `/:id` | Get invoice | Authenticated |

#### Inventory (`/api/inventory`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/stock` | Get stock levels | Authenticated |
| GET | `/transactions` | Transaction history | Authenticated |

### Example API Calls

**Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "user_id": 1,
      "username": "admin",
      "full_name": "System Administrator",
      "role": "admin"
    }
  }
}
```

**Get Current User**
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🔄 Business Workflows

### 1. Service Complaint Workflow

```
1. Customer Reports Issue
   ↓
2. Create Complaint (Reception/Admin)
   - Customer details
   - Product information
   - Complaint description
   - Warranty status
   ↓
3. Assign Technician (Manager/Admin)
   ↓
4. Technician Diagnoses Issue
   ↓
5. Create MRQS for Required Parts
   - List needed items
   - Request approval
   ↓
6. Approve & Issue Parts (Manager/Admin)
   - Inventory automatically deducted
   ↓
7. Technician Completes Service
   ↓
8. Return Unused Parts (MRTS)
   - Inventory automatically updated
   ↓
9. Generate Invoice
   - Service charges (from tariff)
   - Parts charges (from MRQS)
   - GST/FST calculations
   ↓
10. Mark Complaint as Completed
```

### 2. Counter Sale Workflow

```
1. Customer Walks In
   ↓
2. Create Delivery Order
   - Customer details
   - Items selected
   - Quantities
   ↓
3. Check Stock Availability
   ↓
4. Generate Invoice
   - Item prices
   - GST calculations
   ↓
5. Inventory Automatically Deducted
   ↓
6. Complete Sale
```

### 3. Purchase & Inventory Workflow

```
1. Create Purchase Order
   - Select vendor
   - List items and quantities
   - Set prices
   ↓
2. Send PO to Vendor
   ↓
3. Receive Goods
   ↓
4. Create Goods Receipt
   - Match with PO
   - Verify quantities
   ↓
5. Inventory Automatically Updated
   ↓
6. Transaction Logged
```

---

## 👥 User Roles

### Admin
- Full system access
- User management
- All module access
- System configuration

### Manager
- View all complaints
- Assign technicians
- Approve requisitions
- View reports
- Cannot manage users

### Technician
- View assigned complaints
- Create MRQS/MRTS
- Update complaint status
- Cannot approve requisitions

### Receptionist
- Create complaints
- Create counter sales
- View customer information
- Limited reporting access

---

## 🧪 Testing

### Manual Testing

**Test Login**
```bash
node test-api.js
```

**Test with Postman/Thunder Client**

1. Import collection (if available)
2. Set environment variable: `BASE_URL = http://localhost:5000`
3. Test login endpoint
4. Copy token to environment
5. Test protected endpoints

### Database Verification

**Check tables exist**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Check sample data**
```sql
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as product_count FROM products;
SELECT COUNT(*) as item_count FROM items;
```

**Check inventory**
```sql
SELECT 
  i.item_code,
  it.description,
  inv.quantity_in_hand,
  oa.area_name
FROM inventory inv
JOIN items it ON inv.item_id = it.item_id
JOIN operational_areas oa ON inv.area_id = oa.area_id;
```

---

## 💻 Development Guide

### Adding a New Feature

1. **Create Database Schema** (if needed)
   - Add to `migrations/initial_schema.sql`
   - Run migration

2. **Create Controller**
   - Add to `controllers/` folder
   - Implement business logic

3. **Create Routes**
   - Add to `routes/` folder
   - Add authentication/authorization

4. **Update Server**
   - Register routes in `server.js`

5. **Test API**
   - Test with Postman/curl
   - Verify database changes

### Code Style Guidelines

- Use `async/await` for database operations
- Always use parameterized queries (no string concatenation)
- Implement proper error handling with try-catch
- Return consistent API response format:
  ```json
  {
    "success": true/false,
    "message": "Description",
    "data": { ... }
  }
  ```
- Use meaningful variable names
- Add comments for complex logic
- Follow REST API conventions

### Database Best Practices

- Always use transactions for multi-step operations
- Log inventory movements in `inventory_transactions`
- Use foreign keys for data integrity
- Index frequently queried columns
- Use `RETURNING *` to get created/updated records

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Server won't start

**Error: Port already in use**
```bash
# Change port in .env
PORT=5001
```

**Error: Cannot find module**
```bash
npm install
```

#### 2. Database connection fails

**Error: password authentication failed**
- Check credentials in `.env`
- Verify PostgreSQL is running
- Test connection: `psql -U postgres -d salescare_db`

**Error: database does not exist**
```bash
# Create database
psql -U postgres -c "CREATE DATABASE salescare_db;"
```

#### 3. Migration fails

**Error: relation already exists**
```sql
-- In pgAdmin, run:
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
```

Then re-run:
```bash
npm run db:migrate
npm run db:seed
```

#### 4. JWT token invalid

- Check `JWT_SECRET` is set in `.env`
- Verify token format: `Bearer <token>`
- Token may be expired (default 7 days)

#### 5. CORS errors (when frontend is added)

Update `server.js`:
```javascript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### Getting Help

1. Check logs in console
2. Verify database connections
3. Test with `test-api.js`
4. Check `.env` configuration
5. Review error messages carefully

---

## 📝 Future Enhancements

### Planned Features

- [ ] React frontend application
- [ ] Real-time notifications (Socket.io)
- [ ] Email/SMS integration
- [ ] PDF invoice generation
- [ ] Advanced reporting dashboard
- [ ] Mobile app (React Native)
- [ ] Barcode scanning for inventory
- [ ] WhatsApp integration
- [ ] Payment gateway integration
- [ ] Multi-language support

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 👨‍💻 Development Team

- Project Lead: [Your Name]
- Backend Developer: [Your Name]
- Database Designer: [Your Name]
- Frontend Developer: [Planned]

---

## 📞 Support

For issues, questions, or contributions:
- GitHub Issues: [[Repository URL](https://github.com/Ahtisham992/salescare-service-center)]

---

## 📅 Version History

### v1.0.0 (Current)
- ✅ Database schema designed
- ✅ Backend API structure
- ✅ Authentication system
- ✅ User management
- ✅ Basic CRUD operations
- ✅ Frontend 
- ✅ Complete complaint module 

---

**Last Updated**: January 2025

**Status**: Active Development 🚀
