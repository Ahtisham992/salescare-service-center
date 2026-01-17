// backend/scripts/seed.js
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

const seedDatabase = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting database seeding...\n');

    // 1. Seed Operational Areas
    console.log('📍 Seeding operational areas...');
    await client.query(`
      INSERT INTO operational_areas (area_name, area_code) VALUES
      ('Rawalpindi, PEL Service Center', 'RWP'),
      ('Islamabad Service Center', 'ISB'),
      ('Lahore Service Center', 'LHR')
      ON CONFLICT (area_code) DO NOTHING
    `);
    console.log('✅ Operational areas seeded');

    // 2. Seed Users
    console.log('👥 Seeding users...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await client.query(`
      INSERT INTO users (username, password_hash, full_name, email, phone, role) VALUES
      ('admin', $1, 'System Administrator', 'admin@salescare.com', '03001234567', 'admin'),
      ('tech1', $1, 'Muhammad Ali', 'ali@salescare.com', '03111234567', 'technician'),
      ('tech2', $1, 'Fatima Khan', 'fatima@salescare.com', '03121234567', 'technician'),
      ('reception1', $1, 'Sara Ahmed', 'sara@salescare.com', '03131234567', 'receptionist'),
      ('manager1', $1, 'Hassan Malik', 'hassan@salescare.com', '03141234567', 'manager')
      ON CONFLICT (username) DO NOTHING
    `, [hashedPassword]);
    console.log('✅ Users seeded (Default password: admin123)');

    // 3. Seed Products
    console.log('📦 Seeding products...');
    const products = [
      ['Instant Geyser', 'IG'],
      ['Storage Geyser', 'SG'],
      ['Electric Geyser', 'EG'],
      ['Refrigerator Side By Side', 'REF-SBS'],
      ['Refrigerator No Frost', 'REF-NF'],
      ['Refrigerator Direct Cool', 'REF-DC'],
      ['Split AC 1 Ton', 'AC-1T'],
      ['Split AC 1.5 Ton', 'AC-1.5T'],
      ['Split AC 2 Ton', 'AC-2T'],
      ['Washing Machine Fully Automatic', 'WM-FA'],
      ['Washing Machine Semi Automatic', 'WM-SA'],
      ['LED TV 32 INCH', 'TV-32'],
      ['LED TV 43 INCH', 'TV-43'],
      ['LED TV 55 INCH', 'TV-55'],
      ['Cooking Range', 'CR'],
      ['Microwave Oven', 'MWO'],
      ['Deep Freezer', 'DF']
    ];

    for (const [name, code] of products) {
      await client.query(`
        INSERT INTO products (product_name, product_code, category)
        VALUES ($1, $2, 'Appliance')
        ON CONFLICT (product_code) DO NOTHING
      `, [name, code]);
    }
    console.log(`✅ ${products.length} products seeded`);

    // 4. Seed Service Tariffs
    console.log('💰 Seeding service tariffs...');
    const productResult = await client.query('SELECT product_id, product_name FROM products LIMIT 5');
    
    for (const product of productResult.rows) {
      await client.query(`
        INSERT INTO service_tariffs 
        (product_id, visit_charges_24h, visit_charges_48h, gas_charges, 
         inspection_charges_csc, washing_charges, transport_charges_per_km,
         dismantling_charges, reinstallation_charges)
        VALUES ($1, 1000, 1500, 0, 1000, 1500, 130, 700, 700)
        ON CONFLICT DO NOTHING
      `, [product.product_id]);
    }
    console.log('✅ Service tariffs seeded');

    // 5. Seed Sample Items (Spare Parts)
    console.log('🔧 Seeding inventory items...');
    const items = [
      ['COMP-001', 'Compressor 1 Ton', 15000],
      ['COMP-002', 'Compressor 1.5 Ton', 18000],
      ['PCB-001', 'PCB Board Universal', 2500],
      ['MOTOR-001', 'Fan Motor', 3500],
      ['THERMO-001', 'Thermostat Digital', 1200],
      ['RELAY-001', 'Overload Relay', 800],
      ['FILTER-001', 'Water Filter', 500],
      ['ELEM-001', 'Heating Element 1500W', 1800],
      ['PUMP-001', 'Drain Pump', 2200],
      ['VALVE-001', 'Gas Valve', 1500]
    ];

    for (const [code, desc, price] of items) {
      const itemResult = await client.query(`
        INSERT INTO items (item_code, description, unit_price, category)
        VALUES ($1, $2, $3, 'Spare Part')
        ON CONFLICT (item_code) DO NOTHING
        RETURNING item_id
      `, [code, desc, price]);

      // Initialize inventory for each area
      if (itemResult.rows.length > 0) {
        await client.query(`
          INSERT INTO inventory (item_id, area_id, quantity_in_hand)
          SELECT $1, area_id, 10 FROM operational_areas
          ON CONFLICT (item_id, area_id) DO NOTHING
        `, [itemResult.rows[0].item_id]);
      }
    }
    console.log(`✅ ${items.length} inventory items seeded`);

    // 6. Seed Sample Customers
    console.log('👤 Seeding customers...');
    const customers = [
      ['Muhammad Qasim Abbas', '03001234567', 'House #123, Street 5, Rawalpindi'],
      ['Ali Hassan', '03111234567', 'Flat 4B, Green Plaza, Islamabad'],
      ['Ayesha Malik', '03221234567', 'Villa 7, DHA Phase 2, Islamabad']
    ];

    for (const [name, phone, address] of customers) {
      await client.query(`
        INSERT INTO customers (name, phone, address)
        VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING
      `, [name, phone, address]);
    }
    console.log(`✅ ${customers.length} customers seeded`);

    // 7. Seed Sample Vendors
    console.log('🏭 Seeding vendors...');
    await client.query(`
      INSERT INTO vendors (vendor_code, vendor_name, vendor_type, phone, address) VALUES
      ('VEN-001', 'ABC Parts Supplier', 'Vendor', '03001111111', 'Commercial Market, Rawalpindi'),
      ('LPR-001', 'Local Purchase Rawalpindi', 'LPR', '03002222222', 'Saddar, Rawalpindi')
      ON CONFLICT (vendor_code) DO NOTHING
    `);
    console.log('✅ Vendors seeded');

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - Users: admin, tech1, tech2, reception1, manager1');
    console.log('   - Default Password: admin123');
    console.log('   - Products: 17 appliances');
    console.log('   - Inventory Items: 10 spare parts');
    console.log('   - Customers: 3 sample customers');
    console.log('   - Operational Areas: 3 service centers');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

// Run seeding
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('\n🎉 Database is ready to use!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n💥 Seeding error:', err);
      process.exit(1);
    });
}

module.exports = seedDatabase;