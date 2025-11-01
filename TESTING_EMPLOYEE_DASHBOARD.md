# Testing Guide for Employee Dashboard Improvements

## Prerequisites
- Application running on `http://localhost:3000`
- Access to developer account

## Test Flow

### 1. Create Rinky Tenant
1. Login to Developer Dashboard at `/developer/login`
2. Navigate to Tenants Management
3. Create new tenant:
   - Name: `Rinky`
   - Slug: `rinky`
   - Max Users: 50
   - Max Employees: 100
4. Create admin user for Rinky:
   - Username: `admin`
   - Password: `1`
   - Role: `admin`

### 2. Add Employees via Google CSV Sync
1. Logout from developer and login to Admin at `/admin/login`
2. Login as `rinky` tenant admin (username: `admin`, password: `1`)
3. Navigate to Roster Sync tab
4. Add Google CSV link:
   - Month: `2025-10`
   - Link: `https://docs.google.com/spreadsheets/d/e/2PACX-1vQUUnqdxxc2BxcRN-N10Ehjes78p2EuerKLCl_20hlMDH-Bv2O2umXP37SIeX20yvxiKOYpWJtWsbfq/pub?output=csv`
5. Click "Sync Google Sheets Now"
6. Verify: Should show "37 employees from 1 sheet(s)"
7. Navigate to Roster tab and verify all 37 employees are loaded:
   - VOICE: 15 employees
   - Control Tower: 6 employees  
   - CS IR: 5 employees
   - PSC IR: 1 employee
   - Digital: 5 employees
   - TL: 5 employees

### 3. Set Employee Passwords
1. Navigate to Employee Management tab
2. For each employee (or at least 2-3 test employees), click "Send Password Link" or set password manually
3. Recommended test employees:
   - Nazmul Hossain (SLL-88818)
   - Atquia Firooz (SLL-88337)
   - Shaima Akhter Zinia (SLL-88713)

### 4. Test Employee Login
1. Logout from admin
2. Go to main page `/`
3. Login as employee:
   - Employee ID: `rinky@SLL-88818` (or tenant@employeeID format)
   - Password: (the password you set, default is employee ID)
4. Verify successful login

### 5. Test Employee Dashboard Features

#### A. Today/Tomorrow Shift Display
- Verify "Today's Shift" card shows correct shift for current date
- Verify "Tomorrow's Shift" card shows correct shift for next date
- Shifts should be from October 2025 roster data (M2, M3, D1, D2, DO, etc.)

#### B. Calendar Functionality
1. Click "Show Calendar" button
2. Verify calendar displays:
   - Month navigation arrows
   - Current month (November 2025)
   - Weekday labels (Su, Mo, Tu, We, Th, Fr, Sa)
   - Color-coded dates:
     - Green: Working shifts
     - Red: Day Off (DO)
     - Blue: Leave (SL, CL, EL, HL)
3. Click on a date with a shift
4. Verify selected date shows in the "Selected Date" section
5. Navigate to previous/next month using arrow buttons

#### C. Profile Management
1. Click "Settings" button in header
2. Verify Profile Settings modal opens
3. Check profile information displays:
   - Full Name
   - Employee ID
   - Team name
4. Test password change:
   - Enter current password
   - Enter new password (min 4 characters)
   - Confirm new password
   - Click "Change Password"
   - Verify success message
5. Close modal and logout
6. Login again with new password to verify change worked

#### D. Search Other Employees
1. In "Search Other Employees" section
2. Type employee name or ID to search
3. Select another employee
4. Verify:
   - Dashboard switches to show other employee's schedule
   - "Back to My Schedule" button appears in header (with arrow icon)
   - Today/Tomorrow shifts show for the selected employee
   - Calendar shows the other employee's schedule
5. Click "Back to My Schedule" button
6. Verify dashboard returns to your own schedule

#### E. Request Shift Change
1. Select a date from calendar
2. Click "Request Shift Change"
3. Fill in the request form:
   - Date should be pre-filled
   - Select requested shift
   - Enter reason
4. Submit request
5. Verify request appears in admin approval queue

#### F. Request Swap
1. Select a date from calendar
2. Click "Request Swap"
3. Select a team member to swap with
4. Select their date
5. Submit request
6. Verify swap request appears in admin queue

#### G. View All Shifts
1. Click "View All Shifts" button
2. Verify modal opens showing full roster
3. Check that all teams and employees are visible
4. Close modal

### 6. Admin Verification
1. Logout from employee dashboard
2. Login as admin (rinky tenant)
3. Navigate to Requests tab
4. Verify employee requests appear in pending list
5. Approve/reject requests as needed
6. Navigate back to Roster tab
7. Verify changes are reflected in the roster

## Expected Results

✅ All 37 employees synced from Google CSV
✅ Employee login works with tenant@employeeID format
✅ Today/Tomorrow shifts show tenant-specific data (October 2025)
✅ Calendar matches admin panel style (modern, color-coded)
✅ Profile management allows password changes
✅ Settings icon accessible in header
✅ Back button appears when viewing other employees
✅ All shift request features work correctly
✅ Tenant isolation maintained throughout

## Common Issues

### Issue: "No Google Sheets links configured"
- **Solution**: Make sure to add the link in the Roster Sync tab before syncing

### Issue: "0 employees added"
- **Solution**: This should now be fixed - the sync should show "37 employees from 1 sheet(s)"

### Issue: Employee login fails
- **Solution**: Make sure password is set for the employee first in Admin > Employee Management

### Issue: Calendar doesn't show shifts
- **Solution**: Verify tenant has roster data synced and employee belongs to the correct tenant

### Issue: Today/Tomorrow shows N/A
- **Solution**: Check that roster data includes the current date range
