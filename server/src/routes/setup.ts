import { Router, Request, Response } from 'express';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

const router = Router();

// Path to setup lock file
const SETUP_LOCK_FILE = path.join(__dirname, '../../.setup-complete');

// Check if setup is complete
const isSetupComplete = (): boolean => {
  return fs.existsSync(SETUP_LOCK_FILE);
};

// Create setup lock file
const markSetupComplete = (): void => {
  fs.writeFileSync(SETUP_LOCK_FILE, new Date().toISOString());
};

/**
 * Check if setup is already complete
 */
router.get('/check', async (req: Request, res: Response) => {
  try {
    const setupComplete = isSetupComplete();
    res.json({ isSetupComplete: setupComplete });
  } catch (error) {
    res.json({ isSetupComplete: false });
  }
});

/**
 * Test database connection
 */
router.post('/test-db', async (req: Request, res: Response) => {
  // Block if setup already complete
  if (isSetupComplete()) {
    return res.status(403).json({ success: false, message: 'Setup đã hoàn tất, không thể truy cập' });
  }

  const { host, port, database, user, password } = req.body;

  try {
    const connection = await mysql.createConnection({
      host,
      port: parseInt(port) || 3306,
      user,
      password,
    });

    // Try to create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    
    // Try to connect to the database
    await connection.query(`USE \`${database}\``);
    
    await connection.end();

    res.json({ success: true, message: 'Kết nối thành công!' });
  } catch (error: any) {
    console.error('Database connection test failed:', error);
    
    let message = 'Không thể kết nối database';
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      message = 'Sai username hoặc password';
    } else if (error.code === 'ECONNREFUSED') {
      message = 'Không thể kết nối đến MySQL server. Kiểm tra host và port.';
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      message = 'Database không tồn tại và không thể tạo';
    }
    
    res.json({ success: false, message });
  }
});

/**
 * Run full setup installation
 */
router.post('/install', async (req: Request, res: Response) => {
  // Block if setup already complete
  if (isSetupComplete()) {
    return res.status(403).json({ success: false, message: 'Setup đã hoàn tất, không thể truy cập' });
  }

  const {
    dbHost,
    dbPort,
    dbName,
    dbUser,
    dbPassword,
    adminUsername,
    adminEmail,
    adminPassword,
    siteName,
    siteUrl,
    supportEmail,
    senderEmail,
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPassword,
  } = req.body;

  let connection: mysql.Connection | null = null;

  try {
    // Step 1: Connect to MySQL
    connection = await mysql.createConnection({
      host: dbHost,
      port: parseInt(dbPort) || 3306,
      user: dbUser,
      password: dbPassword,
      multipleStatements: true,
    });

    // Step 2: Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE \`${dbName}\``);

    // Step 3: Run migrations
    const migrationsDir = path.join(__dirname, '../../../database/migrations');
    if (fs.existsSync(migrationsDir)) {
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

      for (const file of migrationFiles) {
        const migrationPath = path.join(migrationsDir, file);
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Split by delimiter if exists, else execute as is
        const statements = migrationSQL
          .split(/;\s*$/m)
          .filter(s => s.trim());
        
        for (const statement of statements) {
          if (statement.trim()) {
            try {
              await connection.query(statement);
            } catch (err: any) {
              // Ignore "already exists" errors
              if (!err.message.includes('already exists') && 
                  !err.message.includes('Duplicate')) {
                console.log(`Migration warning in ${file}:`, err.message);
              }
            }
          }
        }
        console.log(`✅ Migration: ${file}`);
      }
    }

    // Step 4: Run seed.sql
    const seedPath = path.join(__dirname, '../../../database/seed.sql');
    if (fs.existsSync(seedPath)) {
      let seedSQL = fs.readFileSync(seedPath, 'utf8');
      
      // Remove the default admin user section from seed
      seedSQL = seedSQL.replace(
        /-- 7\. DEFAULT ADMIN USER[\s\S]*?INSERT IGNORE INTO `admin_users`[\s\S]*?;/g,
        '-- Admin user created by setup wizard'
      );
      
      const seedStatements = seedSQL
        .split(/;\s*$/m)
        .filter(s => s.trim() && !s.trim().startsWith('--'));
      
      for (const statement of seedStatements) {
        if (statement.trim()) {
          try {
            await connection.query(statement);
          } catch (err: any) {
            // Ignore duplicate key errors
            if (!err.message.includes('Duplicate')) {
              console.log('Seed warning:', err.message);
            }
          }
        }
      }
      console.log('✅ Seed data imported');
    }

    // Step 5: Create admin user
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await connection.query(`
      INSERT INTO admin_users (id, username, email, password_hash, role, is_active, created_at)
      VALUES (UUID(), ?, ?, ?, 'super_admin', TRUE, NOW())
      ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)
    `, [adminUsername, adminEmail, passwordHash]);
    console.log('✅ Admin user created');

    // Step 6: Update site settings
    const siteSettings = [
      { key: 'site_name', value: JSON.stringify(siteName) },
      { key: 'site_url', value: JSON.stringify(siteUrl) },
      { key: 'support_email', value: JSON.stringify(supportEmail || adminEmail) },
      { key: 'sender_email', value: JSON.stringify(senderEmail || adminEmail) },
    ];

    if (smtpHost) {
      siteSettings.push(
        { key: 'smtp_host', value: JSON.stringify(smtpHost) },
        { key: 'smtp_port', value: JSON.stringify(smtpPort || '587') },
        { key: 'smtp_user', value: JSON.stringify(smtpUser) },
        { key: 'smtp_password', value: JSON.stringify(smtpPassword) },
      );
    }

    for (const setting of siteSettings) {
      await connection.query(`
        INSERT INTO site_settings (id, \`key\`, value)
        VALUES (UUID(), ?, ?)
        ON DUPLICATE KEY UPDATE value = VALUES(value)
      `, [setting.key, setting.value]);
    }
    console.log('✅ Site settings updated');

    // Step 7: Create .env file for server
    const envContent = `
# Database Configuration (Auto-generated by Setup Wizard)
DATABASE_URL="mysql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}"
DB_HOST=${dbHost}
DB_PORT=${dbPort}
DB_NAME=${dbName}
DB_USER=${dbUser}
DB_PASSWORD=${dbPassword}

# Server
PORT=3001
NODE_ENV=production

# JWT Secret (Change this in production!)
JWT_SECRET=${generateRandomString(64)}
JWT_ADMIN_SECRET=${generateRandomString(64)}

# SMTP Configuration
SMTP_HOST=${smtpHost || ''}
SMTP_PORT=${smtpPort || '587'}
SMTP_USER=${smtpUser || ''}
SMTP_PASSWORD=${smtpPassword || ''}
SMTP_FROM=${senderEmail || adminEmail}
`.trim();

    const serverEnvPath = path.join(__dirname, '../../.env');
    fs.writeFileSync(serverEnvPath, envContent);
    console.log('✅ Environment file created');

    // Step 8: Mark setup as complete
    markSetupComplete();
    console.log('✅ Setup marked as complete');

    await connection.end();

    res.json({ 
      success: true, 
      message: 'Setup hoàn tất thành công!' 
    });

  } catch (error: any) {
    console.error('Setup failed:', error);
    
    if (connection) {
      await connection.end();
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Setup thất bại' 
    });
  }
});

// Helper function to generate random string
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default router;
