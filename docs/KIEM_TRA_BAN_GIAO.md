# Kết quả kiểm tra bản bàn giao

Đây là kết quả kiểm tra trong môi trường xây dựng mã nguồn, chưa phải biên bản nghiệm thu trên VPS.

| Hạng mục | Kết quả thực hiện |
|---|---|
| Ruff check và format check | Đạt đối với app và tests |
| Pytest API | 22 passed, 1 skipped |
| Coverage statement | Xấp xỉ 80% đối với app |
| Ca bị bỏ qua | Hai bệnh nhân đồng thời tranh một slot, cần PostgreSQL |
| Alembic | upgrade, check, downgrade base, upgrade và check đạt trên database SQLite dùng một lần |
| Seed chạy lại | Không tạo trùng: vẫn 6 user, 1 lịch sử khám và 99 slot trong bộ dữ liệu kiểm tra |
| OpenAPI | Sinh được tài liệu 27 path, có schema đầu vào/đầu ra |
| JavaScript | node --check đạt; kiểm tra riêng bộ lọc trống và escape HTML ở tiêu đề |
| Báo cáo | Word được render và rà soát, 20 trang |
| Slide | 12 slide theo mục VI của đề, có bảng và sơ đồ chỉnh sửa được |

Pytest dùng SQLite riêng cho bản kiểm tra này. CSDL của ứng dụng vẫn là PostgreSQL như yêu cầu đề. Kết quả SQLite không xác nhận khóa dòng hoặc hành vi cạnh tranh trên PostgreSQL. Bộ test CI đã có cấu hình PostgreSQL để nhóm chạy sau khi đưa lên GitHub.

Chưa thực hiện tại môi trường xây dựng: chạy toàn bộ Compose, thao tác giao diện trong trình duyệt, Postman Runner trên VPS, gửi SMTP thật, triển khai Linux có URL công khai và chạy GitHub Actions thật. Không có video hoặc ảnh chứng minh các bước này trong gói hiện tại.

## Nhóm thực hiện trước khi nộp

1. Chạy Docker theo README và kiểm tra health.
2. Thử luồng bệnh nhân đặt lịch, lễ tân xác nhận/check-in, bác sĩ hoàn thành, lễ tân thu tiền.
3. Thử quyền truy cập chéo, lỗi 422, bộ lọc tất cả và lịch sử của mỗi bệnh nhân.
4. Chạy test trên PostgreSQL riêng, Collection Runner và kiểm tra CI xanh.
5. Triển khai máy chủ sau Nginx, kiểm tra từ máy khác và chụp minh chứng thật.
6. Điền tên nhóm, MSSV, lớp, giảng viên, URL repo/server và tỷ lệ đóng góp thực tế.
7. Quay video dự phòng 3–5 phút theo docs/DEMO.md.

Giữ mật khẩu demo ở mục nộp riêng. Không đính kèm .env hoặc export Postman environment chứa JWT/mật khẩu vào Git.
