#!/usr/bin/env python3
"""
Comprehensive Panel Screenshot Capture Script
Captures all admin and employee panel screenshots with test data
"""

import asyncio
import json
import os
from playwright.async_api import async_playwright, Browser, Page
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:3000"
SCREENSHOTS_DIR = "Documentation/screenshots"
TENANT_SLUG = "techcorp"

# Test credentials
DEV_USERNAME = "admin"
DEV_PASSWORD = "admin123"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"
EMPLOYEE_ID = "EMP001"
EMPLOYEE_PASSWORD = "pass123"

async def take_screenshot(page: Page, name: str, category: str):
    """Take a full page screenshot"""
    filename = f"{name}.png"
    path = Path(SCREENSHOTS_DIR) / category / filename
    path.parent.mkdir(parents=True, exist_ok=True)
    
    await page.wait_for_load_state('networkidle', timeout=15000)
    await asyncio.sleep(2)  # Extra wait for content to render
    
    await page.screenshot(path=str(path), full_page=True)
    print(f"✓ Captured: {category}/{filename}")
    return str(path)

async def setup_browser() -> Browser:
    """Initialize browser with context"""
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=True)
    return browser, playwright

async def login_as_developer(page: Page):
    """Log into developer portal"""
    print("\n🔐 Logging into Developer Portal...")
    await page.goto(f"{BASE_URL}/developer/login")
    await page.fill('input[type="text"]', DEV_USERNAME)
    await page.fill('input[type="password"]', DEV_PASSWORD)
    await page.click('button:has-text("Sign In")')
    await page.wait_for_url("**/developer/dashboard**", timeout=10000)
    print("✓ Developer logged in")

async def login_as_admin(page: Page, tenant_slug: str):
    """Log into admin panel"""
    print(f"\n🔐 Logging into Admin Panel ({tenant_slug})...")
    
    # Navigate using path-based routing
    await page.goto(f"{BASE_URL}/{tenant_slug}/admin")
    await asyncio.sleep(2)
    
    # Fill login form
    try:
        await page.wait_for_selector('input[type="text"]', timeout=10000)
        await page.fill('input[type="text"]', ADMIN_USERNAME)
        await page.fill('input[type="password"]', ADMIN_PASSWORD)
        await page.click('button:has-text("Sign In")')
        await asyncio.sleep(3)
        print("✓ Admin logged in")
        return True
    except Exception as e:
        print(f"⚠️  Admin login error: {e}")
        return False

async def login_as_employee(page: Page, tenant_slug: str):
    """Log into employee portal"""
    print(f"\n🔐 Logging into Employee Portal ({tenant_slug})...")
    
    # Navigate using path-based routing
    await page.goto(f"{BASE_URL}/{tenant_slug}/employee")
    await asyncio.sleep(2)
    
    # Fill login form
    try:
        await page.wait_for_selector('input[placeholder*="ID"]', timeout=10000)
        await page.fill('input[placeholder*="ID"]', EMPLOYEE_ID)
        await page.fill('input[type="password"]', EMPLOYEE_PASSWORD)
        await page.click('button:has-text("Sign In")')
        await asyncio.sleep(3)
        print("✓ Employee logged in")
        return True
    except Exception as e:
        print(f"⚠️  Employee login error: {e}")
        return False

async def capture_admin_screenshots(page: Page, tenant_slug: str):
    """Capture all admin panel screenshots"""
    print("\n📸 Capturing Admin Panel Screenshots...")
    
    screenshots = []
    
    # Try to login
    logged_in = await login_as_admin(page, tenant_slug)
    
    if not logged_in:
        print("⚠️  Could not log into admin panel, capturing available screens...")
        # Capture login page at least
        await page.goto(f"{BASE_URL}/admin/login")
        await take_screenshot(page, "14_admin_login_techcorp", "admin")
        return screenshots
    
    # 1. Dashboard Overview
    try:
        await page.goto(f"{BASE_URL}/admin/dashboard")
        await take_screenshot(page, "15_admin_dashboard_overview", "admin")
        screenshots.append("Dashboard Overview")
    except Exception as e:
        print(f"⚠️  Dashboard: {e}")
    
    # 2. Roster Data View
    try:
        await page.click('text=Roster Data')
        await asyncio.sleep(2)
        await take_screenshot(page, "16_admin_roster_view", "admin")
        screenshots.append("Roster View")
    except Exception as e:
        print(f"⚠️  Roster View: {e}")
    
    # 3. Employee Management
    try:
        await page.click('text=Employee Management')
        await asyncio.sleep(2)
        await take_screenshot(page, "17_admin_employee_management", "admin")
        screenshots.append("Employee Management")
    except Exception as e:
        print(f"⚠️  Employee Management: {e}")
    
    # 4. CSV Import
    try:
        await page.click('text=CSV Import')
        await asyncio.sleep(2)
        await take_screenshot(page, "18_admin_csv_import", "admin")
        screenshots.append("CSV Import")
    except Exception as e:
        print(f"⚠️  CSV Import: {e}")
    
    # 5. Schedule Requests
    try:
        await page.click('text=Schedule Requests')
        await asyncio.sleep(2)
        await take_screenshot(page, "19_admin_schedule_requests", "admin")
        screenshots.append("Schedule Requests")
    except Exception as e:
        print(f"⚠️  Schedule Requests: {e}")
    
    # 6. Google Sheets Sync
    try:
        await page.click('text=Roster Sync')
        await asyncio.sleep(2)
        await take_screenshot(page, "20_admin_google_sheets_sync", "admin")
        screenshots.append("Google Sheets Sync")
    except Exception as e:
        print(f"⚠️  Google Sheets Sync: {e}")
    
    return screenshots

async def capture_employee_screenshots(page: Page, tenant_slug: str):
    """Capture all employee portal screenshots"""
    print("\n📸 Capturing Employee Portal Screenshots...")
    
    screenshots = []
    
    # Try to login
    logged_in = await login_as_employee(page, tenant_slug)
    
    if not logged_in:
        print("⚠️  Could not log into employee portal, capturing available screens...")
        # Capture login page at least
        await page.goto(f"{BASE_URL}/employee")
        await take_screenshot(page, "23_employee_login_page", "employee")
        return screenshots
    
    # 1. Employee Dashboard
    try:
        await page.goto(f"{BASE_URL}/employee")
        await take_screenshot(page, "24_employee_dashboard", "employee")
        screenshots.append("Employee Dashboard")
    except Exception as e:
        print(f"⚠️  Dashboard: {e}")
    
    # 2. Schedule Calendar View
    try:
        # Look for schedule/calendar tab/link
        await page.click('text=My Schedule', timeout=5000)
        await asyncio.sleep(2)
        await take_screenshot(page, "25_employee_schedule_calendar", "employee")
        screenshots.append("Schedule Calendar")
    except Exception as e:
        print(f"⚠️  Schedule Calendar: {e}")
    
    # 3. Team Schedule
    try:
        await page.click('text=Team', timeout=5000)
        await asyncio.sleep(2)
        await take_screenshot(page, "26_employee_team_schedule", "employee")
        screenshots.append("Team Schedule")
    except Exception as e:
        print(f"⚠️  Team Schedule: {e}")
    
    # 4. Request Form
    try:
        await page.click('text=Request', timeout=5000)
        await asyncio.sleep(2)
        await take_screenshot(page, "27_employee_request_form", "employee")
        screenshots.append("Request Form")
    except Exception as e:
        print(f"⚠️  Request Form: {e}")
    
    return screenshots

async def capture_testing_screenshots(page: Page):
    """Capture testing and verification screenshots"""
    print("\n📸 Capturing Testing Screenshots...")
    
    # Check data isolation by viewing data files
    screenshots = []
    
    # This would need custom pages to demonstrate isolation
    print("⚠️  Testing screenshots require custom demonstration pages")
    
    return screenshots

async def main():
    """Main capture orchestration"""
    print("=" * 60)
    print("  RosterBhai Screenshot Capture - Admin & Employee Panels")
    print("=" * 60)
    
    browser, playwright = await setup_browser()
    context = await browser.new_context(
        viewport={'width': 1920, 'height': 1080},
        locale='en-US'
    )
    page = await context.new_page()
    
    try:
        # Capture all screenshots
        admin_screens = await capture_admin_screenshots(page, TENANT_SLUG)
        employee_screens = await capture_employee_screenshots(page, TENANT_SLUG)
        testing_screens = await capture_testing_screenshots(page)
        
        # Summary
        print("\n" + "=" * 60)
        print("  SCREENSHOT CAPTURE SUMMARY")
        print("=" * 60)
        print(f"\n✓ Admin Panel: {len(admin_screens)} screenshots")
        for screen in admin_screens:
            print(f"  - {screen}")
        
        print(f"\n✓ Employee Portal: {len(employee_screens)} screenshots")
        for screen in employee_screens:
            print(f"  - {screen}")
        
        print(f"\n✓ Testing: {len(testing_screens)} screenshots")
        
        total = len(admin_screens) + len(employee_screens) + len(testing_screens)
        print(f"\n📊 Total Captured: {total} screenshots")
        print(f"📁 Location: {SCREENSHOTS_DIR}/")
        
    except Exception as e:
        print(f"\n❌ Error during capture: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        await context.close()
        await browser.close()
        await playwright.stop()
        print("\n✓ Browser closed")

if __name__ == "__main__":
    asyncio.run(main())
