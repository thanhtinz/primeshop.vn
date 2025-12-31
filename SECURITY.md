# Security Hardening Guide

## 🔒 Biện Pháp Bảo Mật Đã Áp Dụng

### 1. **Frontend Security** 🛡️

#### Code Obfuscation (Khó đọc source code)
- ✅ **Vite Obfuscator Plugin** - Chạy khi build production
  - Control flow flattening (làm rối logic code)
  - Dead code injection (thêm code giả)
  - String array encoding (mã hóa strings)
  - Identifier names hexadecimal (đổi tên biến)
  - Self-defending code (chống debug)
  - Split strings (chia nhỏ strings)
  
```bash
# Build với obfuscation
npm run build

# Code sẽ trở thành khó đọc kiểu:
# var _0x1234 = ['base64string', 'anotherstring'];
# function _0xabcd() { ... }
```

#### Build Security
- ✅ **No source maps** trong production
- ✅ **Minified code** với ESBuild
- ✅ **Code splitting** (khó trace logic)
- ✅ **Environment variables** không expose

#### Runtime Protection
- ✅ **Disable console** trong production
- ✅ **Debug protection** (chống DevTools)
- ✅ **String encryption** (mã hóa strings)

---

### 2. **Backend Security** 🔐

#### Input Validation & Sanitization
```typescript
// Đã áp dụng:
app.use(mongoSanitize());  // Chống NoSQL injection
app.use(xss());            // Chống XSS attacks
app.use(hpp());            // Chống HTTP parameter pollution
```

#### Security Headers (Helmet.js)
```typescript
helmet({
  contentSecurityPolicy: {
    // Chỉ cho phép load resources từ domain mình
    defaultSrc: ["'self'"],
    // Block inline scripts (chống XSS)
    scriptSrc: ["'self'"],
    // Block frames (chống clickjacking)
    frameSrc: ["'none'"],
  },
  hsts: {
    // Force HTTPS trong 1 năm
    maxAge: 31536000,
    includeSubDomains: true,
  },
})
```

#### Authentication Security
- ✅ **JWT tokens** với secret key
- ✅ **Password hashing** với bcrypt
- ✅ **Token expiration** (auto logout)
- ✅ **Refresh tokens** rotation
- ✅ **Rate limiting** trên login endpoints

#### Rate Limiting (Chống brute force)
```typescript
// Đã có sẵn:
authLimiter: 5 requests/15 phút
paymentLimiter: 10 requests/phút  
uploadLimiter: 10 requests/phút
apiLimiter: 100 requests/15 phút
```

#### Data Protection
- ✅ **Compression** (gzip/brotli)
- ✅ **Body size limits** (10MB max)
- ✅ **SQL injection protection** (Prisma ORM)
- ✅ **CORS configured** (chỉ cho phép frontend domain)

---

### 3. **Database Security** 💾

#### Prisma ORM Protection
```typescript
// Prisma tự động:
- Prepared statements (chống SQL injection)
- Parameterized queries
- Type-safe queries
- No raw SQL by default
```

#### Access Control
- ✅ **Database user** với least privilege
- ✅ **Connection pooling**
- ✅ **Query timeouts**
- ✅ **Encrypted connections** (SSL/TLS)

#### Data Encryption
```typescript
// Sensitive data:
- Passwords: bcrypt hash
- JWT tokens: signed & verified
- API keys: environment variables
- Session data: encrypted cookies
```

---

### 4. **Environment Variables** 🔑

#### Critical Secrets Protection
```bash
# KHÔNG BAO GIỜ commit .env file!
.env          # ← gitignored
.env.local    # ← gitignored
.env.production  # ← gitignored

# CHỈ commit template
.env.example  # ← example only, no real values
```

#### Secret Management Best Practices
```env
# ❌ WRONG - Weak secrets
JWT_SECRET=123456
DATABASE_PASSWORD=admin

# ✅ CORRECT - Strong secrets
JWT_SECRET=7f9a3b8e2d6c1a5f4e8b9c7d2a3f6e1b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3
DATABASE_PASSWORD=Xy9#mK2$pL8@wR5!nQ7&vT4
```

#### Production Security
```bash
# Production server:
- Dùng secret manager (AWS Secrets, Azure Key Vault)
- Rotate secrets định kỳ
- Không log sensitive data
- Use separate DB credentials per environment
```

---

### 5. **API Security** 🌐

#### Endpoint Protection
```typescript
// Public routes (no auth)
/api/health
/api/products (GET only)
/api/categories (GET only)

// Protected routes (require auth)
/api/users/*
/api/orders/*
/api/payments/*

// Admin routes (require admin auth)
/api/admin/*
```

#### Request Validation
```typescript
// Zod schema validation
app.post('/api/*', validateSchema(schema), handler);

// Input sanitization
- Strip HTML tags
- Escape special characters
- Validate data types
- Check required fields
```

#### Response Security
```typescript
// Không expose sensitive info
❌ res.json({ password: user.password })
✅ res.json({ id: user.id, email: user.email })

// Consistent error messages
❌ "Invalid password"
✅ "Invalid credentials"
```

---

### 6. **File Upload Security** 📁

#### Upload Restrictions
```typescript
// Đã có:
- Max file size: 10MB
- Allowed types: images, documents
- Virus scanning (optional)
- Rate limiting on upload endpoint
```

#### Storage Security
```typescript
// Local storage:
- Random file names (UUID)
- Store outside web root
- Serve via /uploads route (controlled)

// Cloud storage (AWS S3):
- Signed URLs (temporary access)
- Bucket policies (restrict access)
- CDN with access control
```

---

### 7. **Network Security** 🌍

#### CORS Configuration
```typescript
cors({
  origin: process.env.FRONTEND_URL,  // Chỉ domain này
  credentials: true,  // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})
```

#### HTTPS Enforcement
```nginx
# Nginx config
server {
  listen 443 ssl http2;
  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;
  
  # Force HTTPS
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}

# Redirect HTTP to HTTPS
server {
  listen 80;
  return 301 https://$server_name$request_uri;
}
```

---

### 8. **Monitoring & Logging** 📊

#### Security Monitoring
```typescript
// Log suspicious activities:
- Failed login attempts
- Invalid tokens
- Rate limit violations
- Unusual API patterns
- File upload attempts

// Alert on:
- Brute force attacks
- SQL injection attempts
- XSS attempts
- DDoS patterns
```

#### Production Logging
```typescript
// Log levels:
- ERROR: Critical issues
- WARN: Suspicious activities  
- INFO: Normal operations
- DEBUG: Development only (disable in prod)

// Never log:
❌ Passwords
❌ API keys
❌ Credit card numbers
❌ Personal data (GDPR)
```

---

## 🚨 Attack Prevention

### Common Attacks & Protection

| Attack Type | Protection Applied |
|-------------|-------------------|
| **SQL Injection** | ✅ Prisma ORM (prepared statements) |
| **XSS** | ✅ XSS-clean middleware, CSP headers |
| **CSRF** | ✅ SameSite cookies, CORS policy |
| **Brute Force** | ✅ Rate limiting on auth endpoints |
| **DDoS** | ✅ Rate limiting, reverse proxy |
| **Code Injection** | ✅ Input validation, sanitization |
| **Path Traversal** | ✅ Path validation, static file config |
| **Session Hijacking** | ✅ HTTPS, secure cookies, JWT |
| **Man-in-Middle** | ✅ HTTPS/TLS encryption |
| **Clickjacking** | ✅ X-Frame-Options: DENY |

---

## 📋 Security Checklist

### Pre-Deployment:
- [ ] **Secrets audit**: Không có hardcoded secrets
- [ ] **Dependencies audit**: `npm audit fix`
- [ ] **HTTPS enabled**: Force SSL/TLS
- [ ] **Rate limits tested**: Verify blocking works
- [ ] **Auth flows tested**: Login, logout, token refresh
- [ ] **Input validation**: Test với malicious inputs
- [ ] **Error messages**: Không expose stack traces
- [ ] **Logging configured**: Log security events
- [ ] **Backup strategy**: Database backups
- [ ] **Incident response**: Plan for breaches

### Production Environment:
```bash
# Environment checks
✅ NODE_ENV=production
✅ DEBUG=false
✅ Strong JWT_SECRET (>32 chars)
✅ Database credentials rotated
✅ Firewall configured
✅ Monitoring enabled
✅ Backups automated
✅ SSL certificate valid
```

---

## 🛠️ Security Testing

### Manual Testing
```bash
# 1. SQL Injection test
curl -X POST /api/auth/login \
  -d '{"email": "admin'\'' OR 1=1--", "password": "anything"}'
# Should: Block & log attempt

# 2. XSS test
curl -X POST /api/posts \
  -d '{"content": "<script>alert(1)</script>"}'
# Should: Sanitize & escape

# 3. Rate limit test
for i in {1..20}; do
  curl /api/auth/login
done
# Should: Block after limit

# 4. File upload test
curl -X POST /api/upload \
  -F "file=@malicious.exe"
# Should: Reject invalid types
```

### Automated Tools
```bash
# OWASP ZAP (security scanner)
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://yoursite.com

# npm audit (dependency vulnerabilities)
npm audit
npm audit fix

# Snyk (security monitoring)
npx snyk test
```

---

## 🔥 Incident Response

### If Hacked:
1. **Isolate** - Shutdown affected systems
2. **Assess** - Determine breach scope
3. **Contain** - Block attacker access
4. **Eradicate** - Remove malware/backdoors
5. **Recover** - Restore from backups
6. **Learn** - Update security measures

### Emergency Contacts:
```bash
# Have ready:
- Backup admin credentials
- Database backup access
- Cloud provider support
- Security team contacts
- Legal/compliance team
```

---

## 💡 Best Practices

### Do's ✅
- Use environment variables for secrets
- Enable HTTPS everywhere
- Keep dependencies updated
- Use strong passwords (32+ chars)
- Enable 2FA on critical accounts
- Regular security audits
- Backup data regularly
- Monitor logs actively
- Use WAF (Web Application Firewall)
- Implement zero-trust architecture

### Don'ts ❌
- Commit secrets to Git
- Use default passwords
- Disable security features
- Trust user input
- Log sensitive data
- Use HTTP in production
- Ignore security warnings
- Skip dependency updates
- Expose admin panels publicly
- Use weak encryption

---

## 📞 Resources

### Security Tools:
- **OWASP ZAP** - Vulnerability scanner
- **Burp Suite** - Web security testing
- **Nmap** - Network scanner
- **Wireshark** - Traffic analysis
- **Snyk** - Dependency scanning

### Learning:
- OWASP Top 10
- CWE Top 25
- NIST Cybersecurity Framework
- ISO 27001

---

**⚠️ QUAN TRỌNG**: Security là quá trình liên tục, không phải một lần. Phải update và monitor thường xuyên!

**Last Updated**: December 31, 2024  
**Security Level**: 🔒 Production Grade
