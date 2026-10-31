from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
import json, traceback
ROOT=Path(__file__).resolve().parents[1]
PREVIEW=ROOT/'preview-phase3'
SHOT=PREVIEW/'screenshots'
SHOT.mkdir(parents=True,exist_ok=True)
issues=[]
def validate(name,condition):
 print(('PASS' if condition else 'FAIL')+': '+name)
 if not condition: issues.append(name)
def run():
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  context=browser.new_context(viewport={'width':1560,'height':950},device_scale_factor=1,accept_downloads=True)
  page=context.new_page()
  page.on('pageerror',lambda e: issues.append('Browser error: '+str(e)))
  page.on('console',lambda m: issues.append('Console error: '+m.text) if m.type=='error' else None)
  def serve(route):
   name=urlparse(route.request.url).path.lstrip('/') or 'index.html'
   if name in ('index.html','style.css','app.js'):
    content=(PREVIEW/name).read_bytes()
    ctype={'index.html':'text/html','style.css':'text/css','app.js':'application/javascript'}[name]
    route.fulfill(status=200,body=content,content_type=ctype)
   else:route.abort()
  page.route('**/*',serve)
  markup=(PREVIEW/'index.html').read_text()
  css=(PREVIEW/'style.css').read_text().replace("@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');",'')
  js=(PREVIEW/'app.js').read_text()
  fake_storage="""<script>window.__testStore={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>window.__testStore[k]||null,setItem:(k,v)=>{window.__testStore[k]=v},removeItem:k=>delete window.__testStore[k]}});</script>"""
  markup=markup.replace('<link rel="stylesheet" href="./style.css"/>','<style>'+css+'</style>')
  markup=markup.replace('<script src="./app.js"></script>',fake_storage+'<script>'+js+'</script>')
  page.set_content(markup,wait_until='domcontentloaded')
  page.wait_for_timeout(400)
  validate('loads initial visual designer',page.locator('.p-hero h1').count()==1)
  validate('has all three panels',page.locator('.left-panel').is_visible() and page.locator('.right-panel').is_visible())
  page.screenshot(path=str(SHOT/'editor-desktop.png'),full_page=False)
  initialCount=page.locator('.p-section').count()
  try:
   page.locator('[data-block-type="Text"]').drag_to(page.locator('[data-drop-index="1"]'))
   validate('dragging library block inserts a page section',page.locator('.p-section').count()==initialCount+1)
   page.locator('#undo').click()
  except Exception as e:
   validate('dragging library block inserts a page section',False)

  # Select the freeform section from canvas to edit real individual elements
  page.locator('[data-tab="layers"]').click()
  page.locator('.layer-select',has_text='Freeform').click()
  validate('freeform inspector is visible',page.locator('text=ADD ELEMENT').count()>0)
  before=page.locator('[data-node]').count()
  page.locator('[data-action="add-node"][data-kind="label"]').click()
  validate('adds a new freeform label',page.locator('[data-node]').count()==before+1)
  page.locator('[data-node-key="text"]').fill('DESIGNED WITH PURPOSE')
  page.locator('[data-node-key="text"]').press('Tab')
  validate('edits selected label text',page.locator('.p-note',has_text='DESIGNED WITH PURPOSE').count()==1)
  page.locator('[data-node-key="tone"]').select_option('accent')
  validate('adjusts element color',page.locator('.p-note',has_text='DESIGNED WITH PURPOSE').get_attribute('class').find('tone-accent')!=-1)
  page.locator('.p-free-stage').scroll_into_view_if_needed()
  page.screenshot(path=str(SHOT/'editor-freeform-inspector.png'),full_page=False)
  page.locator('[data-device="mobile"]').click()
  x0=page.locator('[data-position-key="x"]').input_value()
  page.locator('[data-position-key="x"]').fill('18')
  page.locator('[data-position-key="x"]').press('Tab')
  validate('saves a mobile-only position override',page.locator('[data-position-key="x"]').input_value()=='12')
  page.set_viewport_size({'width':390,'height':844})
  page.screenshot(path=str(SHOT/'mobile-freeform-inspector.png'),full_page=True)
  page.set_viewport_size({'width':1560,'height':950})
  page.locator('[data-device="desktop"]').click()
  validate('desktop position remains independent',page.locator('[data-position-key="x"]').input_value()!= '18' or x0=='18')
  # Pointer drag - move freeform element
  note=page.locator('.p-note',has_text='DESIGNED WITH PURPOSE').first
  box=note.bounding_box()
  if box:
   page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2)
   page.mouse.down();page.mouse.move(box['x']+box['width']/2+38,box['y']+box['height']/2+18,steps=6);page.mouse.up()
   validate('pointer drag commits new position',page.locator('[data-position-key="x"]').input_value()!='8')
  else: validate('pointer drag commits new position',False)
  page.locator('[data-action="duplicate-node"]').click()
  validate('duplicate creates new element',page.locator('.p-note',has_text='DESIGNED WITH PURPOSE').count()==2)
  page.locator('#undo').click()
  validate('undo restores previous number of nodes',page.locator('.p-note',has_text='DESIGNED WITH PURPOSE').count()==1)
  page.locator('#redo').click()
  validate('redo restores duplicated node',page.locator('.p-note',has_text='DESIGNED WITH PURPOSE').count()==2)
  # Template variation and saved profile information
  page.locator('[data-tab="design"]').click()
  page.locator('[data-template="midnight"]').click()
  validate('template changes background and composition',page.locator('.portfolio.midnight').count()==1)
  page.once('dialog',lambda d:d.accept());page.locator('[data-action="apply-preset"]').click()
  validate('midnight has different ordering',page.locator('.p-section').nth(1).locator('.p-skills').count()==1)
  page.locator('[data-tab="content"]').click()
  page.locator('[data-site-key="name"]').fill('Jordan Lee')
  page.locator('[data-site-key="name"]').press('Tab')
  validate('content changes rendered portfolio',page.locator('.intro-name',has_text='Jordan Lee').count()==1)
  page.once('dialog',lambda d:d.accept());page.locator('#publish').click()
  page.wait_for_timeout(400)
  validate('local publication exists',page.locator('#viewPublished').is_enabled())
  page.locator('[data-site-key="heroOne"]').fill('Updated after publishing')
  page.locator('[data-site-key="heroOne"]').press('Tab')
  validate('draft contains later change',page.locator('.p-hero h1',has_text='Updated after publishing').count()==1)
  page.locator('#viewPublished').click()
  validate('published snapshot is independent of draft',page.locator('.p-hero h1',has_text='Updated after publishing').count()==0)
  page.locator('#viewPublished').click()
  # Screenshot desktop after edits
  page.locator('[data-device="desktop"]').click()
  page.screenshot(path=str(SHOT/'editor-updated.png'),full_page=False)
  # preview width comparisons & clipping
  for d in ['desktop','tablet','mobile']:
   page.locator(f'[data-device="{d}"]').click()
   page.locator('#previewToggle').click()
   page.wait_for_timeout(120)
   overflow=page.evaluate('''() => {const el=document.querySelector('#canvasPaper');const site=document.querySelector('.portfolio');return site.scrollWidth>el.clientWidth+3;}''')
   validate(f'{d} portfolio viewport has no horizontal overflow',not overflow)
   page.screenshot(path=str(SHOT/f'portfolio-{d}.png'),full_page=True)
   page.locator('#previewToggle').click()
  # actual narrow screen viewport
  page.set_viewport_size({'width':390,'height':844})
  page.wait_for_timeout(200)
  page.screenshot(path=str(SHOT/'editor-mobile.png'),full_page=True)
  validate('mobile editor viewport does not overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
  # Export and import portable draft JSON (local only).
  with page.expect_download() as download:
   page.locator('#downloadDraft').click()
  exported=json.loads(Path(download.value.path()).read_text())
  validate('exports a valid versioned JSON draft',exported.get('layout',{}).get('schemaVersion')==1)
  exported['site']['name']='Imported Developer'
  page.once('dialog',lambda d:d.accept())
  page.locator('#importDraft').set_input_files({'name':'imported.json','mimeType':'application/json','buffer':json.dumps(exported).encode()})
  page.locator('.intro-name',has_text='Imported Developer').wait_for(state='visible',timeout=4000)
  validate('imports a valid draft and updates content',page.locator('.intro-name',has_text='Imported Developer').count()==1)
  # Browser-only save should store the latest draft and a separate publication snapshot.
  page.wait_for_timeout(550)
  persist=page.evaluate("""() => JSON.parse(window.__testStore['devfolio.phase3.visualstudio.v1']||'null')""")
  validate('autosave persists draft and local publication',bool(persist and persist.get('draft',{}).get('site',{}).get('name')=='Imported Developer' and persist.get('publication')))
  validate('template persists in saved draft',bool(persist and persist.get('draft',{}).get('template')=='midnight'))
  context.close();browser.close()
if __name__=='__main__':
 try:run()
 except Exception as e:print('UNCAUGHT:',str(e));traceback.print_exc();issues.append(str(e))
 print('\nFAILED',len(issues),'\n'+'\n'.join(issues))
 raise SystemExit(1 if issues else 0)
