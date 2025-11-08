# RosterBhai - Use Case Diagram Documentation
**Version:** 2.0.0  
**Date:** November 08, 2025

## System Actors

### 1. Company (Guest)
- Browse landing page
- View pricing
- Register for service

### 2. Developer (Super Admin)
- Manage tenants
- Approve registrations
- Configure landing page CMS
- Monitor system health
- Export tenant data

### 3. Admin (Tenant Manager)
- Manage employees
- Upload/modify rosters
- Configure shift templates
- Approve schedule requests
- Manage team structures
- View audit logs
- Configure organization settings

### 4. Employee
- View personal schedule
- View team schedules
- Submit shift change requests
- Submit shift swap requests
- View notifications
- Manage profile

---

## Use Cases by Actor

### Company Use Cases

**UC-001: Browse Landing Page**
- **Actor**: Company
- **Precondition**: None
- **Main Flow**: 
  1. Visit rosterbhai.me
  2. View features and benefits
  3. Explore pricing plans
- **Postcondition**: Company gains product knowledge

**UC-002: Register for Service**
- **Actor**: Company
- **Precondition**: Access to landing page
- **Main Flow**:
  1. Navigate to registration form
  2. Enter company details (name, email, phone)
  3. Select subscription plan (monthly/yearly)
  4. Submit registration
  5. Receive pending approval message
- **Postcondition**: Registration pending developer approval

---

### Developer Use Cases

**UC-003: Login to Developer Portal**
- **Actor**: Developer
- **Precondition**: Valid developer credentials
- **Main Flow**:
  1. Navigate to /developer/login
  2. Enter username and password
  3. Submit credentials
  4. Redirected to dashboard
- **Postcondition**: Authenticated developer session

**UC-004: Approve Tenant Registration**
- **Actor**: Developer
- **Precondition**: Authenticated, pending tenant exists
- **Main Flow**:
  1. View list of pending registrations
  2. Select tenant to review
  3. Verify company details
  4. Activate subscription
  5. System generates subdomain
- **Postcondition**: Tenant activated with subdomain access

**UC-005: Manage Tenant**
- **Actor**: Developer
- **Precondition**: Authenticated, tenant exists
- **Main Flow**:
  1. Select tenant from list
  2. View tenant details
  3. Update subscription status
  4. Modify max employees/users limit
  5. Export tenant data if needed
- **Postcondition**: Tenant settings updated

**UC-006: Edit Landing Page Content**
- **Actor**: Developer
- **Precondition**: Authenticated
- **Main Flow**:
  1. Navigate to Landing CMS
  2. Edit hero section text
  3. Modify pricing information
  4. Update feature descriptions
  5. Upload logos/images
  6. Save changes
- **Postcondition**: Landing page content updated

---

### Admin Use Cases

**UC-007: Login to Admin Panel**
- **Actor**: Admin
- **Precondition**: Valid admin credentials, active tenant
- **Main Flow**:
  1. Navigate to subdomain.rosterbhai.me/admin/login
  2. Enter username and password
  3. Submit credentials
  4. Redirected to dashboard
- **Postcondition**: Authenticated admin session

**UC-008: Add Employee**
- **Actor**: Admin
- **Precondition**: Authenticated
- **Main Flow**:
  1. Navigate to Employee Management tab
  2. Click "Add Employee"
  3. Enter employee details (ID, name, team)
  4. Set initial password
  5. Upload photo (optional)
  6. Save employee
- **Postcondition**: New employee created

**UC-009: Import Roster from CSV**
- **Actor**: Admin
- **Precondition**: Authenticated, valid CSV file
- **Main Flow**:
  1. Navigate to CSV Import tab
  2. Upload CSV file
  3. System parses and validates data
  4. Preview imported data
  5. Confirm import
  6. System creates missing employees
  7. Updates roster_data.json
- **Postcondition**: Roster data imported and saved

**UC-010: Sync with Google Sheets**
- **Actor**: Admin
- **Precondition**: Authenticated, Google Sheets URL configured
- **Main Flow**:
  1. Navigate to Roster Sync tab
  2. Enter Google Sheets public link
  3. Select month/year
  4. Enable auto-sync (optional)
  5. Click "Sync Now"
  6. System fetches and imports data
- **Postcondition**: Roster synced from Google Sheets

**UC-011: Modify Employee Shift**
- **Actor**: Admin
- **Precondition**: Authenticated, roster data exists
- **Main Flow**:
  1. Navigate to Roster Data tab
  2. Select team and date
  3. Click on employee shift cell
  4. Select new shift from dropdown
  5. Save modification
  6. System logs change in audit trail
- **Postcondition**: Shift updated, modification logged

**UC-012: Create Shift Template**
- **Actor**: Admin
- **Precondition**: Authenticated
- **Main Flow**:
  1. Navigate to Settings/Templates
  2. Click "Create Template"
  3. Name template
  4. Define shift definitions
  5. Set default schedule pattern
  6. Save template
- **Postcondition**: Reusable template created

**UC-013: Approve Schedule Request**
- **Actor**: Admin
- **Precondition**: Authenticated, pending request exists
- **Main Flow**:
  1. Navigate to Schedule Requests tab
  2. View list of pending requests
  3. Select request to review
  4. View request details and reason
  5. Approve or reject with optional message
  6. System updates schedule if approved
  7. Employee receives notification
- **Postcondition**: Request processed, employee notified

**UC-014: Configure Organization Profile**
- **Actor**: Admin
- **Precondition**: Authenticated
- **Main Flow**:
  1. Navigate to Settings tab
  2. Update organization name
  3. Upload company logo
  4. Configure notification preferences
  5. Save changes
- **Postcondition**: Organization settings updated

**UC-015: Manage Admin Users (RBAC)**
- **Actor**: Admin (with RBAC permission)
- **Precondition**: Authenticated, has RBAC access
- **Main Flow**:
  1. Navigate to Settings/Admin Users
  2. Add new admin user
  3. Assign role (Super Admin, Admin, Viewer)
  4. Set permissions per role
  5. Save changes
- **Postcondition**: New admin user created with specific permissions

---

### Employee Use Cases

**UC-016: Login to Employee Portal**
- **Actor**: Employee
- **Precondition**: Valid employee credentials, active account
- **Main Flow**:
  1. Navigate to subdomain.rosterbhai.me/employee
  2. Enter employee ID and password
  3. Submit credentials
  4. Redirected to dashboard
- **Postcondition**: Authenticated employee session

**UC-017: View Personal Schedule**
- **Actor**: Employee
- **Precondition**: Authenticated
- **Main Flow**:
  1. View "My Schedule" tab (default)
  2. Calendar displays shifts with color coding
  3. Click on date for shift details
  4. View shift time and location
- **Postcondition**: Employee aware of schedule

**UC-018: View Team Schedule**
- **Actor**: Employee
- **Precondition**: Authenticated
- **Main Flow**:
  1. Navigate to "Team Schedule" tab
  2. View colleagues' shifts in calendar view
  3. Filter by team (if multiple teams)
  4. Check who's working on specific date
- **Postcondition**: Employee aware of team availability

**UC-019: Submit Shift Change Request**
- **Actor**: Employee
- **Precondition**: Authenticated, has scheduled shift
- **Main Flow**:
  1. Navigate to "Requests" tab
  2. Click "Request Shift Change"
  3. Select date
  4. View current shift
  5. Select desired shift
  6. Enter reason
  7. Submit request
- **Postcondition**: Request created, awaiting admin approval

**UC-020: Submit Shift Swap Request**
- **Actor**: Employee
- **Precondition**: Authenticated, has scheduled shift
- **Main Flow**:
  1. Navigate to "Requests" tab
  2. Click "Request Shift Swap"
  3. Select date
  4. View current shift
  5. Select colleague to swap with
  6. View colleague's shift
  7. Enter reason
  8. Submit swap request
- **Postcondition**: Swap request created, awaiting admin approval

**UC-021: View Notifications**
- **Actor**: Employee
- **Precondition**: Authenticated
- **Main Flow**:
  1. Navigate to "Notifications" tab
  2. View list of notifications (unread highlighted)
  3. Click on notification to view details
  4. Mark as read
- **Postcondition**: Employee informed of updates

**UC-022: Update Profile**
- **Actor**: Employee
- **Precondition**: Authenticated
- **Main Flow**:
  1. Click on profile icon
  2. Navigate to profile settings
  3. Update personal information
  4. Change password
  5. Update email address
  6. Save changes
- **Postcondition**: Profile information updated

**UC-023: Set Password (First Login)**
- **Actor**: Employee
- **Precondition**: Received password reset link from admin
- **Main Flow**:
  1. Click on password reset link
  2. Enter employee ID
  3. Enter new password
  4. Confirm password
  5. Submit
  6. Redirected to login
- **Postcondition**: Password set, can log in

---

## Use Case Relationships

### Extends
- UC-019 (Shift Change) extends UC-017 (View Schedule)
- UC-020 (Shift Swap) extends UC-018 (View Team Schedule)
- UC-013 (Approve Request) extends UC-019 and UC-020

### Includes
- UC-009 (Import CSV) includes UC-008 (Add Employee) for auto-creation
- UC-010 (Google Sync) includes UC-009 (Import CSV)
- UC-013 (Approve Request) includes UC-011 (Modify Shift) if approved

---

## System Boundary

**In Scope**:
- Roster management
- Employee self-service
- Multi-tenant SaaS operations
- Request approval workflow
- CSV/Google Sheets import

**Out of Scope**:
- Payroll integration
- Time tracking/clock-in
- HR management
- Mobile app (in development)
- Email delivery (configured externally)

---

**Document Prepared By**: RosterBhai Documentation Team  
**Last Updated**: November 08, 2025  
**Version**: 2.0.0
