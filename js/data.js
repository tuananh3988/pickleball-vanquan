/**
 * Dữ liệu Giải đấu & Các buổi chơi - Pickleball Văn Quán
 * Cấu trúc chuẩn hóa: Quản lý các buổi đấu, tỉ số từng trận đôi và chi phí (sân, bóng, nước, bia).
 */

window.PICKLEBALL_DATA = {
  clubName: "Pickleball Văn Quán",
  subTitle: "Hệ thống Thống kê Thi đấu & Sổ quỹ CLB",
  defaultLossPenalty: 10000, // 10.000 VNĐ / trận thua
  
  // Danh sách các buổi chơi theo thời gian
  sessions: [
    {
      id: "session-2026-11-01",
      name: "Buổi thi đấu ngày 01/11/2026",
      date: "2026-11-01",
      location: "Sân Pickleball Văn Quán",
      expenses: {
        court: 400000,   // Tiền sân (400k)
        water: 375000,   // Tiền nước (375k)
        balls: 70000,    // Tiền bóng (70k)
        beer: 1578000    // Tiền bia (1.578k)
      },
      // Danh sách người tham gia tăng 2 (uống bia)
      beerParticipants: [
        "Đạt", "Tuấn Anh", "Khiêm", "Tuấn", "HAnh", "Cường", "Bình"
      ],
      // Danh sách 17 trận đôi của buổi
      matches: [
        { id: 1, team1: ["Tuấn Anh", "Tùng nhỏ"], team2: ["Cường", "Đạt"], score1: 11, score2: 3, note: "" },
        { id: 2, team1: ["Khiêm", "Tuấn"], team2: ["HAnh", "Bình"], score1: 11, score2: 8, note: "" },
        { id: 3, team1: ["Tuấn Anh", "Cường"], team2: ["Tùng lớn", "Luân"], score1: 11, score2: 10, note: "" },
        { id: 4, team1: ["Tùng nhỏ", "Tùng trọc"], team2: ["HAnh", "Đạt"], score1: 11, score2: 6, note: "" },
        { id: 5, team1: ["Tuấn Anh", "Đạt"], team2: ["Tuấn", "Cường"], score1: 11, score2: 10, note: "" },
        { id: 6, team1: ["Tùng nhỏ", "HAnh"], team2: ["Khiêm", "Tùng trọc"], score1: 11, score2: 6, note: "" },
        { id: 7, team1: ["Cường", "Luân"], team2: ["Tùng lớn", "Bình"], score1: 11, score2: 1, note: "" },
        { id: 8, team1: ["Tuấn Anh", "Tuấn"], team2: ["Khiêm", "Tùng nhỏ"], score1: 5, score2: 11, note: "" },
        { id: 9, team1: ["Bình", "Luân"], team2: ["HAnh", "Tùng lớn"], score1: 11, score2: 7, note: "" },
        { id: 10, team1: ["Tuấn Anh", "Bình"], team2: ["Khiêm", "HAnh"], score1: 2, score2: 11, note: "" },
        { id: 11, team1: ["HAnh", "Tuấn"], team2: ["Tùng lớn", "Tùng nhỏ"], score1: 8, score2: 11, note: "" },
        { id: 12, team1: ["Tùng lớn", "Tuấn"], team2: ["Bình", "Khiêm"], score1: 11, score2: 6, note: "" },
        { id: 13, team1: ["Bình", "Cường"], team2: ["Khiêm", "Luân"], score1: 8, score2: 11, note: "" },
        { id: 14, team1: ["Tuấn Anh", "Tùng trọc"], team2: ["HAnh", "Đạt"], score1: 10, score2: 11, note: "" },
        { id: 15, team1: ["Tuấn Anh", "Luân"], team2: ["Cường", "Tùng nhỏ"], score1: 11, score2: 5, note: "" },
        { id: 16, team1: ["Bình", "Luân"], team2: ["Khiêm", "Tùng lớn"], score1: 11, score2: 2, note: "" },
        { id: 17, team1: ["Tuấn", "Đạt"], team2: ["Cường", "Tùng trọc"], score1: 11, score2: 9, note: "" }
      ]
    }
  ]
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = PICKLEBALL_DATA;
}
