import { icon } from './icons.js';
import { endpoints as api, request, setToken } from './api.js';
import * as demo from './demo.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const same = (a, b) => String(a) === String(b);
const money = value => `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)} ₫`;
const dateObject = value => new Date(String(value).length === 10 ? `${value}T12:00:00+07:00` : value);
const fmt = (value, options = {}) => { const d = dateObject(value); return Number.isNaN(d.getTime()) ? '—' : new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric', ...options }).format(d); };
const time = value => new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' }).format(dateObject(value));
const dateKey = value => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(dateObject(value)).map(p => [p.type,p.value]));
  return `${p.year}-${p.month}-${p.day}`;
};
const initials = name => String(name || '?').trim().split(/\s+/).slice(-2).map(x => x[0]).join('').toUpperCase();
const normalized = value => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g,'d');
function pref(key, value) { try { if (value !== undefined) localStorage.setItem(`clinic-booking.${key}`, value); else return localStorage.getItem(`clinic-booking.${key}`); } catch {} }
const savedRole = pref('preview-role');
const state = {
  mode: pref('mode') === 'api' ? 'api' : 'demo',
  user: null, route: 'dashboard', data: {}, pending: false,
  booking: { doctor: '', date: demo.day(1), slot: '', slots: [], reason: '', editing: null, loading: false },
  filters: { search: '', specialty: '', status: '', date: '' },
  report: { from: demo.day(-13), to: demo.day(), service: '', data: null },
};
if (state.mode === 'demo') state.user = demo.users[savedRole] || demo.users.patient;
const titles = { dashboard:'Tổng quan', doctors:'Đội ngũ bác sĩ', booking:'Đặt lịch khám', appointments:'Lịch khám', history:'Hồ sơ khám', invoices:'Hóa đơn', reports:'Báo cáo doanh thu', services:'Dịch vụ', profile:'Tài khoản' };
const navItems = {
  patient: [['dashboard','grid','Tổng quan'],['doctors','doctor','Đội ngũ bác sĩ'],['booking','plus','Đặt lịch khám'],['appointments','calendar','Lịch của tôi'],['history','folder','Hồ sơ khám'],['invoices','receipt','Hóa đơn']],
  receptionist: [['dashboard','grid','Tổng quan'],['appointments','calendar','Tiếp nhận bệnh nhân'],['invoices','receipt','Hóa đơn & thu phí']],
  doctor: [['dashboard','grid','Tổng quan'],['appointments','calendar','Danh sách khám'],['history','folder','Hồ sơ phụ trách']],
  admin: [['dashboard','grid','Tổng quan'],['doctors','doctor','Đội ngũ bác sĩ'],['services','grid','Danh mục dịch vụ'],['invoices','receipt','Quản lý hóa đơn'],['reports','chart','Báo cáo doanh thu']],
};
const labels = {pending:'Chờ xác nhận',confirmed:'Đã xác nhận',checked_in:'Đã check-in',completed:'Đã khám',cancelled:'Đã hủy',paid:'Đã thanh toán',unpaid:'Chưa thanh toán'};
const badge = status => `<span class="badge ${Object.hasOwn(labels,status) ? status : ''}">${esc(labels[status] || status)}</span>`;
const btn = (text, action, extra = '', kind = '') => `<button type="button" class="btn ${kind}" data-action="${action}" ${extra}>${text}</button>`;
const avatar = (person, cls = '') => `<span class="avatar ${['mint','blue','peach','lavender'].includes(person?.color) ? person.color : 'mint'} ${cls}">${esc(person?.initials || initials(person?.name))}</span>`;
const doctor = id => (state.data.doctors || []).find(d => same(d.id,id)) || {name:'Bác sĩ',specialty_name:'',room:'Phòng khám'};
const toothArt = () => `<div class="hero-art" aria-hidden="true"><div class="hero-circle"></div><div class="tooth-art">${icon('tooth',150)}</div><span class="sparkle">✦</span><span class="sparkle second">✦</span><div class="hero-pill">${icon('shield',12)} Một nụ cười, trọn an tâm</div></div>`;
const brand = () => `<div class="brand"><span class="brand-mark">${icon('tooth',25)}</span><div><div class="brand-name">clinic booking<span style="color:var(--green)">.</span></div><small>Care for your smile</small></div></div>`;
const empty = (title, message, action = '') => `<div class="empty">${icon('calendar',32)}<h3>${esc(title)}</h3><p>${esc(message)}</p>${action}</div>`;
const heading = (title, description, action = '', eyebrow = '') => `<div class="page-heading"><div>${eyebrow ? `<div class="eyebrow">${esc(eyebrow)}</div>` : ''}<h1 tabindex="-1">${esc(title)}</h1><p class="subtitle">${esc(description)}</p></div>${action}</div>`;
const stat = (label, value, description, symbol, color='') => `<div class="stat card"><div class="stat-icon ${color}">${icon(symbol,21)}</div><div><div class="stat-label">${esc(label)}</div><div class="stat-number ${String(value).includes('₫')?'currency':''}">${esc(value)}</div><div class="stat-foot">${esc(description)}</div></div></div>`;
const caption = () => `<div class="bottom-caption">${icon('shield',12)} ${state.mode === 'demo' ? 'Dữ liệu minh họa · Chỉ dùng thông tin mẫu để xem thử' : 'Chỉ xem thông tin trong phạm vi tài khoản của bạn'} <span>·</span> Clinic Booking</div>`;
function toast(message, error = false) {
  const node = document.createElement('div'); node.className = `toast ${error?'error':''}`;
  node.innerHTML = `${icon(error?'info':'check',18)}<span>${esc(message)}</span>`; $('#toasts').append(node); setTimeout(() => node.remove(),5500);
}
function modal(title, content) {
  const dialog = $('#dialog');
  dialog.innerHTML = `<div class="dialog-head"><h2 id="dialog-title">${esc(title)}</h2><button type="button" class="icon-button" data-action="close-dialog" aria-label="Đóng">${icon('close',18)}</button></div><div class="dialog-body">${content}</div>`;
  if (!dialog.open) dialog.showModal();
}
function closeModal() { $('#dialog').close(); }
function previewNotice() { return state.mode === 'demo' ? `<div class="info-box print-note">${icon('info',17)}<span>Bản xem thử. Thao tác chỉ cập nhật dữ liệu mẫu trên trình duyệt, không gửi đến phòng khám.</span></div>` : ''; }
let renderTicket = 0;
let slotTicket = 0;
function shell() {
  const items = navItems[state.user.role] || [];
  $('#app').innerHTML = `<div class="shell"><div class="mobile-backdrop" data-action="close-menu"></div><aside class="sidebar" id="sidebar">${brand()}<div class="nav-label">Không gian của bạn</div><nav class="nav" aria-label="Điều hướng chính">${items.map(([id,symbol,label])=>`<a href="#${id}" class="${state.route===id?'active':''}" ${state.route===id?'aria-current="page"':''}>${icon(symbol,19)}<span>${label}</span></a>`).join('')}</nav><div class="nav-label">Cá nhân</div><nav class="nav" aria-label="Tài khoản"><a href="#profile" class="${state.route==='profile'?'active':''}">${icon('user',19)}Thông tin tài khoản</a><a href="#" data-action="logout">${icon('logout',19)}Đăng xuất</a></nav><div class="sidebar-bottom"><div class="support-card"><div class="support-icon">${icon('tooth',24)}</div><strong class="small">Một nụ cười khỏe mạnh</strong><p>Chủ động sắp xếp lịch khám phù hợp với bạn.</p><button class="link-button" data-action="help">Hướng dẫn sử dụng ${icon('arrow',14)}</button></div><div class="side-footer">${icon('shield',12)} Chăm sóc tận tâm, kết nối an toàn</div></div></aside><div class="page"><header class="topbar"><button class="icon-button menu-button" data-action="menu" aria-label="Mở menu" aria-expanded="false" aria-controls="sidebar">${icon('menu',20)}</button><div class="breadcrumb"><span>Phòng khám</span>${icon('chevron',12)}<strong>${titles[state.route]}</strong></div><div class="top-right"><div class="top-date">${icon('calendar',15)}${fmt(demo.day())}</div><button class="profile-button" data-action="profile"><span class="avatar">${esc(initials(state.user.name))}</span><span><span class="profile-name">${esc(state.user.name)}</span><span class="profile-role">${esc(demo.roles[state.user.role])}</span></span>${icon('down',13)}</button></div></header>${state.mode==='demo'?`<div class="demo-bar"><span>${icon('info',14)}<span><strong>Bản xem thử</strong> · Lịch hẹn và thông tin được lưu cục bộ, chưa gửi đến phòng khám.</span></span><div class="demo-actions"><button class="link-button" data-action="role">Đổi vai trò ${icon('down',12)}</button><button class="link-button" data-action="switch-api">Kết nối API ${icon('arrow',12)}</button></div></div>`:''}<main id="main-content" class="content"><div class="loading"><span class="spinner"></span><p>Đang tải dữ liệu…</p></div></main></div></div>`;
}
async function loadData(route) {
  if (state.mode === 'demo') {
    const d = demo.read();
    if (state.user.role === 'patient') {
      d.appointments=d.appointments.filter(a=>same(a.patient_id,state.user.id));
      d.visits=d.visits.filter(a=>same(a.patient_id,state.user.id));
      d.invoices=d.invoices.filter(a=>same(a.patient_id,state.user.id));
    } else if (state.user.role === 'doctor') {
      d.appointments=d.appointments.filter(a=>same(a.doctor_id,state.user.doctor_id));
      d.visits=d.visits.filter(a=>same(a.doctor_id,state.user.doctor_id)); d.invoices=[];
    } else d.visits=[];
    return d;
  }
  const d = {doctors:[],specialties:[],services:[],appointments:[],visits:[],invoices:[]};
  const tasks=[];
  const get=(key,promise)=>tasks.push(promise.then(value=>{d[key]=value;}));
  if (route !== 'profile') get('doctors',api.doctors());
  if (['doctors','booking'].includes(route)) get('specialties',api.specialties());
  if (['dashboard','appointments','booking'].includes(route)) get('appointments',api.appointments(state.user.role));
  if (route==='history' || (route==='dashboard' && ['patient','doctor'].includes(state.user.role))) get('visits',api.visits());
  if (['dashboard','invoices'].includes(route) && state.user.role!=='doctor') get('invoices',api.invoices(state.user.role));
  if (['services','reports'].includes(route) || state.user.role==='doctor') get('services',api.services());
  await Promise.all(tasks); return d;
}
async function navigate(route='dashboard') {
  const ticket=++renderTicket;
  if (!state.user) { renderLogin(); return; }
  if (![...navItems[state.user.role].map(x=>x[0]),'profile'].includes(route)) { route='dashboard'; toast('Màn hình này không thuộc vai trò hiện tại.',true); }
  state.route=route; history.replaceState(null,'',`#${route}`); shell();
  try {
    const data = await loadData(route); if(ticket!==renderTicket)return;
    state.data=data;
    const renders={dashboard:renderDashboard,doctors:renderDoctors,booking:renderBooking,appointments:renderAppointments,history:renderHistory,invoices:renderInvoices,reports:renderReports,services:renderServices,profile:renderProfile};
    renders[route]();
    if(route==='booking') await loadSlots();
    if(route==='reports') await loadReport();
    if(route==='dashboard' && state.user.role==='admin') checkHealth();
  } catch(error) {
    if(ticket!==renderTicket)return;
    if(error.status===401){setToken(null);state.user=null;renderLogin();$('#login-error').textContent=error.message;return;}
    $('#main-content').innerHTML=heading(titles[route],'Dữ liệu chưa tải được.')+`<div class="card">${empty('Chưa thể tải thông tin',error.message,btn(`${icon('refresh',15)} Thử lại`,'reload'))}${state.mode==='api'?'<p class="small muted">Bản backend được gửi ban đầu mới có API kiểm tra hệ thống. Các API nghiệp vụ cần được nhóm bổ sung theo tài liệu FRONTEND_API.md.</p>':''}</div>`;
  }
}
function go(route) { if(state.route!==route){state.filters={search:'',specialty:'',status:'',date:state.user?.role==='doctor'&&route==='appointments'?demo.day():''};} navigate(route); window.scrollTo({top:0,behavior:'instant'}); }
function patientUpcoming() { return state.data.appointments.filter(a=>['pending','confirmed','checked_in'].includes(a.status)&&dateObject(a.starts_at)>new Date()).sort((a,b)=>dateObject(a.starts_at)-dateObject(b.starts_at)); }
function dateTile(date) { const d=dateObject(date); return `<div class="date-tile"><strong>${new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit'}).format(d)}</strong><small>THÁNG ${new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',month:'2-digit'}).format(d)}</small></div>`; }
function nextAppointment(a) {
  if(!a)return `<div class="card next-card"><div class="label-chip">Lịch khám sắp tới</div>${empty('Chưa có lịch hẹn','Chọn bác sĩ và thời gian thuận tiện để bắt đầu.',btn('Đặt lịch khám','new-booking','','soft small'))}</div>`;
  const d=doctor(a.doctor_id);
  return `<div class="card next-card"><div class="row spread"><span class="label-chip">Lịch khám sắp tới</span>${badge(a.status)}</div><div class="next-doctor">${avatar(d,'lg')}<div><h3>BS. ${esc(d.name)}</h3><p>${esc(d.specialty_name)}</p></div></div><div class="date-block">${dateTile(a.starts_at)}<div class="date-details"><strong>${time(a.starts_at)} · ${fmt(a.starts_at,{year:undefined,weekday:'long'})}</strong><span>${esc(d.room || 'Phòng khám')} · Clinic Booking</span></div></div><div class="row spread"><span class="small muted">${icon('clock',13)} Vui lòng đến sớm 10 phút</span><button class="link-button" data-action="appointment-detail" data-id="${esc(a.id)}">Chi tiết ${icon('arrow',13)}</button></div></div>`;
}
function tableAppointments(items, compact=false) {
  if(!items.length)return empty('Chưa có lịch khám','Lịch khám phù hợp sẽ xuất hiện ở đây.');
  const patient=state.user.role==='patient';
  return `<div class="table-wrap"><table><thead><tr><th>${patient?'Bác sĩ':'Bệnh nhân'}</th><th>Thời gian</th><th>Trạng thái</th><th style="text-align:right">${compact?'':'Thao tác'}</th></tr></thead><tbody>${items.map(a=>{
    const d=doctor(a.doctor_id); const person=patient?d:{name:a.patient_name};
    let actions=btn(icon('chevron',15),'appointment-detail',`data-id="${esc(a.id)}" aria-label="Chi tiết lịch khám"`,'secondary small');
    if(!compact){
      if(patient && demo.canChange(a))actions=btn('Đổi lịch','reschedule',`data-id="${esc(a.id)}"`,'secondary small')+btn('Hủy','cancel',`data-id="${esc(a.id)}"`,'danger small');
      if(state.user.role==='receptionist' && a.status==='pending')actions=btn('Xác nhận','confirm',`data-id="${esc(a.id)}"`,'soft small');
      if(state.user.role==='receptionist' && a.status==='confirmed' && dateKey(a.starts_at)===demo.day())actions=btn('Check-in','checkin',`data-id="${esc(a.id)}"`,'small');
      if(state.user.role==='doctor' && a.status==='checked_in')actions=btn('Khám & ghi kết quả','visit-form',`data-id="${esc(a.id)}"`,'small');
    }
    return `<tr><td><div class="table-person">${avatar(person)}<div><strong>${patient?'BS. ':''}${esc(person.name)}</strong><small>${esc(patient?d.specialty_name:`BS. ${d.name}`)}</small></div></div></td><td><strong>${time(a.starts_at)}</strong><small>${fmt(a.starts_at)}</small></td><td>${badge(a.status)}</td><td><div class="actions">${actions}</div></td></tr>`;
  }).join('')}</tbody></table></div>`;
}
function renderDashboard() {
  if(state.user.role!=='patient'){ renderStaffDashboard(); return; }
  const upcoming=patientUpcoming(), unpaid=state.data.invoices.filter(x=>x.status==='unpaid');
  const suggestions=state.data.doctors.slice(0,2);
  $('#main-content').innerHTML=heading(`Xin chào, ${state.user.name.split(' ').slice(-2).join(' ')}!`,'Một ngày mới, thêm một lý do để mỉm cười.',btn(`${icon('plus',17)} Đặt lịch mới`,'new-booking'),'CHĂM SÓC SỨC KHỎE RĂNG MIỆNG')+
  `<div class="hero-grid"><section class="hero"><div class="hero-copy"><div class="eyebrow">Nụ cười khỏe · Cuộc sống vui</div><h2>Chăm sóc nụ cười,<br>bắt đầu từ một lịch hẹn.</h2><p>Chọn bác sĩ bạn tin tưởng và khung giờ phù hợp. Mọi lịch khám ở ngay trong tầm tay.</p>${btn(`Đặt lịch khám ${icon('arrow',16)}`,'new-booking')}</div>${toothArt()}</section>${nextAppointment(upcoming[0])}</div>`+
  `<div class="stats">${stat('Lịch khám sắp tới',upcoming.length,'Chủ động theo dõi lịch hẹn','calendar')}${stat('Lượt khám đã hoàn tất',state.data.visits.length,'Hồ sơ được lưu theo từng lượt','folder','blue')}${stat('Hóa đơn chưa thanh toán',unpaid.length,unpaid.length?`Tổng ${money(unpaid.reduce((s,i)=>s+i.total,0))}`:'Bạn đã thanh toán đầy đủ','receipt','peach')}</div>`+
  `<div class="grid-two"><section class="card"><div class="card-header"><div><h2>Lịch khám của bạn</h2><p>Những lịch hẹn cần theo dõi gần nhất</p></div><button class="link-button" data-action="nav" data-route="appointments">Xem tất cả ${icon('arrow',13)}</button></div>${tableAppointments(upcoming.slice(0,3),true)}</section><div class="stack"><section class="card"><div class="card-header"><h2>Đồng hành cùng bạn</h2><button class="link-button" data-action="nav" data-route="doctors">Tất cả ${icon('arrow',13)}</button></div><div>${suggestions.map(d=>`<div class="doctor-mini">${avatar(d)}<div><h3>BS. ${esc(d.name)}</h3><p>${esc(d.specialty_name)}</p></div><button class="icon-button" data-action="book-doctor" data-id="${esc(d.id)}" aria-label="Đặt lịch với ${esc(d.name)}">${icon('arrow',15)}</button></div>`).join('')}</div></section><aside class="care-note"><div class="note-icon">${icon('calendar',21)}</div><h3>Một chút chuẩn bị, thêm an tâm</h3><p>Kiểm tra giờ hẹn và mang theo thông tin khám trước đó khi đến phòng khám.</p><button class="link-button" data-action="help">Lưu ý trước khi đến ${icon('arrow',13)}</button></aside></div></div>${caption()}`;
}
function renderStaffDashboard() {
  const today=state.data.appointments.filter(a=>dateKey(a.starts_at)===demo.day());
  const waiting=today.filter(a=>a.status==='checked_in');
  const completed=today.filter(a=>a.status==='completed');
  const role=state.user.role;
  if(role==='admin'){
    const report=buildReport(state.data.invoices,demo.day(-13),demo.day(),'');
    $('#main-content').innerHTML=heading('Tổng quan phòng khám','Theo dõi lịch hẹn, thanh toán và hoạt động trong ngày.',btn(`${icon('chart',16)} Xem báo cáo`,'nav','data-route="reports"'),'KHÔNG GIAN QUẢN TRỊ')+
    `<div class="stats">${stat('Lịch khám hôm nay',today.length,'Các lượt hẹn trong ngày','calendar')}${stat('Đã thu trong 14 ngày',money(report.total),`${report.invoice_count} hóa đơn đã thanh toán`,'receipt','blue')}${stat('Hóa đơn cần thu',state.data.invoices.filter(i=>i.status==='unpaid').length,'Chưa ghi nhận thanh toán','clock','peach')}</div><div class="report-grid"><section class="card"><div class="card-header"><div><h2>Doanh thu đã ghi nhận</h2><p>14 ngày gần nhất · Đơn vị: VNĐ</p></div>${badge('paid')}</div>${chart(report.by_day)}</section><section class="card"><div class="card-header"><h2>Theo dịch vụ</h2></div>${serviceBars(report.by_service)}</section></div><div class="grid-equal mt"><section class="card"><div class="card-header"><h2>Đội ngũ & dịch vụ</h2></div><div class="summary-line"><span>Bác sĩ</span><strong>${state.data.doctors.length}</strong></div><div class="summary-line"><span>Lịch đã hoàn tất hôm nay</span><strong>${completed.length}</strong></div><div class="dialog-footer">${btn('Quản lý dịch vụ','nav','data-route="services"','secondary')}${btn('Xem hóa đơn','nav','data-route="invoices"')}</div></section><section class="card"><div class="card-header"><h2>Trạng thái hệ thống</h2><button class="link-button" data-action="health">Kiểm tra lại ${icon('refresh',13)}</button></div><div id="health-status" class="small muted">Đang kiểm tra kết nối…</div>${state.mode==='demo'?'<p class="small muted mt">Dữ liệu xem thử hoạt động độc lập với kết nối máy chủ.</p>':''}</section></div>${caption()}`;
    return;
  }
  $('#main-content').innerHTML=heading(role==='doctor'?`Xin chào, BS. ${state.user.name.split(' ').slice(-2).join(' ')}!`:'Tiếp đón tận tâm, mỗi ngày.','Lịch khám và các lượt tiếp nhận trong ngày hôm nay.',btn(`${icon('calendar',16)} Danh sách khám`,'nav','data-route="appointments"'),role==='doctor'?'KHÔNG GIAN BÁC SĨ':'KHÔNG GIAN LỄ TÂN')+
  `<div class="stats">${stat('Lịch khám hôm nay',today.length,'Theo ngày làm việc hiện tại','calendar')}${stat('Đang chờ khám',waiting.length,'Bệnh nhân đã check-in','users','blue')}${stat('Đã hoàn tất',completed.length,'Lượt khám trong ngày','check','peach')}</div><section class="card"><div class="card-header"><div><h2>${role==='doctor'?'Bệnh nhân của bạn':'Danh sách tiếp nhận'}</h2><p>${fmt(demo.day(),{weekday:'long'})}</p></div><button class="link-button" data-action="nav" data-route="appointments">Xem tất cả ${icon('arrow',14)}</button></div>${tableAppointments(today.sort((a,b)=>dateObject(a.starts_at)-dateObject(b.starts_at)))}</section><div class="info-box mt">${icon('shield',18)}<span>${role==='doctor'?'Chỉ các lượt khám được phân công cho bạn hiển thị trong danh sách. Hoàn tất kết quả khám để chuyển sang bước lập hóa đơn.':'Xác nhận lịch hẹn trước khi check-in. Chỉ check-in các lịch khám đúng ngày hôm nay.'}</span></div>${caption()}`;
}
function renderDoctors() {
  $('#main-content').innerHTML=heading('Tìm bác sĩ phù hợp','Lắng nghe, thấu hiểu và đồng hành cùng sức khỏe răng miệng của bạn.','','ĐỘI NGŨ CHUYÊN MÔN')+
  `<div class="filters"><div class="search-field">${icon('search',18)}<input id="doctor-search" type="search" placeholder="Tìm tên bác sĩ hoặc chuyên khoa…" aria-label="Tìm bác sĩ" value="${esc(state.filters.search)}"></div><select id="specialty-filter" aria-label="Lọc chuyên khoa"><option value="">Tất cả chuyên khoa</option>${state.data.specialties.map(s=>`<option value="${esc(s.id)}" ${same(state.filters.specialty,s.id)?'selected':''}>${esc(s.name)}</option>`).join('')}</select></div><div id="doctor-results"></div>${caption()}`;
  renderDoctorResults();
}
function renderDoctorResults() {
  const docs=state.data.doctors.filter(d=>(!state.filters.specialty||same(d.specialty_id,state.filters.specialty)) && normalized(`${d.name} ${d.specialty_name}`).includes(normalized(state.filters.search)));
  $('#doctor-results').innerHTML=docs.length?`<div class="doctor-grid">${docs.map(d=>`<article class="card doctor-card"><div class="doctor-card-top">${avatar(d,'xl')}<span class="badge confirmed no-dot">${esc(d.experience || 0)} năm kinh nghiệm</span></div><h3>BS. ${esc(d.name)}</h3><div class="specialty">${esc(d.specialty_name)}</div><p class="description">${esc(d.description || 'Tư vấn và chăm sóc theo nhu cầu của bạn.')}</p><div class="doctor-meta"><span>${icon('location',13)}${esc(d.room || 'Phòng khám')}</span><span>${icon('clock',13)}Theo khung giờ đăng ký</span></div><div class="doctor-card-bottom"><div><small>Phí khám dự kiến</small><strong>${money(d.fee)}</strong></div>${state.user.role==='patient'?btn('Đặt lịch','book-doctor',`data-id="${esc(d.id)}"`,'small'):btn('Thông tin','doctor-detail',`data-id="${esc(d.id)}"`,'secondary small')}</div></article>`).join('')}</div>`:empty('Chưa tìm thấy bác sĩ','Thử tên khác hoặc chọn tất cả chuyên khoa.');
}
function newBooking(doctorId='', editing=null) {
  const a=editing?(state.data.appointments||[]).find(a=>same(a.id,editing)):null;
  state.booking={doctor:String(doctorId || a?.doctor_id || ''),date:a?dateKey(a.starts_at):demo.day(1),slot:'',slots:[],reason:a?.reason||'',editing:a?.id||null,loading:false};
  go('booking');
}
function renderBooking() {
  const b=state.booking;
  if(!b.doctor && state.data.doctors.length)b.doctor=String(state.data.doctors[0].id);
  const d=doctor(b.doctor); const slot=b.slots.find(s=>same(s.id,b.slot));
  $('#main-content').innerHTML=heading(b.editing?'Thay đổi lịch khám':'Một lịch hẹn, thật dễ dàng.','Chọn bác sĩ và khung giờ phù hợp. Lễ tân sẽ tiếp nhận yêu cầu của bạn.','','ĐẶT LỊCH KHÁM')+
  `<div class="steps"><span><b>1</b>Chọn bác sĩ</span><i class="step-line"></i><span><b>2</b>Chọn thời gian</span><i class="step-line"></i><span><b>3</b>Xác nhận lịch hẹn</span></div><form id="booking-form" class="booking-grid"><div class="card"><h2 class="section-title"><span>${icon('doctor',19)}</span>Bác sĩ & thời gian khám</h2><div class="field"><label for="booking-doctor">Bác sĩ phụ trách</label><select id="booking-doctor" required>${state.data.doctors.map(d=>`<option value="${esc(d.id)}" ${same(d.id,b.doctor)?'selected':''}>BS. ${esc(d.name)} · ${esc(d.specialty_name)}</option>`).join('')}</select></div><div class="field"><label for="booking-date">Ngày khám</label><input id="booking-date" type="date" value="${esc(b.date)}" min="${demo.day()}" max="${demo.day(30)}" required></div><div class="date-chips" aria-label="Chọn nhanh ngày khám">${Array.from({length:7},(_,i)=>{const date=demo.day(i);return `<button type="button" class="date-chip ${date===b.date?'active':''}" data-action="pick-date" data-date="${date}" aria-pressed="${date===b.date}"><span>${fmt(date,{day:undefined,month:undefined,year:undefined,weekday:'short'})}</span><strong>${date.slice(-2)}</strong></button>`;}).join('')}</div><div class="row spread"><span class="field-label">Khung giờ khám</span><span class="small muted">Giờ Việt Nam · 30 phút/lượt</span></div><div class="time-slots">${b.loading?'<span class="small muted">Đang tải giờ trống…</span>':b.slots.length?b.slots.map(s=>`<button type="button" class="slot ${same(s.id,b.slot)?'active':''}" data-action="pick-slot" data-id="${esc(s.id)}" aria-pressed="${same(s.id,b.slot)}" ${!s.available?'disabled title="Khung giờ không còn trống"':''}>${time(s.starts_at)}</button>`).join(''):'<p class="small muted">Chưa có khung giờ cho ngày này.</p>'}</div><div class="field"><label for="booking-reason">Lý do khám</label><textarea id="booking-reason" maxlength="500" required placeholder="Ví dụ: khám răng định kỳ, tư vấn chỉnh nha…" ${b.editing?'readonly':''}>${esc(b.reason)}</textarea><small>Thông tin ngắn gọn giúp phòng khám chuẩn bị tốt hơn.</small></div><div class="info-box">${icon('info',17)}<span>Bạn có thể đổi hoặc hủy lịch trước giờ khám <strong>ít nhất 2 tiếng</strong>.</span></div></div><aside class="card booking-side"><div class="eyebrow">Lịch hẹn của bạn</div><div class="next-doctor">${avatar(d,'lg')}<div><h3>BS. ${esc(d.name)}</h3><p>${esc(d.specialty_name)}</p></div></div><div class="summary-line"><span>Ngày khám</span><strong>${fmt(b.date)}</strong></div><div class="summary-line"><span>Khung giờ</span><strong>${slot?time(slot.starts_at):'Chưa chọn'}</strong></div><div class="summary-line"><span>Bệnh nhân</span><strong>${esc(state.user.name)}</strong></div><div class="summary-line"><span>Phòng khám</span><strong>${esc(d.room || 'Clinic Booking')}</strong></div><div class="summary-total"><span>Phí khám dự kiến</span><strong>${money(d.fee)}</strong></div><p class="small muted mb">Chi phí dịch vụ phát sinh sẽ được ghi nhận theo lượt khám.</p><button type="submit" class="btn full" ${!slot||b.loading?'disabled':''}>${b.editing?'Xem lại lịch mới':'Tiếp tục xác nhận'} ${icon('arrow',16)}</button>${b.editing?btn('Quay lại lịch của tôi','nav','data-route="appointments"','secondary full mt'):''}<p class="small muted mt">${icon('shield',13)} ${state.mode==='demo'?'Lịch mẫu chỉ lưu trong trình duyệt.':'Yêu cầu được gửi trực tiếp tới hệ thống.'}</p></aside></form>${caption()}`;
}
function rememberReason() { const field=$('#booking-reason'); if(field)state.booking.reason=field.value; }
async function loadSlots() {
  const ticket=++slotTicket; const b=state.booking;
  if(!b.doctor)return;
  b.loading=true;renderBooking();
  try {
    const slots=state.mode==='demo'?demo.schedules(b.doctor,b.date,b.editing):await api.schedules(b.doctor,b.date);
    if(ticket!==slotTicket || state.route!=='booking')return;
    b.slots=slots;b.slot='';b.loading=false;renderBooking();
  } catch(error) { if(ticket!==slotTicket||state.route!=='booking')return; b.loading=false;b.slots=[];b.slot='';renderBooking();toast(error.message,true); }
}
function renderAppointments() {
  const title=state.user.role==='patient'?'Lịch khám của tôi':state.user.role==='doctor'?'Danh sách khám':'Tiếp nhận bệnh nhân';
  $('#main-content').innerHTML=heading(title,'Theo dõi trạng thái và quản lý lịch hẹn tại một nơi.',state.user.role==='patient'?btn(`${icon('plus',16)} Đặt lịch mới`,'new-booking'):'')+
  `<div class="status-tabs" aria-label="Lọc trạng thái">${[['','Tất cả'],['pending','Chờ xác nhận'],['confirmed','Đã xác nhận'],['checked_in','Đã check-in'],['completed','Đã khám'],['cancelled','Đã hủy']].map(([id,title])=>`<button type="button" class="tab ${state.filters.status===id?'active':''}" data-action="filter-status" data-status="${id}" aria-pressed="${state.filters.status===id}">${title}</button>`).join('')}</div><div class="filters"><div class="search-field">${icon('search',18)}<input id="appointment-search" type="search" value="${esc(state.filters.search)}" placeholder="Tìm bác sĩ, bệnh nhân hoặc lý do khám…" aria-label="Tìm lịch khám"></div><div class="field"><label for="appointment-date" class="small">Ngày khám</label><input type="date" id="appointment-date" value="${esc(state.filters.date)}"></div>${btn('Bỏ lọc','clear-filters','','secondary')}</div><section class="card" id="appointment-results"></section>${state.user.role==='patient'?'<div class="info-box mt">'+icon('info',17)+'<span>Nút đổi/hủy chỉ xuất hiện với lịch chờ xác nhận hoặc đã xác nhận, còn ít nhất 2 tiếng trước giờ khám.</span></div>':''}${caption()}`;
  renderAppointmentResults();
}
function renderAppointmentResults() {
  const items=state.data.appointments.filter(a=>(!state.filters.status||a.status===state.filters.status)&&(!state.filters.date||dateKey(a.starts_at)===state.filters.date)&&normalized(`${a.patient_name} ${doctor(a.doctor_id).name} ${a.reason}`).includes(normalized(state.filters.search))).sort((a,b)=>dateObject(b.starts_at)-dateObject(a.starts_at));
  $('#appointment-results').innerHTML=tableAppointments(items);
}

function renderHistory() {
  const visits=[...state.data.visits].sort((a,b)=>dateObject(b.date)-dateObject(a.date));
  $('#main-content').innerHTML=heading('Hồ sơ khám','Thông tin được lưu theo từng lượt khám và bác sĩ phụ trách.','','LỊCH SỬ CHĂM SÓC')+
  (visits.length?`<div class="history-list">${visits.map(v=>`<article class="card history-card">${dateTile(v.date)}<div class="history-content"><h3>${state.user.role==='doctor'?esc(v.patient_name):`Khám tại ${esc(doctor(v.doctor_id).specialty_name || 'phòng khám')}`}</h3><p>BS. ${esc(doctor(v.doctor_id).name)} · ${fmt(v.date)}</p><span class="badge completed">${v.services.length} dịch vụ đã sử dụng</span></div>${btn(`Xem hồ sơ ${icon('arrow',14)}`,'visit-detail',`data-id="${esc(v.id)}"`,'secondary small')}</article>`).join('')}</div>`:`<div class="card">${empty('Chưa có hồ sơ khám','Hồ sơ sẽ xuất hiện sau khi bác sĩ hoàn tất lượt khám.')}</div>`)+caption();
}
function renderInvoices() {
  const unpaid=state.data.invoices.filter(i=>i.status==='unpaid');
  $('#main-content').innerHTML=heading('Hóa đơn & thanh toán','Chi tiết dịch vụ và tình trạng thanh toán cho từng lượt khám.','','CHI PHÍ MINH BẠCH')+
  `<div class="stats">${stat('Tất cả hóa đơn',state.data.invoices.length,'Theo phạm vi tài khoản','receipt')}${stat('Cần thanh toán',money(unpaid.reduce((s,i)=>s+i.total,0)),`${unpaid.length} hóa đơn chưa thanh toán`,'clock','peach')}${stat('Đã thanh toán',state.data.invoices.length-unpaid.length,'Hóa đơn đã ghi nhận thu phí','check','blue')}</div><div class="status-tabs">${[['','Tất cả'],['unpaid','Chưa thanh toán'],['paid','Đã thanh toán']].map(([id,label])=>`<button class="tab ${state.filters.status===id?'active':''}" data-action="invoice-filter" data-status="${id}" aria-pressed="${state.filters.status===id}">${label}</button>`).join('')}</div><section class="card" id="invoice-results"></section>${caption()}`;
  renderInvoiceResults();
}
function renderInvoiceResults() {
  const invoices=state.data.invoices.filter(i=>!state.filters.status||i.status===state.filters.status).sort((a,b)=>dateObject(b.date)-dateObject(a.date));
  $('#invoice-results').innerHTML=invoices.length?`<div class="table-wrap"><table><thead><tr><th>Hóa đơn</th><th>Bệnh nhân</th><th>Tổng tiền</th><th>Trạng thái</th><th style="text-align:right">Thao tác</th></tr></thead><tbody>${invoices.map(i=>`<tr><td><strong>${esc(i.id)}</strong><small>${fmt(i.date)}</small></td><td>${esc(i.patient_name)}</td><td><strong>${money(i.total)}</strong></td><td>${badge(i.status)}</td><td><div class="actions">${btn('Chi tiết','invoice-detail',`data-id="${esc(i.id)}"`,'secondary small')}${i.status==='unpaid'&&['receptionist','admin'].includes(state.user.role)?btn('Ghi nhận đã thu','pay',`data-id="${esc(i.id)}"`,'small'):''}</div></td></tr>`).join('')}</tbody></table></div>`:empty('Không có hóa đơn phù hợp','Thử chọn trạng thái khác hoặc quay lại sau khi hoàn tất lượt khám.');
}
function renderServices() {
  $('#main-content').innerHTML=heading('Danh mục dịch vụ','Quản lý tên dịch vụ, đơn giá và trạng thái sử dụng.',btn(`${icon('plus',16)} Thêm dịch vụ`,'service-form'),'QUẢN LÝ PHÒNG KHÁM')+
  `<section class="card">${state.data.services.length?`<div class="table-wrap"><table><thead><tr><th>Dịch vụ</th><th>Đơn giá</th><th>Trạng thái</th><th></th></tr></thead><tbody>${state.data.services.map(s=>`<tr><td><strong>${esc(s.name)}</strong></td><td>${money(s.price)}</td><td><span class="badge ${s.active?'confirmed':'cancelled'}">${s.active?'Đang sử dụng':'Tạm ngưng'}</span></td><td style="text-align:right">${btn(`${icon('edit',14)} Chỉnh sửa`,'service-form',`data-id="${esc(s.id)}"`,'secondary small')}</td></tr>`).join('')}</tbody></table></div>`:empty('Chưa có dịch vụ','Thêm dịch vụ đầu tiên để bắt đầu.')}</section><div class="info-box mt">${icon('info',17)}<span>Thay đổi đơn giá áp dụng cho lượt sử dụng tiếp theo. Giá đã ghi trên hóa đơn được giữ nguyên.</span></div>${caption()}`;
}
function buildReport(invoices, from, to, service) {
  const byDay=new Map();
  for(let d=dateObject(from);dateKey(d)<=to;d.setUTCDate(d.getUTCDate()+1))byDay.set(dateKey(d),0);
  const services=new Map();let total=0,count=0;
  for(const invoice of invoices){
    if(invoice.status!=='paid'||!invoice.paid_at)continue;
    const key=dateKey(invoice.paid_at); if(key<from||key>to)continue;
    const items=invoice.items.filter(i=>!service||same(i.service_id,service)); if(!items.length)continue;
    count++;
    for(const item of items){const amount=item.quantity*item.price;total+=amount;byDay.set(key,(byDay.get(key)||0)+amount);const current=services.get(String(item.service_id))||{service_id:item.service_id,name:item.name,total:0};current.total+=amount;services.set(String(item.service_id),current);}
  }
  return {total,invoice_count:count,by_day:[...byDay].map(([date,total])=>({date,total})),by_service:[...services.values()].sort((a,b)=>b.total-a.total)};
}
function chart(items) {
  if(!items?.length)return empty('Chưa có dữ liệu','Chọn khoảng thời gian khác để xem doanh thu.');
  const max=Math.max(...items.map(i=>Number(i.total)||0),1); const step=Math.ceil(items.length/8);
  return `<div class="chart" role="img" aria-label="Biểu đồ doanh thu theo ngày"><span class="sr-only"></span>${items.map((item,index)=>`<div class="chart-col" title="${esc(fmt(item.date))}: ${money(item.total)}"><div class="chart-bar" style="height:${Math.max(2,Number(item.total)/max*100)}%"></div><span class="chart-label">${index%step===0?fmt(item.date,{year:undefined}):''}</span></div>`).join('')}</div>`;
}
function serviceBars(items) {
  if(!items?.length)return empty('Chưa ghi nhận doanh thu','Chỉ các hóa đơn đã thanh toán được tính.');
  const max=Math.max(...items.map(i=>Number(i.total)||0),1);
  return items.map(i=>`<div class="service-bar"><div class="row"><span>${esc(i.name)}</span><strong class="service-total">${money(i.total)}</strong></div><div class="progress-track"><div class="progress-fill" style="width:${Number(i.total)/max*100}%"></div></div></div>`).join('');
}
function renderReports() {
  const r=state.report;
  $('#main-content').innerHTML=heading('Báo cáo doanh thu','Tổng hợp theo thời điểm thanh toán và dịch vụ đã sử dụng.',btn(`${icon('download',16)} Xuất CSV`,'export-report'),'SỐ LIỆU PHÒNG KHÁM')+
  `<form id="report-form" class="filters"><div class="field"><label for="report-from">Từ ngày</label><input id="report-from" type="date" value="${esc(r.from)}" required></div><div class="field"><label for="report-to">Đến ngày</label><input id="report-to" type="date" value="${esc(r.to)}" required></div><div class="field"><label for="report-service">Dịch vụ</label><select id="report-service"><option value="">Tất cả dịch vụ</option>${state.data.services.map(s=>`<option value="${esc(s.id)}" ${same(s.id,r.service)?'selected':''}>${esc(s.name)}</option>`).join('')}</select></div><button class="btn" type="submit">Áp dụng bộ lọc</button></form><div id="report-results"><div class="loading"><span class="spinner"></span><p>Đang tổng hợp…</p></div></div>${caption()}`;
}
async function loadReport() {
  const ticket=renderTicket; const r=state.report;r.data=null;
  try{
    const result=state.mode==='demo'?buildReport(state.data.invoices,r.from,r.to,r.service):await api.report(r.from,r.to,r.service);
    if(state.route!=='reports'||ticket!==renderTicket)return;
    if(!Array.isArray(result.by_day)||!Array.isArray(result.by_service)||!Number.isFinite(result.total)||!Number.isInteger(result.invoice_count))throw new Error('Báo cáo chưa đúng định dạng dữ liệu đã thống nhất.');
    r.data=result;
    $('#report-results').innerHTML=`<div class="stats">${stat('Doanh thu đã thu',money(result.total),'Các hóa đơn đã thanh toán','chart')}${stat('Hóa đơn được tính',result.invoice_count,'Trong khoảng thời gian đã chọn','receipt','blue')}${stat('Giá trị trung bình',money(result.invoice_count?Math.round(result.total/result.invoice_count):0),'Theo hóa đơn trong bộ lọc','grid','peach')}</div><div class="report-grid"><section class="card"><div class="card-header"><h2>Doanh thu theo ngày</h2><span class="small muted">Đơn vị: VNĐ</span></div>${chart(result.by_day)}<details class="mt"><summary class="small">Xem bảng số liệu theo ngày</summary><div class="table-wrap mt"><table><thead><tr><th>Ngày</th><th>Doanh thu</th></tr></thead><tbody>${result.by_day.map(d=>`<tr><td>${fmt(d.date)}</td><td>${money(d.total)}</td></tr>`).join('')}</tbody></table></div></details></section><section class="card"><div class="card-header"><h2>Doanh thu theo dịch vụ</h2></div>${serviceBars(result.by_service)}</section></div><div class="info-box mt">${icon('info',17)}<span>Hóa đơn chưa thanh toán không được tính. Khoảng ngày được tính theo múi giờ Việt Nam.</span></div>`;
  }catch(error){if(state.route==='reports'&&ticket===renderTicket)$('#report-results').innerHTML=`<div class="error-box">${esc(error.message)}</div>`;}
}
function renderProfile() {
  const u=state.user;
  $('#main-content').innerHTML=heading('Thông tin tài khoản','Quản lý phiên làm việc và xem phạm vi tài khoản của bạn.')+
  `<div class="profile-grid"><section class="card profile-card">${avatar(u,'xl')}<h2>${esc(u.name)}</h2><span class="badge confirmed no-dot">${esc(demo.roles[u.role])}</span><p class="small muted">${esc(u.email || '')}</p>${state.mode==='demo'?btn('Đổi vai trò xem thử','role','','soft mt'):''}</section><section class="card"><div class="card-header"><h2>Thông tin cơ bản</h2></div><dl class="details-list"><dt>Họ tên</dt><dd>${esc(u.name)}</dd><dt>Email</dt><dd>${esc(u.email || 'Chưa cập nhật')}</dd><dt>Điện thoại</dt><dd>${esc(u.phone || 'Chưa cập nhật')}</dd><dt>Vai trò</dt><dd>${esc(demo.roles[u.role])}</dd><dt>Phiên sử dụng</dt><dd>${state.mode==='demo'?'Bản xem thử trên trình duyệt':'Kết nối máy chủ qua API'}</dd></dl><div class="dialog-footer">${btn(`${icon('logout',15)} Đăng xuất`,'logout','','secondary')}</div></section></div>${state.mode==='demo'?`<section class="card mt"><div class="card-header"><div><h2>Dữ liệu xem thử</h2><p>Khôi phục bộ dữ liệu mẫu để bắt đầu kiểm tra lại từ đầu.</p></div>${btn(`${icon('refresh',15)} Khôi phục mẫu`,'reset-demo','','secondary')}</div><p class="small muted">Chỉ xóa các thay đổi trong dữ liệu mẫu của ứng dụng này. Các tài khoản và lịch khám trên máy chủ không bị tác động.</p></section>`:''}${caption()}`;
}
function showAppointment(id) {
  const a=state.data.appointments.find(a=>same(a.id,id));if(!a)return;
  const d=doctor(a.doctor_id);
  modal('Thông tin lịch khám',`${badge(a.status)}<dl class="details-list mt"><dt>Bệnh nhân</dt><dd>${esc(a.patient_name)}</dd><dt>Bác sĩ</dt><dd>BS. ${esc(d.name)}</dd><dt>Thời gian</dt><dd>${time(a.starts_at)} · ${fmt(a.starts_at)}</dd><dt>Phòng khám</dt><dd>${esc(d.room || 'Clinic Booking')}</dd><dt>Lý do khám</dt><dd class="note-block">${esc(a.reason)}</dd></dl>${previewNotice()}<div class="dialog-footer">${state.user.role==='patient'&&demo.canChange(a)?btn('Đổi lịch','reschedule',`data-id="${esc(a.id)}"`,'secondary')+btn('Hủy lịch','cancel',`data-id="${esc(a.id)}"`,'danger'):btn('Đóng','close-dialog','','secondary')}</div>`);
}
function showVisit(id) {
  const v=state.data.visits.find(v=>same(v.id,id));if(!v)return;
  modal('Chi tiết hồ sơ khám',`<div class="row spread"><strong>${esc(v.patient_name)}</strong>${badge('completed')}</div><p class="small muted mt">BS. ${esc(doctor(v.doctor_id).name)} · ${fmt(v.date)}</p><div class="visit-section"><h3>Kết quả khám</h3><p class="note-block">${esc(v.diagnosis)}</p></div><div class="visit-section"><h3>Ghi chú của bác sĩ</h3><p class="note-block">${esc(v.notes || 'Không có ghi chú thêm.')}</p></div><div class="visit-section"><h3>Dịch vụ đã sử dụng</h3>${itemsTable(v.services)}</div>${previewNotice()}<div class="dialog-footer">${btn('Đóng hồ sơ','close-dialog','','secondary')}</div>`);
}
function itemsTable(items) { return `<div class="table-wrap mt"><table><thead><tr><th>Dịch vụ</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>${items.map(i=>`<tr><td>${esc(i.name)}</td><td>${esc(i.quantity)}</td><td>${money(i.price)}</td><td>${money(i.quantity*i.price)}</td></tr>`).join('')}</tbody></table></div>`; }
function showInvoice(id) {
  const i=state.data.invoices.find(i=>same(i.id,id));if(!i)return;
  modal('Chi tiết hóa đơn',`<div class="invoice-brand"><div><strong>clinic booking.</strong><p class="small muted">Phòng khám nha khoa</p></div>${badge(i.status)}</div><div class="invoice-meta"><strong>Hóa đơn ${esc(i.id)}</strong><br>Bệnh nhân: ${esc(i.patient_name)}<br>Ngày lập: ${fmt(i.date)}${i.paid_at?`<br>Ngày thanh toán: ${fmt(i.paid_at)}`:''}</div>${itemsTable(i.items)}<div class="invoice-total"><span>Tổng thanh toán</span><span>${money(i.total)}</span></div>${previewNotice()}<div class="dialog-footer">${btn(`${icon('print',15)} In hóa đơn`,'print','','secondary')}${i.status==='unpaid'&&['receptionist','admin'].includes(state.user.role)?btn('Ghi nhận đã thu','pay',`data-id="${esc(i.id)}"`):btn('Đóng','close-dialog','','secondary')}</div>`);
}
function showVisitForm(id) {
  const a=state.data.appointments.find(a=>same(a.id,id));if(!a||state.user.role!=='doctor'||a.status!=='checked_in')return;
  const services=state.data.services.filter(s=>s.active);
  modal('Ghi kết quả khám',`<p class="small muted mb">Bệnh nhân: <strong>${esc(a.patient_name)}</strong> · ${fmt(a.starts_at)}</p><form id="visit-form" data-id="${esc(a.id)}"><div class="field"><label for="visit-diagnosis">Kết quả khám / chẩn đoán</label><textarea id="visit-diagnosis" maxlength="2000" required placeholder="Nhập kết quả khám…"></textarea></div><div class="field"><label for="visit-notes">Ghi chú và hướng dẫn</label><textarea id="visit-notes" maxlength="4000" placeholder="Ghi chú cho bệnh nhân…"></textarea></div><h3 class="mb">Dịch vụ đã sử dụng</h3>${services.length?services.map((s,index)=>`<div class="service-choice"><input id="service-${index}" type="checkbox" class="service-check" value="${esc(s.id)}" ${index===0?'checked':''}><label for="service-${index}">${esc(s.name)}<small>${money(s.price)} / lần</small></label><input type="number" class="service-quantity" min="1" max="20" step="1" value="1" aria-label="Số lượng ${esc(s.name)}" ${index===0?'':'disabled'}></div>`).join(''):'<p class="small muted">Chưa có dịch vụ đang hoạt động.</p>'}<div class="summary-total"><span>Tổng chi phí dự kiến</span><strong id="visit-total">${money(services[0]?.price)}</strong></div><div class="info-box">${icon('info',17)}<span>Hoàn tất lượt khám sẽ tạo hóa đơn từ các dịch vụ đã chọn.${state.mode==='demo'?' Đây là thao tác trên dữ liệu mẫu.':''}</span></div><div id="visit-error" class="login-error" role="alert"></div><div class="dialog-footer">${btn('Quay lại','close-dialog','','secondary')}<button type="submit" class="btn" ${!services.length?'disabled':''}>Hoàn tất & lập hóa đơn</button></div></form>`);
}
function showServiceForm(id) {
  if(state.user.role!=='admin')return;
  const s=state.data.services.find(s=>same(s.id,id));
  modal(s?'Chỉnh sửa dịch vụ':'Thêm dịch vụ',`<form id="service-form" data-id="${esc(s?.id||'')}"><div class="field"><label for="service-name">Tên dịch vụ</label><input id="service-name" value="${esc(s?.name||'')}" maxlength="120" required></div><div class="field"><label for="service-price">Đơn giá (VNĐ)</label><input id="service-price" type="number" min="0" max="100000000" step="1" value="${s?.price??''}" required></div><label class="check-label"><input id="service-active" type="checkbox" ${s?.active!==false?'checked':''}>Đang sử dụng</label><div id="service-error" class="login-error" role="alert"></div><div class="dialog-footer">${btn('Hủy','close-dialog','','secondary')}<button class="btn" type="submit">Lưu dịch vụ</button></div></form>`);
}
function showRolePicker() {
  modal('Khám phá từng vai trò',`<p class="small muted">Chọn một vai trò để xem thử giao diện. Tất cả tài khoản và dữ liệu dưới đây đều là mẫu.</p><div class="role-grid">${Object.entries(demo.roles).map(([role,label])=>`<button class="role-option" data-action="select-role" data-role="${role}">${icon(({patient:'user',receptionist:'users',doctor:'doctor',admin:'shield'})[role],24)}<span><strong>${label}</strong><small>${esc(demo.users[role].name)}</small></span></button>`).join('')}</div><div class="info-box">${icon('info',17)}<span>Bản xem thử chỉ dùng dữ liệu mẫu. Không nhập thông tin bệnh nhân thật.</span></div><div class="dialog-footer">${btn('Đăng nhập qua API','switch-api','','secondary')}</div>`);
}
function renderLogin() {
  ++renderTicket;
  $('#app').innerHTML=`<div class="login-page"><aside class="login-story">${brand()}<div class="login-story-content"><div class="eyebrow">Chăm sóc từ những điều nhỏ nhất</div><h1>Nụ cười của bạn.<br>Sự tận tâm<br>của chúng tôi.</h1><p>Một nơi để đặt lịch, theo dõi lượt khám và kết nối với bác sĩ của bạn.</p></div>${toothArt()}<div class="login-story-footer">Clinic Booking · Đồng hành cùng sức khỏe răng miệng</div></aside><main class="login-main" id="main-content"><div class="login-form"><div class="eyebrow">Chào mừng bạn trở lại</div><h2>Đăng nhập</h2><p class="subtitle">Sử dụng tài khoản được cấp bởi phòng khám.</p><form id="login-form"><div class="field"><label for="login-username">Tên đăng nhập</label><input id="login-username" name="username" autocomplete="username" placeholder="Nhập tên đăng nhập" required maxlength="100"></div><div class="field"><label for="login-password">Mật khẩu</label><input id="login-password" name="password" type="password" autocomplete="current-password" placeholder="Nhập mật khẩu" required maxlength="200"></div><div id="login-error" class="login-error" role="alert"></div><button class="btn full" type="submit">Đăng nhập qua API ${icon('arrow',15)}</button></form><div class="login-divider">HOẶC KHÁM PHÁ GIAO DIỆN</div>${btn('Dùng bản xem thử','start-demo','','secondary full')}<div class="info-box">${icon('info',17)}<span>Bản backend hiện tại mới có chức năng kiểm tra hệ thống. Đăng nhập thật cần API tài khoản của nhóm; bản xem thử sử dụng dữ liệu mẫu riêng.</span></div></div></main></div>`;
}
async function checkHealth() {
  const target=$('#health-status');if(!target)return;
  target.textContent='Đang kiểm tra kết nối…';
  const results=await Promise.allSettled([request('/health',{timeout:5000}),request('/health/db',{timeout:5000})]);
  if(!target.isConnected)return;
  target.innerHTML=results.map((r,index)=>`<div class="summary-line"><span>${index===0?'Máy chủ ứng dụng':'Cơ sở dữ liệu'}</span><strong>${r.status==='fulfilled'&&r.value[index===0?'status':'database']==='ok'?'<span class="badge confirmed">Hoạt động</span>':'<span class="badge pending">Chưa kết nối</span>'}</strong></div>`).join('');
}

async function mutate(operation,message,route=state.route) {
  if(state.pending)return;
  state.pending=true;
  const buttons=$$('button').map(node=>({node,disabled:node.disabled}));buttons.forEach(x=>{x.node.disabled=true;});
  try{await operation();closeModal();toast(message);await navigate(route);}
  catch(error){const output=$('#dialog[open] .login-error');if(output)output.textContent=error.message;else toast(error.message,true);}
  finally{state.pending=false;buttons.forEach(x=>{if(x.node.isConnected)x.node.disabled=x.disabled;});}
}
function confirmTransition(id,action) {
  const a=state.data.appointments.find(a=>same(a.id,id));if(!a)return;
  const title={cancel:'Hủy lịch khám này?',confirm:'Xác nhận lịch khám?',checkin:'Check-in bệnh nhân?'}[action];
  const detail=action==='cancel'?'Khung giờ sẽ được trả lại cho người khác. Bạn có thể đặt một lịch mới sau đó.':action==='confirm'?'Lịch hẹn sẽ được chuyển sang trạng thái đã xác nhận.':'Xác nhận bệnh nhân đã có mặt tại phòng khám để chờ bác sĩ tiếp nhận.';
  modal(title,`<p class="small muted">${detail}</p><div class="date-block mt">${dateTile(a.starts_at)}<div><strong>${esc(a.patient_name)}</strong><p class="small">${time(a.starts_at)} · BS. ${esc(doctor(a.doctor_id).name)}</p></div></div>${previewNotice()}<div class="dialog-footer">${btn('Quay lại','close-dialog','','secondary')}${btn(action==='cancel'?'Xác nhận hủy':action==='confirm'?'Xác nhận lịch':'Xác nhận check-in','do-transition',`data-id="${esc(id)}" data-operation="${action}"`,action==='cancel'?'danger':'')}</div>`);
}
function confirmPay(id) {
  const i=state.data.invoices.find(i=>same(i.id,id));if(!i||!['admin','receptionist'].includes(state.user.role))return;
  modal('Ghi nhận đã thu tiền',`<p class="small muted">Chỉ xác nhận khi phòng khám đã nhận được tiền thanh toán. Đây là bước ghi nhận thu phí, không tự chuyển tiền.</p><div class="summary-line mt"><span>Hóa đơn</span><strong>${esc(i.id)}</strong></div><div class="summary-line"><span>Bệnh nhân</span><strong>${esc(i.patient_name)}</strong></div><div class="summary-total"><span>Số tiền</span><strong>${money(i.total)}</strong></div>${previewNotice()}<div class="dialog-footer">${btn('Quay lại','close-dialog','','secondary')}${btn('Xác nhận đã thu','do-pay',`data-id="${esc(id)}"`)}</div>`);
}
function exportReport() {
  const r=state.report.data;if(!r){toast('Chưa có dữ liệu báo cáo để xuất.',true);return;}
  const rows=[['Clinic Booking',state.mode==='demo'?'DU LIEU XEM THU':'BAO CAO DOANH THU'],['Từ ngày',state.report.from],['Đến ngày',state.report.to],['Dịch vụ',state.report.service?state.data.services.find(s=>same(s.id,state.report.service))?.name||state.report.service:'Tất cả'],[],['Ngày','Doanh thu (VNĐ)'],...r.by_day.map(d=>[d.date,d.total]),[],['Dịch vụ','Doanh thu (VNĐ)'],...r.by_service.map(d=>[d.name,d.total]),[],['Tổng doanh thu',r.total],['Số hóa đơn',r.invoice_count]];
  const cell=value=>{let text=String(value??'');if(/^[=+\-@]/.test(text.trimStart()))text=`'${text}`;return `"${text.replace(/"/g,'""')}"`;};
  const blob=new Blob(['\ufeff'+rows.map(row=>row.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${state.mode==='demo'?'XEM-THU-':''}doanh-thu-${state.report.from}-${state.report.to}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function updateVisitTotal() {
  let total=0;
  $$('.service-choice').forEach(row=>{const check=$('.service-check',row),quantity=$('.service-quantity',row);quantity.disabled=!check.checked;if(check.checked){const s=state.data.services.find(s=>same(s.id,check.value));total+=(s?.price||0)*Math.max(0,Number(quantity.value)||0);}});
  if($('#visit-total'))$('#visit-total').textContent=money(total);
}
function closeMenu(){ $('#sidebar')?.classList.remove('open');$('.mobile-backdrop')?.classList.remove('active');$('.menu-button')?.setAttribute('aria-expanded','false'); }

document.addEventListener('click', async event=>{
  const target=event.target.closest('[data-action]');if(!target)return;
  event.preventDefault();if(state.pending)return;
  const action=target.dataset.action,id=target.dataset.id;
  try{
    switch(action){
      case 'nav': closeModal();go(target.dataset.route);break;
      case 'profile': go('profile');break;
      case 'menu': {const open=$('#sidebar').classList.toggle('open');$('.mobile-backdrop').classList.toggle('active',open);target.setAttribute('aria-expanded',String(open));break;}
      case 'close-menu':closeMenu();break;
      case 'close-dialog':closeModal();break;
      case 'reload':navigate(state.route);break;
      case 'role':showRolePicker();break;
      case 'start-demo':state.mode='demo';pref('mode','demo');showRolePicker();break;
      case 'select-role': if(!demo.users[target.dataset.role])return;state.mode='demo';pref('mode','demo');pref('preview-role',target.dataset.role);state.user=demo.users[target.dataset.role];setToken(null);state.filters={search:'',specialty:'',status:'',date:''};closeModal();go('dashboard');break;
      case 'switch-api':state.mode='api';pref('mode','api');state.user=null;setToken(null);closeModal();renderLogin();break;
      case 'logout':state.user=null;setToken(null);closeModal();renderLogin();break;
      case 'new-booking':newBooking();break;
      case 'book-doctor':newBooking(id);break;
      case 'doctor-detail':{const d=doctor(id);modal(`BS. ${d.name}`,`<div class="row">${avatar(d,'xl')}<div><h3>${esc(d.specialty_name)}</h3><p class="small muted">${esc(d.experience||0)} năm kinh nghiệm · ${esc(d.room)}</p></div></div><p class="note-block mt">${esc(d.description)}</p><div class="summary-total"><span>Phí khám dự kiến</span><strong>${money(d.fee)}</strong></div><div class="dialog-footer">${btn('Đóng','close-dialog','','secondary')}</div>`);break;}
      case 'pick-date':rememberReason();state.booking.date=target.dataset.date;state.booking.slot='';await loadSlots();break;
      case 'pick-slot':rememberReason();state.booking.slot=id;renderBooking();break;
      case 'appointment-detail':showAppointment(id);break;
      case 'reschedule':{const a=state.data.appointments.find(a=>same(a.id,id));if(!a||!demo.canChange(a))throw new Error('Lịch này không còn đủ điều kiện đổi trước 2 tiếng.');closeModal();newBooking(a.doctor_id,a.id);break;}
      case 'cancel':case 'confirm':case 'checkin':confirmTransition(id,action);break;
      case 'do-transition':{const operation=target.dataset.operation;if(!['cancel','confirm','checkin'].includes(operation))return;await mutate(()=>state.mode==='demo'?demo.transition(state.user,id,operation):api[operation](id),({cancel:'Đã hủy lịch khám.',confirm:'Đã xác nhận lịch khám.',checkin:'Đã check-in bệnh nhân.'})[operation]);break;}
      case 'confirm-booking':{const b={...state.booking};await mutate(()=>state.mode==='demo'?demo.book(state.user,b.slot,b.reason,b.editing):b.editing?api.reschedule(b.editing,b.slot):api.book({schedule_id:b.slot,reason:b.reason}),`${state.mode==='demo'?'Đã lưu lịch mẫu':'Đã gửi yêu cầu đặt lịch'}. Lịch đang chờ xác nhận.`,'appointments');break;}
      case 'filter-status':state.filters.status=target.dataset.status;renderAppointments();break;
      case 'clear-filters':state.filters={search:'',specialty:'',status:'',date:''};renderAppointments();break;
      case 'invoice-filter':state.filters.status=target.dataset.status;renderInvoices();break;
      case 'visit-detail':showVisit(id);break;
      case 'visit-form':showVisitForm(id);break;
      case 'invoice-detail':showInvoice(id);break;
      case 'pay':confirmPay(id);break;
      case 'do-pay':await mutate(()=>state.mode==='demo'?demo.pay(state.user,id):api.pay(id),'Đã ghi nhận thanh toán.');break;
      case 'print':window.print();break;
      case 'service-form':showServiceForm(id);break;
      case 'export-report':exportReport();break;
      case 'health':checkHealth();break;
      case 'reset-demo':modal('Khôi phục dữ liệu mẫu?',`<p class="small muted">Các lịch khám, hóa đơn và chỉnh sửa mẫu bạn đã tạo trên trình duyệt này sẽ được thay bằng dữ liệu ban đầu. Thao tác không ảnh hưởng máy chủ.</p><div class="dialog-footer">${btn('Giữ dữ liệu hiện tại','close-dialog','','secondary')}${btn('Khôi phục dữ liệu mẫu','do-reset','','danger')}</div>`);break;
      case 'do-reset':demo.reset();closeModal();toast('Đã khôi phục dữ liệu mẫu.');navigate(state.route);break;
      case 'help':modal('Trước khi đến phòng khám',`<div class="stack"><div class="row">${icon('calendar',20)}<div><strong>Kiểm tra lịch đã xác nhận</strong><p class="small muted">Theo dõi trạng thái tại mục Lịch của tôi.</p></div></div><div class="row">${icon('clock',20)}<div><strong>Sắp xếp đến sớm khoảng 10 phút</strong><p class="small muted">Để lễ tân tiếp nhận và hướng dẫn bạn.</p></div></div><div class="row">${icon('folder',20)}<div><strong>Mang theo thông tin khám trước đó</strong><p class="small muted">Trao đổi trực tiếp với bác sĩ về tình trạng của bạn.</p></div></div><div class="info-box">${icon('info',17)}<span>Cần thay đổi lịch? Thực hiện trước giờ khám ít nhất 2 tiếng.</span></div></div><div class="dialog-footer">${btn('Đã hiểu','close-dialog')}</div>`);break;
    }
  }catch(error){toast(error.message,true);}
});
document.addEventListener('input', event=>{
  if(event.target.id==='doctor-search'){state.filters.search=event.target.value;renderDoctorResults();}
  if(event.target.id==='appointment-search'){state.filters.search=event.target.value;renderAppointmentResults();}
  if(event.target.id==='booking-reason')state.booking.reason=event.target.value;
  if(event.target.classList.contains('service-quantity'))updateVisitTotal();
});
document.addEventListener('change',async event=>{
  if(state.pending)return;
  const target=event.target;
  try{
    if(target.id==='specialty-filter'){state.filters.specialty=target.value;renderDoctorResults();}
    if(target.id==='appointment-date'){state.filters.date=target.value;renderAppointmentResults();}
    if(target.id==='booking-doctor'){rememberReason();state.booking.doctor=target.value;state.booking.slot='';await loadSlots();}
    if(target.id==='booking-date'){
      if(!target.value||target.value<demo.day()||target.value>demo.day(30)){target.value=state.booking.date;throw new Error('Chọn ngày khám trong 30 ngày tới.');}
      rememberReason();state.booking.date=target.value;state.booking.slot='';await loadSlots();
    }
    if(target.classList.contains('service-check'))updateVisitTotal();
  }catch(error){toast(error.message,true);}
});
document.addEventListener('submit',async event=>{
  const form=event.target;if(!['booking-form','login-form','visit-form','service-form','report-form'].includes(form.id))return;
  event.preventDefault();if(state.pending)return;
  try{
    if(form.id==='login-form'){
      const button=$('button[type=submit]',form);button.disabled=true;state.pending=true;
      $('#login-error').textContent='';
      try{
        const result=await api.login({username:$('#login-username').value.trim(),password:$('#login-password').value});
        if(typeof result.access_token!=='string'||!result.access_token)throw new Error('Máy chủ chưa trả về access_token hợp lệ.');
        setToken(result.access_token);const user=result.user||await api.me();
        if(!user||!Object.hasOwn(navItems,user.role)||!user.name||user.id==null||(user.role==='doctor'&&user.doctor_id==null))throw new Error('Thông tin tài khoản hoặc vai trò chưa đúng hợp đồng API.');
        state.mode='api';pref('mode','api');state.user=user;state.filters={search:'',specialty:'',status:'',date:''};go('dashboard');
      }catch(error){setToken(null);if($('#login-error'))$('#login-error').textContent=error.message;}
      finally{state.pending=false;if(button.isConnected)button.disabled=false;}
    }
    if(form.id==='booking-form'){
      rememberReason();const b=state.booking;const slot=b.slots.find(s=>same(s.id,b.slot)&&s.available);
      if(!slot)throw new Error('Vui lòng chọn khung giờ còn trống.');
      if(!b.reason.trim())throw new Error('Vui lòng nhập lý do khám.');
      const d=doctor(b.doctor);
      modal(b.editing?'Xác nhận đổi lịch':'Xác nhận lịch hẹn',`<p class="small muted">Kiểm tra thông tin trước khi ${b.editing?'thay đổi lịch':'gửi yêu cầu'}.</p><dl class="details-list mt"><dt>Bệnh nhân</dt><dd>${esc(state.user.name)}</dd><dt>Bác sĩ</dt><dd>BS. ${esc(d.name)}</dd><dt>Thời gian</dt><dd>${time(slot.starts_at)} · ${fmt(slot.starts_at)}</dd><dt>Lý do khám</dt><dd class="word-wrap">${esc(b.reason)}</dd></dl>${previewNotice()}<div class="dialog-footer">${btn('Chỉnh sửa','close-dialog','','secondary')}${btn(b.editing?'Xác nhận đổi lịch':'Xác nhận đặt lịch','confirm-booking')}</div>`);
    }
    if(form.id==='visit-form'){
      const services=$$('.service-choice',form).filter(row=>$('.service-check',row).checked).map(row=>({service_id:$('.service-check',row).value,quantity:Number($('.service-quantity',row).value)}));
      if(!services.length)throw new Error('Chọn ít nhất một dịch vụ đã sử dụng.');
      const body={diagnosis:$('#visit-diagnosis').value.trim(),notes:$('#visit-notes').value.trim(),services};
      await mutate(()=>state.mode==='demo'?demo.complete(state.user,form.dataset.id,body):api.complete(form.dataset.id,body),'Đã hoàn tất lượt khám và lập hóa đơn.');
    }
    if(form.id==='service-form'){
      const body={name:$('#service-name').value.trim(),price:Number($('#service-price').value),active:$('#service-active').checked};
      await mutate(()=>state.mode==='demo'?demo.saveService(state.user,form.dataset.id,body):api.saveService(form.dataset.id,body),'Đã lưu dịch vụ.');
    }
    if(form.id==='report-form'){
      const from=$('#report-from').value,to=$('#report-to').value,service=$('#report-service').value;
      if(!from||!to||from>to)throw new Error('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.');
      if((dateObject(to)-dateObject(from))/86400000>92)throw new Error('Mỗi lần xem báo cáo tối đa 93 ngày.');
      Object.assign(state.report,{from,to,service,data:null});$('#report-results').innerHTML='<div class="loading">Đang tổng hợp…</div>';await loadReport();
    }
  }catch(error){const output=$('.login-error',form);if(output)output.textContent=error.message;else toast(error.message,true);}
});
window.addEventListener('hashchange',()=>{if(state.pending)return;go(location.hash.slice(1)||'dashboard');});
window.addEventListener('storage',event=>{if(event.key==='clinic-booking.demo.v1'&&state.mode==='demo'&&state.user&&!state.pending){closeModal();navigate(state.route);toast('Dữ liệu mẫu đã được cập nhật ở cửa sổ khác.');}});
$('#dialog').addEventListener('click',event=>{if(event.target===$('#dialog')&&!state.pending){const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeModal();}});
$('#dialog').addEventListener('cancel',event=>{if(state.pending)event.preventDefault();});
if(state.user)navigate(location.hash.slice(1)||'dashboard');else renderLogin();
