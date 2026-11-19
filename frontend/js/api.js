function getToken() { return localStorage.getItem("token"); }

async function apiFetch(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers["Authorization"] = "Bearer " + token;

  const res = await fetch(CONFIG.API_BASE + path, { ...options, headers });

  if (res.status === 401) { localStorage.removeItem("token"); location.href = "index.html"; return; }
  if (res.status === 403) throw new Error("Bạn không có quyền thực hiện thao tác này.");
  if (res.status === 409) throw new Error("Khung giờ này đã có người đặt, vui lòng chọn giờ khác.");
  if (res.status === 422 || res.status === 400) throw new Error("Dữ liệu chưa hợp lệ, hãy kiểm tra lại các ô đã nhập.");
  if (!res.ok) throw new Error("Có lỗi xảy ra (" + res.status + ").");
  return res.json();
}