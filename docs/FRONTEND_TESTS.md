# Kiểm tra frontend

## Đã thực hiện

Lệnh từ thư mục gốc:

```powershell
node --test frontend/tests/*.test.mjs
```

Kết quả: **44 kiểm tra đạt, 0 lỗi**.

- 17 kiểm tra dữ liệu demo/API client: đặt lịch, tranh chỗ trong mô phỏng tuần tự, không đặt hai bác sĩ cùng giờ, hủy và trả chỗ, ranh giới hai giờ, chủ sở hữu lịch, đổi lịch, xác nhận/check-in, quyền vai trò mẫu, bác sĩ phụ trách, tính hóa đơn từ giá danh mục, số lượng không hợp lệ, thanh toán trùng, giữ giá hóa đơn cũ, 404/HTML fallback/token của API client.
- 21 kiểm tra các màn hình theo vai trò dựng được mà không có lỗi JavaScript bằng document stub.
- 6 kiểm tra phạm vi dữ liệu mẫu, chặn route không thuộc vai trò, escape nội dung chèn vào HTML, doanh thu theo dịch vụ và ranh giới ngày Việt Nam.
- Cú pháp ES modules và Python launcher, đường dẫn tài nguyên HTML, dấu ngoặc/chuỗi trong CSS được kiểm tra trước khi đóng gói. CSS chưa được xác nhận bằng bộ máy hiển thị trình duyệt.

`render.test.mjs` dùng đối tượng document mô phỏng để kiểm tra logic render; không có browser layout engine. Các test dữ liệu demo không thay thế test backend, không xác nhận khả năng chống đặt trùng đồng thời trên PostgreSQL, và không xác nhận phân quyền thật.

## Chưa xác nhận trong môi trường soạn mã

- Kiểm thử tương tác và bố cục trên trình duyệt thật: trình duyệt kiểm thử không truy cập được máy chủ cục bộ trong môi trường này.
- Chạy Docker/Compose thực tế: môi trường soạn mã không có Docker.
- API nghiệp vụ, tài khoản thật, GitHub Actions và triển khai server: backend trong ZIP hiện chưa có các nghiệp vụ này.

## Kiểm tra thủ công trên máy nhóm

1. Mở bằng `python start_frontend.py`. Kiểm tra thanh Bản xem thử xuất hiện và không có lỗi JavaScript trong F12 → Console.
2. Dùng F12 → Device Toolbar kiểm tra chiều rộng 390px và 1440px: menu điện thoại mở/đóng được; không tràn toàn bộ trang; bảng rộng cuộn trong khung.
3. Bệnh nhân: tìm bác sĩ không dấu, lọc chuyên khoa, chọn ngày/giờ, nhập lý do, xem lại và xác nhận. Refresh vẫn thấy lịch mẫu đã tạo.
4. Đổi giờ và hủy lịch; kiểm tra giờ cũ được trả lại. Lịch gần giờ khám hoặc đã khám không có nút đổi/hủy.
5. Lễ tân: xác nhận lịch hôm nay, check-in; lịch ngày khác không được check-in.
6. Bác sĩ: mở một lượt đã check-in, nhập kết quả và chọn dịch vụ/số lượng. Hoàn tất phải tạo đúng một hóa đơn mẫu.
7. Lễ tân: xem hóa đơn, ghi nhận đã thu; lần sau không còn nút thu lần nữa.
8. Bệnh nhân: chỉ thấy hồ sơ/hóa đơn của tài khoản mẫu của mình. Quản trị và lễ tân không có menu chẩn đoán/hồ sơ khám.
9. Quản trị: sửa giá dịch vụ; kiểm tra hóa đơn cũ giữ giá cũ. Báo cáo chỉ cộng hóa đơn đã thu, lọc ngày/dịch vụ và xuất CSV đọc được tiếng Việt.
10. In hóa đơn: kiểm tra trang xem trước chỉ có nội dung hóa đơn; hóa đơn mẫu vẫn có ghi chú xem thử. Hủy cửa sổ in nếu chỉ kiểm tra.
11. Dùng bàn phím Tab, Enter, Esc với form và hộp thoại; thử lý do/ghi chú dài và các ký tự `< > & " '` để chắc chắn được hiển thị như văn bản.
12. Chọn Kết nối API trên backend hiện tại: phải thấy lỗi chức năng chưa tồn tại khi thử đăng nhập, không được báo đăng nhập/đặt lịch thành công giả.
13. Sau khi ghép API, lặp lại các luồng bằng tài khoản kiểm thử backend và kiểm tra quyền trực tiếp qua API.
