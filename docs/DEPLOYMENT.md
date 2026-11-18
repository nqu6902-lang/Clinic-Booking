# Clinic Booking - Linux Deployment Guide

## 1. Giới thiệu

Tài liệu hướng dẫn triển khai hệ thống Clinic Booking trên Ubuntu bằng Docker Compose.

Các thành phần:
- Backend: FastAPI
- Database: PostgreSQL 16
- Web Server: Nginx
- Containerization: Docker Compose

## 2. Yêu cầu hệ thống

- Ubuntu 22.04 trở lên
- Git
- Docker
- Docker Compose v2

Kiểm tra phiên bản:

```bash
docker --version
docker compose version
git --version
```

## 3. Tải mã nguồn

```bash
git clone -b develop https://github.com/nqu6902-lang/Clinic-Booking.git
cd Clinic-Booking
```

## 4. Cấu hình môi trường

Tạo file môi trường:

```bash
cp .env.example .env
nano .env
```

Cấu hình các biến môi trường:

```env
POSTGRES_USER=clinic
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=clinic
DATABASE_URL=postgresql+psycopg2://clinic:your_secure_password@db:5432/clinic
JWT_SECRET=your_random_secret
JWT_EXPIRE_MINUTES=60
WEB_PORT=8080
```

Lưu ý:
- Thay mật khẩu và JWT_SECRET bằng giá trị riêng, đủ mạnh.
- DATABASE_URL phải sử dụng đúng mật khẩu PostgreSQL.
- Không đưa file .env lên GitHub.

Phân quyền file môi trường:

```bash
chmod 600 .env
```

## 5. Kiểm tra cấu hình Docker Compose

```bash
docker compose config --quiet
```

Nếu không có lỗi, cấu hình hợp lệ.

## 6. Build và khởi chạy

```bash
docker compose build
docker compose up -d
```

Kiểm tra trạng thái:

```bash
docker compose ps
```

## 7. Kiểm tra hoạt động

Kiểm tra API:

```bash
curl http://localhost:8080/api/health
```

Kết quả mong đợi:

```json
{"status":"ok"}
```

Kiểm tra kết nối Database:

```bash
curl http://localhost:8080/api/health/db
```

Kết quả mong đợi:

```json
{"database":"ok"}
```

Mở trình duyệt:

http://localhost:8080

Nếu thay đổi WEB_PORT trong .env, hãy sử dụng cổng tương ứng.

## 8. Quản lý hệ thống

Xem log:

```bash
docker compose logs -f
```

Dừng hệ thống:

```bash
docker compose down
```

Khởi động lại:

```bash
docker compose up -d
```

## 9. Lưu ý bảo mật

- Không commit file .env.
- Sử dụng mật khẩu PostgreSQL mạnh.
- Thay JWT_SECRET bằng chuỗi ngẫu nhiên.
- Không công khai cổng PostgreSQL nếu không cần thiết.
- Cấu hình HTTPS và Firewall trước khi triển khai Internet.

## 10. Ghi chú

Tài liệu này mô tả triển khai hạ tầng Docker thử nghiệm.
Các chức năng nghiệp vụ đặt lịch khám sẽ được tích hợp khi Backend và Frontend hoàn thiện.
