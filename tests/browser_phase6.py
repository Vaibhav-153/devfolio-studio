from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
HTML=(ROOT/'preview-phase6/index.html').read_text()
SHOTS=ROOT/'preview-phase6/screenshots';SHOTS.mkdir(parents=True,exist_ok=True)
results=[]
def check(name,good):
 results.append(bool(good));print(('PASS' if good else 'FAIL')+': '+name)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1,accept_downloads=True)
 errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
 page.set_content(HTML,wait_until='domcontentloaded')
 check('launch title renders',page.get_by_role('heading',name='Make the next launch dependable.').count()==1)
 check('eight actionable gates render',page.locator('[data-gate]').count()==8)
 check('initial state records no verified gates',page.locator('#done-count').inner_text()=='0 / 8')
 check('always marks source as not deployed',page.locator('.status').inner_text()=='Not yet deployed')
 page.screenshot(path=str(SHOTS/'launch-desktop.png'),full_page=True)
 page.locator('[data-gate="repo"]').check()
 check('checking a gate updates progress',page.locator('#done-count').inner_text()=='1 / 8' and page.locator('#progress-label').inner_text()=='13%')
 check('checking a gate states it is local',page.get_by_text('Marked reviewed locally').count()==1)
 page.on('dialog',lambda dialog:dialog.accept());page.get_by_role('button',name='Reset checklist').click()
 check('manual review status can be reset',page.locator('#done-count').inner_text()=='0 / 8')
 with page.expect_download() as download_info:page.get_by_role('button',name='Export reviewed status').click()
 download=download_info.value
 check('status exports a JSON file',download.suggested_filename.endswith('.json'))
 page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(100)
 page.screenshot(path=str(SHOTS/'launch-mobile.png'),full_page=True)
 check('390px mobile has no horizontal overflow',page.evaluate('document.documentElement.scrollWidth <= window.innerWidth+3'))
 page.set_viewport_size({'width':320,'height':760});page.wait_for_timeout(100)
 check('320px mobile has no horizontal overflow',page.evaluate('document.documentElement.scrollWidth <= window.innerWidth+3'))
 check('no page JavaScript errors',not errors)
 browser.close()
print(f'PHASE6 BROWSER: {sum(results)}/{len(results)} passed')
if not all(results):raise SystemExit(1)
