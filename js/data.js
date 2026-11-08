/**
 * Dữ liệu Giải đấu & Các buổi chơi - Pickleball Văn Quán
 * Cấu trúc chuẩn hóa: Quản lý các buổi đấu, tỉ số từng trận đôi và chi phí (sân, bóng, nước, bia).
 */

window.PICKLEBALL_DATA = {
  clubName: "Pickleball Văn Quán",
  subTitle: "Hệ thống Thống kê Thi đấu & Sổ quỹ CLB",
  defaultLossPenalty: 10000, // 10.000 VNĐ / trận thua
  googleSheetId: "1KYVmtRKqrcdmxtnGfwgNRIvsjUNJHoW4gcP4ZvxM8dg",
  
  // Danh sách các buổi chơi theo thời gian
  sessions: [
    {
      id: "session-2026-11-01",
      name: "Buổi thi đấu ngày 01/11/2026",
      date: "2026-11-01",
      location: "Sân Pickleball Văn Quán",
      sheetGid: "1710743855",
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
      // Danh sách thành viên đã thanh toán tiền buổi này (đồng bộ từ Google Sheets)
      paidMembers: [
        "Tùng", "Luân", "Đạt", "Tuấn Anh", "Khiêm", "Tuấn", "Tùng 89", "HAnh", "Tùng 86", "Cường", "Bình"
      ],
      // Danh sách 17 trận đôi của buổi 01/11/2026
      matches: [
        { id: 1, team1: ["Tuấn Anh", "Tùng"], team2: ["Cường", "Đạt"], score1: 11, score2: 3, note: "" },
        { id: 2, team1: ["Khiêm", "Tuấn"], team2: ["HAnh", "Bình"], score1: 11, score2: 8, note: "" },
        { id: 3, team1: ["Tuấn Anh", "Cường"], team2: ["Tùng 86", "Luân"], score1: 11, score2: 10, note: "" },
        { id: 4, team1: ["Tùng", "Tùng 89"], team2: ["HAnh", "Đạt"], score1: 11, score2: 6, note: "" },
        { id: 5, team1: ["Tuấn Anh", "Đạt"], team2: ["Tuấn", "Cường"], score1: 11, score2: 10, note: "" },
        { id: 6, team1: ["Tùng", "HAnh"], team2: ["Khiêm", "Tùng 89"], score1: 11, score2: 6, note: "" },
        { id: 7, team1: ["Cường", "Luân"], team2: ["Tùng 86", "Bình"], score1: 11, score2: 1, note: "" },
        { id: 8, team1: ["Tuấn Anh", "Tuấn"], team2: ["Khiêm", "Tùng"], score1: 5, score2: 11, note: "" },
        { id: 9, team1: ["Bình", "Luân"], team2: ["HAnh", "Tùng 86"], score1: 11, score2: 7, note: "" },
        { id: 10, team1: ["Tuấn Anh", "Bình"], team2: ["Khiêm", "HAnh"], score1: 2, score2: 11, note: "" },
        { id: 11, team1: ["HAnh", "Tuấn"], team2: ["Tùng 86", "Tùng"], score1: 8, score2: 11, note: "" },
        { id: 12, team1: ["Tùng 86", "Tuấn"], team2: ["Bình", "Khiêm"], score1: 11, score2: 6, note: "" },
        { id: 13, team1: ["Bình", "Cường"], team2: ["Khiêm", "Luân"], score1: 8, score2: 11, note: "" },
        { id: 14, team1: ["Tuấn Anh", "Tùng 89"], team2: ["HAnh", "Đạt"], score1: 10, score2: 11, note: "" },
        { id: 15, team1: ["Tuấn Anh", "Luân"], team2: ["Cường", "Tùng"], score1: 11, score2: 5, note: "" },
        { id: 16, team1: ["Bình", "Luân"], team2: ["Khiêm", "Tùng 86"], score1: 11, score2: 2, note: "" },
        { id: 17, team1: ["Tuấn", "Đạt"], team2: ["Cường", "Tùng 89"], score1: 11, score2: 9, note: "" }
      ]
    },
    {
      id: "session-2026-11-08",
      name: "Buổi thi đấu ngày 08/11/2026",
      date: "2026-11-08",
      location: "Sân Pickleball Văn Quán",
      sheetGid: "1030549909",
      expenses: {
        court: 400000,   // Tiền sân (400k)
        water: 250000,   // Tiền nước (250k)
        balls: 0,        // Tiền bóng (0k)
        beer: 0          // Tiền bia (0k - không đi)
      },
      // Danh sách người tham gia tăng 2 (uống bia)
      beerParticipants: [],
      // Danh sách thành viên đã thanh toán tiền buổi này
      paidMembers: [],
      // Danh sách 14 trận đôi của buổi 08/11/2026
      matches: [
        { id: 1, team1: ["Bình", "Đức"], team2: ["Hưng", "Cường"], score1: 11, score2: 8, note: "" },
        { id: 2, team1: ["Tuấn Anh", "Tùng"], team2: ["Tín", "Vững"], score1: 11, score2: 1, note: "" },
        { id: 3, team1: ["Cường", "Đức"], team2: ["Hưng", "Bình"], score1: 11, score2: 4, note: "" },
        { id: 4, team1: ["Tuấn Anh", "Tín"], team2: ["Tùng", "Tùng 86"], score1: 2, score2: 11, note: "" },
        { id: 5, team1: ["Tuấn Anh", "Cường"], team2: ["Vững", "Bình"], score1: 8, score2: 11, note: "" },
        { id: 6, team1: ["Tùng", "Hưng"], team2: ["Tùng 86", "Đức"], score1: 11, score2: 4, note: "" },
        { id: 7, team1: ["Bình", "Tín"], team2: ["Vững", "Cường"], score1: 10, score2: 11, note: "" },
        { id: 8, team1: ["Tuấn Anh", "Tùng 86"], team2: ["Tùng", "Đức"], score1: 11, score2: 9, note: "" },
        { id: 9, team1: ["Cường", "Bình"], team2: ["Hưng", "Vững"], score1: 11, score2: 3, note: "" },
        { id: 10, team1: ["Tùng 86", "Hưng"], team2: ["Đức", "Tín"], score1: 11, score2: 9, note: "" },
        { id: 11, team1: ["Tuấn Anh", "Bình"], team2: ["Cường", "Tùng"], score1: 8, score2: 11, note: "" },
        { id: 12, team1: ["Cường", "Tuấn Anh"], team2: ["Tùng", "Bình"], score1: 11, score2: 3, note: "" },
        { id: 13, team1: ["Tùng 86", "Vững"], team2: ["Hưng", "Đức"], score1: 11, score2: 6, note: "" },
        { id: 14, team1: ["Tuấn Anh", "Hưng"], team2: ["Đức", "Vững"], score1: 4, score2: 11, note: "" }
      ]
    }
  ]
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = window.PICKLEBALL_DATA;
}
