
"use strict";
let token=sessionStorage.getItem("clinic_token")||"";
let user=null;
const content=document.querySelector("#content");
const labels={PATIENT:"Bệnh nhân",RECEPTIONIST:"Lễ tân",DOCTOR:"Bác sĩ",ADMIN:"Quản trị"};
const statuses={pending:"Chờ xác nhận",confirmed:"Đã xác nhận",checked_in:"Đã đến",in_progress:"Đang khám",completed:"Hoàn thành",cancelled:"Đã hủy",no_show:"Không đến",paid:"Đã thanh toán",unpaid:"Chưa thanh toán"};
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=v=>Number(v).toLocaleString("vi-VN")+" đ";
const date=v=>new Date(v).toLocaleString("vi-VN",{timeZone:"Asia/Ho_Chi_Minh",hour:"2-digit",minute:"2-digit",day:"2-digit",month:"2-digit",year:"numeric"});
const today=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Ho_Chi_Minh"}).format(new Date());
const badge=s=>'<span class="badge '+esc(s)+'">'+esc(statuses[s]||s)+'</span>';
const staff=()=>user&&["ADMIN","RECEPTIONIST"].includes(user.role);
function queryString(params){const query=new URLSearchParams(params);for(const [key,value] of [...query])if(value==="")query.delete(key);return query.toString()}
function field(name,label,type="text",value="",required=true){return '<div class="field"><label for="'+name+'">'+label+'</label><input id="'+name+'" name="'+name+'" type="'+type+'" value="'+esc(value)+'" '+(required?"required":"")+'></div>'}
function notice(message,error=false){document.querySelector("#notice").innerHTML='<div class="notice '+(error?"error":"")+'">'+esc(message)+'</div>'}
function clearAuth(){token="";user=null;sessionStorage.removeItem("clinic_token");navigation()}
async function api(path,method="GET",data){
 const res=await fetch("/api"+path,{method,headers:{"Content-Type":"application/json",...(token?{Authorization:"Bearer "+token}:{})},...(data===undefined?{}:{body:JSON.stringify(data)})});
 const value=await res.json().catch(()=>({detail:"Phản hồi không hợp lệ."}));
 if(!res.ok){if(res.status===401&&token){clearAuth();location.hash="#login"}throw new Error(Array.isArray(value.detail)?value.detail.map(e=>e.field+": "+e.message).join("; "):(value.detail||"Lỗi HTTP "+res.status))}
 return value;
}
function navigation(){
 let links=[["home","Tổng quan"],["doctors","Bác sĩ và đặt lịch"],["services","Dịch vụ"]];
 if(user){links.push(["appointments",user.role==="DOCTOR"?"Lịch khám của tôi":"Lịch hẹn"]);if(user.role==="PATIENT")links.push(["history","Lịch sử khám"]);if(user.role!=="DOCTOR")links.push(["invoices","Hóa đơn"]);if(user.role==="ADMIN")links.push(["admin","Quản trị"],["reports","Thống kê"]);links.push(["profile","Hồ sơ cá nhân"])}
 else links.push(["login","Đăng nhập"],["register","Tạo tài khoản"]);
 document.querySelector("#nav").innerHTML=links.map(([href,name])=>'<a href="#'+href+'" class="'+(location.hash.split("?")[0]==="#"+href?"active":"")+'">'+name+'</a>').join("");
 document.querySelector("#identity").innerHTML=user?'<span><b>'+esc(user.full_name)+'</b><br><small>'+labels[user.role]+'</small></span><button class="small secondary" data-action="logout">Đăng xuất</button>':'<a href="#login">Đăng nhập</a>';
}
function head(title,sub=""){return '<div class="page-head"><div><div class="eyebrow">CLINIC-BOOKING 2</div><h1>'+esc(title)+'</h1><p class="muted">'+esc(sub)+'</p></div></div>'}
function modal(html){document.querySelector("#dialog-content").innerHTML=html;document.querySelector("#dialog").showModal()}
function closeModal(){document.querySelector("#dialog").close()}
function pager(data,route,params=new URLSearchParams()){
 function link(p){const next=new URLSearchParams(params);next.set("page",p);return "#"+route+"?"+next}
 return '<div class="pager">'+(data.page>1?'<a class="btn secondary small" href="'+esc(link(data.page-1))+'">Trước</a>':"")+'<small>Trang '+data.page+' · '+data.total+' kết quả</small>'+(data.page*data.page_size<data.total?'<a class="btn secondary small" href="'+esc(link(data.page+1))+'">Sau</a>':"")+'</div>';
}
function doctorCards(data){return '<div class="grid">'+data.items.map(d=>'<article class="card"><div class="avatar">'+esc(d.full_name.split(" ").pop().slice(0,1))+'</div><small>'+esc(d.specialty)+'</small><h2>'+esc(d.full_name)+'</h2><p class="muted">'+esc(d.bio)+'</p><a class="btn" href="#slots?doctor_id='+d.id+'">Xem giờ trống</a></article>').join("")+'</div>'}
async function home(){
 const doctors=await api("/doctors?page_size=3");
 content.innerHTML='<section class="hero"><div><div class="eyebrow">NHA KHOA · HẢI PHÒNG</div><h1>Chủ động lịch khám.<br>Thuận tiện mỗi lần đến.</h1><p>Chọn bác sĩ và giờ hẹn. Theo dõi kết quả khám, dịch vụ và hóa đơn trong một nơi.</p><a class="btn" href="#doctors">Đặt lịch khám</a></div><div class="card"><h2>'+(user?"Chào "+esc(user.full_name):"Lịch hẹn rõ ràng")+'</h2><p>01 · Chọn bác sĩ và khung giờ trống</p><p>02 · Chờ lễ tân xác nhận lịch</p><p>03 · Đến khám theo giờ đã hẹn</p><small>Đổi/hủy khi còn ít nhất 2 giờ trước lịch hiện tại.</small></div></section>'+head("Đội ngũ bác sĩ")+doctorCards(doctors);
}
async function doctors(params){
 const specs=await api("/specialties");const data=await api("/doctors?"+queryString(params));
 content.innerHTML=head("Chọn bác sĩ","Tìm theo tên hoặc chuyên khoa nha khoa.")+'<form data-form="doctor-filter" class="filter"><div class="field"><label>Tên bác sĩ</label><input name="q" value="'+esc(params.get("q")||"")+'"></div><div class="field"><label>Chuyên khoa</label><select name="specialty_id"><option value="">Tất cả</option>'+specs.filter(s=>s.is_active).map(s=>'<option value="'+s.id+'" '+(params.get("specialty_id")==s.id?"selected":"")+'>'+esc(s.name)+'</option>').join("")+'</select></div><button>Tìm kiếm</button></form>'+doctorCards(data)+pager(data,"doctors",params);
}
async function slots(params){
 const data=await api("/schedules?"+queryString(params));
 content.innerHTML=head("Khung giờ còn trống","Giờ hiển thị theo Việt Nam. Hệ thống kiểm tra lại khi xác nhận đặt.")+'<form class="filter" data-form="slot-filter"><input type="hidden" name="doctor_id" value="'+esc(params.get("doctor_id")||"")+'">'+field("day","Ngày khám","date",params.get("day")||"",false)+'<button>Lọc ngày</button></form><div class="grid">'+data.items.map(s=>'<div class="card"><h3>'+esc(s.doctor)+'</h3><p>'+date(s.start_at)+' – '+new Date(s.end_at).toLocaleTimeString("vi-VN",{timeZone:"Asia/Ho_Chi_Minh",hour:"2-digit",minute:"2-digit"})+'</p><button data-action="book" data-id="'+s.id+'">Đặt giờ này</button></div>').join("")+'</div>'+(!data.total?'<div class="card empty">Không còn khung giờ phù hợp.</div>':"")+pager(data,"slots",params);
}
function authForm(register=false){
 content.innerHTML='<section class="card form-card">'+head(register?"Tạo tài khoản bệnh nhân":"Đăng nhập")+'<form data-form="'+(register?"register":"login")+'">'+field("username","Tên đăng nhập")+(register?field("full_name","Họ tên")+field("email","Email","email")+field("phone","Số điện thoại","tel","",false):"")+field("password","Mật khẩu","password")+'<small>'+(register?"Mật khẩu từ 10 ký tự.":"Dùng tài khoản theo vai trò được quản trị cấp.")+'</small><div class="actions"><button>'+(register?"Đăng ký":"Đăng nhập")+'</button></div></form><p><a href="#'+(register?"login":"register")+'">'+(register?"Đã có tài khoản":"Tạo tài khoản bệnh nhân")+'</a></p></section>';
}
async function appointments(params,history=false){
 if(!user){location.hash="#login";return}
 const query=new URLSearchParams(params);
 if(history)query.set("status","completed");
 if(!history&&user.role!=="PATIENT"&&!params.has("day"))query.set("day",today());
 const data=await api("/appointments?"+queryString(query));
 content.innerHTML=head(history?"Lịch sử khám":"Danh sách lịch hẹn",user.role==="DOCTOR"?"Chỉ hiển thị bệnh nhân được phân công cho bạn.":"Lọc đúng ngày hẹn hoặc bỏ ngày để xem toàn bộ.")+'<form class="filter" data-form="appointment-filter"><input type="hidden" name="route" value="'+(history?"history":"appointments")+'">'+field("day","Ngày hẹn","date",query.get("day")||"",false)+'<div class="field"><label>Trạng thái</label><select name="status"><option value="">Tất cả</option>'+Object.entries(statuses).filter(([s])=>!["paid","unpaid"].includes(s)).map(([s,l])=>'<option '+(query.get("status")===s?"selected":"")+' value="'+s+'">'+l+'</option>').join("")+'</select></div><button>Lọc</button></form><div class="card table-wrap"><table><thead><tr><th>Lịch</th><th>Bệnh nhân</th><th>Bác sĩ và giờ</th><th>Trạng thái</th><th></th></tr></thead><tbody>'+data.items.map(a=>'<tr><td>#'+a.id+'</td><td>'+esc(a.patient)+'</td><td>'+esc(a.slot.doctor)+'<small>'+date(a.slot.start_at)+'</small></td><td>'+badge(a.status)+'</td><td><a href="#appointment?id='+a.id+'">Chi tiết</a></td></tr>').join("")+'</tbody></table>'+(!data.total?'<div class="empty">Chưa có lịch phù hợp.</div>':"")+'</div>'+pager(data,history?"history":"appointments",query);
}
async function appointment(id){
 const a=await api("/appointments/"+id);let actions="";
 if(user.role==="PATIENT"&&["pending","confirmed"].includes(a.status)&&new Date(a.slot.start_at)-Date.now()>=7200000)actions='<button data-action="move" data-id="'+id+'">Đổi giờ</button><button class="danger" data-action="cancel" data-id="'+id+'">Hủy lịch</button>';
 if(staff()&&a.status==="pending")actions+='<button data-action="transition" data-state="confirm" data-id="'+id+'">Xác nhận</button>';
 if(staff()&&a.status==="confirmed")actions+='<button data-action="transition" data-state="check_in" data-id="'+id+'">Check-in hôm nay</button><button class="secondary" data-action="transition" data-state="no_show" data-id="'+id+'">Không đến</button>';
 if(user.role==="DOCTOR"||(user.role==="PATIENT"&&a.status==="completed"))actions+='<a class="btn" href="#medical?id='+id+'">Hồ sơ khám</a>';
 content.innerHTML=head("Lịch hẹn #"+id)+'<div class="card"><h2>'+esc(a.patient)+'</h2><p>'+esc(a.slot.doctor)+' · '+date(a.slot.start_at)+'</p>'+badge(a.status)+(a.reason!==undefined?'<p class="record-text">'+esc(a.reason)+'</p>':"")+'<div class="actions">'+actions+'</div></div>';
}
async function medical(id){
 const [a,m,services]=await Promise.all([api("/appointments/"+id),api("/medical/"+id),api("/services")]);
 const edit=user.role==="DOCTOR"&&["checked_in","in_progress"].includes(a.status);
 content.innerHTML=head("Hồ sơ lượt khám #"+id,a.patient+" · "+a.slot.doctor)+'<div class="split"><section class="card"><h2>Kết quả khám</h2>'+(edit?'<form data-form="record" id="record-form"><input type="hidden" name="id" value="'+id+'">'+["symptoms","diagnosis","advice"].map((k,i)=>'<div class="field"><label>'+["Triệu chứng","Chẩn đoán","Lời dặn"][i]+'</label><textarea name="'+k+'">'+esc(m[k])+'</textarea></div>').join("")+'<div class="actions"><button name="action" value="save" class="secondary">Lưu hồ sơ</button><button name="action" value="finish">Hoàn thành và lập hóa đơn</button></div></form>':["symptoms","diagnosis","advice"].map((k,i)=>'<h3>'+["Triệu chứng","Chẩn đoán","Lời dặn"][i]+'</h3><div class="record-text">'+esc(m[k]||"Chưa ghi nhận")+'</div>').join(""))+'</section><aside class="card"><h2>Dịch vụ đã dùng</h2>'+m.services.map(s=>'<p><b>'+esc(s.name)+'</b><br>'+s.quantity+' × '+money(s.unit_price)+(edit?' <button class="small danger" data-action="remove-service" data-id="'+id+'" data-line="'+s.id+'">Bỏ</button>':"")+'</p>').join("")+(edit?'<form data-form="visit-service"><input type="hidden" name="id" value="'+id+'"><div class="field"><label>Dịch vụ</label><select name="service_id">'+services.map(s=>'<option value="'+s.id+'">'+esc(s.name)+' · '+money(s.price)+'</option>').join("")+'</select></div>'+field("quantity","Số lượng","number",1)+'<button>Thêm dịch vụ</button></form>':"")+'</aside></div>';
}
async function invoices(params){
 const data=await api("/invoices?"+params);
 content.innerHTML=head("Hóa đơn","Thanh toán được xác nhận tại quầy.")+'<div class="card table-wrap"><table><thead><tr><th>Mã</th><th>Bệnh nhân</th><th>Tổng tiền</th><th>Trạng thái</th><th></th></tr></thead><tbody>'+data.items.map(i=>'<tr><td>#'+i.id+'</td><td>'+esc(i.patient)+'</td><td>'+money(i.total)+'</td><td>'+badge(i.status)+'</td><td><a href="#invoice?id='+i.id+'">Xem hóa đơn</a></td></tr>').join("")+'</tbody></table></div>'+pager(data,"invoices",params);
}
async function invoice(id){
 const i=await api("/invoices/"+id);
 content.innerHTML=head("Hóa đơn #"+id)+"<article class='card'><h2>clinic-booking 2</h2><p>Bệnh nhân: "+esc(i.patient)+"<br>Lượt khám: #"+i.appointment_id+"<br>Ngày lập: "+date(i.created_at)+"</p>"+badge(i.status)+'<div class="table-wrap"><table><thead><tr><th>Dịch vụ</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>'+i.items.map(x=>'<tr><td>'+esc(x.name)+'</td><td>'+x.quantity+'</td><td>'+money(x.unit_price)+'</td><td>'+money(x.line_total)+'</td></tr>').join("")+'</tbody></table></div><div class="total"><span>Tổng cộng</span><span>'+money(i.total)+'</span></div><div class="actions"><button class="secondary" data-action="print">In hóa đơn</button>'+(staff()&&i.status==="unpaid"?'<button data-action="pay" data-id="'+id+'">Xác nhận thanh toán</button>':"")+'</div></article>';
}
async function servicesPage(){const data=await api("/services");content.innerHTML=head("Dịch vụ nha khoa","Giá trong bộ dữ liệu mẫu phục vụ đồ án.")+'<div class="grid two">'+data.map(s=>'<div class="card"><h2>'+esc(s.name)+'</h2><p class="muted">'+esc(s.description)+'</p><b class="price">'+money(s.price)+'</b></div>').join("")+'</div>'}
async function reports(params){
 const start=params.get("start")||today().slice(0,8)+"01",end=params.get("end")||today();
 const data=await api("/reports/revenue?"+new URLSearchParams({start,end}));
 content.innerHTML=head("Doanh thu theo dịch vụ","Chỉ tính hóa đơn đã thanh toán, theo ngày thu tiền.")+'<form class="filter" data-form="report-filter">'+field("start","Từ ngày","date",start)+field("end","Đến ngày","date",end)+'<button>Xem thống kê</button></form><div class="card"><div class="summary"><div><small>Doanh thu</small><br><b>'+money(data.total)+'</b></div><div><small>Hóa đơn đã thu</small><br><b>'+data.invoice_count+'</b></div></div><div class="table-wrap"><table><thead><tr><th>Dịch vụ</th><th>Số lượng</th><th>Doanh thu</th></tr></thead><tbody>'+data.services.map(x=>'<tr><td>'+esc(x.name)+'</td><td>'+x.quantity+'</td><td>'+money(x.revenue)+'</td></tr>').join("")+'</tbody></table></div></div>';
}
function profile(){content.innerHTML=head("Thông tin cá nhân")+'<div class="grid two"><section class="card"><form data-form="profile">'+field("full_name","Họ tên","text",user.full_name)+field("email","Email","email",user.email)+field("phone","Điện thoại","tel",user.phone,false)+'<button>Lưu thông tin</button></form></section><section class="card"><h2>Đổi mật khẩu</h2><form data-form="password">'+field("old_password","Mật khẩu hiện tại","password")+field("new_password","Mật khẩu mới","password")+'<button>Đổi mật khẩu</button></form></section></div>'}
async function admin(){
 if(user?.role!=="ADMIN")throw new Error("Trang này dành cho quản trị.");
 const [people,specs,docs,svc,slots]=await Promise.all([api("/users"),api("/specialties"),api("/doctors?page_size=100"),api("/services?include_inactive=true"),api("/schedules?available=false&page_size=100")]);
 content.innerHTML=head("Quản trị phòng khám","Quản lý tài khoản, danh mục và lịch làm việc.")+'<div class="grid two"><section class="card"><h2>Tạo tài khoản</h2><form data-form="staff">'+field("username","Tên đăng nhập")+field("full_name","Họ tên")+field("email","Email","email")+field("password","Mật khẩu ban đầu","password")+'<div class="field"><label>Vai trò</label><select name="role">'+Object.entries(labels).map(([k,v])=>'<option value="'+k+'">'+v+'</option>').join("")+'</select></div><button>Tạo tài khoản</button></form><details><summary>'+people.length+' tài khoản</summary>'+people.map(p=>'<p>'+esc(p.username)+' · '+labels[p.role]+' <button class="small secondary" data-action="user-state" data-id="'+p.id+'" data-active="'+p.is_active+'">'+(p.is_active?"Khóa":"Mở")+'</button></p>').join("")+'</details></section><section class="card"><h2>Chuyên khoa và bác sĩ</h2><form data-form="specialty">'+field("name","Tên chuyên khoa")+'<button>Thêm chuyên khoa</button></form><hr><form data-form="doctor"><div class="field"><label>Tài khoản bác sĩ</label><select name="user_id">'+people.filter(p=>p.role==="DOCTOR").map(p=>'<option value="'+p.id+'">'+esc(p.full_name)+'</option>').join("")+'</select></div><div class="field"><label>Chuyên khoa</label><select name="specialty_id">'+specs.map(s=>'<option value="'+s.id+'">'+esc(s.name)+'</option>').join("")+'</select></div>'+field("bio","Giới thiệu","text","",false)+'<button>Thêm hồ sơ bác sĩ</button></form></section><section class="card"><h2>Tạo khung giờ</h2><form data-form="schedule"><div class="field"><label>Bác sĩ</label><select name="doctor_id">'+docs.items.map(d=>'<option value="'+d.id+'">'+esc(d.full_name)+'</option>').join("")+'</select></div>'+field("start_at","Bắt đầu theo giờ trên máy","datetime-local")+field("end_at","Kết thúc theo giờ trên máy","datetime-local")+'<button>Tạo khung giờ</button></form><details><summary>Khung giờ sắp tới</summary>'+slots.items.map(s=>'<p>'+esc(s.doctor)+'<br>'+date(s.start_at)+' <button class="small secondary" data-action="close-slot" data-id="'+s.id+'">Đóng</button></p>').join("")+'</details></section><section class="card"><h2>Danh mục dịch vụ</h2><form data-form="service">'+field("name","Tên dịch vụ")+field("price","Giá VND","number")+field("description","Mô tả","text","",false)+'<button>Thêm dịch vụ</button></form><details open><summary>Dịch vụ hiện có</summary>'+svc.map(s=>'<p><b>'+esc(s.name)+'</b><br>'+money(s.price)+' <button class="small secondary" data-action="edit-service" data-id="'+s.id+'" data-name="'+esc(s.name)+'" data-price="'+s.price+'" data-description="'+esc(s.description)+'">Sửa</button> <button class="small danger" data-action="disable-service" data-id="'+s.id+'">Ngừng</button></p>').join("")+'</details></section></div>';
}
async function render(){
 navigation();content.innerHTML='<div class="empty">Đang tải…</div>';
 const [route,query]=location.hash.slice(1).split("?");const params=new URLSearchParams(query);
 try{
  if(["appointments","history","appointment","medical","invoices","invoice","reports","profile","admin"].includes(route)&&!user){location.hash="#login";return}
  switch(route){
   case "doctors":await doctors(params);break;case "slots":await slots(params);break;
   case "login":authForm();break;case "register":authForm(true);break;
   case "appointments":await appointments(params);break;case "history":await appointments(params,true);break;
   case "appointment":await appointment(params.get("id"));break;case "medical":await medical(params.get("id"));break;
   case "invoices":await invoices(params);break;case "invoice":await invoice(params.get("id"));break;
   case "services":await servicesPage();break;case "reports":await reports(params);break;
   case "profile":profile();break;case "admin":await admin();break;default:await home();
  }
 }catch(e){content.innerHTML='<div class="card empty">'+esc(e.message)+'</div>';notice(e.message,true)}
}
async function preserveRecord(){const f=document.querySelector("#record-form");if(f){const d=Object.fromEntries(new FormData(f));const id=d.id;delete d.id;await api("/medical/"+id,"PUT",{...d,finish:false})}}
document.addEventListener("submit",async e=>{
 const form=e.target;if(!form.dataset.form)return;e.preventDefault();const kind=form.dataset.form;const data=Object.fromEntries(new FormData(form));const button=e.submitter;if(button)button.disabled=true;
 try{
  if(kind.endsWith("-filter")){
   const routes={"doctor-filter":"doctors","slot-filter":"slots","appointment-filter":data.route,"report-filter":"reports"};delete data.route;data.page=1;
   location.hash="#"+routes[kind]+"?"+new URLSearchParams(data);return;
  }
  if(kind==="login"){const res=await api("/auth/login","POST",data);token=res.access_token;sessionStorage.setItem("clinic_token",token);user=res.user;navigation();location.hash="#home"}
  else if(kind==="register"){await api("/auth/register","POST",data);location.hash="#login"}
  else if(kind==="book"){await api("/appointments","POST",{slot_id:Number(data.slot_id),reason:data.reason});closeModal();location.hash="#appointments"}
  else if(kind==="move"){await api("/appointments/"+data.id+"/reschedule","PATCH",{slot_id:Number(data.slot_id)});closeModal();await render()}
  else if(kind==="profile"){user=await api("/auth/me","PATCH",data);navigation()}
  else if(kind==="password"){await api("/auth/password","POST",data);clearAuth();location.hash="#login"}
  else if(kind==="record"){const id=data.id;delete data.id;await api("/medical/"+id,"PUT",{...data,finish:button?.value==="finish"});await render()}
  else if(kind==="visit-service"){await preserveRecord();await api("/medical/"+data.id+"/services","POST",{service_id:Number(data.service_id),quantity:Number(data.quantity)});await render()}
  else if(kind==="staff"){await api("/users","POST",data);await render()}
  else if(kind==="specialty"){await api("/specialties","POST",data);await render()}
  else if(kind==="doctor"){await api("/doctors","POST",{...data,user_id:Number(data.user_id),specialty_id:Number(data.specialty_id)});await render()}
  else if(kind==="schedule"){await api("/schedules","POST",{doctor_id:Number(data.doctor_id),start_at:new Date(data.start_at).toISOString(),end_at:new Date(data.end_at).toISOString()});await render()}
  else if(kind==="service"||kind==="edit-service"){const id=data.id;delete data.id;await api("/services"+(id?"/"+id:""),id?"PUT":"POST",{...data,price:Number(data.price)});closeModal();await render()}
  notice("Thao tác thành công.");
 }catch(error){notice(error.message,true)}finally{if(button)button.disabled=false}
});
document.addEventListener("click",async e=>{
 const b=e.target.closest("[data-action]");if(!b)return;const {action,id}=b.dataset;b.disabled=true;
 try{
  if(action==="logout"){await api("/auth/logout","POST");clearAuth();location.hash="#login"}
  else if(action==="book"){if(user?.role!=="PATIENT"){location.hash="#login";return}modal('<h2>Đặt lịch khám</h2><form data-form="book"><input type="hidden" name="slot_id" value="'+id+'"><div class="field"><label>Lý do khám</label><textarea name="reason" maxlength="1500"></textarea></div><button>Gửi lịch hẹn</button></form>')}
  else if(action==="move"){const slots=await api("/schedules?page_size=100");modal('<h2>Đổi giờ hẹn</h2><form data-form="move"><input type="hidden" name="id" value="'+id+'"><div class="field"><label>Giờ mới</label><select name="slot_id">'+slots.items.map(s=>'<option value="'+s.id+'">'+esc(s.doctor)+' · '+date(s.start_at)+'</option>').join("")+'</select></div><button>Xác nhận đổi</button></form>')}
  else if(action==="cancel"){if(!confirm("Hủy lịch hẹn này?"))return;await api("/appointments/"+id,"DELETE");await render();notice("Đã hủy lịch.")}
  else if(action==="transition"){await api("/appointments/"+id+"/status","PATCH",{action:b.dataset.state});await render();notice("Đã cập nhật trạng thái.")}
  else if(action==="remove-service"){await preserveRecord();await api("/medical/"+id+"/services/"+b.dataset.line,"DELETE");await render()}
  else if(action==="pay"){if(!confirm("Xác nhận đã nhận đủ tiền?"))return;await api("/invoices/"+id+"/payment","POST");await render()}
  else if(action==="print"){window.print()}
  else if(action==="close-slot"){await api("/schedules/"+id,"DELETE");await render()}
  else if(action==="user-state"){await api("/users/"+id,"PATCH",{is_active:b.dataset.active!=="true"});await render()}
  else if(action==="disable-service"){await api("/services/"+id,"DELETE");await render()}
  else if(action==="edit-service"){modal('<h2>Cập nhật dịch vụ</h2><form data-form="edit-service"><input type="hidden" name="id" value="'+id+'">'+field("name","Tên","text",b.dataset.name)+field("price","Giá","number",b.dataset.price)+field("description","Mô tả","text",b.dataset.description,false)+'<button>Lưu</button></form>')}
 }catch(error){notice(error.message,true)}finally{b.disabled=false}
});
document.querySelector("#close-dialog").addEventListener("click",closeModal);
window.addEventListener("hashchange",render);
(async()=>{if(token){try{user=await api("/auth/me")}catch{clearAuth()}}await render()})();
