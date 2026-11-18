# Làm việc nhóm và minh chứng Git

## Bốn nhánh

| TV | Nhánh | Các file chính |
|---|---|---|
| 1 | feature/01-auth-api | security.py, auth.py, schemas.py |
| 2 | feature/02-frontend | frontend/index.html, app.js, app.css |
| 3 | feature/03-data-qa | models.py, migrations, appointments, tests, postman |
| 4 | feature/04-billing-devops | billing, reminders, Docker, Nginx, Actions, docs |

Tỷ lệ 25% mỗi người chỉ là dự kiến. Điền tỷ lệ thực tế theo công việc và minh chứng của nhóm.

## Tạo repo và push

Dùng repository clinic-booking-2. Trong Settings của GitHub thêm ba cộng tác viên và giảng viên nếu repo Private. Thực hiện trên máy đã có Git đăng nhập:

```bash
git init
git add .
git commit -m "feat: add clinic booking API and frontend"
git branch -M main
git remote add origin https://github.com/USERNAME/clinic-booking-2.git
git push -u origin main
git switch -c feature/01-auth-api
git push -u origin feature/01-auth-api
```

Các bạn khác tạo nhánh của mình từ main mới nhất. Không dùng --force. Nếu đã có repository Django, clone ra thư mục riêng và mở nhánh chuyển đổi, review thay đổi trước khi hợp nhất.

## Issues gợi ý

1. Auth JWT và Argon2, kiểm thử nâng quyền.
2. Tìm bác sĩ và slot, kiểm thử đặt trùng.
3. Check-in, kết quả khám và quyền đọc hồ sơ.
4. Hóa đơn chốt giá và thống kê paid_at.
5. Frontend gọi API, xử lý 401/403/422.
6. Migrations, seed, ERD và Postman.
7. Docker/Nginx, triển khai máy chủ, sao lưu.
8. README, báo cáo, slide và quay demo.

Mỗi issue cần người phụ trách, tiêu chí chấp nhận và liên kết PR. Trên Projects dùng cột Todo, In Progress, Review, Done.

## Quy ước commit và review

- feat: thêm chức năng; fix: sửa lỗi; test: thêm kiểm thử; docs: tài liệu; ci: workflow.
- Mỗi PR có người review khác người viết, kiểm tra CI và đường đi dữ liệu.
- Khi conflict, đọc cả hai thay đổi, sửa trên nhánh cá nhân, chạy test rồi commit.
- Không giả lập Contributions bằng commit rỗng hoặc ghi tên người chưa làm việc.
- Chụp ảnh Contributors, PR có review và Actions thật sau khi thực hiện.
