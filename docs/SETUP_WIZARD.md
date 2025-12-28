# Setup Wizard

## Tổng quan

Setup Wizard là trang cài đặt ban đầu cho website Prime Shop. Trang này chỉ xuất hiện một lần khi website chưa được cấu hình.

## Truy cập

- URL: `/setup`
- Điều kiện: Chỉ khi file `.setup-complete` chưa tồn tại trong thư mục server

## Các bước setup

### 1. Welcome (Chào mừng)
- Giới thiệu về quá trình cài đặt
- Hiển thị các bước sẽ thực hiện

### 2. Database Configuration (Cấu hình MySQL)
- Host: Địa chỉ MySQL server (mặc định: localhost)
- Port: Port MySQL (mặc định: 3306)
- Database Name: Tên database (sẽ tự tạo nếu chưa có)
- Username: Tài khoản MySQL
- Password: Mật khẩu MySQL
- Nút "Test kết nối" để kiểm tra

### 3. Admin Account (Tài khoản quản trị)
- Username: Tên đăng nhập admin
- Email: Email admin
- Password: Mật khẩu (tối thiểu 8 ký tự)
- Confirm Password: Xác nhận mật khẩu

### 4. Site Settings (Cấu hình website)
- Site Name: Tên website
- Site URL: URL đầy đủ của website
- Support Email: Email hỗ trợ
- Sender Email: Email gửi thông báo

### 5. Email SMTP (Tùy chọn)
- SMTP Host: Server SMTP
- SMTP Port: Port SMTP
- SMTP Username: Tài khoản SMTP
- SMTP Password: Mật khẩu SMTP

### 6. Review & Install (Xác nhận và cài đặt)
- Hiển thị tóm tắt cấu hình
- Nút "Bắt đầu Setup" để thực hiện

## Quá trình Setup

Khi nhấn "Bắt đầu Setup", hệ thống sẽ:

1. **Kết nối Database** - Tạo database nếu chưa có
2. **Chạy Migrations** - Import cấu trúc bảng từ `/database/migrations/`
3. **Import Seed Data** - Import dữ liệu mẫu từ `/database/seed.sql`
4. **Tạo Admin User** - Tạo tài khoản admin với thông tin đã nhập
5. **Cập nhật Site Settings** - Lưu cấu hình website
6. **Tạo file .env** - Tự động tạo file environment cho server
7. **Đánh dấu hoàn tất** - Tạo file `.setup-complete`

## Bảo mật

- Sau khi setup hoàn tất, trang `/setup` không thể truy cập
- API `/api/setup/*` sẽ trả về lỗi 403 nếu đã setup
- File `.setup-complete` đánh dấu trạng thái setup

## Troubleshooting

### Lỗi kết nối Database
- Kiểm tra MySQL đã khởi động chưa
- Kiểm tra username/password đúng chưa
- Kiểm tra firewall có chặn port MySQL không

### Muốn chạy lại Setup
1. Xóa file `server/.setup-complete`
2. Xóa database nếu muốn setup từ đầu
3. Restart server
4. Truy cập `/setup`

## Files liên quan

```
src/pages/SetupPage.tsx          # Frontend UI
server/src/routes/setup.ts       # Backend API
database/migrations/             # SQL migrations
database/seed.sql               # Seed data
server/.setup-complete          # Lock file
```
