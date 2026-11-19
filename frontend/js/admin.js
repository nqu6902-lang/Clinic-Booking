// Chặn người không phải quản trị vào trang này
if (!localStorage.getItem("token") || localStorage.getItem("role") !== "admin") {
  location.href = "index.html";
}

// ===== DỮ LIỆU GIẢ (thay bằng API thật khi Back-end sẵn sàng) =====
const users = [
  { id: 1, name: "Phạm Thu Hà",   username: "ha",   role: "Bệnh nhân", active: true },
  { id: 2, name: "Nguyễn Thị Lan", username: "lan",  role: "Lễ tân",    active: true },
  { id: 3, name: "BS. Nguyễn Văn An", username: "an", role: "Bác sĩ",   active: true },
  { id: 4, name: "BS. Trần Thị Bình", username: "binh", role: "Bác sĩ", active: false }
];
const services = [
  { id: 1, name: "Khám tổng quát", price: 100000, count: 42 },
  { id: 2, name: "Lấy cao răng",   price: 200000, count: 30 },
  { id: 3, name: "Trám răng",      price: 300000, count: 18 },
  { id: 4, name: "Nhổ răng",       price: 400000, count: 9 }
];
let nextId = 100;

function showMsg(text, ok) {
  const el = document.getElementById("msg");
  el.textContent = text;
  el.className = ok ? "success" : "error";
  el.hidden = false;
  window.scrollTo(0, 0);
}
function money(n) { return n.toLocaleString("vi-VN") + " đ"; }

// ===== TÀI KHOẢN =====
function renderUsers() {
  const body = document.getElementById("userList");
  body.innerHTML = "";
  users.forEach(function (u) {
    const tr = document.createElement("tr");
    [u.name, u.username, u.role, u.active ? "Đang hoạt động" : "Đã khóa"].forEach(function (text) {
      const td = document.createElement("td");
      td.textContent = text;
      tr.appendChild(td);
    });
    const tdBtn = document.createElement("td");
    const btn = document.createElement("button");
    btn.className = "small";
    btn.textContent = u.active ? "Khóa" : "Mở khóa";
    btn.addEventListener("click", function () {
      u.active = !u.active;
      showMsg((u.active ? "Đã mở khóa " : "Đã khóa ") + "tài khoản " + u.username + ".", true);
      renderUsers();
    });
    tdBtn.appendChild(btn);
    tr.appendChild(tdBtn);
    body.appendChild(tr);
  });
}

function addUser() {
  const name = document.getElementById("newName").value.trim();
  const username = document.getElementById("newUsername").value.trim();
  const role = document.getElementById("newRole").value;
  if (!name || !username) { showMsg("Vui lòng nhập họ tên và tên đăng nhập.", false); return; }
  if (users.some(function (u) { return u.username === username; })) {
    showMsg("Tên đăng nhập đã tồn tại, hãy chọn tên khác.", false); return;
  }
  // Khi có API thật: gửi lên Back-end, mật khẩu do Back-end tạo và băm
  users.push({ id: nextId++, name: name, username: username, role: role, active: true });
  document.getElementById("newName").value = "";
  document.getElementById("newUsername").value = "";
  showMsg("Đã tạo tài khoản " + username + " (" + role + ").", true);
  renderUsers();
}

// ===== DỊCH VỤ =====
function renderServices() {
  const body = document.getElementById("serviceList");
  body.innerHTML = "";
  services.forEach(function (s) {
    const tr = document.createElement("tr");
    [s.name, money(s.price)].forEach(function (text) {
      const td = document.createElement("td");
      td.textContent = text;
      tr.appendChild(td);
    });
    const tdBtn = document.createElement("td");
    const btn = document.createElement("button");
    btn.className = "small";
    btn.textContent = "Sửa giá";
    btn.addEventListener("click", function () {
      const v = prompt("Nhập giá mới (đồng) cho " + s.name + ":", s.price);
      if (v === null) return;
      const n = Number(v);
      if (!Number.isFinite(n) || n <= 0) { showMsg("Giá phải là số lớn hơn 0.", false); return; }
      s.price = n;
      showMsg("Đã cập nhật giá " + s.name + ".", true);
      renderServices();
      renderStats();
    });
    tdBtn.appendChild(btn);
    tr.appendChild(tdBtn);
    body.appendChild(tr);
  });
}

function addService() {
  const name = document.getElementById("svcName").value.trim();
  const price = Number(document.getElementById("svcPrice").value);
  if (!name) { showMsg("Vui lòng nhập tên dịch vụ.", false); return; }
  if (!Number.isFinite(price) || price <= 0) { showMsg("Giá phải là số lớn hơn 0.", false); return; }
  if (services.some(function (s) { return s.name.toLowerCase() === name.toLowerCase(); })) {
    showMsg("Dịch vụ này đã có trong danh sách.", false); return;
  }
  services.push({ id: nextId++, name: name, price: price, count: 0 });
  document.getElementById("svcName").value = "";
  document.getElementById("svcPrice").value = "";
  showMsg("Đã thêm dịch vụ " + name + ".", true);
  renderServices();
  renderStats();
}

// ===== THỐNG KÊ =====
function renderStats() {
  const body = document.getElementById("statList");
  body.innerHTML = "";
  const total = services.reduce(function (sum, s) { return sum + s.price * s.count; }, 0);
  services.forEach(function (s) {
    const revenue = s.price * s.count;
    const percent = total > 0 ? Math.round(revenue * 100 / total) : 0;
    const tr = document.createElement("tr");
    [s.name, s.count, money(revenue)].forEach(function (text) {
      const td = document.createElement("td");
      td.textContent = text;
      tr.appendChild(td);
    });
    const tdBar = document.createElement("td");
    const bar = document.createElement("div");
    bar.className = "bar";
    const fill = document.createElement("span");
    fill.style.width = percent + "%";
    bar.appendChild(fill);
    tdBar.appendChild(bar);
    tdBar.appendChild(document.createTextNode(percent + "%"));
    tr.appendChild(tdBar);
    body.appendChild(tr);
  });
  document.getElementById("statTotal").textContent = "Tổng doanh thu: " + money(total);
}

document.getElementById("addUser").addEventListener("click", addUser);
document.getElementById("addService").addEventListener("click", addService);
document.getElementById("logout").addEventListener("click", function () {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  location.href = "index.html";
});

renderUsers();
renderServices();
renderStats();