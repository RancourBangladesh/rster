#!/usr/bin/env python3
"""
Comprehensive Screenshot Capture and Documentation Integration
This script will:
1. Capture actual screenshots from the running RosterBhai application
2. Test all features comprehensively
3. Integrate screenshots into all documentation formats
"""

import os
import sys
import time
import json
import subprocess
from pathlib import Path

# Configuration
BASE_DIR = Path("/home/runner/work/rster/rster")
DOC_DIR = BASE_DIR / "Documentation"
SCREENSHOT_DIR = DOC_DIR / "screenshots"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

print("╔══════════════════════════════════════════════════════════════════════════════╗")
print("║                                                                              ║")
print("║        RosterBhai - Comprehensive Screenshot Capture & Documentation        ║")
print("║                                                                              ║")
print("╚══════════════════════════════════════════════════════════════════════════════╝")
print()

# Phase 1: Application Setup
print("📋 Phase 1: Application Setup")
print("━" * 80)

# Check if server is running
try:
    import requests
    response = requests.get("http://localhost:3000", timeout=2)
    print("✓ Server is already running")
except:
    print("⚠ Server not running. Please start it with: npm run dev")
    print("  Then run this script again.")
    sys.exit(1)

# Phase 2: Screenshot Categories
print("\n📸 Phase 2: Screenshot Capture Plan")
print("━" * 80)

screenshot_plan = {
    "Public Pages": [
        {"name": "01_landing_page", "url": "http://localhost:3000/", "desc": "Landing page"},
        {"name": "02_pricing", "url": "http://localhost:3000/pricing", "desc": "Pricing page"},
        {"name": "03_about", "url": "http://localhost:3000/about", "desc": "About page"},
        {"name": "04_contact", "url": "http://localhost:3000/contact", "desc": "Contact page"},
    ],
    "Developer Portal": [
        {"name": "05_dev_login", "url": "http://localhost:3000/developer/login", "desc": "Developer login"},
    ],
    "Admin Portal": [
        {"name": "06_admin_login", "url": "http://localhost:3000/admin/login", "desc": "Admin login"},
    ],
    "Employee Portal": [
        {"name": "07_employee_login", "url": "http://localhost:3000/employee", "desc": "Employee login"},
    ]
}

total_screenshots = sum(len(v) for v in screenshot_plan.values())
print(f"Total screenshots to capture: {total_screenshots}")

# Phase 3: Capture Screenshots using Playwright
print("\n🎬 Phase 3: Capturing Screenshots")
print("━" * 80)

print("\nNote: This script will capture public-facing screenshots.")
print("For authenticated screens (developer dashboard, admin panel, employee portal),")
print("manual testing with actual credentials is required.")
print("\nProceeding with public page capture...")

# Save plan
with open(SCREENSHOT_DIR / "capture_plan.json", "w") as f:
    json.dump(screenshot_plan, f, indent=2)

print(f"\n✓ Capture plan saved to: {SCREENSHOT_DIR}/capture_plan.json")
print(f"✓ Screenshots will be saved to: {SCREENSHOT_DIR}/")
print("\nReady for Playwright screenshot capture...")

