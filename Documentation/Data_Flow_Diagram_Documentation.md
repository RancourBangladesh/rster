# RosterBhai - Data Flow Diagram (DFD)
**Version:** 2.0.0  
**Date:** November 08, 2025

## Level 0: Context Diagram

### External Entities:
1. **Company** - Organizations signing up for service
2. **Developer** - System administrators managing tenants
3. **Admin** - Tenant managers handling rosters
4. **Employee** - End users viewing schedules and making requests
5. **Google Sheets** - External data source for roster imports

### Main Process:
**RosterBhai System** - Multi-tenant roster management platform

### Data Flows (Context Level):

**From Company to System:**
- Registration Data (company name, contact info, subscription plan)
- Contact Inquiries

**From System to Company:**
- Registration Confirmation
- Subscription Status

**From Developer to System:**
- Login Credentials
- Tenant Management Commands (approve, activate, deactivate)
- Landing Page Content Updates

**From System to Developer:**
- Tenant List
- Subscription Status Reports
- System Analytics

**From Admin to System:**
- Login Credentials
- Employee Data (create, update, delete)
- Roster Data (shifts, schedules)
- CSV Files (uploads)
- Google Sheets Links
- Approval Decisions

**From System to Admin:**
- Dashboard Data
- Employee Lists
- Roster Display
- Schedule Requests
- Audit Logs
- Organization Settings

**From Employee to System:**
- Login Credentials
- Shift Change Requests
- Shift Swap Requests
- Profile Updates

**From System to Employee:**
- Personal Schedule
- Team Schedule
- Notifications
- Request Status

**From Google Sheets to System:**
- Roster Data (CSV format)

**From System to Google Sheets:**
- Fetch Requests (via public URL)

---

## Level 1: Main System DFD

### Processes:

#### 1.0 User Authentication
**Inputs:**
- Login credentials (username/password or employee ID/password)
- Session tokens

**Outputs:**
- Authenticated session
- Access token (cookie)
- Authentication errors

**Data Stores Used:**
- developers.json
- admin_data.json (tenant-specific)
- employee_data.json (tenant-specific)

---

#### 2.0 Tenant Management
**Inputs:**
- Registration data from companies
- Tenant management commands from developers

**Outputs:**
- New tenant records
- Subdomain assignments
- Tenant status updates

**Data Stores Used:**
- tenants.json

**Sub-processes:**
- 2.1 Register Tenant
- 2.2 Approve Tenant
- 2.3 Manage Subscription
- 2.4 Export Tenant Data

---

#### 3.0 Employee Management
**Inputs:**
- Employee data from admin
- Employee profile updates from employees

**Outputs:**
- Employee records
- Employee credentials
- Profile confirmation

**Data Stores Used:**
- roster_data.json (allEmployees array)
- employee_data.json (credentials)
- photos/ (employee images)

**Sub-processes:**
- 3.1 Create Employee
- 3.2 Update Employee
- 3.3 Deactivate Employee
- 3.4 Reactivate Employee

---

#### 4.0 Roster Management
**Inputs:**
- CSV files from admin
- Google Sheets URLs from admin
- Manual shift changes from admin

**Outputs:**
- Parsed roster data
- Schedule displays
- Shift modifications

**Data Stores Used:**
- roster_data.json
- google_data.json
- modified_shifts.json (audit trail)

**Sub-processes:**
- 4.1 Import CSV
- 4.2 Sync Google Sheets
- 4.3 Modify Shifts
- 4.4 Create Templates
- 4.5 Display Roster

---

#### 5.0 Schedule Request Management
**Inputs:**
- Shift change requests from employees
- Shift swap requests from employees
- Approval decisions from admin

**Outputs:**
- Request records
- Request status updates
- Notifications

**Data Stores Used:**
- schedule_requests.json
- roster_data.json (updated if approved)

**Sub-processes:**
- 5.1 Create Request (Change)
- 5.2 Create Request (Swap)
- 5.3 Review Request
- 5.4 Approve Request
- 5.5 Reject Request

---

#### 6.0 Notification Management
**Inputs:**
- Request status changes
- Shift modifications
- Admin announcements

**Outputs:**
- In-app notifications
- Email notifications (planned)
- Notification read status

**Data Stores Used:**
- notifications.json (planned)
- schedule_requests.json (status)

**Sub-processes:**
- 6.1 Generate Notification
- 6.2 Deliver Notification
- 6.3 Mark as Read

---

#### 7.0 Reporting & Analytics
**Inputs:**
- Roster data queries
- Request statistics
- Modification history

**Outputs:**
- Dashboard metrics
- Audit reports
- Activity logs

**Data Stores Used:**
- modified_shifts.json
- schedule_requests.json
- roster_data.json

**Sub-processes:**
- 7.1 Generate Dashboard Stats
- 7.2 Audit Log Viewer
- 7.3 Request Statistics

---

## Level 2: Detailed Process DFDs

### 4.1 Import CSV Process

**Inputs:**
- CSV file (from admin)

**Data Flows:**
1. Admin uploads CSV → Parse CSV
2. Parse CSV → Validate Data
3. Validate Data → Extract Employees
4. Extract Employees → Create Missing Employees (Process 3.1)
5. Extract Employees → Map Shifts
6. Map Shifts → Update Roster Data Store
7. Update Roster Data Store → Generate Import Report
8. Generate Import Report → Display to Admin

**Data Stores:**
- roster_data.json (write)
- employee_data.json (write, if new employees)

**Validation Rules:**
- CSV format verification
- Required columns check (Date, Employee ID, Name, Team, Shifts)
- Employee ID uniqueness
- Shift code validity

---

### 5.1 Create Shift Change Request Process

**Inputs:**
- Employee ID (from session)
- Request date
- Requested shift
- Reason

**Data Flows:**
1. Employee selects date → Fetch Current Shift (from roster_data.json)
2. Employee enters reason → Validate Request
3. Validate Request → Generate Request ID (UUID)
4. Generate Request ID → Create Request Record
5. Create Request Record → Write to schedule_requests.json
6. Write to schedule_requests.json → Trigger Notification (Process 6.1)
7. Trigger Notification → Confirm to Employee

**Data Stores:**
- roster_data.json (read)
- schedule_requests.json (write)

**Validation Rules:**
- Request date is in future
- Employee has shift on selected date
- Requested shift is different from current
- Reason is provided

---

### 5.4 Approve Request Process

**Inputs:**
- Request ID
- Admin decision (approve/reject)
- Admin message (optional)

**Data Flows:**
1. Admin selects request → Fetch Request Details (from schedule_requests.json)
2. Admin decides → Update Request Status
3. Update Request Status → Write to schedule_requests.json
4. If Approved → Update Roster Data (Process 4.3)
5. Update Roster Data → Write to roster_data.json
6. Update Roster Data → Log Modification (modified_shifts.json)
7. Write to schedule_requests.json → Trigger Notification (Process 6.1)
8. Trigger Notification → Notify Employee

**Data Stores:**
- schedule_requests.json (write)
- roster_data.json (write, if approved)
- modified_shifts.json (write, if approved)

**Business Rules:**
- Only pending requests can be approved/rejected
- Approved requests update roster immediately
- Rejected requests preserve original schedule
- Both actions trigger employee notification

---

## Data Stores

### 1. developers.json
**Structure:**
```json
{
  "developers": [
    {
      "username": string,
      "password": string,
      "full_name": string,
      "created_at": string,
      "role": "developer"
    }
  ]
}
```
**Access:** Read/Write by Authentication process

---

### 2. tenants.json
**Structure:**
```json
{
  "tenants": [
    {
      "id": UUID,
      "name": string,
      "slug": string,
      "created_at": string,
      "is_active": boolean,
      "settings": {},
      "subscription": {
        "plan": "monthly" | "yearly",
        "status": "pending" | "active",
        "started_at": string,
        "expires_at": string
      }
    }
  ]
}
```
**Access:** Read by multiple processes, Write by Tenant Management

---

### 3. roster_data.json (per tenant)
**Structure:**
```json
{
  "teams": {
    "[team_name]": [
      {
        "id": string,
        "name": string,
        "currentTeam": string,
        "schedule": [string],
        "status": "active" | "inactive"
      }
    ]
  },
  "headers": [string],
  "allEmployees": [Employee]
}
```
**Access:** Read by display processes, Write by roster management

---

### 4. schedule_requests.json (per tenant)
**Structure:**
```json
{
  "shift_change_requests": [ScheduleRequestChange],
  "swap_requests": [ScheduleRequestSwap],
  "approved_count": number,
  "pending_count": number
}
```
**Access:** Read/Write by Schedule Request Management

---

### 5. modified_shifts.json (per tenant)
**Structure:**
```json
{
  "modifications": [
    {
      "employee_id": string,
      "date_index": number,
      "old_shift": string,
      "new_shift": string,
      "modified_by": string,
      "timestamp": string,
      "month_year": string
    }
  ],
  "monthly_stats": {
    "[month_year]": {
      "total_modifications": number,
      "employees_modified": [string],
      "modifications_by_user": Record<string, number>
    }
  }
}
```
**Access:** Write by roster modification, Read by reporting

---

### 6. admin_data.json (per tenant)
**Structure:**
```json
{
  "users": [
    {
      "username": string,
      "password": string,
      "role": string,
      "full_name": string,
      "created_at": string,
      "tenant_id": string
    }
  ]
}
```
**Access:** Read/Write by Authentication and Admin Management

---

### 7. employee_data.json (per tenant)
**Structure:**
```json
{
  "credentials": [
    {
      "employee_id": string,
      "password": string,
      "email": string,
      "created_at": string,
      "status": "active" | "inactive"
    }
  ]
}
```
**Access:** Read/Write by Authentication and Employee Management

---

## Data Flow Summary by User Role

### Developer Data Flows:
1. Authenticate → View Tenants → Manage Tenant → Update Status
2. Authenticate → CMS → Edit Landing Page → Publish

### Admin Data Flows:
1. Authenticate → View Dashboard → Access Tabs
2. Upload CSV → Parse → Validate → Import → Update Roster
3. View Requests → Review → Approve/Reject → Update Roster → Notify Employee
4. Edit Shift → Validate → Save → Log Modification

### Employee Data Flows:
1. Authenticate → View Schedule → Display Calendar
2. View Team → Fetch Team Data → Display Calendar
3. Create Request → Validate → Save → Notify Admin
4. View Notifications → Fetch → Display → Mark Read

---

**Document Prepared By**: RosterBhai Documentation Team  
**Last Updated**: November 08, 2025  
**Version**: 2.0.0
