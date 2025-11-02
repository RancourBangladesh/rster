# Subdomain-Based Multi-Tenant Setup Guide

## 🌐 Overview

This system now supports subdomain-based multi-tenant routing, allowing each tenant to have their own dedicated subdomain. For example:

- `rancour.rosterbhai.me` - Rancour's tenant
- `acme.rosterbhai.me` - ACME Corp's tenant
- `techco.rosterbhai.me` - TechCo's tenant

Each tenant's subdomain provides access to:
- `https://[tenant].rosterbhai.me/` → Redirects to `/employee`
- `https://[tenant].rosterbhai.me/employee` → Employee dashboard
- `https://[tenant].rosterbhai.me/admin` → Admin login/dashboard

---

## 🚀 Quick Setup

### Prerequisites

1. **Domain Name**: You need a domain registered with a DNS provider (e.g., Cloudflare, Route53, etc.)
2. **DNS Access**: Ability to create wildcard DNS records
3. **Deployment**: The application must be deployed and accessible

---

## 📋 Configuration Steps

### 1. DNS Configuration (Cloudflare Example)

Add a wildcard DNS record pointing to your deployment:

**For Cloudflare:**
1. Log in to your Cloudflare dashboard
2. Select your domain (e.g., `rosterbhai.me`)
3. Go to **DNS** → **Records**
4. Add a new record:
   - **Type**: `A` or `CNAME`
   - **Name**: `*` (wildcard)
   - **Content**: Your server IP or deployment URL
   - **Proxy status**: Proxied (orange cloud) or DNS only (gray cloud)
   - **TTL**: Auto

Example records:
```
Type    Name    Content                    Proxy
A       *       123.45.67.89              Proxied
```

Or if using a CNAME:
```
Type    Name    Content                         Proxy
CNAME   *       your-app.vercel.app            Proxied
```

**For AWS Route53:**
1. Open Route53 console
2. Select your hosted zone
3. Create record:
   - **Record name**: `*`
   - **Record type**: `A` or `CNAME`
   - **Value**: Your server IP or deployment URL

**For Other DNS Providers:**
- Most providers support wildcard records (`*`)
- Create an A record or CNAME pointing `*.rosterbhai.me` to your deployment

---

### 2. Deployment Configuration

#### For Vercel

1. Add your domain in Vercel dashboard:
   - Go to Project Settings → Domains
   - Add `rosterbhai.me` and `*.rosterbhai.me`

2. Vercel will automatically handle SSL certificates for subdomains

#### For Custom Server (Node.js)

1. Ensure your server is running on port 80 (HTTP) or 443 (HTTPS)
2. Configure reverse proxy (nginx example):

```nginx
server {
    listen 80;
    server_name *.rosterbhai.me rosterbhai.me;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. For HTTPS, use Let's Encrypt with wildcard certificate:
```bash
certbot certonly --manual --preferred-challenges=dns --server https://acme-v02.api.letsencrypt.org/directory --agree-tos -d "*.rosterbhai.me" -d "rosterbhai.me"
```

#### For Docker

Ensure your container exposes the correct port and pass the Host header correctly.

---

### 3. Create Tenants

1. **Access Developer Portal** (localhost or main domain):
   - URL: `http://localhost:3000/developer/login` or `http://rosterbhai.me/developer/login`
   - Login with developer credentials

2. **Create a Tenant**:
   - Go to Developer Dashboard
   - Click "Create New Tenant"
   - Enter:
     - **Name**: Rancour Bangladesh
     - **Slug**: `rancour` (must be URL-friendly, lowercase, no spaces)
     - **Max Users**: 10 (optional)
     - **Max Employees**: 100 (optional)
   - Click "Create Tenant"

3. **Create Admin User for Tenant**:
   - After creating tenant, create an admin user
   - This admin can only access their tenant's data

---

### 4. Test Subdomain Access

#### Local Testing (Development)

For local development, you can't use real subdomains, but you can simulate it:

**Option 1: Edit hosts file**
```bash
# Linux/Mac: /etc/hosts
# Windows: C:\Windows\System32\drivers\etc\hosts

127.0.0.1 rancour.localhost
127.0.0.1 acme.localhost
```

Then access: `http://rancour.localhost:3000`

**Option 2: Use localhost without subdomain**
- Access: `http://localhost:3000/employee`
- The system will work, but tenant branding won't show
- Employees must use format: `tenant@employeeID` (e.g., `rancour@121`)

#### Production Testing

Once deployed with DNS configured:

1. **Test Tenant Subdomain**:
   - Visit: `https://rancour.rosterbhai.me`
   - Should redirect to: `https://rancour.rosterbhai.me/employee`

2. **Test Employee Login**:
   - Go to: `https://rancour.rosterbhai.me/employee`
   - Login with employee ID and password
   - Should see Rancour's branding

3. **Test Admin Access**:
   - Go to: `https://rancour.rosterbhai.me/admin`
   - Login with admin credentials for Rancour tenant
   - Should access admin dashboard

---

## 🔧 Tenant Slug Rules

When creating tenants, the slug must follow these rules:

- ✅ Lowercase letters: `rancour`, `acme`
- ✅ Numbers: `company1`, `tenant2`
- ✅ Hyphens: `my-company`, `tech-corp`
- ❌ Uppercase: `Rancour` (will be rejected)
- ❌ Spaces: `my company` (will be rejected)
- ❌ Special chars: `company!`, `tenant@123` (will be rejected)
- ❌ Reserved words: `www`, `api`, `admin`, `developer` (will be rejected)

Valid examples:
- `rancour`
- `rancour-bd`
- `company-123`
- `techcorp`

---

## 🎨 Tenant Branding

Each tenant can customize their branding:

1. **Organization Name**: Displayed on login pages
2. **Logo**: Custom logo for the organization (future feature)

To set organization name:
1. Login as admin for the tenant
2. Go to Settings
3. Update "Organization Name"
4. Employees will see this name on login pages

---

## 🔐 Security Considerations

1. **SSL/TLS Required**: Always use HTTPS in production
2. **Tenant Isolation**: Each tenant's data is completely isolated
3. **Session Management**: Admin sessions are tenant-scoped
4. **Wildcard Certificates**: Use wildcard SSL for `*.rosterbhai.me`

---

## 🧪 Testing Checklist

- [ ] Wildcard DNS record created
- [ ] DNS propagation completed (use `nslookup rancour.rosterbhai.me`)
- [ ] Deployment configured to accept wildcard subdomains
- [ ] SSL certificate covers wildcard domain
- [ ] Tenant created in developer portal
- [ ] Admin user created for tenant
- [ ] Subdomain redirects to `/employee`
- [ ] Employee can login via subdomain
- [ ] Admin can login via subdomain
- [ ] Tenant branding shows correctly

---

## 🆘 Troubleshooting

### Issue: Subdomain doesn't resolve

**Solution:**
- Check DNS propagation: `nslookup rancour.rosterbhai.me`
- Wait for DNS propagation (can take 1-48 hours)
- Verify wildcard record is correct

### Issue: 404 on subdomain

**Solution:**
- Verify deployment accepts all subdomains
- Check reverse proxy configuration
- Ensure middleware is handling subdomain extraction

### Issue: Tenant branding doesn't show

**Solution:**
- Verify tenant slug matches subdomain
- Check tenant is active in database
- Verify API route `/api/tenant/info-by-slug` is working

### Issue: SSL certificate error

**Solution:**
- Ensure wildcard certificate covers `*.rosterbhai.me`
- For Let's Encrypt, use DNS challenge for wildcard
- For Vercel/Netlify, add both `domain.com` and `*.domain.com`

### Issue: Admin can't login via subdomain

**Solution:**
- Verify admin user belongs to correct tenant
- Check that subdomain matches tenant slug
- Clear browser cookies and try again

---

## 📱 Mobile/App Access

For mobile apps or third-party integrations:

1. **Use full subdomain URL**: `https://rancour.rosterbhai.me/api/...`
2. **API remains the same**: All existing API endpoints work
3. **Employee format**: When not using subdomain, use `tenant@employeeID`

---

## 🚀 Advanced: Custom Domains per Tenant

Future enhancement: Allow each tenant to use their own domain:
- `roster.rancour.com` instead of `rancour.rosterbhai.me`

This would require:
1. Tenant provides their domain
2. Create CNAME record pointing to your app
3. Add domain to deployment (e.g., Vercel)
4. Map domain to tenant in database

---

## 📄 Example Nginx Configuration (Full)

For production deployment with SSL:

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name rosterbhai.me *.rosterbhai.me;
    return 301 https://$host$request_uri;
}

# HTTPS configuration
server {
    listen 443 ssl http2;
    server_name rosterbhai.me *.rosterbhai.me;
    
    ssl_certificate /etc/letsencrypt/live/rosterbhai.me/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rosterbhai.me/privkey.pem;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📝 Summary

1. **DNS**: Create wildcard record `*.rosterbhai.me`
2. **Deploy**: Configure deployment to accept subdomains
3. **Tenants**: Create via developer portal with slug
4. **Access**: `https://[slug].rosterbhai.me/employee` and `/admin`
5. **Branding**: Automatic tenant-specific branding on login pages

Your multi-tenant system is now ready with subdomain routing! 🎉
