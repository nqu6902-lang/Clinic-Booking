import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as demo from '../assets/demo.js';
import { request, setToken } from '../assets/api.js';

class MemoryStorage {
  values = new Map();
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  clear() { this.values.clear(); }
}
Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true });
const patient = demo.users.patient;
const freeSlot = (doctor = 1, offset = 2) => demo.schedules(doctor, demo.day(offset)).find(s => s.available).id;
beforeEach(() => { localStorage.clear(); demo.reset(); setToken(null); });

test('new booking is pending and reserves the selected doctor/time', () => {
  const slot = freeSlot();
  const result = demo.book(patient, slot, 'Khám định kỳ');
  assert.equal(result.patient_id, patient.id);
  assert.equal(result.status, 'pending');
  assert.equal(demo.schedules(1, demo.day(2)).find(s => s.id === slot).available, false);
  assert.equal(demo.read().appointments.find(a => a.id === result.id).reason, 'Khám định kỳ');
});
test('a second patient cannot claim a slot that was just booked', () => {
  const slot = freeSlot(); demo.book(patient, slot, 'Khám lần đầu');
  assert.throws(() => demo.book({ ...patient, id: 90 }, slot, 'Khám lần sau'), /không còn khả dụng/);
});
test('a patient cannot double-book two doctors at the same time', () => {
  const slot = freeSlot(1); demo.book(patient, slot, 'Khám tổng quát');
  assert.throws(() => demo.book(patient, slot.replace(/^1\|/, '2|'), 'Tư vấn'), /đã có lịch khám/);
});
test('cancel releases the slot, and cannot be repeated', () => {
  const slot = freeSlot(); const a = demo.book(patient, slot, 'Khám');
  demo.transition(patient, a.id, 'cancel');
  assert.equal(demo.schedules(1, demo.day(2)).find(s => s.id === slot).available, true);
  assert.throws(() => demo.transition(patient, a.id, 'cancel'));
});
test('two-hour boundary is inclusive and blocks late cancellation', () => {
  const a = demo.read().appointments.find(a => a.id === '1001');
  const original = Date.now;
  try {
    Date.now = () => new Date(a.starts_at).getTime() - 7200000;
    assert.equal(demo.canChange(a), true);
    Date.now = () => new Date(a.starts_at).getTime() - 7199999;
    assert.equal(demo.canChange(a), false);
    assert.throws(() => demo.transition(patient, a.id, 'cancel'), /2 giờ/);
  } finally { Date.now = original; }
});
test('patient cannot cancel another patient appointment', () => {
  const a = demo.book({ ...patient, id: 90 }, freeSlot(), 'Khám');
  assert.throws(() => demo.transition(patient, a.id, 'cancel'), /thuộc quyền/);
});
test('reschedule releases old slot and waits for confirmation again', () => {
  const a = demo.read().appointments.find(a => a.id === '1001');
  const originalTime = a.starts_at;
  demo.book(patient, freeSlot(1, 4), a.reason, a.id);
  assert.equal(demo.read().appointments.find(x => x.id === a.id).status, 'pending');
  assert.equal(demo.schedules(1, demo.day(1)).find(s => s.starts_at === originalTime).available, true);
});
test('receptionist confirms then checks in, with a date restriction', () => {
  demo.transition(demo.users.receptionist, '1003', 'confirm');
  demo.transition(demo.users.receptionist, '1003', 'checkin');
  assert.equal(demo.read().appointments.find(a => a.id === '1003').status, 'checked_in');
  assert.throws(() => demo.transition(demo.users.receptionist, '1001', 'checkin'), /ngày khám/);
});
test('patient cannot confirm appointments as reception', () => {
  assert.throws(() => demo.transition(patient, '1002', 'confirm'), /Vai trò/);
});
test('only assigned doctor can complete a checked-in visit', () => {
  const body = { diagnosis: 'Kết quả mẫu', notes: '', services: [{ service_id: 1, quantity: 1 }] };
  assert.throws(() => demo.complete({ ...demo.users.doctor, doctor_id: 2 }, '1004', body), /thuộc quyền/);
  assert.throws(() => demo.complete(demo.users.doctor, '1001', body), /check-in/);
});
test('completing a visit creates one invoice using catalog prices', () => {
  const body = { diagnosis: 'Kết quả mẫu', notes: '', services: [{ service_id: 1, quantity: 1, price: 1 }, { service_id: 4, quantity: 2 }], total: 1 };
  demo.complete(demo.users.doctor, '1004', body);
  const invoice = demo.read().invoices.find(i => i.appointment_id === '1004');
  assert.equal(invoice.total, 1400000);
  assert.equal(invoice.status, 'unpaid');
  assert.equal(demo.read().visits.filter(i => i.appointment_id === '1004').length, 1);
  assert.throws(() => demo.complete(demo.users.doctor, '1004', body), /check-in/);
});
test('invalid quantities do not complete the visit or create an invoice', () => {
  assert.throws(() => demo.complete(demo.users.doctor, '1004', { diagnosis: 'Mẫu', notes: '', services: [{ service_id: 1, quantity: -1 }] }), /không hợp lệ/);
  assert.equal(demo.read().appointments.find(a => a.id === '1004').status, 'checked_in');
  assert.equal(demo.read().invoices.some(i => i.appointment_id === '1004'), false);
});
test('payment requires staff role and cannot be recorded twice', () => {
  assert.throws(() => demo.pay(patient, 'HD1009'), /Vai trò/);
  demo.pay(demo.users.receptionist, 'HD1009');
  assert.equal(demo.read().invoices.find(i => i.id === 'HD1009').status, 'paid');
  assert.throws(() => demo.pay(demo.users.admin, 'HD1009'), /chờ thanh toán/);
});
test('catalog price changes preserve historic invoice prices', () => {
  const before = demo.read().invoices.find(i => i.id === 'HD1007');
  demo.saveService(demo.users.admin, '1', { name: 'Khám tổng quát', price: 900000, active: true });
  const after = demo.read().invoices.find(i => i.id === 'HD1007');
  assert.deepEqual(after, before);
  assert.throws(() => demo.saveService(patient, '1', { name: 'Sai quyền', price: 1, active: true }), /Vai trò/);
});
test('API client reports 404 without pretending a mutation succeeded', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response('{"detail":"Not Found"}', { status: 404, headers: { 'content-type': 'application/json' } });
    await assert.rejects(request('/auth/login', { method: 'POST', body: { username: 'test', password: 'test' } }), error => error.status === 404 && /chưa có/.test(error.message));
  } finally { globalThis.fetch = original; }
});
test('API requests send the bearer token and preserve JSON errors', async () => {
  const original = globalThis.fetch; let observed;
  try {
    setToken('unit-test-token');
    globalThis.fetch = async (url, options) => { observed = { url, options }; return new Response('{"ok":true}', { headers: { 'content-type': 'application/json' } }); };
    const result = await request('/appointments', { method: 'POST', body: { schedule_id: 2 } });
    assert.equal(result.ok, true);
    assert.equal(observed.url, '/api/appointments');
    assert.equal(observed.options.headers.Authorization, 'Bearer unit-test-token');
    assert.deepEqual(JSON.parse(observed.options.body), { schedule_id: 2 });
  } finally { globalThis.fetch = original; setToken(null); }
});
test('an HTML fallback from a missing JS/API route is rejected', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response('<html>app</html>', { headers: { 'content-type': 'text/html' } });
    await assert.rejects(request('/doctors'), /dữ liệu hợp lệ/);
  } finally { globalThis.fetch = original; }
});
