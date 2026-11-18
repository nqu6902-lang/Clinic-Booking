# Kịch bản bảo vệ và video dự phòng

## Demo 5 phút trên máy chủ

| Thời gian | Người trình diễn | Nội dung |
|---|---|---|
| 00:00–00:30 | TV2 | Mở URL máy chủ và trang chủ, giới thiệu bác sĩ/chuyên khoa |
| 00:30–01:20 | TV1 + TV2 | Đăng ký/đăng nhập bệnh nhân, chọn slot và đặt |
| 01:20–02:20 | TV3 | Lễ tân xác nhận/check-in, bác sĩ nhập kết quả và dịch vụ |
| 02:20–03:00 | TV4 | Hóa đơn, thu tiền, bệnh nhân xem lịch sử của mình |
| 03:00–03:40 | TV1 + TV3 | Swagger/Postman: 401 thiếu token, 403 sai quyền, 422 dữ liệu sai |
| 03:40–04:10 | TV4 | Báo cáo theo dịch vụ và tìm kiếm/lọc/phân trang |
| 04:10–04:40 | TV4 | Mở PR và Actions thật, chỉ ra lint/test |
| 04:40–05:00 | TV3 | Mở psql/DBeaver, xem lịch/hóa đơn vừa tạo |

Chuẩn bị khung giờ tương lai trong ngày trước demo. Nếu hẹn ngày mai, hệ thống sẽ từ chối check-in hôm nay. Khi thử đổi/hủy, dùng một lịch riêng còn trên 2 giờ.

## Video 3 đến 5 phút

Quay màn hình ứng dụng thật bằng công cụ có sẵn trên máy nhóm hoặc OBS. Giữ URL máy chủ trong khung hình, dùng dữ liệu giả, không quay file .env, mật khẩu hoặc JWT đầy đủ. Thực hiện các bước đầu đến cuối với ít nhất bệnh nhân và lễ tân/bác sĩ. Không dùng slide tĩnh thay cho video demo chương trình.

Nếu cần rút xuống 3 phút, chuẩn bị sẵn tài khoản và slot, nhập nội dung khám ngắn. Giữ phần 403/422 và hóa đơn/thống kê. Xuất MP4 1080p, đặt tên video-demo-clinic-booking-2.mp4, kiểm tra phát được khi không có Internet.

## Các điểm phải nói đúng

- Mật khẩu Argon2id là băm một chiều, JWT được ký chứ không mã hóa nội dung.
- Token ở sessionStorage có rủi ro khi xảy ra XSS. Frontend escape dữ liệu, backend vẫn kiểm tra quyền.
- JWT hết hạn hoặc token_version thay đổi trả 401 và frontend yêu cầu đăng nhập lại.
- 403 là thiếu quyền; 409 là xung đột trạng thái/lịch; 422 là dữ liệu đầu vào không hợp lệ.
- Doanh thu tính theo paid_at, không lấy tất cả lịch đặt.
- AI đã hỗ trợ mã/tài liệu, nhóm cần giải thích được implementation.

## Minh chứng cần tự bổ sung

URL server, URL repo, ảnh Swagger đang chạy, ảnh Runner, ảnh Actions xanh, PR có review, Contributors và video. Bộ tài liệu không tạo giả các minh chứng này.
