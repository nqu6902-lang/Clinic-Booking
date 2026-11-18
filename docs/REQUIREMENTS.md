# Đối chiếu file đề ĐG2

Nguồn: DDG2_Bài Tập Lớn.docx, mục I, đề tài 6 và mục V–VII.

| Yêu cầu bắt buộc | Hiện thực hoặc minh chứng | Trạng thái |
|---|---|---|
| REST API FastAPI/Express, OpenAPI | FastAPI, /api/docs, responses.py, docs/openapi.json | Có mã và kiểm thử |
| Frontend gọi API | HTML/CSS/JS fetch, sessionStorage JWT | Có mã |
| PostgreSQL/MySQL, ≥5 bảng, ORM | PostgreSQL, SQLAlchemy, 10 bảng | Có cấu hình, thử nghiệp vụ trên SQLite |
| Quan hệ 1:N và N:N | Doctor–Schedule, Appointment–Service qua VisitService | Có schema |
| Migration và seed | Alembic snapshot, app.seed | Đã thử upgrade/check/seed trên SQLite |
| JWT, Argon2/bcrypt, phân quyền | HS256, Argon2id, 4 role, quyền sở hữu | Có kiểm thử |
| ≥2 nâng cao | Search/filter/page, report, email, JSON log | Có mã, SMTP thật chưa thử |
| Non-root và ≥3 service | API UID10001, Nginx unprivileged; db/api/nginx/reminders | Có cấu hình, Docker chưa chạy ở môi trường tạo bài |
| VPS/Linux sau Nginx | nginx/default.conf, DEPLOYMENT.md | Cần nhóm triển khai thật |
| Postman test script | 28 request và assertions | Có collection, Runner chưa chạy trên VPS |
| ≥8 pytest và CI lint+test | 22 đạt, 1 PostgreSQL bỏ qua tại lần thử local; workflow CI | Local đạt, CI remote chưa có minh chứng |
| Git feature/PR/review/Conventional | GIT_TEAM.md, PR template | Nhóm thực hiện thật |
| Báo cáo 15–25 trang và slide | File Word và PowerPoint trong docs | Đính kèm |
| Video 3–5 phút | DEMO.md | Cần quay trên ứng dụng đang chạy |
| Tài khoản demo | README + DEMO_PASSWORD riêng trong .env | Có seed |
| Ảnh Contributors/Swagger/Actions | Dùng ảnh chụp từ repo và server của nhóm | Không tạo giả |

Các trạng thái trên phân biệt việc có mã nguồn với việc đã vận hành thật. Không dùng tài liệu này để khẳng định CI xanh hoặc đã triển khai khi chưa có kết quả.
