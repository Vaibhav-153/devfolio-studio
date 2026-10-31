from playwright.sync_api import sync_playwright
from pathlib import Path
root=Path("/mnt/data/devfolio-studio-phase2")
url=(root/'preview-phase2/index.html').as_uri()
html=(root/'preview-phase2/index.html').read_text()
css=(root/'preview-phase2/style.css').read_text().replace("@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');","")
js=(root/'preview-phase2/app.js').read_text()
html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+css+'</style>')
# The managed browser disallows file:/ and localhost navigation; use an in-memory page.
# It has an opaque origin, so we inject a lightweight localStorage shim for smoke tests.
shim="<script>window.__testStorage={};Object.defineProperty(window,'localStorage',{value:{getItem(k){return window.__testStorage[k]||null},setItem(k,v){window.__testStorage[k]=String(v)},removeItem(k){delete window.__testStorage[k]}}});</script>"
html=html.replace('<script src="app.js" defer></script>',shim+'<script>'+js+'</script>')
out=root/'preview-phase2/screenshots'
out.mkdir(exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('about:blank');page.set_content(html,wait_until='domcontentloaded',timeout=12000)
 page.screenshot(path=str(out/'overview-desktop.png'),full_page=True)
 assert 'Welcome back, Alex' in page.locator('main#app').inner_text()
 page.locator('nav button[data-view="projects"]').click()
 assert page.locator('.project-card').count()==3
 page.screenshot(path=str(out/'projects-desktop.png'),full_page=True)
 page.locator('[data-action="new-project"]').click()
 page.locator('input[name="title"]').fill('Automated Code Inspector')
 page.locator('textarea[name="summary"]').fill('Developer-focused code review tool with explainable recommendations.')
 page.locator('input[name="tech"]').fill('TypeScript, Python, React')
 page.locator('form#projectForm button[type="submit"]').click()
 assert 'Edit Automated Code Inspector' in page.locator('#app').inner_text()
 assert len(page.evaluate('JSON.parse(localStorage.getItem("devfolio.phase2.offline.content.v1")).projects'))==4
 page.screenshot(path=str(out/'project-editor.png'),full_page=True)
 page.locator('nav button[data-view="categories"]').click()
 page.locator('form[data-form="category"] input[name="name"]').fill('Developer Tools')
 page.locator('form[data-form="category"] button[type="submit"]').click()
 assert 'Developer Tools' in page.locator('#app').inner_text()
 page.locator('nav button[data-view="career"]').click()
 page.locator('[data-action="career-tab"][data-kind="certification"]').click()
 page.locator('form[data-form="career"] input[name="name"]').fill('AWS Cloud Fundamentals')
 page.locator('form[data-form="career"] button[type="submit"]').click()
 assert 'AWS Cloud Fundamentals' in page.locator('#app').inner_text()
 page.locator('nav button[data-view="skills"]').click()
 page.screenshot(path=str(out/'skills-desktop.png'),full_page=True)
 page.locator('form[data-form="skillgroup"] input[name="name"]').fill('Infrastructure')
 page.locator('form[data-form="skillgroup"] button.btn.primary').click()
 assert 'Infrastructure' in page.locator('#app').inner_text()
 page.locator('nav button[data-view="preview"]').click()
 page.screenshot(path=str(out/'portfolio-preview-desktop.png'),full_page=True)
 page.locator('[data-action="preview-mobile"]').click()
 page.screenshot(path=str(out/'portfolio-preview-mobile-canvas.png'),full_page=True)
 page.set_viewport_size({'width':390,'height':844})
 page.goto('about:blank');page.set_content(html,wait_until='domcontentloaded',timeout=12000)
 page.screenshot(path=str(out/'overview-mobile.png'),full_page=True)
 body_w=page.evaluate('document.documentElement.scrollWidth')
 assert body_w<=390,f'mobile overflow: {body_w}'
 page.locator('#mobileMenu').click()
 assert 'open' in page.locator('#sidebar').get_attribute('class')
 page.locator('#nav button[data-view="projects"]').click()
 assert 'Your projects' in page.locator('#app').inner_text()
 page.screenshot(path=str(out/'projects-mobile.png'),full_page=True)
 assert page.evaluate('document.documentElement.scrollWidth')<=390
 print('PASS: overview, project add/save, categories, certifications, skill groups, previews, mobile navigation, no horizontal overflow')
 print('console errors',errors)
 assert not errors,errors
 browser.close()
