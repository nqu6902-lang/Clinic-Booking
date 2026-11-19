# Frontend Clinic Booking

Giao diện HTML/CSS/JavaScript thuần cho bản `Clinic-Booking-develop`. Không cần npm install, không cần build JavaScript, không cần `.venv` để xem giao diện.

## Mở nhanh trên Windows

1. Giải nén dự án.
2. Mở thư mục gốc có `backend`, `frontend`, `docker-compose.yml`.
3. Nhấp đúp `start_frontend.bat`. Máy cần có Python 3 trong PATH.
4. Trình duyệt mở `http://127.0.0.1:5500`. Giữ cửa sổ chạy Python mở trong lúc sử dụng.

Hoặc mở Terminal tại thư mục gốc:

```powershell
python start_frontend.py
```

Nếu cổng 5500 bị dùng:

```powershell
python start_frontend.py --port 5501
```

Nếu chỉ muốn tự chạy server và mở trình duyệt thủ công:

```powershell
python -m http.server 5500 --bind 127.0.0.1 --directory frontend
```

Không mở `index.html` bằng cách nhấp đúp: ES modules cần được phục vụ qua HTTP.

## Hai chế độ riêng biệt

**Bản xem thử:** mở mặc định với bệnh nhân Nguyễn Minh An. Thanh màu vàng luôn ghi rõ đây là dữ liệu mẫu, thao tác chỉ lưu trong trình duyệt. Dùng nút **Đổi vai trò** để xem bệnh nhân, lễ tân, bác sĩ và quản trị. Tài khoản → Khôi phục mẫu đưa dữ liệu demo về trạng thái ban đầu. Bộ mẫu lấy ngày hiện tại lúc tạo; khi đã dùng nhiều ngày, khôi phục mẫu để có lịch minh họa mới.

**Kết nối API:** bấm nút ở thanh trên cùng, nhập tài khoản của hệ thống thật. Không có tài khoản/mật khẩu thật được tạo trong frontend. Bản backend trong ZIP mới có `/health` và `/health/db`, nên đăng nhập/nghiệp vụ thật sẽ báo chưa có chức năng cho đến khi nhóm bổ sung các API trong `docs/FRONTEND_API.md`. Không tự chuyển về dữ liệu mẫu khi API báo lỗi.

Token API được giữ trong bộ nhớ, không ghi vào localStorage. Tải lại trang trong chế độ API sẽ cần đăng nhập lại. LocalStorage của chế độ demo chỉ chứa dữ liệu mẫu và lựa chọn giao diện.

## Các màn hình và thao tác

| Vai trò | Có thể xem/thử |
|---|---|
| Bệnh nhân | Tổng quan; tìm bác sĩ; lọc chuyên khoa; chọn ngày/giờ; xác nhận đặt lịch; đổi/hủy trước ít nhất hai giờ; xem hồ sơ và hóa đơn của mình; in hóa đơn |
| Lễ tân | Lịch trong ngày; tìm kiếm/lọc lịch; xác nhận; check-in đúng ngày; xem hóa đơn và ghi nhận đã thu tiền |
| Bác sĩ | Lịch được phân công; mở lượt đã check-in; ghi kết quả/ghi chú; chọn dịch vụ và số lượng; hoàn tất khám và tạo hóa đơn mẫu; xem hồ sơ phụ trách |
| Quản trị | Tổng quan; danh mục bác sĩ/dịch vụ; thêm/sửa/tạm ngưng dịch vụ; hóa đơn; doanh thu đã thanh toán theo ngày/dịch vụ; xuất CSV |

Chế độ xem thử có dữ liệu bệnh nhân/bác sĩ/hóa đơn hoàn toàn hư cấu. Không nhập hồ sơ thật vào chế độ này. Việc lọc quyền bằng JavaScript trong demo chỉ minh họa trải nghiệm; backend phải thực thi xác thực và quyền trên dữ liệu thật.

## Thử một luồng hoàn chỉnh

1. Vai trò bệnh nhân: vào Đặt lịch khám, chọn bác sĩ, ngày, giờ trống, nhập lý do và xác nhận. Lịch mẫu sẽ ở trạng thái Chờ xác nhận.
2. Thử đổi sang giờ khác hoặc hủy lịch này. Khung giờ cũ được trả lại; nếu đổi thì lịch mới chờ xác nhận lại.
3. Đổi vai trò Lễ tân. Trong Tiếp nhận bệnh nhân, xác nhận lịch mẫu của **Đỗ Hải Nam** hôm nay rồi check-in. Không check-in lịch ngày mai.
4. Đổi vai trò Bác sĩ. Vào Danh sách khám, chọn **Phạm Mai Chi** hoặc bệnh nhân vừa check-in. Nhập kết quả mẫu, chọn dịch vụ/số lượng, bấm Hoàn tất & lập hóa đơn.
5. Đổi vai trò Lễ tân, mở Hóa đơn & thu phí. Tìm hóa đơn vừa tạo, xem chi tiết và ghi nhận đã thu. Đây là ghi nhận dữ liệu mẫu, không phải giao dịch chuyển tiền.
6. Đổi vai trò Quản trị, vào Báo cáo doanh thu. Doanh thu đã thu bao gồm hóa đơn vừa thanh toán; thử lọc theo dịch vụ, xem bảng theo ngày và xuất CSV.

## Chạy cùng Docker

Tại thư mục gốc, mở Docker Desktop rồi:

```powershell
if (!(Test-Path .env)) { Copy-Item .env.example .env }
docker compose up --build -d
```

Thiết lập mật khẩu database và các biến môi trường theo `docs/DEPLOYMENT.md` của nhóm. Mở `http://localhost:8080` hoặc cổng đã cấu hình trong `WEB_PORT`.

Frontend Dockerfile đã có `COPY assets/ /usr/share/nginx/html/assets/`. Sau khi sửa HTML/CSS/JS:

```powershell
docker compose up --build -d web
```

Nhấn Ctrl+F5 trên trình duyệt. Compose của nhóm hiện không gắn volume mã frontend, vì vậy chỉ refresh sẽ chưa lấy được code mới nếu chưa build lại.

## File cần biết

| File | Nội dung |
|---|---|
| `index.html` | Khung trang và nạp ES modules |
| `assets/style.css` | Bố cục, màu, responsive, hộp thoại và in hóa đơn |
| `assets/icons.js` | Icon SVG nội bộ, không tải thư viện ngoài |
| `assets/app.js` | Điều hướng theo vai trò, render màn hình, form, dialog, báo cáo và xử lý sự kiện |
| `assets/api.js` | Request JSON, bearer token, lỗi HTTP, timeout và đường dẫn API dự kiến |
| `assets/demo.js` | Bộ dữ liệu mẫu và thao tác mẫu lưu tại localStorage |
| `tests/demo.test.mjs` | Kiểm tra luồng dữ liệu mẫu và xử lý phản hồi API |
| `tests/render.test.mjs` | Kiểm tra logic render bằng document stub, quyền hiển thị, escaping và báo cáo |

## Kiểm tra JavaScript

Node.js 20 trở lên chỉ cần nếu muốn chạy kiểm thử; không cần Node để mở website.

```powershell
node --test frontend/tests/*.test.mjs
```

Hoặc vào `frontend`, chạy `npm test`. Không cần cài dependency npm.

44 kiểm tra tự động đã đạt trong môi trường soạn mã. Đây là kiểm thử JavaScript và render bằng document stub, không phải kiểm thử trình duyệt hay xác nhận bảo mật backend. Xem chi tiết và checklist kiểm tra trình duyệt tại `docs/FRONTEND_TESTS.md`.

## Đưa phần P2 vào repo nhóm

Nếu đang có bản clone repo với thay đổi chưa commit, kiểm tra và giữ lại chúng trước. Trên bản clone sạch:

```powershell
git switch develop
git pull --ff-only origin develop
git switch -c feature/02-frontend
```

Nếu nhánh đã tồn tại, dùng `git switch feature/02-frontend`. Chép **nội dung thư mục `frontend`** từ bản này vào `frontend` của repo; bổ sung `start_frontend.py`, `start_frontend.bat` ở gốc và hai tài liệu `docs/FRONTEND_API.md`, `docs/FRONTEND_TESTS.md`. Không chép cả thư mục dự án vào trong `backend` hoặc `frontend`.

Nếu nhóm đã tự sửa frontend, so sánh/ghép thay đổi trước khi thay file. Không thay backend hay cấu hình Compose của nhóm bằng bản cũ trong ZIP này.

```powershell
git status
git add frontend start_frontend.py start_frontend.bat docs/FRONTEND_API.md docs/FRONTEND_TESTS.md
git diff --cached --stat
git commit -m "feat(frontend): add role-based clinic booking interface"
git push -u origin feature/02-frontend
```

Tạo Pull Request với **base: develop**, **compare: feature/02-frontend**. Ghi rõ các luồng chạy bằng dữ liệu demo và API backend còn cần ghép. File `.env`, database và môi trường `.venv` không nằm trong phần frontend cần commit.
