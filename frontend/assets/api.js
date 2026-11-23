let accessToken = null;
export function setToken(value) { accessToken = value || null; }
export async function request(path, { method = 'GET', body, timeout = 12000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const headers = { Accept: 'application/json' };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  try {
    const response = await fetch(`/api${path}`, { method, headers, signal: controller.signal, body: body === undefined ? undefined : JSON.stringify(body) });
    if (response.status === 204) return null;
    const json = (response.headers.get('content-type') || '').includes('application/json');
    const data = json ? await response.json() : null;
    if (!response.ok) {
      const messages = { 401: 'Phiên đăng nhập không hợp lệ hoặc thông tin đăng nhập chưa đúng.', 403: 'Tài khoản của bạn không có quyền thực hiện thao tác này.', 404: 'Chức năng này chưa có trên máy chủ hoặc dữ liệu không còn tồn tại.', 409: 'Dữ liệu vừa thay đổi. Vui lòng tải lại và chọn khung giờ khác.', 422: 'Thông tin chưa hợp lệ. Vui lòng kiểm tra lại các trường đã nhập.' };
      const error = new Error(messages[response.status] || (typeof data?.detail === 'string' && data.detail) || 'Máy chủ chưa xử lý được yêu cầu. Vui lòng thử lại.');
      error.status = response.status; throw error;
    }
    if (!json) throw new Error('Không nhận được dữ liệu hợp lệ từ máy chủ. Kiểm tra đường dẫn API.');
    return data;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Kết nối quá thời gian chờ. Vui lòng thử lại.');
    if (error instanceof TypeError) throw new Error('Không kết nối được máy chủ. Kiểm tra mạng và Docker.');
    throw error;
  } finally { clearTimeout(timer); }
}
export function list(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  throw new Error('Danh sách trả về chưa đúng định dạng API đã thống nhất.');
}
export const endpoints = {
  login: (body) => request('/auth/login', { method: 'POST', body }),
  me: () => request('/auth/me'),
  doctors: () => request('/doctors').then(list),
  specialties: () => request('/specialties').then(list),
  services: () => request('/services').then(list),
  schedules: (doctor, date) => request(`/schedules?doctor_id=${encodeURIComponent(doctor)}&date=${encodeURIComponent(date)}`).then(list),
  appointments: (role) => request(role === 'patient' ? '/appointments/mine' : '/appointments').then(list),
  book: (body) => request('/appointments', { method: 'POST', body }),
  cancel: (id) => request(`/appointments/${encodeURIComponent(id)}/cancel`, { method: 'PATCH' }),
  reschedule: (id, schedule_id) => request(`/appointments/${encodeURIComponent(id)}/reschedule`, { method: 'PATCH', body: { schedule_id } }),
  confirm: (id) => request(`/appointments/${encodeURIComponent(id)}/confirm`, { method: 'PATCH' }),
  checkin: (id) => request(`/appointments/${encodeURIComponent(id)}/check-in`, { method: 'PATCH' }),
  visits: () => request('/visits/mine').then(list),
  complete: (id, body) => request(`/appointments/${encodeURIComponent(id)}/complete`, { method: 'POST', body }),
  invoices: (role) => request(role === 'patient' ? '/invoices/mine' : '/invoices').then(list),
  pay: (id) => request(`/invoices/${encodeURIComponent(id)}/pay`, { method: 'POST' }),
  saveService: (id, body) => request(id ? `/services/${encodeURIComponent(id)}` : '/services', { method: id ? 'PATCH' : 'POST', body }),
  report: (from, to, service) => request(`/reports/revenue?date_from=${encodeURIComponent(from)}&date_to=${encodeURIComponent(to)}${service ? `&service_id=${encodeURIComponent(service)}` : ''}`),
};
