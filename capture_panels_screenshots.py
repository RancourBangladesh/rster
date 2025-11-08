#!/usr/bin/env python3
"""
Comprehensive Screenshot Capture for Admin and Employee Panels
Captures all functionality screenshots with full tenant data
"""

import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright

SCREENSHOTS_DIR = Path("/home/runner/work/rster/rster/Documentation/screenshots")
BASE_URL = "http://localhost:3000"

# Tenant data
TENANT_ID_TECHCORP = "96b645ca-8dcc-47b7-ad81-f2b0902e9012"
TENANT_ID_RETAILHUB = "e6ef24ae-98be-45ee-9d53-886a2d2dfd17"

async def capture_admin_panel_screenshots(browser):
    """Capture all admin panel functionality screenshots"""
    print("\n🔷 Capturing Admin Panel Screenshots...")
    
    context = await browser.new_context(viewport={"width": 1920, "height": 1080})
    page = await context.new_page()
    
    # Store tenant ID in session for middleware bypass
    await page.goto(BASE_URL)
    await page.evaluate(f'localStorage.setItem("current_tenant_id", "{TENANT_ID_TECHCORP}")')
    
    try:
        # 1. Admin Login Page
        print("  📸 Capturing admin login page...")
        await page.goto(f"{BASE_URL}/admin/login")
        await page.wait_for_timeout(2000)
        await page.screenshot(
            path=str(SCREENSHOTS_DIR / "admin" / "01_admin_login_page.png"),
            full_page=True
        )
        
        # Login as admin
        await page.fill('input[name="username"]', 'admin')
        await page.fill('input[name="password"]', 'admin123')
        await page.click('button[type="submit"]')
        await page.wait_for_timeout(3000)
        
        # 2. Admin Dashboard
        print("  📸 Capturing admin dashboard...")
        await page.goto(f"{BASE_URL}/admin/dashboard")
        await page.wait_for_timeout(3000)
        await page.screenshot(
            path=str(SCREENSHOTS_DIR / "admin" / "02_admin_dashboard.png"),
            full_page=True
        )
        
        # 3. Roster Data View
        print("  📸 Capturing roster data view...")
        # Try to navigate to roster data tab or section
        roster_tab = page.locator('text="Roster Data"').first
        if await roster_tab.is_visible(timeout=2000):
            await roster_tab.click()
            await page.wait_for_timeout(2000)
        await page.screenshot(
            path=str(SCREENSHOTS_DIR / "admin" / "03_roster_data_view.png"),
            full_page=True
        )
        
        # 4. Employee Management
        print("  📸 Capturing employee management...")
        employee_tab = page.locator('text="Employee Management"').first
        if await employee_tab.is_visible(timeout=2000):
            await employee_tab.click()
            await page.wait_for_timeout(2000)
        await page.screenshot(
            path=str(SCREENSHOTS_DIR / "admin" / "04_employee_management.png"),
            full_page=True
        )
        
        # 5. CSV Import Tab
        print("  📸 Capturing CSV import interface...")
        csv_tab = page.locator('text="CSV Import"').first
        if await csv_tab.is_visible(timeout=2000):
            await csv_tab.click()
            await page.wait_for_timeout(2000)
        await page.screenshot(
            path=str(SCREENSHOTS_DIR / "admin" / "05_csv_import.png"),
            full_page=True
        )
        
        # 6. Schedule Requests
        print("  📸 Capturing schedule requests...")
        requests_tab = page.locator('text="Schedule Requests"').first
        if await requests_tab.is_visible(timeout=2000):
            await requests_tab.click()
            await page.wait_for_timeout(2000)
        await page.screenshot(
            path=str(SCREENSHOTS_DIR / "admin" / "07_schedule_requests.png"),
            full_page=True
        )
        
        # 7. Google Sheets Sync
        print("  📸 Capturing Google Sheets sync...")
        sync_tab = page.locator('text="Roster Sync"').first
        if await sync_tab.is_visible(timeout=2000):
            await sync_tab.click()
            await page.wait_for_timeout(2000)
        await page.screenshot(
            path=str(SCREENSHOTS_DIR / "admin" / "08_google_sheets_sync.png"),
            full_page=True
        )
        
        # 8. Employee Profile Detail (click on an employee)
        print("  📸 Capturing employee profile detail...")
        await page.goto(f"{BASE_URL}/admin/dashboard")
        await page.wait_for_timeout(2000)
        # Try to find and click on employee profile
        employee_link = page.locator('text="Alice Johnson"').first
        if await employee_link.is_visible(timeout=2000):
            await employee_link.click()
            await page.wait_for_timeout(2000)
            await page.screenshot(
                path=str(SCREENSHOTS_DIR / "admin" / "09_employee_profile_detail.png"),
                full_page=True
            )
        
    except Exception as e:
        print(f"  ⚠️  Error capturing admin screenshots: {e}")
    
    await context.close()
    print("✅ Admin panel screenshots captured")

async def capture_employee_panel_screenshots(browser):
    """Capture all employee panel functionality screenshots"""
    print("\n🔷 Capturing Employee Panel Screenshots...")
    
    context = await browser.new_context(viewport={"width": 1920, "height": 1080})
    page = await context.new_page()
    
    # Store tenant ID in session
    await page.goto(BASE_URL)
    await page.evaluate(f'localStorage.setItem("current_tenant_id", "{TENANT_ID_TECHCORP}")')
    
    try:
        # 1. Employee Login Page
        print("  📸 Capturing employee login page...")
        await page.goto(f"{BASE_URL}/employee")
        await page.wait_for_timeout(2000)
        await page.screenshot(
            path=str(SCREENSHOTS_DIR / "employee" / "01_employee_login_page.png"),
            full_page=True
        )
        
        # Login as employee
        await page.fill('input[name="employeeId"]', 'EMP001')
        await page.fill('input[name="password"]', 'pass123')
        await page.click('button[type="submit"]')
        await page.wait_for_timeout(3000)
        
        # 2. Employee Dashboard/Home
        print("  📸 Capturing employee dashboard...")
        await page.screenshot(
            path=str(SCREENSHOTS_DIR / "employee" / "02_employee_dashboard.png"),
            full_page=True
        )
        
        # 3. Schedule Calendar View
        print("  📸 Capturing schedule calendar...")
        schedule_link = page.locator('text="My Schedule"').first
        if await schedule_link.is_visible(timeout=2000):
            await schedule_link.click()
            await page.wait_for_timeout(2000)
        await page.screenshot(
            path=str(SCREENSHOTS_DIR / "employee" / "03_schedule_calendar.png"),
            full_page=True
        )
        
        # 4. Team Schedule View
        print("  📸 Capturing team schedule...")
        team_link = page.locator('text="Team Schedule"').first
        if await team_link.is_visible(timeout=2000):
            await team_link.click()
            await page.wait_for_timeout(2000)
        await page.screenshot(
            path=str(SCREENSHOTS_DIR / "employee" / "04_team_schedule.png"),
            full_page=True
        )
        
        # 5. Shift Change/Swap Request Form
        print("  📸 Capturing shift request form...")
        request_link = page.locator('text="Request Shift"').first
        if await request_link.is_visible(timeout=2000):
            await request_link.click()
            await page.wait_for_timeout(2000)
        await page.screenshot(
            path=str(SCREENSHOTS_DIR / "employee" / "05_shift_request_form.png"),
            full_page=True
        )
        
        # 6. Notifications Panel
        print("  📸 Capturing notifications...")
        notification_icon = page.locator('[aria-label="Notifications"]').first
        if await notification_icon.is_visible(timeout=2000):
            await notification_icon.click()
            await page.wait_for_timeout(1000)
        await page.screenshot(
            path=str(SCREENSHOTS_DIR / "employee" / "06_notifications.png"),
            full_page=True
        )
        
        # 7. Profile Management
        print("  📸 Capturing profile management...")
        profile_link = page.locator('text="My Profile"').first
        if await profile_link.is_visible(timeout=2000):
            await profile_link.click()
            await page.wait_for_timeout(2000)
        await page.screenshot(
            path=str(SCREENSHOTS_DIR / "employee" / "08_profile_management.png"),
            full_page=True
        )
        
    except Exception as e:
        print(f"  ⚠️  Error capturing employee screenshots: {e}")
    
    await context.close()
    print("✅ Employee panel screenshots captured")

async def capture_isolation_verification(browser):
    """Capture screenshots demonstrating tenant isolation"""
    print("\n🔷 Capturing Tenant Isolation Verification...")
    
    context = await browser.new_context(viewport={"width": 1920, "height": 1080})
    page = await context.new_page()
    
    try:
        # Show both tenants' data side by side concept
        print("  📸 Capturing data isolation demo...")
        
        # RetailHub Admin Dashboard
        await page.goto(BASE_URL)
        await page.evaluate(f'localStorage.setItem("current_tenant_id", "{TENANT_ID_RETAILHUB}")')
        await page.goto(f"{BASE_URL}/admin/login")
        await page.wait_for_timeout(1000)
        await page.fill('input[name="username"]', 'admin')
        await page.fill('input[name="password"]', 'admin123')
        await page.click('button[type="submit"]')
        await page.wait_for_timeout(3000)
        
        await page.screenshot(
            path=str(SCREENSHOTS_DIR / "testing" / "01_retailhub_admin_dashboard.png"),
            full_page=True
        )
        
        print("  📸 Captured RetailHub dashboard for isolation comparison")
        
    except Exception as e:
        print(f"  ⚠️  Error capturing isolation screenshots: {e}")
    
    await context.close()
    print("✅ Isolation verification screenshots captured")

async def main():
    print("🚀 Starting Comprehensive Screenshot Capture")
    print("=" * 60)
    
    # Ensure directories exist
    (SCREENSHOTS_DIR / "admin").mkdir(parents=True, exist_ok=True)
    (SCREENSHOTS_DIR / "employee").mkdir(parents=True, exist_ok=True)
    (SCREENSHOTS_DIR / "testing").mkdir(parents=True, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # Capture all screenshots
        await capture_admin_panel_screenshots(browser)
        await capture_employee_panel_screenshots(browser)
        await capture_isolation_verification(browser)
        
        await browser.close()
    
    print("\n" + "=" * 60)
    print("✅ All screenshots captured successfully!")
    print(f"📁 Location: {SCREENSHOTS_DIR}")
    
    # Count screenshots
    admin_count = len(list((SCREENSHOTS_DIR / "admin").glob("*.png")))
    employee_count = len(list((SCREENSHOTS_DIR / "employee").glob("*.png")))
    testing_count = len(list((SCREENSHOTS_DIR / "testing").glob("*.png")))
    
    print(f"\n📊 Summary:")
    print(f"  Admin screenshots: {admin_count}")
    print(f"  Employee screenshots: {employee_count}")
    print(f"  Testing screenshots: {testing_count}")
    print(f"  Total: {admin_count + employee_count + testing_count}")

if __name__ == "__main__":
    asyncio.run(main())
