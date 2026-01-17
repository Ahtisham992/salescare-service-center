# SalesCare - Quick Reference Guide

## 🚀 Quick Start Commands

```bash
# Setup (First time only)
npm install
npm run db:migrate
npm run db:seed

# Development
npm run dev

# Production
npm start

# Database
npm run db:setup    # Migrate + Seed
npm run db:migrate  # Run migrations only
npm run db:seed     # Seed data only
```

---

## 🔐 Default Login Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | admin |
| tech1 | admin123 | technician |
| manager1 | admin123 | manager |

---

## 📡 API Quick Reference

### Base URL
```
http://localhost:5000/api
```

### Authentication

**Login**
```bash
POST /api/auth/login
{
  "username": "admin",
  "password": "admin123"
}
```

**Get Current User**
```bash
GET /api/auth/me
Headers: Authorization: Bearer <token>
```

**Change Password**
```bash
PUT /api/auth/change-password
Headers: Authorization: Bearer <token>
{
  "currentPassword": "admin123",
  "newPassword": "newpass123"
}
```

---

## 📊 Database Quick Queries

### Check Setup
```sql
-- List all tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Count records
SELECT 
  'users' as table, COUNT(*) FROM users
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'items', COUNT(*) FROM items;
```

### User Management
```sql
-- View all users
SELECT user_id, username, full_name, role, is_active 
FROM users ORDER BY user_id;

-- Create new user
INSERT INTO users (username, password_hash, full_name, role)
VALUES ('newuser', '$2a$10$...', 'New User', 'technician');

-- Deactivate user
UPDATE users SET is_active = false WHERE username = 'tech1';
```

### Inventory
```sql
-- Current stock by area
SELECT 
  oa.area_name,
  i.item_code,
  it.description,
  i.quantity_in_hand,
  it.unit_price
FROM inventory i
JOIN items it ON i.item_id = it.item_id
JOIN operational_areas oa ON i.area_id = oa.area_id
ORDER BY oa.area_name, it.description;

-- Low stock items (< 5)
SELECT 
  it.item_code,
  it.description,
  SUM(i.quantity_in_hand) as total_stock
FROM inventory i
JOIN items it ON i.item_id = it.item_id
GROUP BY it.item_id, it.item_code, it.description
HAVING SUM(i.quantity_in_hand) < 5;
```

### Complaints
```sql
-- Active complaints
SELECT 
  c.complaint_number,
  cust.name as customer_name,
  p.product_name,
  c.status,
  u.full_name as technician
FROM complaints c
JOIN customers cust ON c.customer_id = cust.customer_id
JOIN products p ON c.product_id = p.product_id
LEFT JOIN users u ON c.assigned_technician = u.user_id
WHERE c.status IN ('Open', 'Assigned', 'In Progress')
ORDER BY c.complaint_date DESC;
```

---

## 🔧 Common Tasks

### Reset Database
```sql
-- In pgAdmin
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Then:
```bash
npm run db:setup
```

### Generate Strong JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Check Server Status
```bash
curl http://localhost:5000/health
```

### Test API
```bash
node test-api.js
```

---

## 📝 Code Snippets

### Database Query Template
```javascript
const { query } = require('../config/database');

const getUsers = async (req, res) => {
  try {
    const result = await query(
      'SELECT user_id, username, full_name FROM users WHERE is_active = $1',
      [true]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};
```

### Transaction Template
```javascript
const { transaction } = require('../config/database');

const createComplaint = async (req, res) => {
  try {
    const result = await transaction(async (client) => {
      // Insert complaint
      const complaint = await client.query(
        'INSERT INTO complaints (...) VALUES (...) RETURNING *',
        [...]
      );
      
      // Other operations...
      
      return complaint.rows[0];
    });
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

### Protected Route Template
```javascript
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// Public route
router.post('/public-endpoint', async (req, res) => {
  // No authentication required
});

// Protected route (any authenticated user)
router.get('/protected', authenticate, async (req, res) => {
  // req.user is available
});

// Role-restricted route
router.post('/admin-only', 
  authenticate, 
  authorize('admin', 'manager'), 
  async (req, res) => {
    // Only admin and manager can access
  }
);

module.exports = router;
```

---

## 🐛 Troubleshooting Checklist

- [ ] PostgreSQL is running
- [ ] Database `salescare_db` exists
- [ ] `.env` file exists with correct values
- [ ] All npm packages installed (`npm install`)
- [ ] Migrations ran successfully (`npm run db:migrate`)
- [ ] Sample data loaded (`npm run db:seed`)
- [ ] No port conflicts (PORT=5000 is free)
- [ ] JWT_SECRET is set in `.env`

---

## 📊 Project Stats

### Database
- **Tables**: 20+
- **Sample Users**: 5
- **Sample Products**: 17
- **Sample Items**: 10
- **Relationships**: Foreign keys with cascading

### API
- **Auth Endpoints**: 3
- **Placeholder Endpoints**: 9
- **Planned Endpoints**: 50+

### Tech Stack
- Node.js + Express
- PostgreSQL
- JWT Authentication
- bcryptjs for passwords

---

## 🔗 Useful Links

- **pgAdmin 4**: Database management GUI
- **Postman**: API testing
- **VS Code Extensions**:
  - Thunder Client (API testing)
  - PostgreSQL (SQL formatting)
  - REST Client (API testing in VS Code)

---

## 📞 Need Help?

1. Check README.md for detailed documentation
2. Review error logs in console
3. Test with `test-api.js`
4. Check PostgreSQL logs
5. Verify `.env` configuration

---

**Quick Tip**: Keep this file open in a separate tab while developing! 🚀