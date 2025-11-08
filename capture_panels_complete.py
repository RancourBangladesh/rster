#!/usr/bin/env python3
"""
Comprehensive Screenshot Capture Script for RosterBhai Documentation
Creates test routes, captures admin and employee panel screenshots
"""

import asyncio
import os
import json
from pathlib import Path
from playwright.async_api import async_playwright

# Screenshot configuration
BASE_URL = "http://localhost:3000"
SCREENSHOTS_DIR = Path("/home/runner/work/rster/rster/Documentation/screenshots")
VIEWPORT = {"width": 1920, "height": 1080}

# Screenshots to capture
ADMIN_SCREENSHOTS = [
    {
        "name": "14_admin_dashboard_overview",
        "url": "/admin/dashboard/overview",
        "description": "Admin dashboard overview with metrics and stats",
        "setup": "admin"
    },
    {
        "name": "15_admin_roster_data_view",
        "url": "/admin/dashboard/roster-data",
        "description": "Roster data calendar view with employee shifts",
        "setup": "admin"
    },
    {
        "name": "16_admin_employee_management",
        "url": "/admin/dashboard/employee-management",
        "description": "Employee management list and CRUD operations",
        "setup": "admin"
    },
    {
        "name": "17_admin_csv_import",
        "url": "/admin/dashboard/csv-import",
        "description": "CSV import interface for bulk roster upload",
        "setup": "admin"
    },
    {
        "name": "18_admin_schedule_requests",
        "url": "/admin/dashboard/schedule-requests",
        "description": "Schedule change and swap requests management",
        "setup": "admin"
    },
    {
        "name": "19_admin_google_sheets_sync",
        "url": "/admin/dashboard/roster-sync",
        "description": "Google Sheets sync configuration",
        "setup": "admin"
    },
    {
        "name": "20_admin_template_creator",
        "url": "/admin/dashboard/template-creator",
        "description": "Shift template creator for recurring schedules",
        "setup": "admin"
    },
    {
        "name": "21_admin_rbac_settings",
        "url": "/admin/dashboard/user-management",
        "description": "RBAC user management and permissions",
        "setup": "admin"
    }
]

EMPLOYEE_SCREENSHOTS = [
    {
        "name": "22_employee_dashboard",
        "url": "/test-capture/employee-portal",
        "description": "Employee dashboard with today/tomorrow shifts",
        "setup": "employee"
    }
]

async def setup_admin_session(page):
    """Set up admin session in localStorage"""
    await page.evaluate("""() => {
        const adminUser = {
            username: 'admin',
            tenant_id: '96b645ca-8dcc-47b7-ad81-f2b0902e9012',
            tenant_name: 'TechCorp Solutions'
        };
        localStorage.setItem('adminUser', JSON.stringify(adminUser));
        localStorage.setItem('adminAuth', 'true');
    }""")
    print("✓ Admin session configured")

async def setup_employee_session(page):
    """Set up employee session in localStorage"""
    await page.evaluate("""() => {
        const employeeData = {
            employeeId: 'EMP001',
            fullName: 'Alice Johnson'
        };
        localStorage.setItem('rosterViewerUser', JSON.stringify(employeeData));
        localStorage.setItem('rosterViewerAuth', 'true');
    }""")
    print("✓ Employee session configured")

async def capture_screenshot(page, screenshot_config, output_dir):
    """Capture a single screenshot"""
    name = screenshot_config["name"]
    url = screenshot_config["url"]
    description = screenshot_config["description"]
    setup = screenshot_config["setup"]
    
    print(f"\n📸 Capturing: {name}")
    print(f"   URL: {url}")
    print(f"   Description: {description}")
    
    try:
        # Setup session based on type
        if setup == "admin":
            await setup_admin_session(page)
        elif setup == "employee":
            await setup_employee_session(page)
        
        # Navigate to page
        full_url = f"{BASE_URL}{url}"
        print(f"   Navigating to: {full_url}")
        
        response = await page.goto(full_url, wait_until="networkidle", timeout=30000)
        
        if response and response.status >= 400:
            print(f"   ⚠️  Warning: HTTP {response.status}")
        
        # Wait for page to be fully loaded
        await page.wait_for_timeout(2000)
        
        # Additional wait for dynamic content
        try:
            await page.wait_for_selector('body', timeout=5000)
        except:
            pass
        
        # Capture screenshot
        output_file = output_dir / f"{name}.png"
        await page.screenshot(path=str(output_file), full_page=True)
        
        file_size = output_file.stat().st_size / 1024  # KB
        print(f"   ✓ Captured: {output_file.name} ({file_size:.1f} KB)")
        
        return True
        
    except Exception as e:
        print(f"   ✗ Error: {str(e)}")
        return False

async def main():
    print("=" * 80)
    print("RosterBhai Admin & Employee Panel Screenshot Capture")
    print("=" * 80)
    
    # Create output directories
    admin_dir = SCREENSHOTS_DIR / "admin"
    employee_dir = SCREENSHOTS_DIR / "employee"
    admin_dir.mkdir(parents=True, exist_ok=True)
    employee_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"\n📁 Output directories:")
    print(f"   Admin: {admin_dir}")
    print(f"   Employee: {employee_dir}")
    
    async with async_playwright() as p:
        print("\n🌐 Launching browser...")
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport=VIEWPORT,
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )
        page = await context.new_page()
        
        # Capture admin screenshots
        print("\n" + "=" * 80)
        print("ADMIN PANEL SCREENSHOTS")
        print("=" * 80)
        
        admin_success = 0
        for screenshot_config in ADMIN_SCREENSHOTS:
            if await capture_screenshot(page, screenshot_config, admin_dir):
                admin_success += 1
        
        # Capture employee screenshots
        print("\n" + "=" * 80)
        print("EMPLOYEE PORTAL SCREENSHOTS")
        print("=" * 80)
        
        employee_success = 0
        for screenshot_config in EMPLOYEE_SCREENSHOTS:
            if await capture_screenshot(page, screenshot_config, employee_dir):
                employee_success += 1
        
        await browser.close()
    
    # Summary
    print("\n" + "=" * 80)
    print("CAPTURE SUMMARY")
    print("=" * 80)
    print(f"Admin screenshots: {admin_success}/{len(ADMIN_SCREENSHOTS)} successful")
    print(f"Employee screenshots: {employee_success}/{len(EMPLOYEE_SCREENSHOTS)} successful")
    print(f"Total: {admin_success + employee_success}/{len(ADMIN_SCREENSHOTS) + len(EMPLOYEE_SCREENSHOTS)}")
    
    if admin_success == len(ADMIN_SCREENSHOTS) and employee_success == len(EMPLOYEE_SCREENSHOTS):
        print("\n✅ All screenshots captured successfully!")
        return 0
    else:
        print("\n⚠️  Some screenshots failed to capture")
        return 1

if __name__ == "__main__":
    exit(asyncio.run(main()))
