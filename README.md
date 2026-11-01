# 🎾 Pickleball Văn Quán - Hệ Thống Thống Kê & Sổ Quỹ Thi Đấu

Trang web thống kê kết quả thi đấu đôi Pickleball và tự động chia chi phí sân, nước, bóng, bia cho các thành viên **Pickleball Văn Quán**.

---

## 🌟 Tính Năng Chính

### 1. Bảng Xếp Hạng VĐV (Leaderboard)
* **Bộ lọc thời gian linh hoạt:** Theo Tuần, Tháng, Quý, Năm và Toàn thời gian (All-time).
* **Tiêu chí xếp hạng:** Tự động sắp xếp ưu tiên theo **Tỉ lệ Thắng (%)** rồi đến **Tổng số trận đã đấu**.
* **Thống kê chi tiết:**
  * Top 3 Podium vinh danh VĐV xuất sắc nhất.
  * Tổng trận, Thắng - Thua, Điểm ghi được, Điểm bị mất, Hiệu số (+/-).
  * Phong độ 5 trận gần nhất (`W`, `L`) và Chuỗi phong độ (`🔥 3W`, `❄️ 2L`).
  * Tìm kiếm nhanh VĐV theo tên.

### 2. Chi Tiết Buổi Chơi & Sổ Quỹ (Sessions & Chi phí)
* Hiển thị danh sách kết quả 17 trận đấu đôi của từng buổi.
* Bảng chi phí minh bạch: Sân, Nước, Bóng (Tổng Pick) và Tiền Bia.
* **Bảng tính tiền chuẩn 100% theo quy tắc của CLB:**
  1. Phạt thua **10.000 đ / trận** cho mỗi người thua.
  2. Lấy tổng tiền phạt bù vào tiền Sân + Nước + Bóng.
  3. Số tiền Pick còn thiếu chia đều cho tất cả VĐV tham gia.
  4. Tiền Bia chia đều cho đúng số người đi bia.
  5. **Tổng cuối** = Tiền Pick (Phạt + Chia đều) + Tiền Bia.
* **Nút 📋 "Sao Chép Bảng Tiền Gửi Zalo":** 1-click sao chép toàn bộ danh sách tiền đã định dạng sẵn để dán thẳng vào nhóm chat Zalo/Messenger của CLB!

### 3. Cặp Đôi Ăn Ý (Doubles Synergy)
* Thống kê các bộ đôi đánh cặp với nhau: số trận cùng thi đấu, số trận thắng, tỉ lệ ăn ý (%).

---

## 🚀 Cách Xem Trang Web Ngay Lập Tức Trên Máy Tính

Bạn chỉ cần:
1. Mở thư mục `D:\Code\pickleball-tracker`.
2. Bấm đúp chuột vào file **`index.html`**.
3. Trang web sẽ mở ngay lập tức trên trình duyệt của bạn (Chrome, Edge, Cốc Cốc...) với đầy đủ giao diện và dữ liệu!

---

## 🌐 Hướng Dẫn Đưa Web Lên Public (Miễn phí 100% Vĩnh Viễn)

Để cả nhóm có thể mở link trên điện thoại:

### Cách 1: Triển khai qua Vercel (Khuyên dùng - 2 phút)
1. Truy cập [vercel.com](https://vercel.com) (Đăng ký/Đăng nhập miễn phí bằng tài khoản Google hoặc GitHub).
2. Chọn **Add New...** $\rightarrow$ **Project**.
3. Kéo thả thư mục `D:\Code\pickleball-tracker` vào hoặc kết nối với Git Repository.
4. Đặt tên dự án là **`pickleball-vanquan`**.
5. Nhấn **Deploy**. Bạn sẽ nhận ngay đường link public:
   👉 `https://pickleball-vanquan.vercel.app`

### Cách 2: Triển khai qua GitHub Pages / Netlify / Cloudflare Pages
* Chỉ cần upload thư mục mã nguồn lên repository và bật GitHub Pages / Netlify Drop (kéo thả folder là có link public ngay).

---

## 📝 Cách Cập Nhật Kết Quả Buổi Chơi Hàng Tuần

Cứ sau mỗi buổi chơi:
1. Bạn chỉ cần nhắn tin cho trợ lý AI Antigravity trong khung chat:
   * Tỉ số các trận đôi.
   * Chi phí: Sân, Nước, Bóng, Bia và ai đi bia.
2. AI sẽ tự động cập nhật vào file `js/data.js` và tính toán lại bảng xếp hạng tích lũy cho toàn bộ các tuần/tháng/quý/năm!
