# Testing Guide: Subdomain Multi-Tenant Routing

## ✅ What to Test

This guide helps you verify that the subdomain-based multi-tenant routing is working correctly.

---

## 🧪 Local Testing (Development)

### Setup

Since real subdomains don't work on localhost, you have two options:

#### Option 1: Use /etc/hosts (Recommended for testing subdomain logic)

**Mac/Linux:**
```bash
sudo nano /etc/hosts
```

**Windows:**
- Open Notepad as Administrator
- File → Open → `C:\Windows\System32\drivers\etc\hosts`

**Add these lines:**
```
127.0.0.1 rancour.localhost
127.0.0.1 acme.localhost
```

**Then access:**
- `http://rancour.localhost:3000`
- `http://acme.localhost:3000`

#### Option 2: Use localhost without subdomain

Just use `http://localhost:3000/employee` and `http://localhost:3000/admin`

**Note:** Tenant branding won't show without subdomain in the URL.

---

## 🔍 Test Cases

### 1. Root Redirect Test

**Test:** Visit root URL with subdomain
```bash
curl -I http://rancour.localhost:3000/
```

**Expected:** HTTP 307, Location: /employee
```
HTTP/1.1 307 Temporary Redirect
Location: /employee
```

---

### 2. Employee Page Access

**Test:** Visit employee page
```bash
curl -s -o /dev/null -w "%{http_code}" http://rancour.localhost:3000/employee
```

**Expected:** 200 OK

**Browser Test:**
1. Visit `http://rancour.localhost:3000/employee`
2. Should see login page with "Rancour Bangladesh Ltd." branding
3. Should NOT see "RosterBhai" (unless tenant not found)

---

### 3. Admin Page Access

**Test:** Visit admin login
```bash
curl -s -o /dev/null -w "%{http_code}" http://rancour.localhost:3000/admin
```

**Expected:** 200 OK

**Browser Test:**
1. Visit `http://rancour.localhost:3000/admin`
2. Should see login page with "Rancour Bangladesh Ltd. Admin" branding

---

### 4. Tenant Info API Test

**Test:** Fetch tenant info by slug
```bash
curl -X POST http://localhost:3000/api/tenant/info-by-slug \
  -H "Content-Type: application/json" \
  -d '{"slug":"rancour"}' | jq .
```

**Expected:**
```json
{
  "success": true,
  "tenant": {
    "name": "Rancour Bangladesh",
    "slug": "rancour",
    "organization_name": "Rancour Bangladesh Ltd."
  }
}
```

**Test with invalid slug:**
```bash
curl -X POST http://localhost:3000/api/tenant/info-by-slug \
  -H "Content-Type: application/json" \
  -d '{"slug":"nonexistent"}' | jq .
```

**Expected:**
```json
{
  "success": false,
  "tenant": null
}
```

---

### 5. Developer Portal Test

**Test:** Developer portal should work without tenant context
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/developer/login
```

**Expected:** 200 OK

**Browser Test:**
1. Visit `http://localhost:3000/developer/login`
2. Should see developer login page
3. Login with developer credentials
4. Should access developer dashboard

---

### 6. Admin Login with Tenant Validation

**Setup:** Create a test tenant and admin user first via developer portal

**Test:** Login as admin via subdomain
1. Visit `http://rancour.localhost:3000/admin`
2. Enter admin credentials for Rancour tenant
3. Should successfully login and redirect to `/admin/dashboard`

**Test Cross-Tenant Access (Security):**
1. Visit `http://acme.localhost:3000/admin`
2. Try to login with Rancour tenant admin credentials
3. Should FAIL with error: "Invalid credentials for this tenant"

---

### 7. Middleware Tenant Extraction Test

**Test:** Verify middleware sets correct header
```bash
# This requires the server to log the tenant slug header
# Or you can check in browser DevTools → Network → Headers
curl -v -H "Host: rancour.localhost:3000" http://localhost:3000/ 2>&1 | grep -i tenant
```

---

### 8. Employee Login Test

**Test:** Employee login with tenant context
1. Visit `http://rancour.localhost:3000/employee`
2. Enter employee ID (e.g., "121" instead of "rancour@121")
3. Enter password
4. Should successfully login and see employee dashboard

**Note:** When accessed via subdomain, employees don't need to specify tenant in ID.

---

## 🌐 Production Testing

Once deployed with DNS configured:

### 1. DNS Resolution Test

```bash
nslookup rancour.yourdomain.com
```

**Expected:** Should resolve to your server IP

```bash
nslookup acme.yourdomain.com
```

**Expected:** Should resolve to same server IP (wildcard DNS)

---

### 2. SSL Certificate Test

**Test:** Verify SSL works for subdomains
```bash
curl -I https://rancour.yourdomain.com
```

**Expected:** No SSL errors, valid certificate

---

### 3. Full Flow Test (Production)

#### Scenario: Rancour Bangladesh Employee Access

1. **Visit:** `https://rancour.yourdomain.com`
2. **Expect:** Redirect to `https://rancour.yourdomain.com/employee`
3. **See:** "Rancour Bangladesh Ltd. Employee Portal"
4. **Login:** Employee ID and password
5. **Access:** Employee dashboard

#### Scenario: Rancour Bangladesh Admin Access

1. **Visit:** `https://rancour.yourdomain.com/admin`
2. **See:** "Rancour Bangladesh Ltd. Admin"
3. **Login:** Admin username and password
4. **Access:** Admin dashboard
5. **Verify:** Can only see Rancour's data

#### Scenario: Cross-Tenant Access Prevention

1. **Create admin for Rancour:** `rancour_admin` / `password123`
2. **Create admin for ACME:** `acme_admin` / `password123`
3. **Visit:** `https://rancour.yourdomain.com/admin`
4. **Try login with:** `acme_admin` / `password123`
5. **Expect:** Error "Invalid credentials for this tenant"

---

## 📊 Automated Test Script

Create `test-subdomains.sh`:

```bash
#!/bin/bash

echo "Testing Subdomain Multi-Tenant Routing..."

BASE_URL="http://localhost:3000"

# Test 1: Root redirect
echo -n "Test 1 - Root redirect: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: rancour.localhost:3000" $BASE_URL/)
if [ "$STATUS" = "307" ]; then
  echo "✓ PASS"
else
  echo "✗ FAIL (Expected 307, got $STATUS)"
fi

# Test 2: Employee page
echo -n "Test 2 - Employee page: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/employee)
if [ "$STATUS" = "200" ]; then
  echo "✓ PASS"
else
  echo "✗ FAIL (Expected 200, got $STATUS)"
fi

# Test 3: Admin page
echo -n "Test 3 - Admin page: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/admin/login)
if [ "$STATUS" = "200" ]; then
  echo "✓ PASS"
else
  echo "✗ FAIL (Expected 200, got $STATUS)"
fi

# Test 4: Developer portal
echo -n "Test 4 - Developer portal: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/developer/login)
if [ "$STATUS" = "200" ]; then
  echo "✓ PASS"
else
  echo "✗ FAIL (Expected 200, got $STATUS)"
fi

# Test 5: Tenant API
echo -n "Test 5 - Tenant API: "
RESPONSE=$(curl -s -X POST $BASE_URL/api/tenant/info-by-slug \
  -H "Content-Type: application/json" \
  -d '{"slug":"test"}')
if echo $RESPONSE | grep -q '"success":false'; then
  echo "✓ PASS"
else
  echo "✗ FAIL"
fi

echo ""
echo "All tests completed!"
```

**Run:**
```bash
chmod +x test-subdomains.sh
./test-subdomains.sh
```

---

## 🐛 Troubleshooting Tests

### Issue: 404 on /employee

**Solution:**
1. Check if `app/employee/page.tsx` exists
2. Rebuild: `npm run build`
3. Restart dev server

### Issue: Tenant branding doesn't show

**Checklist:**
- [ ] Using subdomain in URL (not just localhost)
- [ ] Tenant exists in `data/tenants.json`
- [ ] Tenant is active: `"is_active": true`
- [ ] Organization name is set in tenant settings
- [ ] Browser console shows no errors

### Issue: Subdomain doesn't work locally

**Solution:**
1. Verify /etc/hosts entry
2. Use `.localhost` TLD (e.g., `rancour.localhost`)
3. Clear DNS cache:
   - Mac: `sudo dscacheutil -flushcache`
   - Windows: `ipconfig /flushdns`
   - Linux: `sudo systemd-resolve --flush-caches`

### Issue: Cross-tenant access works (security issue)

**Check:**
1. Middleware is setting `x-tenant-slug` header
2. Admin login API is validating tenant
3. Session includes correct `tenantId`
4. Browser console for errors

---

## ✅ Complete Test Checklist

### Development (localhost)
- [ ] Root redirects to /employee
- [ ] /employee page loads
- [ ] /admin/login page loads
- [ ] /developer/login page loads
- [ ] Tenant API returns correct info
- [ ] Build succeeds without errors
- [ ] No console errors in browser

### Production (with DNS)
- [ ] DNS resolves for subdomains
- [ ] SSL certificate covers wildcard
- [ ] Subdomain redirects work
- [ ] Tenant branding shows
- [ ] Employee can login via subdomain
- [ ] Admin can login via subdomain
- [ ] Cross-tenant access is blocked
- [ ] All API endpoints work
- [ ] No security vulnerabilities

---

## 📝 Sample Test Data

Create test tenants via developer portal or manually:

**data/tenants.json:**
```json
{
  "tenants": [
    {
      "id": "tenant-1",
      "name": "Rancour Bangladesh",
      "slug": "rancour",
      "created_at": "2024-01-01T00:00:00.000Z",
      "is_active": true,
      "settings": {
        "organization_name": "Rancour Bangladesh Ltd."
      }
    },
    {
      "id": "tenant-2",
      "name": "ACME Corporation",
      "slug": "acme",
      "created_at": "2024-01-01T00:00:00.000Z",
      "is_active": true,
      "settings": {
        "organization_name": "ACME Corp"
      }
    }
  ]
}
```

---

## 🎉 Success Criteria

Your implementation is working correctly if:

✅ Root URL with subdomain redirects to /employee
✅ Employee page loads without errors
✅ Admin page loads without errors
✅ Tenant branding shows on login pages
✅ Tenant API returns correct information
✅ Cross-tenant access is prevented
✅ Build completes successfully
✅ No security vulnerabilities found

**Ready for production!** 🚀
