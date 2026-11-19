const KEY = 'clinic-booking.demo.v1';
export const roles = { patient: 'Bệnh nhân', receptionist: 'Lễ tân', doctor: 'Bác sĩ', admin: 'Quản trị' };
export function day(offset = 0) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map(x => [x.type, x.value]));
  const date = new Date(`${value.year}-${value.month}-${value.day}T12:00:00+07:00`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}
export const stamp = (date, time = '09:00') => `${date}T${time}:00+07:00`;
export const users = {
  patient: { id: 1, name: 'Nguyễn Minh An', email: 'minhan@example.com', phone: '090 000 0001', role: 'patient' },
  receptionist: { id: 101, name: 'Lê Thu Hà', email: 'letan@example.com', role: 'receptionist' },
  doctor: { id: 201, name: 'Nguyễn Hà Phương', email: 'bacsi@example.com', role: 'doctor', doctor_id: 1 },
  admin: { id: 301, name: 'Trần Quang Minh', email: 'quantri@example.com', role: 'admin' },
};
function initial() {
  const data = {
    version: 1,
    specialties: [{ id: 1, name: 'Nha khoa tổng quát' }, { id: 2, name: 'Chỉnh nha' }, { id: 3, name: 'Nha chu' }],
    doctors: [
      { id: 1, name: 'Nguyễn Hà Phương', specialty_id: 1, specialty_name: 'Nha khoa tổng quát', experience: 12, fee: 200000, color: 'mint', initials: 'HP', room: 'Phòng 01', description: 'Khám tổng quát, chăm sóc và bảo tồn răng. Luôn dành thời gian lắng nghe để mỗi buổi khám thật nhẹ nhàng.' },
      { id: 2, name: 'Trần Minh Đức', specialty_id: 2, specialty_name: 'Chỉnh nha', experience: 9, fee: 250000, color: 'blue', initials: 'MĐ', room: 'Phòng 02', description: 'Tư vấn chỉnh nha và đồng hành cùng bạn trong hành trình tìm lại nụ cười tự tin.' },
      { id: 3, name: 'Lê Ngọc Linh', specialty_id: 3, specialty_name: 'Nha chu', experience: 8, fee: 200000, color: 'peach', initials: 'NL', room: 'Phòng 03', description: 'Chăm sóc nướu, vệ sinh răng miệng và dự phòng các vấn đề nha chu.' },
      { id: 4, name: 'Phạm Anh Tuấn', specialty_id: 1, specialty_name: 'Nha khoa tổng quát', experience: 10, fee: 200000, color: 'lavender', initials: 'AT', room: 'Phòng 04', description: 'Khám và điều trị răng tổng quát với quy trình tư vấn rõ ràng, phù hợp từng người bệnh.' },
    ],
    services: [
      { id: 1, name: 'Khám & tư vấn tổng quát', price: 200000, active: true },
      { id: 2, name: 'Lấy cao răng', price: 350000, active: true },
      { id: 3, name: 'Chụp X-quang răng', price: 150000, active: true },
      { id: 4, name: 'Trám răng thẩm mỹ', price: 600000, active: true },
      { id: 5, name: 'Tư vấn chỉnh nha', price: 250000, active: true },
    ],
    appointments: [
      { id: '1001', patient_id: 1, patient_name: 'Nguyễn Minh An', doctor_id: 1, starts_at: stamp(day(1), '09:00'), status: 'confirmed', reason: 'Khám răng định kỳ' },
      { id: '1002', patient_id: 1, patient_name: 'Nguyễn Minh An', doctor_id: 2, starts_at: stamp(day(3), '14:30'), status: 'pending', reason: 'Tư vấn chỉnh nha' },
      { id: '1003', patient_id: 2, patient_name: 'Đỗ Hải Nam', doctor_id: 1, starts_at: stamp(day(), '09:30'), status: 'pending', reason: 'Khám tổng quát' },
      { id: '1004', patient_id: 3, patient_name: 'Phạm Mai Chi', doctor_id: 1, starts_at: stamp(day(), '14:00'), status: 'checked_in', reason: 'Vệ sinh và chăm sóc răng' },
      { id: '1005', patient_id: 4, patient_name: 'Vũ Gia Bảo', doctor_id: 3, starts_at: stamp(day(), '10:30'), status: 'confirmed', reason: 'Kiểm tra nướu' },
      { id: '1006', patient_id: 5, patient_name: 'Lê Thanh Hương', doctor_id: 2, starts_at: stamp(day(), '15:00'), status: 'confirmed', reason: 'Tư vấn chỉnh nha' },
      { id: '1007', patient_id: 1, patient_name: 'Nguyễn Minh An', doctor_id: 1, starts_at: stamp(day(-7), '09:00'), status: 'completed', reason: 'Khám và lấy cao răng' },
      { id: '1008', patient_id: 2, patient_name: 'Đỗ Hải Nam', doctor_id: 1, starts_at: stamp(day(-2), '14:00'), status: 'completed', reason: 'Trám răng' },
      { id: '1009', patient_id: 1, patient_name: 'Nguyễn Minh An', doctor_id: 3, starts_at: stamp(day(-1), '10:00'), status: 'completed', reason: 'Kiểm tra nha chu' },
    ], visits: [], invoices: [],
  };
  for (const [aId, serviceIds, paid] of [['1007', [1, 2], true], ['1008', [1, 4], true], ['1009', [1], false]]) {
    const a = data.appointments.find(a => a.id === aId);
    const items = serviceIds.map(sId => { const s = data.services.find(s => s.id === sId); return { service_id: s.id, name: s.name, price: s.price, quantity: aId === '1008' && sId === 4 ? 2 : 1 }; });
    data.visits.push({ id: `V${aId}`, appointment_id: aId, patient_id: a.patient_id, patient_name: a.patient_name, doctor_id: a.doctor_id, date: a.starts_at.slice(0, 10), diagnosis: 'Kiểm tra răng miệng định kỳ. Đây là kết quả khám mẫu.', notes: 'Thông tin minh họa cho giao diện; không phải hướng dẫn điều trị.', services: items });
    data.invoices.push({ id: `HD${aId}`, appointment_id: aId, patient_id: a.patient_id, patient_name: a.patient_name, date: a.starts_at.slice(0, 10), status: paid ? 'paid' : 'unpaid', paid_at: paid ? a.starts_at : null, total: items.reduce((sum, i) => sum + i.price * i.quantity, 0), items });
  }
  return data;
}
export let storageAvailable = true;
let fallback;
export function read() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved?.version === 1 && ['doctors','services','appointments','visits','invoices','specialties'].every(k => Array.isArray(saved[k]))) return saved;
  } catch { storageAvailable = false; }
  if (!fallback) { fallback = initial(); write(fallback); }
  return structuredClone(fallback);
}
function write(data) { fallback = structuredClone(data); try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { storageAvailable = false; } }
export function reset() { write(initial()); }
const newId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const requireRole = (user, allowed) => { if (!user || !allowed.includes(user.role)) throw new Error('Vai trò này không được thực hiện thao tác.'); };
const owned = (a, user) => { if (!a || (user.role === 'patient' && a.patient_id !== user.id) || (user.role === 'doctor' && a.doctor_id !== user.doctor_id)) throw new Error('Không tìm thấy lịch khám thuộc quyền của bạn.'); };
export function canChange(a) { return ['pending','confirmed'].includes(a.status) && new Date(a.starts_at).getTime() - Date.now() >= 7200000; }
export function schedules(doctorId, date, excludeId = null) {
  const data = read();
  return ['08:00','08:30','09:00','09:30','10:00','10:30','14:00','14:30','15:00','15:30','16:00','16:30'].map(time => ({ id: `${doctorId}|${date}|${time}`, doctor_id: Number(doctorId), starts_at: stamp(date, time), available: new Date(stamp(date, time)) > new Date() && !data.appointments.some(a => String(a.doctor_id) === String(doctorId) && a.starts_at === stamp(date, time) && a.status !== 'cancelled' && a.id !== excludeId) }));
}
export function book(user, scheduleId, reason, appointmentId = null) {
  requireRole(user, ['patient']);
  const [doctorId, date] = String(scheduleId).split('|');
  const data = read(); const slot = schedules(doctorId, date, appointmentId).find(s => s.id === scheduleId && s.available);
  if (!slot || !data.doctors.some(d => String(d.id) === doctorId) || date < day() || date > day(30)) throw new Error('Khung giờ không còn khả dụng. Vui lòng chọn lại.');
  if (data.appointments.some(a => a.patient_id === user.id && a.starts_at === slot.starts_at && !['cancelled','completed'].includes(a.status) && a.id !== appointmentId)) throw new Error('Bạn đã có lịch khám vào giờ này. Vui lòng chọn giờ khác.');
  if (appointmentId) {
    const a = data.appointments.find(a => a.id === appointmentId); owned(a, user);
    if (!canChange(a)) throw new Error('Chỉ được đổi lịch trước giờ khám ít nhất 2 giờ.');
    Object.assign(a, { doctor_id: Number(doctorId), starts_at: slot.starts_at, status: 'pending' }); write(data); return a;
  }
  if (!reason.trim() || reason.trim().length > 500) throw new Error('Nhập lý do khám từ 1 đến 500 ký tự.');
  const a = { id: newId(), patient_id: user.id, patient_name: user.name, doctor_id: Number(doctorId), starts_at: slot.starts_at, reason: reason.trim(), status: 'pending' };
  data.appointments.push(a); write(data); return a;
}
export function transition(user, appointmentId, action) {
  const data = read(); const a = data.appointments.find(a => a.id === appointmentId); owned(a, user);
  if (action === 'cancel') { requireRole(user, ['patient']); if (!canChange(a)) throw new Error('Chỉ được hủy lịch trước giờ khám ít nhất 2 giờ.'); a.status = 'cancelled'; }
  else {
    requireRole(user, ['receptionist']);
    if (action === 'confirm' && a.status === 'pending') a.status = 'confirmed';
    else if (action === 'checkin' && a.status === 'confirmed' && a.starts_at.slice(0,10) === day()) a.status = 'checked_in';
    else throw new Error('Trạng thái hoặc ngày khám không phù hợp để thực hiện thao tác.');
  }
  write(data);
}
export function complete(user, appointmentId, body) {
  requireRole(user, ['doctor']); const data = read(); const a = data.appointments.find(a => a.id === appointmentId); owned(a, user);
  if (a.status !== 'checked_in') throw new Error('Bệnh nhân cần check-in trước khi hoàn tất khám.');
  if (!body.diagnosis.trim()) throw new Error('Vui lòng nhập kết quả khám.');
  if (!Array.isArray(body.services) || !body.services.length) throw new Error('Chọn ít nhất một dịch vụ đã sử dụng.');
  const items = body.services.map(item => {
    const s = data.services.find(s => String(s.id) === String(item.service_id) && s.active);
    if (!s || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) throw new Error('Dịch vụ hoặc số lượng không hợp lệ.');
    return { service_id: s.id, name: s.name, quantity: item.quantity, price: s.price };
  });
  if (new Set(items.map(x => x.service_id)).size !== items.length) throw new Error('Dịch vụ bị lặp.');
  a.status = 'completed';
  data.visits.push({ id: `V-${newId()}`, appointment_id: a.id, patient_id: a.patient_id, patient_name: a.patient_name, doctor_id: a.doctor_id, date: day(), diagnosis: body.diagnosis.trim(), notes: body.notes.trim(), services: items });
  data.invoices.push({ id: `HD-${newId().slice(0,8).toUpperCase()}`, appointment_id: a.id, patient_id: a.patient_id, patient_name: a.patient_name, date: day(), status: 'unpaid', paid_at: null, total: items.reduce((sum, i) => sum + i.quantity * i.price, 0), items }); write(data);
}
export function pay(user, invoiceId) {
  requireRole(user, ['receptionist','admin']); const data = read(); const invoice = data.invoices.find(x => x.id === invoiceId);
  if (!invoice || invoice.status !== 'unpaid') throw new Error('Hóa đơn không còn ở trạng thái chờ thanh toán.');
  invoice.status = 'paid'; invoice.paid_at = new Date().toISOString(); write(data);
}
export function saveService(user, serviceId, body) {
  requireRole(user, ['admin']);
  if (!body.name.trim() || !Number.isSafeInteger(body.price) || body.price < 0 || body.price > 100000000) throw new Error('Tên dịch vụ hoặc đơn giá chưa hợp lệ.');
  const data = read();
  if (serviceId) { const s = data.services.find(s => String(s.id) === String(serviceId)); if (!s) throw new Error('Dịch vụ không còn tồn tại.'); Object.assign(s, body, { name: body.name.trim() }); }
  else data.services.push({ id: newId(), ...body, name: body.name.trim() });
  write(data);
}
