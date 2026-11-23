// Tài khoản giả: tên đăng nhập -> mật khẩu và vai trò nội bộ
const MOCK_ACCOUNTS = {
  benhnhan: { password: "benhnhan", role: "patient" },
  letan:    { password: "letan",    role: "receptionist" },
  bacsi:    { password: "bacsi",    role: "doctor" },
  quantri:  { password: "quantri",  role: "admin" }
};

const PAGE_BY_ROLE = {
  patient: "patient.html",
  receptionist: "reception.html",
  doctor: "doctor.html",
  admin: "admin.html"
};

function showError(msg) {
  const el = document.getElementById("error");
  el.textContent = msg;
  el.hidden = false;
}

async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  if (!username || !password) { showError("Vui lòng nhập tên đăng nhập và mật khẩu."); return; }

  try {
    let data;
    if (CONFIG.USE_MOCK) {
      const acc = MOCK_ACCOUNTS[username];
      if (!acc || acc.password !== password) {
        throw new Error("Sai tên đăng nhập hoặc mật khẩu.");
      }
      data = { access_token: "mock-token", role: acc.role };
    } else {
      // Sửa đường dẫn và kiểu gửi cho khớp với Back-end khi bạn ấy trả lời
      data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });
    }
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("role", data.role);
    location.href = PAGE_BY_ROLE[data.role] || "index.html";
  } catch (e) {
    showError(e.message);
  }
}

document.getElementById("btn").addEventListener("click", login);
// Chỉ hiện ghi chú tài khoản khi đang dùng dữ liệu giả
if (CONFIG.USE_MOCK) document.getElementById("demo").hidden = false;