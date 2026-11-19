// Chặn người không phải lễ tân vào trang này
if (!localStorage.getItem("token") || localStorage.getItem("role") !== "receptionist") {
  location.href = "index.html";
}

// ===== DỮ LIỆU GIẢ (thay bằng API thật khi Back-end sẵn sàng) =====
const appointments = [
  { id: 1, time: "08:00", patient: "Phạm Thu Hà",   doctor: "BS. Nguyễn Văn An", status: "Chờ xác nhận" },
  { id: 2, time: "09:00", patient: "Đỗ Quang Huy",  doctor: "BS. Trần Thị Bình", status: "Đã xác nhận" },
  { id: 3, time: "10:00", patient: "Vũ Mai Lan",    doctor: "BS. Nguyễn Văn An", status: "Chờ xác nhận" },
  { id: 4, time: "14:00", patient: "Bùi Đức Minh",  doctor: "BS. Lê Minh Châu",  status: "Đã xác nhận" }
];

function showMsg(text, ok) {
  const el = document.getElementById("msg");
  el.textContent = text;
  el.className = ok ? "success" : "error";
  el.hidden = false;
}

function confirmAppointment(a) {
  a.status = "Đã xác nhận";
  showMsg("Đã xác nhận lịch hẹn của " + a.patient + ".", true);
  render();
}

function checkIn(a) {
  a.status = "Đã check-in";
  showMsg("Đã check-in cho " + a.patient + ". Bác sĩ sẽ thấy bệnh nhân trong danh sách khám.", true);
  render();
}

function render() {
  const body = document.getElementById("list");
  body.innerHTML = "";
  appointments.forEach(function (a) {
    const tr = document.createElement("tr");
    [a.time, a.patient, a.doctor, a.status].forEach(function (text) {
      const td = document.createElement("td");
      td.textContent = text;
      tr.appendChild(td);
    });

    const tdBtn = document.createElement("td");
    if (a.status === "Chờ xác nhận") {
      const btn = document.createElement("button");
      btn.textContent = "Xác nhận";
      btn.className = "small";
      btn.addEventListener("click", function () { confirmAppointment(a); });
      tdBtn.appendChild(btn);
    } else if (a.status === "Đã xác nhận") {
      const btn = document.createElement("button");
      btn.textContent = "Check-in";
      btn.className = "small";
      btn.addEventListener("click", function () { checkIn(a); });
      tdBtn.appendChild(btn);
    }
    tr.appendChild(tdBtn);
    body.appendChild(tr);
  });
}

document.getElementById("logout").addEventListener("click", function () {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  location.href = "index.html";
});

render();