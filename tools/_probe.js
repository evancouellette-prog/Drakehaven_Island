const path=require('path'), fs=require('fs');
const {chromium}=require('playwright-core');
const ROOT='/home/user/Drakehaven_Island';
(async()=>{
  const exe=['/opt/pw-browsers/chromium/chrome-linux/chrome','/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(p=>fs.existsSync(p));
  const b=await chromium.launch({executablePath:exe,args:['--no-sandbox','--mute-audio']});
  const p=await b.newPage({viewport:{width:1280,height:760}});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e.message))); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto('file://'+path.join(ROOT,'index.html'));
  await p.waitForTimeout(800);
  // build a character straight through the API and go to the market
  await p.evaluate(async ()=>{
    const ch = DH.char.create({name:'Probe',raceId:'human',classId:'rogue',subclassId:'thief',
      backgroundId:'criminal',abilities:{str:10,dex:15,con:12,int:13,wis:10,cha:12},
      skills:['stealth','sleight_of_hand','perception','investigation'],level:3});
    DH.game.state.party=[ch]; DH.game.pc().gold=1000;
    DH.game.replace(DH.scenes.overworld,{map:'market',spawn:'start'});
    DH.game.flushOps();
  });
  await p.waitForTimeout(700);
  console.log('scene:', await p.evaluate(()=>DH.game.current().name));
  await p.evaluate(()=>DH.scenes.script.run('shop_potion_stand'));
  await p.waitForTimeout(500);
  console.log('after run — dlg visible:', await p.locator('#dlg').isVisible().catch(()=>false),
              'running:', await p.evaluate(()=>DH.scenes.script.isRunning()));
  for(let i=0;i<8;i++){
    await p.keyboard.press('Space'); await p.waitForTimeout(350);
    const vis = await p.locator('#shop').isVisible().catch(()=>false);
    console.log(' press',i,'shop visible:',vis,'running:',await p.evaluate(()=>DH.scenes.script.isRunning()),
      'scene:',await p.evaluate(()=>DH.game.current().name));
    if(vis) break;
  }
  console.log('wares:', await p.locator('#shop-buy .wares').count());
  console.log('errors:', errs.slice(0,6));
  await p.screenshot({path:'/tmp/probe-shop.png'});
  await b.close();
})();
