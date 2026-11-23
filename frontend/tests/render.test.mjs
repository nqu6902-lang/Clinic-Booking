// Logic/render smoke checks using a minimal document stub, not browser layout tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as demo from '../assets/demo.js';

class Element {
  innerHTML = ''; textContent = ''; value = ''; open = false; isConnected = true;
  children = []; dataset = {}; disabled = false;
  classList = { add(){}, remove(){}, toggle(){return true;}, contains(){return false;} };
  addEventListener(){} setAttribute(){} append(value){this.children.push(value);} remove(){}
  showModal(){this.open=true;} close(){this.open=false;}
}
const elements = new Map();
const documentStub = {
  querySelector(selector) { if(!elements.has(selector))elements.set(selector,new Element());return elements.get(selector); },
  querySelectorAll() { return []; }, addEventListener(){}, createElement(){return new Element();},
};
const storage = new Map();
Object.assign(globalThis, {
  document: documentStub,
  window: { addEventListener(){}, scrollTo(){} },
  location: { hash: '' },
  history: { replaceState(_a,_b,url){globalThis.location.hash=url;} },
});
Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))}});
const nativeTimer = globalThis.setTimeout;
globalThis.setTimeout = (handler, delay, ...args) => { const timer=nativeTimer(handler,delay,...args);timer.unref();return timer; };
globalThis.fetch = async path => new Response(JSON.stringify(path.endsWith('/health/db')?{database:'ok'}:{status:'ok'}),{headers:{'content-type':'application/json'}});
demo.reset();
const sourceUrl = new URL('../assets/app.js',import.meta.url);
let source = await fs.readFile(sourceUrl,'utf8');
source = source.replace(/from '(\.\/[^']+)'/g,(_all,path)=>`from '${new URL(path,sourceUrl).href}'`);
source += '\nexport { state, navigate, renderDoctorResults, buildReport, renderHistory };';
const app = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

const routes = {
  patient:['dashboard','doctors','booking','appointments','history','invoices','profile'],
  receptionist:['dashboard','appointments','invoices','profile'],
  doctor:['dashboard','appointments','history','profile'],
  admin:['dashboard','doctors','services','invoices','reports','profile'],
};
for(const [role,pages] of Object.entries(routes)) {
  for(const page of pages) {
    test(`${role}: ${page} renders without an exception`, async()=>{
      app.state.user=demo.users[role];app.state.mode='demo';
      app.state.filters={search:'',specialty:'',status:'',date:''};
      await app.navigate(page);
      const html=elements.get('#main-content').innerHTML;
      assert.ok(html.includes('<h1'), 'Page has a heading');
      assert.ok(!html.includes('Chưa thể tải thông tin'), 'No render error card');
      assert.equal(app.state.route,page);
      if(page==='booking')assert.equal(app.state.booking.slots.length,12);
      if(page==='reports')assert.equal(app.state.report.data.total,1950000);
    });
  }
}
test('patient preview only loads own records and invoices', async()=>{
  app.state.user=demo.users.patient;await app.navigate('history');
  assert.equal(app.state.data.visits.length,2);
  assert.ok(app.state.data.visits.every(v=>v.patient_id===1));
  assert.ok(app.state.data.invoices.every(v=>v.patient_id===1));
});
test('doctor preview only loads assigned records', async()=>{
  app.state.user=demo.users.doctor;await app.navigate('history');
  assert.ok(app.state.data.visits.every(v=>v.doctor_id===1));
  assert.equal(app.state.data.invoices.length,0);
});
test('clinical history is not a receptionist or administrator route', async()=>{
  for(const role of ['receptionist','admin']){
    app.state.user=demo.users[role];await app.navigate('history');
    assert.equal(app.state.route,'dashboard');assert.deepEqual(app.state.data.visits,[]);
  }
});
test('rendered medical notes cannot inject HTML', async()=>{
  app.state.user=demo.users.patient;await app.navigate('history');
  app.state.data.visits[0].patient_name='<img src=x onerror=alert(1)>';
  app.state.user=demo.users.doctor;app.renderHistory();
  const html=elements.get('#main-content').innerHTML;
  assert.ok(!html.includes('<img'));
  assert.ok(html.includes('&lt;img'));
});
test('revenue excludes unpaid invoices and supports service filters',()=>{
  const invoices=demo.read().invoices;
  const all=app.buildReport(invoices,demo.day(-13),demo.day(),'');
  assert.equal(all.total,1950000);assert.equal(all.invoice_count,2);
  const filling=app.buildReport(invoices,demo.day(-13),demo.day(),'4');
  assert.equal(filling.total,1200000);assert.equal(filling.invoice_count,1);
});
test('revenue date boundaries use Vietnam time even for UTC timestamps',()=>{
  const invoice={status:'paid',paid_at:'2026-11-19T18:30:00Z',items:[{service_id:1,name:'Mẫu',quantity:1,price:200000}]};
  assert.equal(app.buildReport([invoice],'2026-11-19','2026-11-19','').total,0);
  assert.equal(app.buildReport([invoice],'2026-11-20','2026-11-20','').total,200000);
});
