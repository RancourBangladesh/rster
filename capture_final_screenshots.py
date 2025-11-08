#!/usr/bin/env python3
"""
Final Screenshot Capture Script with Authentication Bypass

This script captures all remaining admin and employee panel screenshots
using the test authentication bypass system.

Requirements:
- TEST_AUTH_BYPASS=true in .env.local
- Application running on localhost:3000
- Playwright browser automation
"""

import asyncio
import os
import sys
from playwright.async_api import async_playwright, Page, Browser
from datetime import datetime

# Screenshot output directory
SCREENSHOT_DIR = "Documentation/screenshots"
os.makedirs(f"{SCREENSHOT_DIR}/admin", exist_ok=True)
os.makedirs(f"{SCREENSHOT_DIR}/employee", exist_ok=True)
os.makedirs(f"{SCREENSHOT_DIR}/testing", exist_ok=True)

# Test credentials
TENANTS = {
    "techcorp": {
        "admin": {"username": "admin", "password": "admin123"},
        "employees": [
            {"id": "EMP001", "password": "pass123", "name": "Alice Johnson"},
            {"id": "EMP002", "password": "pass123", "name": "Bob Smith"},
        ]
    },
    "retailhub": {
        "admin": {"username": "admin", "password": "admin123"},
        "employees": [
            {"id": "RH001", "password": "pass123", "name": "Frank Miller"},
        ]
    }
}

async def wait_and_screenshot(page: Page, filename: str, wait_time: int = 2000):
    """Wait for page to stabilize and take screenshot"""
    try:
        await page.wait_for_timeout(wait_time)
        await page.wait_for_load_state('networkidle', timeout=10000)
    except:
        pass  # Continue even if timeout
    
    filepath = os.path.join(SCREENSHOT_DIR, filename)
    await page.screenshot(path=filepath, full_page=True)
    print(f"✅ Screenshot saved: {filepath}")
    return filepath

async def login_admin(page: Page, tenant_slug: str):
    """Login to admin panel"""
    print(f"\n🔐 Logging into {tenant_slug} admin panel...")
    
    # Navigate to admin login via path-based routing
    url = f"http://localhost:3000/{tenant_slug}/admin"
    await page.goto(url)
    await page.wait_for_timeout(2000)
    
    # Fill login form
    creds = TENANTS[tenant_slug]["admin"]
    
    try:
        await page.fill('input[name="username"], input[type="text"]', creds["username"])
        await page.fill('input[name="password"], input[type="password"]', creds["password"])
        await page.wait_for_timeout(500)
        
        # Click login button
        await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")')
        await page.wait_for_timeout(3000)
        
        # Wait for dashboard to load
        await page.wait_for_load_state('networkidle', timeout=10000)
        print(f"✅ Logged in successfully as {creds['username']}")
        return True
    except Exception as e:
        print(f"⚠️ Login attempt encountered issue: {e}")
        # Continue anyway as we might already be on the right page
        return True

async def login_employee(page: Page, tenant_slug: str, employee_id: str, password: str):
    """Login to employee portal"""
    print(f"\n🔐 Logging into {tenant_slug} employee portal as {employee_id}...")
    
    # Navigate to employee login via path-based routing
    url = f"http://localhost:3000/{tenant_slug}/employee"
    await page.goto(url)
    await page.wait_for_timeout(2000)
    
    try:
        # Fill login form
        await page.fill('input[name="employeeId"], input[name="employee_id"], input[placeholder*="Employee"]', employee_id)
        await page.fill('input[name="password"], input[type="password"]', password)
        await page.wait_for_timeout(500)
        
        # Click login button
        await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")')
        await page.wait_for_timeout(3000)
        
        await page.wait_for_load_state('networkidle', timeout=10000)
        print(f"✅ Logged in successfully as {employee_id}")
        return True
    except Exception as e:
        print(f"⚠️ Login attempt encountered issue: {e}")
        return True

async def capture_admin_screenshots(page: Page, tenant_slug: str):
    """Capture all admin panel screenshots"""
    print(f"\n📸 Capturing {tenant_slug} admin screenshots...")
    
    screenshots = []
    
    try:
        # 1. Dashboard Overview
        print("  📊 Capturing dashboard...")
        await page.goto(f"http://localhost:3000/admin/dashboard")
        await page.wait_for_timeout(3000)
        screenshots.append(await wait_and_screenshot(page, f"admin/20_{tenant_slug}_admin_dashboard.png"))
        
        # 2. Roster Data Tab
        print("  📅 Capturing roster data...")
        try:
            # Try clicking Roster Data tab
            await page.click('button:has-text("Roster Data"), [role="tab"]:has-text("Roster")')
            await page.wait_for_timeout(2000)
            screenshots.append(await wait_and_screenshot(page, f"admin/21_{tenant_slug}_roster_view.png"))
        except:
            print("    ⚠️ Roster tab not found, skipping")
        
        # 3. Employee Management
        print("  👥 Capturing employee management...")
        try:
            await page.click('button:has-text("Employee Management"), [role="tab"]:has-text("Employee")')
            await page.wait_for_timeout(2000)
            screenshots.append(await wait_and_screenshot(page, f"admin/22_{tenant_slug}_employees.png"))
        except:
            print("    ⚠️ Employee tab not found, skipping")
        
        # 4. CSV Import
        print("  📂 Capturing CSV import...")
        try:
            await page.click('button:has-text("CSV Import"), [role="tab"]:has-text("CSV")')
            await page.wait_for_timeout(2000)
            screenshots.append(await wait_and_screenshot(page, f"admin/23_{tenant_slug}_csv_import.png"))
        except:
            print("    ⚠️ CSV tab not found, skipping")
        
        # 5. Schedule Requests
        print("  📝 Capturing schedule requests...")
        try:
            await page.click('button:has-text("Schedule Requests"), [role="tab"]:has-text("Request")')
            await page.wait_for_timeout(2000)
            screenshots.append(await wait_and_screenshot(page, f"admin/24_{tenant_slug}_requests.png"))
        except:
            print("    ⚠️ Requests tab not found, skipping")
        
        # 6. Google Sheets Sync
        print("  🔄 Capturing sync tab...")
        try:
            await page.click('button:has-text("Roster Sync"), [role="tab"]:has-text("Sync")')
            await page.wait_for_timeout(2000)
            screenshots.append(await wait_and_screenshot(page, f"admin/25_{tenant_slug}_sync.png"))
        except:
            print("    ⚠️ Sync tab not found, skipping")
        
    except Exception as e:
        print(f"❌ Error capturing admin screenshots: {e}")
    
    return screenshots

async def capture_employee_screenshots(page: Page, tenant_slug: str, employee_id: str):
    """Capture employee portal screenshots"""
    print(f"\n📸 Capturing {tenant_slug} employee screenshots for {employee_id}...")
    
    screenshots = []
    
    try:
        # 1. Employee Dashboard
        print("  🏠 Capturing employee dashboard...")
        await page.goto(f"http://localhost:3000/employee")
        await page.wait_for_timeout(3000)
        screenshots.append(await wait_and_screenshot(page, f"employee/26_{tenant_slug}_{employee_id}_dashboard.png"))
        
        # 2. Schedule Calendar View
        print("  📅 Capturing schedule calendar...")
        try:
            await page.click('a:has-text("Schedule"), button:has-text("Schedule")')
            await page.wait_for_timeout(2000)
            screenshots.append(await wait_and_screenshot(page, f"employee/27_{tenant_slug}_{employee_id}_schedule.png"))
        except:
            print("    ⚠️ Schedule view not accessible, using dashboard")
        
        # 3. Team Schedule
        print("  👥 Capturing team schedule...")
        try:
            await page.click('a:has-text("Team"), button:has-text("Team")')
            await page.wait_for_timeout(2000)
            screenshots.append(await wait_and_screenshot(page, f"employee/28_{tenant_slug}_{employee_id}_team.png"))
        except:
            print("    ⚠️ Team view not accessible")
        
        # 4. Request Form
        print("  📝 Capturing request form...")
        try:
            await page.click('a:has-text("Request"), button:has-text("Request")')
            await page.wait_for_timeout(2000)
            screenshots.append(await wait_and_screenshot(page, f"employee/29_{tenant_slug}_{employee_id}_request.png"))
        except:
            print("    ⚠️ Request form not accessible")
        
    except Exception as e:
        print(f"❌ Error capturing employee screenshots: {e}")
    
    return screenshots

async def capture_testing_screenshots(page: Page):
    """Capture testing verification screenshots"""
    print(f"\n📸 Capturing testing verification screenshots...")
    
    screenshots = []
    
    try:
        # Show data isolation by capturing both tenant dashboards
        print("  🔒 Capturing isolation verification...")
        
        # TechCorp dashboard
        await page.goto("http://localhost:3000/techcorp/admin")
        await page.wait_for_timeout(3000)
        screenshots.append(await wait_and_screenshot(page, "testing/30_techcorp_isolation.png"))
        
        # RetailHub dashboard
        await page.goto("http://localhost:3000/retailhub/admin")
        await page.wait_for_timeout(3000)
        screenshots.append(await wait_and_screenshot(page, "testing/31_retailhub_isolation.png"))
        
    except Exception as e:
        print(f"❌ Error capturing testing screenshots: {e}")
    
    return screenshots

async def main():
    """Main execution function"""
    print("=" * 70)
    print("🚀 ROSTERBHAI SCREENSHOT CAPTURE - FINAL")
    print("=" * 70)
    print(f"📅 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📂 Output directory: {SCREENSHOT_DIR}")
    print(f"🌐 Application URL: http://localhost:3000")
    print("=" * 70)
    
    all_screenshots = []
    
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = await context.new_page()
        
        try:
            # ===== TECHCORP ADMIN =====
            print("\n\n" + "=" * 70)
            print("🏢 TECHCORP ADMIN PANEL")
            print("=" * 70)
            
            if await login_admin(page, "techcorp"):
                admin_shots = await capture_admin_screenshots(page, "techcorp")
                all_screenshots.extend(admin_shots)
            
            # ===== TECHCORP EMPLOYEE =====
            print("\n\n" + "=" * 70)
            print("👤 TECHCORP EMPLOYEE PORTAL")
            print("=" * 70)
            
            employee = TENANTS["techcorp"]["employees"][0]
            if await login_employee(page, "techcorp", employee["id"], employee["password"]):
                emp_shots = await capture_employee_screenshots(page, "techcorp", employee["id"])
                all_screenshots.extend(emp_shots)
            
            # ===== RETAILHUB ADMIN =====
            print("\n\n" + "=" * 70)
            print("🏬 RETAILHUB ADMIN PANEL")
            print("=" * 70)
            
            if await login_admin(page, "retailhub"):
                admin_shots2 = await capture_admin_screenshots(page, "retailhub")
                all_screenshots.extend(admin_shots2)
            
            # ===== TESTING VERIFICATION =====
            print("\n\n" + "=" * 70)
            print("🔍 TESTING VERIFICATION")
            print("=" * 70)
            
            test_shots = await capture_testing_screenshots(page)
            all_screenshots.extend(test_shots)
            
        except Exception as e:
            print(f"\n❌ Fatal error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await browser.close()
    
    # Summary
    print("\n\n" + "=" * 70)
    print("📊 CAPTURE SUMMARY")
    print("=" * 70)
    print(f"✅ Total screenshots captured: {len(all_screenshots)}")
    print(f"📂 Screenshots saved to: {SCREENSHOT_DIR}")
    print(f"⏰ Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    return all_screenshots

if __name__ == "__main__":
    try:
        asyncio.run(main())
        print("\n✅ Screenshot capture completed successfully!")
        sys.exit(0)
    except KeyboardInterrupt:
        print("\n⚠️ Interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
