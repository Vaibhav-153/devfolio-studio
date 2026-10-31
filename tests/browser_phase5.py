from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
HTML=(ROOT/'preview-phase5/standalone.html').read_text()
SHOTS=ROOT/'preview-phase5/screenshots'
SHOTS.mkdir(exist_ok=True)
results=[]
def check(label,value):
    results.append(bool(value));print(('PASS' if value else 'FAIL')+': '+label)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1440,'height':920},device_scale_factor=1)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(HTML,wait_until='domcontentloaded')
    check('title renders',page.get_by_role('heading',name='Confidence before launch.').count()==1)
    check('twelve launch tasks render',page.locator('input[type=checkbox]').count()==12)
    check('all verification boxes start unchecked',page.locator('input[type=checkbox]:checked').count()==0)
    page.screenshot(path=str(SHOTS/'readiness-desktop.png'),full_page=True)
    page.locator('input[type=checkbox]').first.check()
    check('verification count updates',page.locator('#progress-label').inner_text()=='1/12 verified')
    check('progress bar updates',page.locator('#progress-fill').evaluate('(x)=>parseInt(x.style.width)>0'))
    page.get_by_role('button',name='Clear local checks').click()
    check('checklist can reset',page.locator('#progress-label').inner_text()=='0/12 verified')
    page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(130)
    page.screenshot(path=str(SHOTS/'readiness-mobile.png'),full_page=True)
    check('mobile layout no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+3'))
    check('mobile checkboxes remain accessible',page.locator('input[type=checkbox]').count()==12)
    page.set_viewport_size({'width':320,'height':760});page.wait_for_timeout(80)
    check('narrow phone no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+3'))
    check('no browser errors',not errors)
    browser.close()
print(f'Browser readiness tests: {sum(results)}/{len(results)}')
if not all(results):raise SystemExit(1)
