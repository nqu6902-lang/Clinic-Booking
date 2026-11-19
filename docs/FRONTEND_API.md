# Hợp đồng API cho frontend P2

Đây là hợp đồng frontend đề xuất, chưa phải danh sách API đã được triển khai. `backend/app/main.py` của bản ZIP gốc mới định nghĩa `/health` và `/health/db`. Frontend không tạo hay sửa backend, schema database hoặc dữ liệu thật.

## Đường dẫn và phiên

- Trình duyệt gọi `/api/...`. Nginx chuyển tới API bên trong container bằng cách bỏ `/api/`.
- JSON request/response dùng UTF-8. Các endpoint bảo vệ nhận `Authorization: Bearer <access_token>`.
- ID có thể là số hoặc chuỗi, phải dùng nhất quán trong phản hồi. `schedule_id` và ID dịch vụ từ `<select>` được gửi dạng chuỗi; backend cần chấp nhận/coerce ID phù hợp.
- Danh sách hiện nhận mảng trực tiếp hoặc `{ "items": [...] }`, chứa toàn bộ tập dữ liệu được phép xem trong MVP. Nếu backend phân trang, cần bổ sung điều khiển phân trang và số liệu tổng ở frontend; không coi trang đầu là toàn bộ dữ liệu.
- Tiền là số nguyên VNĐ. Thời điểm là ISO 8601 có múi giờ, ví dụ `2026-11-20T09:00:00+07:00` hoặc UTC tương đương. Ngày lọc có định dạng `YYYY-MM-DD`, hiểu theo giờ Việt Nam.
- HTTP 400/422 cho dữ liệu sai, 401 khi chưa xác thực/hết phiên, 403 hoặc 404 khi không có quyền tài nguyên, 409 khi xung đột lịch/trạng thái. Lỗi chuẩn `{ "detail": "Thông báo" }`.
- Token hiện chỉ giữ trong bộ nhớ. Muốn duy trì đăng nhập sau refresh cần thống nhất cơ chế refresh/session, không tự lưu mật khẩu hay token vào localStorage.

## Tài khoản

`POST /api/auth/login`

```json
{ "username": "ten_dang_nhap", "password": "mat_khau" }
```

Phản hồi:

```json
{
  "access_token": "JWT_FROM_SERVER",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "name": "Tên người dùng",
    "email": "patient@example.com",
    "phone": "",
    "role": "patient"
  }
}
```

Vai trò chuẩn: `patient`, `receptionist`, `doctor`, `admin`. Bác sĩ cần thêm `doctor_id` là ID hồ sơ bác sĩ. Nếu login không trả `user`, frontend gọi `GET /api/auth/me` với token vừa nhận; endpoint này trả đối tượng user nêu trên.

Frontend hiện dùng JSON cho đăng nhập. Nếu backend chọn OAuth2PasswordRequestForm, sửa hàm `login` trong `assets/api.js` để gửi `URLSearchParams` và header `application/x-www-form-urlencoded`.

## Danh mục và lịch trống

| API | Phản hồi mỗi phần tử |
|---|---|
| `GET /api/specialties` | `id`, `name` |
| `GET /api/doctors` | `id`, `name`, `specialty_id`, `specialty_name`, `experience`, `fee`, `room`, `description`; tùy chọn `initials`, `color` (`mint`, `blue`, `peach`, `lavender`) |
| `GET /api/services` | `id`, `name`, `price`, `active` (boolean) |
| `GET /api/schedules?doctor_id=...&date=...` | `id`, `doctor_id`, `starts_at`, `available` (boolean) |

Frontend hiện cho chọn ngày từ hôm nay đến 30 ngày tới. Thời lượng 30 phút là nhãn của bản mẫu; nếu backend dùng thời lượng khác, cập nhật nhãn/định nghĩa lịch cho khớp.

Ví dụ một khung giờ:

```json
{ "id": 42, "doctor_id": 1, "starts_at": "2026-11-20T09:00:00+07:00", "available": true }
```

## Lịch hẹn

`GET /api/appointments/mine`: lịch của bệnh nhân đang đăng nhập.

`GET /api/appointments`: danh sách phù hợp vai trò. Lễ tân xem lịch phục vụ tiếp nhận; bác sĩ chỉ xem lịch được phân công; quản trị dùng số liệu vận hành theo chính sách của nhóm. Không đưa ghi chú/chẩn đoán vào phản hồi lịch hẹn dùng chung.

Phần tử lịch hẹn:

```json
{
  "id": 1001,
  "patient_id": 1,
  "patient_name": "Tên bệnh nhân",
  "doctor_id": 1,
  "starts_at": "2026-11-20T09:00:00+07:00",
  "status": "confirmed",
  "reason": "Khám định kỳ"
}
```

Trạng thái hỗ trợ: `pending`, `confirmed`, `checked_in`, `completed`, `cancelled`.

| API | Body | Yêu cầu backend |
|---|---|---|
| `POST /api/appointments` | `{ "schedule_id": "42", "reason": "Khám định kỳ" }` | Lấy bệnh nhân từ token; kiểm tra giờ trống, ràng buộc/transaction chống đặt trùng |
| `PATCH /api/appointments/{id}/cancel` | Không có | Chính bệnh nhân, trạng thái hợp lệ, còn ít nhất hai giờ |
| `PATCH /api/appointments/{id}/reschedule` | `{ "schedule_id": "43" }` | Chính bệnh nhân; kiểm tra cả lịch cũ và giờ mới; đổi nguyên tử, không làm mất lịch cũ khi thất bại |
| `PATCH /api/appointments/{id}/confirm` | Không có | Lễ tân; chỉ chuyển từ chờ xác nhận |
| `PATCH /api/appointments/{id}/check-in` | Không có | Lễ tân; lịch đã xác nhận, đúng ngày khám |

Các mutation trả JSON đối tượng vừa cập nhật hoặc 204. Frontend tải lại danh sách sau khi server xác nhận thành công; không dùng kết quả mock để thay cho lỗi API.

Backend là nơi quyết định quyền và điều kiện thời gian. Việc ẩn nút/kiểm tra hai giờ ở trình duyệt chỉ hỗ trợ người dùng; không thay thế kiểm tra backend.

## Kết quả khám và lập hóa đơn

`POST /api/appointments/{id}/complete`

```json
{
  "diagnosis": "Kết quả khám",
  "notes": "Ghi chú của bác sĩ",
  "services": [
    { "service_id": "1", "quantity": 1 },
    { "service_id": "2", "quantity": 1 }
  ]
}
```

Chỉ bác sĩ phụ trách được gửi; bệnh nhân cần check-in. Backend đọc đơn giá từ database, ghi giá tại thời điểm dùng dịch vụ, tính tổng bằng kiểu tiền chính xác, lưu lượt khám và lập hóa đơn với cơ chế ngăn tạo trùng. Không tin tổng/đơn giá tùy ý do client gửi.

`GET /api/visits/mine`: bệnh nhân nhận hồ sơ của mình, bác sĩ nhận hồ sơ được phân công. Lễ tân và quản trị không có màn hình đọc chẩn đoán trong frontend này.

Phần tử hồ sơ:

```json
{
  "id": "V1001",
  "appointment_id": 1001,
  "patient_id": 1,
  "patient_name": "Tên bệnh nhân",
  "doctor_id": 1,
  "date": "2026-11-20",
  "diagnosis": "Kết quả khám",
  "notes": "Ghi chú",
  "services": [
    { "service_id": 1, "name": "Khám tổng quát", "quantity": 1, "price": 200000 }
  ]
}
```

## Hóa đơn

- `GET /api/invoices/mine`: hóa đơn của bệnh nhân đang đăng nhập.
- `GET /api/invoices`: danh sách cho lễ tân/quản trị theo quyền server.
- `POST /api/invoices/{id}/pay`: ghi nhận đã thu tiền, không phải API cổng thanh toán. Chỉ lễ tân/quản trị; ngăn thanh toán/ghi sổ trùng.

Phần tử hóa đơn:

```json
{
  "id": "HD1001",
  "appointment_id": 1001,
  "patient_id": 1,
  "patient_name": "Tên bệnh nhân",
  "date": "2026-11-20",
  "status": "paid",
  "paid_at": "2026-11-20T10:00:00+07:00",
  "total": 200000,
  "items": [
    { "service_id": 1, "name": "Khám tổng quát", "quantity": 1, "price": 200000 }
  ]
}
```

Trạng thái hóa đơn hỗ trợ `unpaid`, `paid`. `paid_at` có thể null với hóa đơn chưa thanh toán. `items` giữ đơn giá cũ, không thay theo danh mục hiện tại.

## Quản trị dịch vụ

- `POST /api/services` để thêm.
- `PATCH /api/services/{id}` để sửa.
- Body: `{ "name": "Tên dịch vụ", "price": 200000, "active": true }`.
- Chỉ quản trị; server kiểm tra đơn giá nguyên không âm và tên hợp lệ. Frontend giới hạn đơn giá tối đa 100.000.000 VNĐ cho bản mẫu; thống nhất lại nếu nghiệp vụ cần mức khác.

## Báo cáo doanh thu

`GET /api/reports/revenue?date_from=2026-11-01&date_to=2026-11-20&service_id=1`

`service_id` được bỏ khi chọn tất cả. Chỉ quản trị. Tính theo `paid_at` với ranh giới ngày Việt Nam, chỉ hóa đơn đã thanh toán. Tối đa 93 ngày trong mỗi lượt xem của frontend.

```json
{
  "total": 400000,
  "invoice_count": 2,
  "by_day": [
    { "date": "2026-11-19", "total": 200000 },
    { "date": "2026-11-20", "total": 200000 }
  ],
  "by_service": [
    { "service_id": 1, "name": "Khám tổng quát", "total": 400000 }
  ]
}
```

`by_day` cần bao gồm các ngày không có doanh thu với total=0. Khi lọc dịch vụ, `invoice_count` là số hóa đơn có dòng dịch vụ phù hợp; `total` chỉ cộng các dòng phù hợp. Tránh nhân đôi doanh thu do JOIN.

## Trình tự tích hợp

1. Hoàn thiện đăng nhập/me và quyền server.
2. Cung cấp danh mục bác sĩ/chuyên khoa/dịch vụ và khung giờ thật.
3. Hoàn thiện đặt/đổi/hủy, xác nhận/check-in và các xung đột lịch.
4. Hoàn thiện hồ sơ, hóa đơn, báo cáo; không gửi dữ liệu vượt quyền xuống client.
5. Chọn Kết nối API và kiểm tra từng vai trò bằng tài khoản kiểm thử do backend tạo.
6. Kiểm tra direct API với token khác để xác nhận quyền thật; các kiểm thử demo của frontend không chứng minh bảo mật server.
