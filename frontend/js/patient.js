// Chặn người không phải bệnh nhân vào trang này
if (!localStorage.getItem("token") || localStorage.getItem("role") !== "patient") {
  location.href = "index.html";
}

// ===== DỮ LIỆU GIẢ (thay bằng API thật khi Back-end sẵn sàng) =====
const MOCK_DOCTORS = [
  { id: 1, name: "BS. Nguyễn Văn An", specialty: "Nha khoa tổng quát" },
  { id: 2, name: "BS. Trần Thị Bình", specialty: "Chỉnh nha" },
  { id: 3, name: "BS. Lê Minh Châu", specialty: "Phục hình răng" }
];
const SLOT_TIMES = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];
let myAppointments = [];            // lịch hẹn của bệnh nhân
const takenByOthers = new Set(["1|" + today() + "|09:00"]); // giờ đã có người khác đặt

function today() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + m + "-" + day;
}
function startOf(date, time) { return new Date(date + "T" + time + ":00"); }

// ===== HIỂN THỊ THÔNG BÁO =====
function showMsg(text, ok) {
  const el = document.getElementById("msg");
  el.textContent = text;
  el.className = ok ? "success" : "error";
  el.hidden = false;
}

// ===== BÁC SĨ =====
function loadDoctors() {
  const sel = document.getElementById("doctor");
  MOCK_DOCTORS.forEach(function (d) {
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = d.name + " - " + d.specialty;
    sel.appendChild(opt);
  });
}

// ===== KHUNG GIỜ =====
function isTaken(doctorId, date, time) {
  if (takenByOthers.has(doctorId + "|" + date + "|" + time)) return true;
  return myAppointments.some(function (a) {
    return a.status === "Đã đặt" && a.doctorId === doctorId && a.date === date && a.time === time;
  });
}

function loadSlots() {
  const doctorId = Number(document.getElementById("doctor").value);
  const date = document.getElementById("date").value;
  const box = document.getElementById("slots");
  box.innerHTML = "";
  if (!date) { box.textContent = "Hãy chọn ngày khám."; return; }

  SLOT_TIMES.forEach(function (time) {
    const btn = document.createElement("button");
    btn.textContent = time;
    const past = startOf(date, time) <= new Date();
    if (past || isTaken(doctorId, date, time)) {
      btn.disabled = true;
      btn.title = past ? "Giờ đã qua" : "Đã có người đặt";
    } else {
      btn.addEventListener("click", function () { book(doctorId, date, time); });
    }
    box.appendChild(btn);
  });
}

// ===== ĐẶT LỊCH =====
function book(doctorId, date, time) {
  // Khi có API thật: gọi apiFetch với POST, và nếu server trả 409 thì apiFetch sẽ báo "giờ đã có người đặt"
  if (isTaken(doctorId, date, time)) { showMsg("Khung giờ này vừa có người đặt, hãy chọn giờ khác.", false); loadSlots(); return; }
  const doctor = MOCK_DOCTORS.find(function (d) { return d.id === doctorId; });
  myAppointments.push({ id: Date.now(), doctorId: doctorId, doctorName: doctor.name, date: date, time: time, status: "Đã đặt" });
  showMsg("Đặt lịch thành công: " + doctor.name + ", " + time + " ngày " + date + ".", true);
  loadSlots();
  renderMine();
}

// ===== LỊCH HẸN CỦA TÔI =====
function cancelAppointment(id) {
  const a = myAppointments.find(function (x) { return x.id === id; });
  const hoursLeft = (startOf(a.date, a.time) - new Date()) / 3600000;
  if (hoursLeft < 2) { showMsg("Chỉ được hủy lịch trước giờ khám ít nhất 2 giờ.", false); return; }
  a.status = "Đã hủy";
  showMsg("Đã hủy lịch hẹn.", true);
  loadSlots();
  renderMine();
}

function renderMine() {
  const body = document.getElementById("myList");
  body.innerHTML = "";
  document.getElementById("empty").hidden = myAppointments.length > 0;

  myAppointments.forEach(function (a) {
    const tr = document.createElement("tr");
    [a.doctorName, a.date, a.time, a.status].forEach(function (text) {
      const td = document.createElement("td");
      td.textContent = text;
      tr.appendChild(td);
    });
    const tdBtn = document.createElement("td");
    if (a.status === "Đã đặt") {
      const btn = document.createElement("button");
      btn.textContent = "Hủy";
      btn.className = "small";
      const hoursLeft = (startOf(a.date, a.time) - new Date()) / 3600000;
      if (hoursLeft < 2) { btn.disabled = true; btn.title = "Chỉ hủy được trước giờ khám 2 giờ"; }
      btn.addEventListener("click", function () { cancelAppointment(a.id); });
      tdBtn.appendChild(btn);
    }
    tr.appendChild(tdBtn);
    body.appendChild(tr);
  });
}

// ===== KHỞI TẠO =====
document.getElementById("logout").addEventListener("click", function () {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  location.href = "index.html";
});
document.getElementById("doctor").addEventListener("change", loadSlots);
document.getElementById("date").addEventListener("change", loadSlots);

document.getElementById("date").min = today();
document.getElementById("date").value = today();
loadDoctors();
loadSlots();
renderMine();