#!/usr/bin/env python3
"""
RosterBhai Documentation Generator
Generates comprehensive technical documentation including:
- Architecture Document
- Use Case Diagrams
- Data Flow Diagrams
- System Documentation
"""

import os
import json
from datetime import datetime

# Create documentation content
class DocumentationGenerator:
    def __init__(self):
        self.project_name = "RosterBhai"
        self.version = "2.0.0"
        self.date = datetime.now().strftime("%B %d, %Y")
        
    def generate_architecture_document(self):
        """Generate Architecture Document in Markdown"""
        content = f"""# {self.project_name} - System Architecture Document
**Version:** {self.version}  
**Date:** {self.date}

## 1. Executive Summary

RosterBhai is a modern, multi-tenant SaaS application designed for roster and shift management. Built using Next.js 14 with TypeScript, it provides a comprehensive solution for organizations managing employee shifts across different teams.

### Key Features:
- **Multi-tenant Architecture**: Subdomain-based tenant isolation
- **Employee Portal**: Self-service shift viewing and swap requests
- **Admin Panel**: Comprehensive roster management with RBAC
- **Developer Panel**: Super-admin controls for tenant management
- **Google Sheets Integration**: CSV import/export functionality
- **Real-time Notifications**: Email and in-app notification system

---

## 2. System Architecture Overview

### 2.1 Architecture Pattern
RosterBhai follows a **3-tier architecture** with clear separation of concerns:

1. **Presentation Layer**: Next.js App Router with React Components
2. **Business Logic Layer**: API Routes and Server-side Processing
3. **Data Layer**: File-based JSON storage with tenant isolation

### 2.2 Technology Stack

#### Frontend:
- **Framework**: Next.js 14.2.33 (React 18.2.0)
- **Language**: TypeScript 5.4.5
- **Styling**: CSS Modules + Global Styles
- **UI Components**: Lucide React Icons

#### Backend:
- **Runtime**: Node.js
- **API**: Next.js API Routes (serverless)
- **File Processing**: Formidable (file uploads), csv-parse (CSV parsing)
- **Authentication**: Session-based with HTTP-only cookies

#### Data Storage:
- **Database**: JSON file-based storage
- **Structure**: Tenant-isolated data directories
- **Session Management**: Cookie-based sessions

---

## 3. Multi-Tenant Architecture

### 3.1 Tenant Isolation Strategy

RosterBhai implements **subdomain-based multi-tenancy**:

```
Main Domain:         rosterbhai.me (Landing page, pricing, developer portal)
Tenant Subdomains:   [tenant-slug].rosterbhai.me (Employee & Admin access)
```

### 3.2 Data Isolation

Each tenant has isolated data storage:

```
data/
├── tenants/
│   ├── [tenant-id]/
│   │   ├── roster_data.json       # Shift schedules
│   │   ├── admin_data.json        # Admin users
│   │   ├── employee_data.json     # Employee credentials
│   │   ├── google_data.json       # Google Sheets links
│   │   ├── schedule_requests.json # Swap/change requests
│   │   ├── modified_shifts.json   # Audit trail
│   │   └── photos/                # Employee photos
├── tenants.json                   # Tenant registry
└── developers.json                # Developer accounts
```

### 3.3 Middleware-Based Routing

The middleware (`middleware.ts`) enforces tenant isolation:
- Subdomain requests → Employee/Admin routes only
- Main domain requests → Marketing/Developer routes only
- Automatic redirection based on context

---

## 4. System Components

### 4.1 Landing Page (Marketing Site)
**Purpose**: Public-facing website for company signup

**Features**:
- Hero section with value proposition
- Pricing plans (Monthly/Yearly)
- Feature showcase
- Contact form
- Company registration

**Routes**:
- `/` - Home page
- `/about` - About page
- `/pricing` - Pricing plans
- `/contact` - Contact form

---

### 4.2 Developer Portal
**Purpose**: Super-admin panel for SaaS management

**Features**:
- Tenant approval/management
- Subscription management
- Tenant data export
- CMS for landing page
- System analytics

**Routes**:
- `/developer/login` - Authentication
- `/developer/dashboard` - Tenant management
- `/developer/tenants/[id]` - Tenant details
- `/developer/landing-cms` - Content management

**Access Control**: Requires developer account login

---

### 4.3 Admin Panel
**Purpose**: Tenant-level roster management

**Features**:
- **Dashboard**: Overview of schedules and stats
- **Employee Management**: Add, edit, deactivate employees
- **Roster Management**: View and modify shift schedules
- **CSV Import**: Bulk import from Google Sheets
- **Template Management**: Create reusable shift templates
- **Schedule Requests**: Approve/reject swap requests
- **Settings**: Organization profile, RBAC

**Routes**:
- `/admin/login` - Authentication
- `/admin/dashboard` - Main admin interface (tabbed)

**Tabs**:
1. Dashboard - Overview and quick actions
2. Roster Data - Schedule viewing and editing
3. Employee Management - Employee CRUD operations
4. CSV Import - Bulk data import
5. Roster Sync - Google Sheets integration
6. Schedule Requests - Approval workflow
7. Settings - Configuration

---

### 4.4 Employee Portal
**Purpose**: Self-service portal for employees

**Features**:
- Personal schedule viewing
- Team schedule viewing
- Shift change requests
- Shift swap requests (with colleague selection)
- Notification center
- Profile management

**Routes**:
- `/employee` - Login page
- `/employee` (authenticated) - Dashboard with tabs

**Tabs**:
1. My Schedule - Personal shift calendar
2. Team Schedule - View colleagues' shifts
3. Requests - Submit change/swap requests
4. Notifications - View announcements

---

## 5. Data Models

### 5.1 Core Entities

#### Tenant
```typescript
{{
  id: string;                    // UUID
  name: string;                  // Display name
  slug: string;                  // URL identifier
  created_at: string;            // ISO timestamp
  is_active: boolean;            // Status flag
  settings: {{
    organization_name?: string;
    logo_url?: string;
    max_users?: number;
    max_employees?: number;
  }};
  subscription?: {{
    plan: 'monthly' | 'yearly';
    status: 'pending' | 'active';
    started_at?: string;
    expires_at?: string;
  }};
}}
```

#### Employee
```typescript
{{
  id: string;                    // Employee ID
  name: string;                  // Full name
  currentTeam?: string;          // Current team assignment
  team?: string;                 // Legacy team field
  schedule: string[];            // Shift codes per day
  allTeams?: string[];           // All teams employee belongs to
  status?: 'active' | 'inactive';
  deleted_at?: string;
}}
```

#### Schedule Request (Shift Change)
```typescript
{{
  id: string;
  employee_id: string;
  employee_name: string;
  team: string;
  date: string;
  current_shift: string;
  requested_shift: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  type: 'shift_change';
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
  admin_message?: string;
}}
```

#### Schedule Request (Swap)
```typescript
{{
  id: string;
  requester_id: string;
  requester_name: string;
  target_employee_id: string;
  target_employee_name: string;
  team: string;
  date: string;
  requester_shift: string;
  target_shift: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  type: 'swap';
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
}}
```

---

## 6. Authentication & Authorization

### 6.1 Authentication Mechanisms

#### Developer Authentication
- **Method**: Username/Password
- **Storage**: developers.json (root level)
- **Session**: HTTP-only cookie `developer_session_v1`
- **Scope**: Full system access

#### Admin Authentication
- **Method**: Username/Password
- **Storage**: tenant-specific admin_data.json
- **Session**: HTTP-only cookie `admin_session_v1`
- **Scope**: Single tenant access

#### Employee Authentication
- **Method**: Employee ID/Password
- **Storage**: tenant-specific employee_data.json
- **Session**: HTTP-only cookie with employee context
- **Scope**: Personal data + team view

### 6.2 Role-Based Access Control (RBAC)

Admin roles support hierarchical permissions:
- **Super Admin**: Full access to all admin features
- **Admin**: Standard roster management
- **Viewer**: Read-only access

---

## 7. API Architecture

### 7.1 API Route Structure

```
/api/
├── public/                    # Unauthenticated endpoints
│   ├── tenants/signup/       # Company registration
│   └── landing-cms/          # Landing page content
├── developer/                 # Developer portal APIs
│   ├── tenants/[id]/         # Tenant management
│   └── landing-cms/          # CMS APIs
├── admin/                     # Admin panel APIs
│   ├── login/
│   ├── upload-csv/
│   ├── shift-definitions/
│   └── employee-profile/
├── employee/                  # Deprecated (moved to my-schedule)
├── my-schedule/               # Employee portal APIs
│   ├── login/
│   ├── [employeeId]/
│   ├── roster-display/
│   └── notifications/
├── my-profile/                # Employee profile APIs
└── schedule-requests/         # Request management APIs
```

### 7.2 API Patterns

All APIs follow REST principles:
- **GET**: Retrieve data
- **POST**: Create or process data
- **PUT**: Update existing data
- **DELETE**: Remove data

Response format:
```json
{{
  "success": true,
  "data": {{ ... }},
  "error": null
}}
```

---

## 8. Security Features

### 8.1 Security Measures

1. **Tenant Isolation**
   - Subdomain-based routing
   - Data directory separation
   - Session-based context validation

2. **Authentication**
   - HTTP-only cookies prevent XSS
   - Session validation on every request
   - Automatic session expiry

3. **Input Validation**
   - Zod schema validation for APIs
   - CSV parsing with error handling
   - File upload restrictions

4. **Authorization**
   - Role-based access control
   - Tenant context verification
   - Employee-level data isolation

---

## 9. File Processing & Data Import

### 9.1 CSV Import Workflow

1. Admin uploads CSV file
2. Server parses CSV using csv-parse
3. Data validation and transformation
4. Employee auto-creation from roster
5. Shift code mapping
6. Save to tenant's roster_data.json

### 9.2 Google Sheets Integration

- Admin provides Google Sheets public link
- System fetches CSV export URL
- Auto-sync option for periodic updates
- Template-based import for consistency

---

## 10. Notification System

### 10.1 Notification Types

1. **Schedule Changes**: Shift modifications by admin
2. **Request Updates**: Approval/rejection of requests
3. **System Announcements**: Admin broadcasts
4. **Reminders**: Upcoming shift notifications (planned)

### 10.2 Delivery Channels

- **In-App**: Notification panel in employee portal
- **Email**: Planned integration (SMTP setup required)
- **Mobile App**: Widget support (in development)

---

## 11. Deployment Architecture

### 11.1 Recommended Deployment

**Platform**: Vercel (optimal for Next.js)

**Configuration**:
- Auto-deployment from Git
- Environment variables in Vercel dashboard
- Serverless functions for API routes
- CDN for static assets

**Environment Variables**:
```
APP_SECRET=<random-secret-key>
NODE_ENV=production
```

### 11.2 Data Persistence

- Use persistent storage volume for `/data` directory
- Regular backups of tenant data
- Consider migration to database for scale (PostgreSQL, MongoDB)

---

## 12. Scalability Considerations

### 12.1 Current Limitations

- File-based storage limits concurrent access
- No horizontal scaling for file I/O
- Session storage in memory (not clustered)

### 12.2 Migration Path

For large-scale deployment:
1. **Database Migration**: PostgreSQL with tenant isolation
2. **Session Store**: Redis for distributed sessions
3. **File Storage**: S3 for employee photos and uploads
4. **Caching**: Redis for frequently accessed data
5. **Queue System**: Background jobs for CSV processing

---

## 13. Monitoring & Logging

### 13.1 Logging Strategy

- API request/response logging
- Error tracking with stack traces
- Audit trail in modified_shifts.json
- User activity logs

### 13.2 Metrics to Monitor

- Tenant count and growth
- Active user sessions
- API response times
- CSV import success rates
- Storage usage per tenant

---

## 14. Future Enhancements

### 14.1 Planned Features

1. **Mobile Application**
   - Native iOS/Android apps
   - Home screen widget for shifts
   - Push notifications

2. **Advanced Analytics**
   - Shift pattern analysis
   - Employee utilization reports
   - Overtime tracking

3. **Integration APIs**
   - Webhook support
   - REST API for third-party apps
   - SSO (Single Sign-On)

4. **Automation**
   - Auto-approval rules
   - Shift template suggestions
   - Smart scheduling algorithms

---

## 15. Conclusion

RosterBhai provides a robust, scalable foundation for roster management with clear separation of concerns, multi-tenancy, and comprehensive features for both administrators and employees. The architecture supports future growth through modular design and clear upgrade paths.

---

**Document Prepared By**: RosterBhai Documentation Team  
**Last Updated**: {self.date}  
**Version**: {self.version}
"""
        return content

    def generate_use_cases_document(self):
        """Generate Use Cases Document"""
        content = f"""# {self.project_name} - Use Case Diagram Documentation
**Version:** {self.version}  
**Date:** {self.date}

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
**Last Updated**: {self.date}  
**Version**: {self.version}
"""
        return content

    def generate_dfd_document(self):
        """Generate Data Flow Diagram Documentation"""
        content = f"""# {self.project_name} - Data Flow Diagram (DFD)
**Version:** {self.version}  
**Date:** {self.date}

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
{{
  "developers": [
    {{
      "username": string,
      "password": string,
      "full_name": string,
      "created_at": string,
      "role": "developer"
    }}
  ]
}}
```
**Access:** Read/Write by Authentication process

---

### 2. tenants.json
**Structure:**
```json
{{
  "tenants": [
    {{
      "id": UUID,
      "name": string,
      "slug": string,
      "created_at": string,
      "is_active": boolean,
      "settings": {{}},
      "subscription": {{
        "plan": "monthly" | "yearly",
        "status": "pending" | "active",
        "started_at": string,
        "expires_at": string
      }}
    }}
  ]
}}
```
**Access:** Read by multiple processes, Write by Tenant Management

---

### 3. roster_data.json (per tenant)
**Structure:**
```json
{{
  "teams": {{
    "[team_name]": [
      {{
        "id": string,
        "name": string,
        "currentTeam": string,
        "schedule": [string],
        "status": "active" | "inactive"
      }}
    ]
  }},
  "headers": [string],
  "allEmployees": [Employee]
}}
```
**Access:** Read by display processes, Write by roster management

---

### 4. schedule_requests.json (per tenant)
**Structure:**
```json
{{
  "shift_change_requests": [ScheduleRequestChange],
  "swap_requests": [ScheduleRequestSwap],
  "approved_count": number,
  "pending_count": number
}}
```
**Access:** Read/Write by Schedule Request Management

---

### 5. modified_shifts.json (per tenant)
**Structure:**
```json
{{
  "modifications": [
    {{
      "employee_id": string,
      "date_index": number,
      "old_shift": string,
      "new_shift": string,
      "modified_by": string,
      "timestamp": string,
      "month_year": string
    }}
  ],
  "monthly_stats": {{
    "[month_year]": {{
      "total_modifications": number,
      "employees_modified": [string],
      "modifications_by_user": Record<string, number>
    }}
  }}
}}
```
**Access:** Write by roster modification, Read by reporting

---

### 6. admin_data.json (per tenant)
**Structure:**
```json
{{
  "users": [
    {{
      "username": string,
      "password": string,
      "role": string,
      "full_name": string,
      "created_at": string,
      "tenant_id": string
    }}
  ]
}}
```
**Access:** Read/Write by Authentication and Admin Management

---

### 7. employee_data.json (per tenant)
**Structure:**
```json
{{
  "credentials": [
    {{
      "employee_id": string,
      "password": string,
      "email": string,
      "created_at": string,
      "status": "active" | "inactive"
    }}
  ]
}}
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
**Last Updated**: {self.date}  
**Version**: {self.version}
"""
        return content

    def save_documents(self):
        """Save all documents to files"""
        docs_dir = "/home/runner/work/rster/rster/Documentation"
        
        # Save Architecture Document
        with open(f"{docs_dir}/Architecture_Document.md", "w") as f:
            f.write(self.generate_architecture_document())
        
        # Save Use Cases Document
        with open(f"{docs_dir}/Use_Case_Diagram_Documentation.md", "w") as f:
            f.write(self.generate_use_cases_document())
        
        # Save DFD Document
        with open(f"{docs_dir}/Data_Flow_Diagram_Documentation.md", "w") as f:
            f.write(self.generate_dfd_document())
        
        print("✓ Architecture Document created")
        print("✓ Use Case Diagram Documentation created")
        print("✓ Data Flow Diagram Documentation created")

if __name__ == "__main__":
    generator = DocumentationGenerator()
    generator.save_documents()
    print("\n✓ All documentation generated successfully!")
