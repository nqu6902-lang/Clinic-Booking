// Chặn người không phải bác sĩ vào trang này
if (!localStorage.getItem("token") || localStorage.getItem("role") !== "doctor") {
  location.href = "index.html";
}

// ===== DỮ LIỆU GIẢ (thay bằng API thật khi Back-end sẵn sàng) =====
const patients = [
  { id: 1, time: "08:00", name: "Phạm Thu Hà",  status: "Đã check-in" },
  { id: 2, time: "09:00", name: "Đỗ Quang Huy", status: "Đã xác nhận" },
  { id: 3, time: "10:00", name: "Vũ Mai Lan",   status: "Đã check-in" }
];
const SERVICES = [
  { id: 1, name: "Khám tổng quát",  price: 100000 },
  { id: 2, name: "Lấy cao răng",    price: 200000 },
  { id: 3, name: "Trám răng",       price: 300000 },
  { id: 4, name: "Nhổ răng",        price: 400000 }
];
let current = null; // bệnh nhân đang được khám

function showMsg(text, ok) {
  const el = document.getElementById("msg");
  el.textContent = text;
  el.className = ok ? "success" : "error";
  el.hidden = false;
}

function money(n) { return n.toLocaleString("vi-VN") + " đ"; }

function renderList() {
  const body = document.getElementById("list");
  body.innerHTML = "";
  patients.forEach(function (p) {
    const tr = document.createElement("tr");
    [p.time, p.name, p.status].forEach(function (text) {
      const td = document.createElement("td");
      td.textContent = text;
      tr.appendChild(td);
    });
    const tdBtn = document.createElement("td");
    const btn = document.createElement("button");
    btn.textContent = "Khám";
    btn.className = "small";
    if (p.status !== "Đã check-in") {
      btn.disabled = true;
      btn.title = p.status === "Đã khám" ? "Đã khám xong" : "Bệnh nhân chưa check-in";
    } else {
      btn.addEventListener("click", function () { startExam(p); });
    }
    tdBtn.appendChild(btn);
    tr.appendChild(tdBtn);
    body.appendChild(tr);
  });
}

function startExam(p) {
  current = p;
  document.getElementById("patientName").textContent = p.name;
  document.getElementById("result").value = "";
  document.getElementById("msg").hidden = true;

  const box = document.getElementById("services");
  box.innerHTML = "";
  SERVICES.forEach(function (s) {
    const label = document.createElement("label");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = s.id;
    cb.addEventListener("change", updateTotal);
    label.appendChild(cb);
    label.appendChild(document.createTextNode(" " + s.name + " - " + money(s.price)));
    box.appendChild(label);
  });
  updateTotal();
  document.getElementById("formPanel").hidden = false;
}

function selectedServices() {
  const ids = Array.from(document.querySelectorAll("#services input:checked")).map(function (c) { return Number(c.value); });
  return SERVICES.filter(function (s) { return ids.indexOf(s.id) !== -1; });
}

function updateTotal() {
  const total = selectedServices().reduce(function (sum, s) { return sum + s.price; }, 0);
  document.getElementById("total").textContent = "Tạm tính: " + money(total);
}

function save() {
  const result = document.getElementById("result").value.trim();
  if (!result) { showMsg("Vui lòng nhập kết quả khám.", false); return; }
  const used = selectedServices();
  if (used.length === 0) { showMsg("Hãy chọn ít nhất một dịch vụ đã sử dụng.", false); return; }

  // Khi có API thật: gửi kết quả + dịch vụ lên Back-end, hóa đơn do hệ thống lập
  current.status = "Đã khám";
  const total = used.reduce(function (sum, s) { return sum + s.price; }, 0);
  showMsg("Đã lưu kết quả khám cho " + current.name + ". Hệ thống sẽ lập hóa đơn " + money(total) + ".", true);
  document.getElementById("formPanel").hidden = true;
  current = null;
  renderList();
}

document.getElementById("save").addEventListener("click", save);
document.getElementById("logout").addEventListener("click", function () {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  location.href = "index.html";
});

renderList();