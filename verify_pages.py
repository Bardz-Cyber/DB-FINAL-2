from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Log console messages
        page.on("console", lambda msg: print(f"Console: {msg.text}"))

        # 1. Register page
        print("Navigating to register page...")
        page.goto("http://localhost:8000/register.html")

        # Fill in registration
        student_id = f"test-{int(time.time())}"
        print(f"Registering student {student_id}...")
        page.fill("input[name='student_id']", student_id)
        page.fill("input[name='first_name']", "Test")
        page.fill("input[name='last_name']", "User")
        page.fill("input[name='email']", f"{student_id}@example.com")
        page.fill("input[name='password']", "password123")
        page.fill("input[name='confirm_password']", "password123")

        page.click("button[type='submit']")

        print("Waiting for login page...")
        page.wait_for_url("http://localhost:8000/login.html")
        print("On login page.")

        # Fill in login
        page.fill("input[name='student_id']", student_id)
        page.fill("input[name='password']", "password123")
        page.click("button[type='submit']")

        print("Waiting for dashboard...")
        page.wait_for_url("http://localhost:8000/dashboard.html")
        print("On dashboard.")

        # Let dashboard fetch items
        page.wait_for_timeout(2000)
        page.screenshot(path="/home/jules/verification/dashboard_page.png", full_page=True)

        # Open modal using JS since the button text might be just an icon
        page.evaluate("openModal()")
        page.wait_for_timeout(1000)
        page.screenshot(path="/home/jules/verification/dashboard_modal.png")

        browser.close()

if __name__ == "__main__":
    run()
