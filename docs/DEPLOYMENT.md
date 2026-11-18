# Triển khai lên Linux

## Chuẩn bị

Dùng VPS hoặc máy ảo phòng lab mà nhóm có quyền quản lý. Cần Docker Engine, Compose plugin, Git, Python 3 và cổng vào phù hợp. Kho GitHub, IP/domain và tài khoản SSH do nhóm điền; tài liệu không chứa mật khẩu.

Clone repo vào thư mục mới, chạy configure.py, kiểm tra .env rồi:

```bash
docker compose up --build -d
docker compose ps
docker compose logs --tail=80 api
curl http://127.0.0.1:8080/api/health
```

Mở http://IP_MAY_CHU:8080 từ một máy khác. Nginx là điểm vào, API/PostgreSQL không publish cổng ra host. Nếu dùng firewall, chỉ mở cổng web và SSH cần thiết theo quy định phòng lab. Dùng HTTPS khi đưa tài khoản/dữ liệu thật lên Internet.

DEMO_MODE=true tự tạo dữ liệu giả. Khi chuyển sang môi trường thật, đổi mật khẩu demo hoặc tạo tài khoản mới rồi khóa demo, đặt DEMO_MODE=false và cấu hình SMTP.

## Nginx và HTTPS

Compose có nginx-unprivileged nghe 8080. Khi có domain/HTTPS, đặt reverse proxy HTTPS của máy chủ trước cổng này và chuyển Host/X-Forwarded-Proto đúng. Không bật HTTPS bằng cách chỉ đổi URL ở frontend. Bản kèm theo chưa có chứng chỉ/domain.

## Sao lưu và khôi phục

```bash
docker compose exec -T db pg_dump -U clinic -d clinic > clinic_backup.sql
```

File backup có thể chứa dữ liệu nhạy cảm, giữ ngoài repo. Kiểm tra khôi phục vào database thử riêng trước khi dựa vào bản sao lưu.

## Cập nhật

1. Sao lưu database.
2. git fetch, review và chuyển sang commit đã được nhóm kiểm thử.
3. docker compose up --build -d.
4. Kiểm tra health, log và đăng nhập/nghiệp vụ.
5. Nếu migration thay đổi dữ liệu, rollback cần kế hoạch riêng; đổi image không tự khôi phục CSDL.

## Trình diễn downgrade an toàn

Tạo database thử một lần, không dùng database clinic đang có dữ liệu:

```bash
docker compose exec db createdb -U clinic clinic_migration_demo
docker compose exec -e DATABASE_URL=postgresql+psycopg://clinic:MAT_KHAU_DB@db:5432/clinic_migration_demo api alembic upgrade head
docker compose exec -e DATABASE_URL=postgresql+psycopg://clinic:MAT_KHAU_DB@db:5432/clinic_migration_demo api alembic downgrade base
```

Thay MAT_KHAU_DB tại máy nhóm; tránh quay lộ mật khẩu trong video và lịch sử terminal. Có thể dùng file env tạm trong máy riêng cho trình diễn thay vì gõ mật khẩu lên màn hình.

## Tiêu chí hoàn tất triển khai

Trang web/Swagger truy cập từ máy khác, 4 container chạy, dữ liệu còn sau restart, kiểm thử nghiệp vụ qua Nginx, ảnh màn hình có URL máy chủ và một lượt demo trọn vẹn.
