#!/usr/bin/env python3
"""
Comprehensive screenshot capture script for RosterBhai
Testing all features and functionalities
"""

import os
import time
import subprocess

# Define screenshot directory
SCREENSHOT_DIR = '/home/runner/work/rster/rster/Documentation/screenshots'
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

screenshots = []

def add_screenshot(name, description):
    """Add a screenshot to the list"""
    screenshots.append({
        'name': name,
        'description': description,
        'file': f'{SCREENSHOT_DIR}/{name}.png'
    })

# Public Pages
add_screenshot('01_landing_page', 'Landing Page - Homepage with features')
add_screenshot('02_pricing_page', 'Pricing Page - Subscription plans')
add_screenshot('03_about_page', 'About Page - Company information')
add_screenshot('04_contact_page', 'Contact Page - Contact form')

# Developer Portal
add_screenshot('05_developer_login', 'Developer Login Page')
add_screenshot('06_developer_dashboard', 'Developer Dashboard - Tenant management')
add_screenshot('07_developer_tenant_list', 'Developer - List of tenants')
add_screenshot('08_developer_create_tenant', 'Developer - Creating new tenant')
add_screenshot('09_developer_tenant_details', 'Developer - Tenant detail view')
add_screenshot('10_developer_landing_cms', 'Developer - Landing page CMS')

# Admin Panel - Tenant 1
add_screenshot('11_admin_login', 'Admin Login Page')
add_screenshot('12_admin_dashboard', 'Admin Dashboard - Overview')
add_screenshot('13_admin_roster_data', 'Admin - Roster data view')
add_screenshot('14_admin_employee_management', 'Admin - Employee management')
add_screenshot('15_admin_add_employee', 'Admin - Add new employee')
add_screenshot('16_admin_csv_import', 'Admin - CSV import')
add_screenshot('17_admin_roster_sync', 'Admin - Google Sheets sync')
add_screenshot('18_admin_schedule_requests', 'Admin - Schedule change requests')
add_screenshot('19_admin_settings', 'Admin - Organization settings')
add_screenshot('20_admin_shift_modification', 'Admin - Modifying shifts')

# Employee Portal - Tenant 1
add_screenshot('21_employee_login', 'Employee Login Page')
add_screenshot('22_employee_dashboard', 'Employee Dashboard - My schedule')
add_screenshot('23_employee_my_schedule', 'Employee - My Schedule view')
add_screenshot('24_employee_team_schedule', 'Employee - Team schedule view')
add_screenshot('25_employee_shift_change_request', 'Employee - Requesting shift change')
add_screenshot('26_employee_shift_swap_request', 'Employee - Requesting shift swap')
add_screenshot('27_employee_notifications', 'Employee - Notifications panel')
add_screenshot('28_employee_profile', 'Employee - Profile management')

# Tenant Isolation Test - Tenant 2
add_screenshot('29_tenant2_admin_login', 'Tenant 2 - Admin login')
add_screenshot('30_tenant2_admin_dashboard', 'Tenant 2 - Admin dashboard')
add_screenshot('31_tenant2_employee_dashboard', 'Tenant 2 - Employee dashboard')
add_screenshot('32_data_isolation_verification', 'Data Isolation - Verification')

print(f"Total screenshots to capture: {len(screenshots)}")
print("\nScreenshot list:")
for i, ss in enumerate(screenshots, 1):
    print(f"{i}. {ss['name']}: {ss['description']}")
    
print(f"\nScreenshots will be saved to: {SCREENSHOT_DIR}")
