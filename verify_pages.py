import asyncio
from playwright.async_api import async_playwright
import os

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # We need an absolute path to the local html files
        base_dir = os.path.abspath('/app/client')

        # Verify Login Page
        login_url = f"file://{base_dir}/login.html"
        print(f"Loading {login_url}")
        await page.goto(login_url)
        await page.wait_for_load_state('networkidle')
        await page.screenshot(path='/app/login_screenshot.png')
        print("Took screenshot of login page")

        await browser.close()

asyncio.run(verify())
