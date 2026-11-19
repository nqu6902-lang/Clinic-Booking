const PAGE_BY_ROLE = {
  patient: "patient.html",
  receptionist: "reception.html",
  doctor: "doctor.html"
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
      // Dữ liệu giả: gõ patient / receptionist / doctor làm tên đăng nhập
      if (!PAGE_BY_ROLE[username]) throw new Error("Tên đăng nhập không đúng. Thử: patient, receptionist hoặc doctor.");
      data = { access_token: "mock-token", role: username };
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