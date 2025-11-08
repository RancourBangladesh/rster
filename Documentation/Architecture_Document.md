# RosterBhai - System Architecture Document
**Version:** 2.0.0  
**Date:** November 08, 2025

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
{
  id: string;                    // UUID
  name: string;                  // Display name
  slug: string;                  // URL identifier
  created_at: string;            // ISO timestamp
  is_active: boolean;            // Status flag
  settings: {
    organization_name?: string;
    logo_url?: string;
    max_users?: number;
    max_employees?: number;
  };
  subscription?: {
    plan: 'monthly' | 'yearly';
    status: 'pending' | 'active';
    started_at?: string;
    expires_at?: string;
  };
}
```

#### Employee
```typescript
{
  id: string;                    // Employee ID
  name: string;                  // Full name
  currentTeam?: string;          // Current team assignment
  team?: string;                 // Legacy team field
  schedule: string[];            // Shift codes per day
  allTeams?: string[];           // All teams employee belongs to
  status?: 'active' | 'inactive';
  deleted_at?: string;
}
```

#### Schedule Request (Shift Change)
```typescript
{
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
}
```

#### Schedule Request (Swap)
```typescript
{
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
}
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
{
  "success": true,
  "data": { ... },
  "error": null
}
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
**Last Updated**: November 08, 2025  
**Version**: 2.0.0
