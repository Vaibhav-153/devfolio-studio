"""Render self-contained static appearance previews in managed Chromium."""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for name,width,height in [('index',1440,940),('index-mobile',390,844),('dashboard',1440,940),('dashboard-mobile',390,844)]:
        source='dashboard.html' if name.startswith('dashboard') else 'index.html'
        page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
        page.goto('about:blank')
        page.set_content((root/'preview'/source).read_text(),wait_until='domcontentloaded')
        page.screenshot(path=str(root/'preview'/(name+'.png')),full_page=False)
        size=page.evaluate('({scroll:document.documentElement.scrollWidth,viewport:window.innerWidth})')
        print(name,size)
        page.close()
    browser.close()
