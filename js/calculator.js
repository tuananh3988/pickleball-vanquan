/**
 * Module Tính toán Thống kê & Phân bổ Chi phí - Pickleball Văn Quán
 */

window.Calculator = {
  /**
   * Tính toán chi tiết tài chính và thống kê cho một buổi chơi cụ thể
   * @param {Object} session - Dữ liệu buổi chơi
   * @param {number} defaultPenalty - Tiền phạt thua mỗi trận (mặc định 10.000đ)
   */
  calculateSessionFinancials(session, defaultPenalty = 10000) {
    if (!session || !session.matches || session.matches.length === 0) {
      return null;
    }

    const penaltyRate = session.lossPenaltyRate || defaultPenalty;
    const playerStats = {};

    // 1. Phân tích kết quả các trận đấu
    session.matches.forEach(match => {
      const isTeam1Win = match.score1 > match.score2;
      const t1 = match.team1 || [];
      const t2 = match.team2 || [];

      // Khởi tạo player nếu chưa có
      [...t1, ...t2].forEach(name => {
        const cleanName = name.trim();
        if (!playerStats[cleanName]) {
          playerStats[cleanName] = {
            name: cleanName,
            matches: 0,
            wins: 0,
            losses: 0,
            pointsWon: 0,
            pointsLost: 0,
            extraBet: 0 // Độ thêm nếu có
          };
        }
      });

      // Ghi nhận Team 1
      t1.forEach(name => {
        const p = playerStats[name.trim()];
        p.matches += 1;
        p.pointsWon += match.score1;
        p.pointsLost += match.score2;
        if (isTeam1Win) p.wins += 1;
        else p.losses += 1;
      });

      // Ghi nhận Team 2
      t2.forEach(name => {
        const p = playerStats[name.trim()];
        p.matches += 1;
        p.pointsWon += match.score2;
        p.pointsLost += match.score1;
        if (!isTeam1Win) p.wins += 1;
        else p.losses += 1;
      });
    });

    const playersList = Object.values(playerStats);
    const totalPlayers = playersList.length;

    // 2. Tính tiền phạt thua
    let totalLossPenalty = 0;
    playersList.forEach(p => {
      p.lossPenalty = p.losses * penaltyRate;
      totalLossPenalty += p.lossPenalty;
    });

    // 3. Tính tiền chi phí Pick (Sân + Nước + Bóng)
    const exp = session.expenses || {};
    const court = exp.court || 0;
    const water = exp.water || 0;
    const balls = exp.balls || 0;
    const totalPickExpense = court + water + balls;

    // Số tiền Pick còn thiếu sau khi lấy tiền phạt bù vào
    const remainingPickExpense = totalPickExpense - totalLossPenalty;
    const pickPerPerson = totalPlayers > 0 ? (remainingPickExpense / totalPlayers) : 0;

    // 4. Tính tiền Bia
    const totalBeerExpense = exp.beer || 0;
    const beerParticipants = (session.beerParticipants || []).map(n => n.trim());
    const beerCount = beerParticipants.length;
    const beerPerPerson = beerCount > 0 ? (totalBeerExpense / beerCount) : 0;

    // 5. Tính tổng số tiền từng người phải đóng
    const paidMembers = (session.paidMembers || []).map(n => n.trim().toLowerCase());
    const playerRows = playersList.map(p => {
      const isBeer = beerParticipants.includes(p.name);
      const isPaid = paidMembers.includes(p.name.toLowerCase());
      const pickCost = p.lossPenalty + pickPerPerson;
      const beerCost = isBeer ? beerPerPerson : 0;
      const totalFinal = pickCost + beerCost;

      return {
        ...p,
        isBeer,
        isPaid,
        pickCost,
        beerCost,
        totalFinal,
        winRate: p.matches > 0 ? (p.wins / p.matches * 100) : 0
      };
    });

    // Sắp xếp danh sách người chơi theo thứ tự trong file: Win rate cao -> thấp, hoặc theo số tiền
    playerRows.sort((a, b) => b.wins - a.wins || a.losses - b.losses);

    // Tính tổng kiểm tra
    const totalCalculatedFinal = playerRows.reduce((sum, r) => sum + r.totalFinal, 0);

    return {
      playerRows,
      summary: {
        totalMatches: session.matches.length,
        totalPlayers,
        court,
        water,
        balls,
        totalPickExpense,
        totalLossPenalty,
        remainingPickExpense,
        pickPerPerson,
        totalBeerExpense,
        beerCount,
        beerPerPerson,
        totalAllExpenses: totalPickExpense + totalBeerExpense,
        totalPaidCount: playerRows.filter(p => p.isPaid).length,
        totalCalculatedFinal
      }
    };
  },

  /**
   * Tính toán Thống kê Tổng hợp (Leaderboard) theo bộ lọc thời gian
   * @param {Array} sessions - Danh sách các buổi chơi
   * @param {Object} filter - { type: 'all' | 'year' | 'quarter' | 'month' | 'week', year, quarter, month, week }
   */
  calculateLeaderboard(sessions, filter = { type: 'all' }) {
    if (!sessions || sessions.length === 0) return { players: [], pairs: [] };

    // 1. Lọc các buổi phù hợp với bộ lọc thời gian
    const filteredSessions = sessions.filter(session => {
      if (filter.type === 'all') return true;
      if (!session.date) return true;

      const date = new Date(session.date);
      const sYear = date.getFullYear();
      const sMonth = date.getMonth() + 1;
      const sQuarter = Math.ceil(sMonth / 3);
      const sWeek = this.getISOWeek(date);

      if (filter.type === 'year') {
        return sYear === parseInt(filter.year);
      }
      if (filter.type === 'quarter') {
        return sYear === parseInt(filter.year) && sQuarter === parseInt(filter.quarter);
      }
      if (filter.type === 'month') {
        return sYear === parseInt(filter.year) && sMonth === parseInt(filter.month);
      }
      if (filter.type === 'week') {
        return sYear === parseInt(filter.year) && sWeek === parseInt(filter.week);
      }
      return true;
    });

    // 2. Thu thập dữ liệu trận đấu theo thời gian (sắp xếp tăng dần theo ngày để tính form/streak chuẩn)
    const sortedSessions = [...filteredSessions].sort((a, b) => new Date(a.date) - new Date(b.date));
    const playerMap = {};
    const pairMap = {};

    sortedSessions.forEach(session => {
      (session.matches || []).forEach(match => {
        const isT1Win = match.score1 > match.score2;
        const t1 = (match.team1 || []).map(n => n.trim());
        const t2 = (match.team2 || []).map(n => n.trim());

        // Cập nhật từng người chơi
        [...t1, ...t2].forEach(name => {
          if (!playerMap[name]) {
            playerMap[name] = {
              name,
              matches: 0,
              wins: 0,
              losses: 0,
              pointsWon: 0,
              pointsLost: 0,
              history: [] // Danh sách 'W' | 'L' theo thứ tự thời gian
            };
          }
        });

        // Team 1
        t1.forEach(name => {
          const p = playerMap[name];
          p.matches += 1;
          p.pointsWon += match.score1;
          p.pointsLost += match.score2;
          if (isT1Win) {
            p.wins += 1;
            p.history.push('W');
          } else {
            p.losses += 1;
            p.history.push('L');
          }
        });

        // Team 2
        t2.forEach(name => {
          const p = playerMap[name];
          p.matches += 1;
          p.pointsWon += match.score2;
          p.pointsLost += match.score1;
          if (!isT1Win) {
            p.wins += 1;
            p.history.push('W');
          } else {
            p.losses += 1;
            p.history.push('L');
          }
        });

        // Cập nhật thống kê Cặp đôi ăn ý (Doubles Synergy)
        if (t1.length === 2) {
          const pairKey = [t1[0], t1[1]].sort().join(" & ");
          if (!pairMap[pairKey]) pairMap[pairKey] = { name: pairKey, player1: t1[0], player2: t1[1], matches: 0, wins: 0, losses: 0 };
          pairMap[pairKey].matches += 1;
          if (isT1Win) pairMap[pairKey].wins += 1;
          else pairMap[pairKey].losses += 1;
        }

        if (t2.length === 2) {
          const pairKey = [t2[0], t2[1]].sort().join(" & ");
          if (!pairMap[pairKey]) pairMap[pairKey] = { name: pairKey, player1: t2[0], player2: t2[1], matches: 0, wins: 0, losses: 0 };
          pairMap[pairKey].matches += 1;
          if (!isT1Win) pairMap[pairKey].wins += 1;
          else pairMap[pairKey].losses += 1;
        }
      });
    });

    // 3. Tính toán các chỉ số phái sinh: Win Rate, Hiệu số, Chuỗi phong độ
    const players = Object.values(playerMap).map(p => {
      const winRate = p.matches > 0 ? (p.wins / p.matches * 100) : 0;
      const pointDiff = p.pointsWon - p.pointsLost;
      
      // Phong độ 5 trận gần nhất
      const recentForm = p.history.slice(-5);
      
      // Chuỗi thắng/thua hiện tại
      let streakType = null;
      let streakCount = 0;
      for (let i = p.history.length - 1; i >= 0; i--) {
        const res = p.history[i];
        if (streakType === null) {
          streakType = res;
          streakCount = 1;
        } else if (streakType === res) {
          streakCount++;
        } else {
          break;
        }
      }

      return {
        ...p,
        winRate,
        winRateFormatted: winRate.toFixed(1),
        pointDiff,
        recentForm,
        streak: {
          type: streakType, // 'W' | 'L'
          count: streakCount
        }
      };
    });

    // 4. Sắp xếp bảng xếp hạng theo yêu cầu người dùng:
    // "sắp xếp theo tỉ lệ thắng / tổng trận đã thi đấu"
    players.sort((a, b) => {
      // 1. Tỉ lệ thắng (%) giảm dần
      if (Math.abs(b.winRate - a.winRate) > 0.01) {
        return b.winRate - a.winRate;
      }
      // 2. Nếu bằng tỉ lệ thắng: người nào đấu NHIỀU trận hơn xếp trên
      if (b.matches !== a.matches) {
        return b.matches - a.matches;
      }
      // 3. Nếu vẫn bằng: xét hiệu số điểm
      return b.pointDiff - a.pointDiff;
    });

    // Gán thứ hạng Rank
    players.forEach((p, idx) => {
      p.rank = idx + 1;
    });

    // Thống kê cặp đôi
    const pairs = Object.values(pairMap).map(pair => {
      const winRate = pair.matches > 0 ? (pair.wins / pair.matches * 100) : 0;
      return {
        ...pair,
        winRate,
        winRateFormatted: winRate.toFixed(1)
      };
    }).sort((a, b) => b.winRate - a.winRate || b.matches - a.matches);

    return {
      players,
      pairs,
      sessionCount: filteredSessions.length,
      totalMatches: filteredSessions.reduce((acc, s) => acc + (s.matches ? s.matches.length : 0), 0)
    };
  },

  /**
   * Tính tuần ISO trong năm
   */
  getISOWeek(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  },

  /**
   * Lấy danh sách các mốc thời gian có trong dữ liệu (để hiển thị filter)
   */
  getTimeFilterOptions(sessions) {
    const years = new Set();
    const months = new Set();
    const quarters = new Set();
    const weeks = new Set();

    (sessions || []).forEach(s => {
      if (!s.date) return;
      const d = new Date(s.date);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const q = Math.ceil(m / 3);
      const w = this.getISOWeek(d);

      years.add(y);
      months.add(`${y}-M${String(m).padStart(2, '0')}`);
      quarters.add(`${y}-Q${q}`);
      weeks.add(`${y}-W${String(w).padStart(2, '0')}`);
    });

    return {
      years: Array.from(years).sort().reverse(),
      months: Array.from(months).sort().reverse(),
      quarters: Array.from(quarters).sort().reverse(),
      weeks: Array.from(weeks).sort().reverse()
    };
  },

  /**
   * Định dạng tiền tệ VNĐ (ví dụ: 291.340 đ hoặc dạng k)
   */
  formatCurrency(amount, inThousands = false) {
    if (amount === undefined || amount === null || isNaN(amount)) return "0 đ";
    if (inThousands) {
      return (amount / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + "k";
    }
    return Math.round(amount).toLocaleString('vi-VN') + " đ";
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = Calculator;
}
