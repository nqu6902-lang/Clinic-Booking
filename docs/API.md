# Danh mục API

Tiền tố /api. Xác thực bằng Authorization: Bearer JWT. Mô hình JSON chi tiết và thử trực tiếp tại /api/docs.

| Phương thức | Endpoint | Mục đích |
|---|---|---|
| POST | /api/auth/register | Đăng ký bệnh nhân |
| POST | /api/auth/login | Đăng nhập nhận JWT Bearer |
| GET | /api/auth/me | Thông tin người đang đăng nhập |
| PATCH | /api/auth/me | Sửa hồ sơ cá nhân |
| POST | /api/auth/password | Đổi mật khẩu và thu hồi token cũ |
| POST | /api/auth/logout | Thu hồi các phiên đăng nhập |
| GET | /api/users | Danh sách tài khoản |
| POST | /api/users | Quản trị tạo tài khoản nghiệp vụ |
| PATCH | /api/users/{pk} | Bật hoặc khóa tài khoản |
| GET | /api/specialties | Danh sách chuyên khoa |
| POST | /api/specialties | Thêm chuyên khoa |
| PUT | /api/specialties/{pk} | Cập nhật chuyên khoa |
| GET | /api/doctors | Tìm bác sĩ theo tên hoặc chuyên khoa |
| POST | /api/doctors | Liên kết tài khoản bác sĩ với chuyên khoa |
| PATCH | /api/doctors/{pk} | Sửa hồ sơ hoặc ngừng nhận lịch bác sĩ |
| GET | /api/services | Bảng giá dịch vụ |
| POST | /api/services | Thêm dịch vụ |
| PUT | /api/services/{pk} | Cập nhật giá dịch vụ |
| DELETE | /api/services/{pk} | Ngừng sử dụng dịch vụ |
| GET | /api/schedules | Danh sách khung giờ tương lai |
| POST | /api/schedules | Tạo khung giờ không trùng |
| DELETE | /api/schedules/{pk} | Đóng khung giờ chưa có người đặt |
| GET | /api/appointments | Danh sách lịch theo quyền sở hữu hoặc phân công |
| POST | /api/appointments | Bệnh nhân đặt lịch |
| GET | /api/appointments/{pk} | Chi tiết lịch hẹn |
| DELETE | /api/appointments/{pk} | Hủy lịch khi còn ít nhất 2 giờ |
| PATCH | /api/appointments/{pk}/reschedule | Đổi lịch khi còn ít nhất 2 giờ |
| PATCH | /api/appointments/{pk}/status | Lễ tân xác nhận hoặc check-in |
| GET | /api/medical/{pk} | Chỉ bác sĩ phụ trách hoặc bệnh nhân đọc kết quả |
| PUT | /api/medical/{pk} | Ghi kết quả hoặc hoàn thành và tự lập hóa đơn |
| POST | /api/medical/{pk}/services | Ghi dịch vụ với giá chốt |
| DELETE | /api/medical/{pk}/services/{line_id} | Bỏ dịch vụ trước khi hoàn thành |
| GET | /api/invoices | Hóa đơn theo quyền truy cập |
| GET | /api/invoices/{pk} | Chi tiết và các dòng hóa đơn |
| POST | /api/invoices/{pk}/payment | Ghi nhận thanh toán tại quầy một lần |
| GET | /api/reports/revenue | Doanh thu đã thu theo dịch vụ và ngày thanh toán |
| GET | /api/health | Kiểm tra kết nối CSDL |

Mã HTTP: 200 đọc/cập nhật, 201 tạo mới, 401 thiếu/sai/hết hạn JWT, 403 thiếu quyền, 404 không tìm thấy hoặc không thuộc phạm vi hóa đơn, 409 trùng hoặc sai trạng thái, 422 kiểm chứng đầu vào.

Ví dụ đặt lịch: POST /api/appointments với {"slot_id": 1, "reason": "Khám răng"}. Lịch mới ở pending.

N:N Appointment–Service qua visit_services chứa quantity và unit_price. Khi hoàn thành, invoice_items chụp lại dòng dịch vụ để đổi bảng giá sau này không sửa hóa đơn cũ.