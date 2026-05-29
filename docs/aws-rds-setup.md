# AWS RDS Setup Guide - FIFA 2026 Betting Platform

## 1. Create RDS PostgreSQL Instance

### Via AWS Console:
1. Go to **RDS → Create database**
2. Choose **PostgreSQL** (version 15+ recommended)
3. Template: **Free tier** (for dev) or **Production** (for prod)
4. Settings:
   - DB instance identifier: `fifa2026-db`
   - Master username: `fifa2026_admin`
   - Master password: (set a strong password)
5. Instance config:
   - Class: `db.t3.micro` (dev) or `db.t3.medium` (prod)
6. Storage: 20 GB gp3
7. Connectivity:
   - VPC: Default or your custom VPC
   - Public access: **Yes** (if connecting from outside AWS, e.g., Vercel/Render)
   - Security group: Create new or use existing (open port 5432)
8. Database name: `fifa2026_db`
9. Click **Create database**

### Via AWS CLI:
```bash
aws rds create-db-instance \
  --db-instance-identifier fifa2026-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username fifa2026_admin \
  --master-user-password YOUR_STRONG_PASSWORD \
  --allocated-storage 20 \
  --storage-type gp3 \
  --db-name fifa2026_db \
  --publicly-accessible \
  --backup-retention-period 7 \
  --multi-az false \
  --no-auto-minor-version-upgrade
```

## 2. Configure Security Group

Allow inbound traffic on port **5432** from:
- Your IP (for local dev): `YOUR_IP/32`
- Render/Vercel servers: `0.0.0.0/0` (or use their IP ranges)
- Your EC2/ECS if deploying on AWS: security group reference

```bash
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 5432 \
  --cidr 0.0.0.0/0
```

## 3. Get Connection String

Once the instance is **Available**, find the endpoint in the RDS console:
```
Endpoint: fifa2026-db.xxxxxxxxxxxx.eu-west-1.rds.amazonaws.com
Port: 5432
```

Your `DATABASE_URL` will be:
```
postgresql://fifa2026_admin:YOUR_PASSWORD@fifa2026-db.xxxxxxxxxxxx.eu-west-1.rds.amazonaws.com:5432/fifa2026_db
```

## 4. Migrate Data from Render

### Option A: pg_dump / pg_restore (recommended)

```bash
# Export from Render
pg_dump "postgresql://fifa2026_db_user:rR8QlA7YhOPS6Qp9e2neCMW9Qzl1HevH@dpg-d80uhjvaqgkc73afiosg-a.oregon-postgres.render.com/fifa2026_db" \
  --no-owner --no-acl --format=custom -f fifa2026_backup.dump

# Import to AWS RDS
pg_restore --host=fifa2026-db.xxxxxxxxxxxx.eu-west-1.rds.amazonaws.com \
  --port=5432 --username=fifa2026_admin --dbname=fifa2026_db \
  --no-owner --no-acl fifa2026_backup.dump
```

### Option B: Plain SQL dump

```bash
# Export
pg_dump "postgresql://fifa2026_db_user:rR8QlA7YhOPS6Qp9e2neCMW9Qzl1HevH@dpg-d80uhjvaqgkc73afiosg-a.oregon-postgres.render.com/fifa2026_db" \
  --no-owner --no-acl > fifa2026_backup.sql

# Import
psql "postgresql://fifa2026_admin:YOUR_PASSWORD@fifa2026-db.xxxxxxxxxxxx.eu-west-1.rds.amazonaws.com:5432/fifa2026_db" \
  < fifa2026_backup.sql
```

## 5. Update Environment Variables

### For Render (if still hosting the API there):
Set `DATABASE_URL` in Render dashboard → Environment tab to the AWS RDS connection string.

### For Vercel (if deploying API there):
```bash
vercel env add DATABASE_URL production
# Paste: postgresql://fifa2026_admin:YOUR_PASSWORD@fifa2026-db.xxx.rds.amazonaws.com:5432/fifa2026_db
```

### For local development:
Update `server/.env`:
```
DATABASE_URL=postgresql://fifa2026_admin:YOUR_PASSWORD@fifa2026-db.xxx.eu-west-1.rds.amazonaws.com:5432/fifa2026_db
```

## 6. Verify Connection

```bash
cd server
node -e "require('dotenv').config(); const {Pool} = require('pg'); const p = new Pool({connectionString: process.env.DATABASE_URL, ssl: {rejectUnauthorized: false}}); p.query('SELECT NOW()').then(r => {console.log('✅ Connected:', r.rows[0].now); p.end()}).catch(e => {console.error('❌ Failed:', e.message); p.end()})"
```

## 7. Cost Estimate

| Resource | Dev (Free Tier) | Production |
|----------|----------------|------------|
| db.t3.micro | ~$0/mo (12 months free) | - |
| db.t3.medium | - | ~$50/mo |
| Storage (20GB gp3) | Included | ~$2.30/mo |
| Backups (7 days) | Free | Free |
| Data transfer | Minimal | ~$5/mo |

## 8. Production Checklist

- [ ] Enable Multi-AZ for high availability (production)
- [ ] Enable automated backups (7+ days retention)
- [ ] Enable encryption at rest (KMS)
- [ ] Restrict security group to known IPs only
- [ ] Set up CloudWatch alarms for CPU/connections/storage
- [ ] Enable Performance Insights
- [ ] Use IAM authentication (optional, advanced)
- [ ] Remove hardcoded credentials from code ✅ (done)
