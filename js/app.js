/**
 * Application Controller - Pickleball Văn Quán
 */

window.App = {
  activeTab: 'sessions',
  currentFilter: { type: 'all' },
  currentSessionId: null,
  cachedLeaderboardData: null,
  searchQuery: '',

  init() {
    if (!window.PICKLEBALL_DATA || !window.Calculator) {
      console.error("Dữ liệu hoặc Module tính toán chưa được tải.");
      return;
    }

    // Chọn buổi mới nhất làm mặc định
    const sessions = window.PICKLEBALL_DATA.sessions || [];
    if (sessions.length > 0) {
      this.currentSessionId = sessions[sessions.length - 1].id;
    }

    this.initSessionSelect();
    this.renderLeaderboard();
    this.renderSessionDetail();
    this.renderPairs();

    // Mặc định hiển thị tab Chi Tiết Buổi Chơi
    this.switchTab('sessions');

    if (window.lucide) {
      lucide.createIcons();
    }
  },

  /**
   * Chuyển đổi tab điều hướng
   */
  switchTab(tabName) {
    this.activeTab = tabName;

    // Ẩn tất cả các section
    ['leaderboard', 'sessions', 'pairs'].forEach(tab => {
      const section = document.getElementById(`section-${tab}`);
      if (section) section.classList.add('hidden');
    });

    // Hiện section được chọn
    const activeSection = document.getElementById(`section-${tabName}`);
    if (activeSection) activeSection.classList.remove('hidden');

    // Cập nhật desktop tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.className = "tab-btn flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 text-slate-300 hover:text-white hover:bg-slate-700/50";
    });
    const activeNavBtn = document.getElementById(`nav-${tabName}`);
    if (activeNavBtn) {
      activeNavBtn.className = "tab-btn flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 bg-pickle-400 text-slate-950 shadow-md";
    }

    // Cập nhật mobile tab buttons
    document.querySelectorAll('.mobile-tab-btn').forEach(btn => {
      const isTarget = btn.getAttribute('data-tab') === tabName;
      btn.className = `mobile-tab-btn flex flex-col items-center py-1 px-3 text-xs font-semibold ${isTarget ? 'text-pickle-400 font-bold' : 'text-slate-400'}`;
    });

    if (window.lucide) {
      lucide.createIcons();
    }
  },

  /**
   * Đặt bộ lọc thời gian cho Bảng Xếp Hạng
   */
  setTimeFilter(type) {
    // Xác định năm, quý, tháng, tuần hiện tại từ dữ liệu
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentQuarter = Math.ceil(currentMonth / 3);
    const currentWeek = Calculator.getISOWeek(now);

    let filterObj = { type };
    let label = "Đang xem: Toàn thời gian (All-time)";

    if (type === 'year') {
      filterObj.year = currentYear;
      label = `Đang xem: Năm ${currentYear}`;
    } else if (type === 'quarter') {
      filterObj.year = currentYear;
      filterObj.quarter = currentQuarter;
      label = `Đang xem: Quý ${currentQuarter} - Năm ${currentYear}`;
    } else if (type === 'month') {
      filterObj.year = currentYear;
      filterObj.month = currentMonth;
      label = `Đang xem: Tháng ${currentMonth} / ${currentYear}`;
    } else if (type === 'week') {
      filterObj.year = currentYear;
      filterObj.week = currentWeek;
      label = `Đang xem: Tuần ${currentWeek} - Năm ${currentYear}`;
    }

    this.currentFilter = filterObj;

    // Cập nhật giao diện nút filter
    document.querySelectorAll('.filter-pill').forEach(pill => {
      if (pill.getAttribute('data-filter') === type) {
        pill.className = "filter-pill px-3 py-1.5 rounded-lg transition-all duration-150 bg-white text-slate-900 font-bold shadow-sm";
      } else {
        pill.className = "filter-pill px-3 py-1.5 rounded-lg transition-all duration-150 text-slate-600 hover:text-slate-900";
      }
    });

    const labelEl = document.getElementById('current-filter-label');
    if (labelEl) labelEl.textContent = label;

    this.renderLeaderboard();
  },

  /**
   * Lọc tìm kiếm người chơi trên Bảng Xếp Hạng
   */
  filterLeaderboardSearch(query) {
    this.searchQuery = (query || '').toLowerCase().trim();
    this.renderLeaderboardTable();
  },

  /**
   * Render Bảng Xếp Hạng & Top 3 Podium
   */
  renderLeaderboard() {
    const sessions = window.PICKLEBALL_DATA.sessions || [];
    const stats = Calculator.calculateLeaderboard(sessions, this.currentFilter);
    this.cachedLeaderboardData = stats;

    // Cập nhật số trận
    const countEl = document.getElementById('stats-matches-count');
    if (countEl) countEl.textContent = `${stats.totalMatches} trận đấu (${stats.sessionCount} buổi)`;

    // Render Top 3 Podium
    this.renderPodium(stats.players);

    // Render bảng danh sách đầy đủ
    this.renderLeaderboardTable();

    if (window.lucide) {
      lucide.createIcons();
    }
  },

  /**
   * Render Top 3 Podium Cards
   */
  renderPodium(players) {
    const container = document.getElementById('podium-container');
    if (!container) return;

    if (!players || players.length === 0) {
      container.innerHTML = `
        <div class="col-span-3 text-center py-8 text-slate-400 text-sm">
          Không có dữ liệu trong khoảng thời gian này
        </div>
      `;
      return;
    }

    const top3 = players.slice(0, 3);
    const ranks = [
      { badgeClass: 'rank-badge-1', title: 'Hạng Nhất', icon: '👑', medal: '🥇', border: 'border-amber-300' },
      { badgeClass: 'rank-badge-2', title: 'Hạng Nhì', icon: '🥈', medal: '🥈', border: 'border-slate-300' },
      { badgeClass: 'rank-badge-3', title: 'Hạng Ba', icon: '🥉', medal: '🥉', border: 'border-amber-600/40' }
    ];

    container.innerHTML = top3.map((p, idx) => {
      const cfg = ranks[idx] || ranks[2];
      return `
        <div class="bg-white rounded-2xl shadow-sm border ${cfg.border} p-5 relative overflow-hidden flex flex-col justify-between hover:shadow-md transition">
          <div class="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-slate-50 flex items-end justify-start pl-2 pb-2 text-2xl opacity-60">
            ${cfg.medal}
          </div>

          <div>
            <div class="flex items-center space-x-3 mb-3">
              <span class="w-8 h-8 rounded-xl ${cfg.badgeClass} flex items-center justify-center font-extrabold text-sm shadow">
                #${idx + 1}
              </span>
              <div>
                <h4 class="font-extrabold text-slate-900 text-base sm:text-lg flex items-center space-x-1.5">
                  <span>${p.name}</span>
                  ${p.streak && p.streak.type === 'W' && p.streak.count >= 2 ? `<span class="flame-icon text-xs" title="Chuỗi ${p.streak.count} trận thắng">🔥${p.streak.count}W</span>` : ''}
                </h4>
                <p class="text-xs text-slate-400 font-medium">${cfg.title}</p>
              </div>
            </div>

            <!-- Stats Bar -->
            <div class="space-y-1.5 my-3">
              <div class="flex justify-between text-xs font-semibold">
                <span class="text-slate-500">Tỉ lệ thắng:</span>
                <span class="text-pickle-600 font-extrabold text-sm">${p.winRateFormatted}%</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div class="bg-gradient-to-r from-pickle-500 to-emerald-500 h-2 rounded-full" style="width: ${p.winRate}%"></div>
              </div>
            </div>
          </div>

          <!-- Bottom Mini Stats -->
          <div class="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center text-xs">
            <div>
              <p class="text-slate-400 text-[10px] uppercase font-bold">Số trận</p>
              <p class="font-bold text-slate-800 text-sm">${p.matches}</p>
            </div>
            <div>
              <p class="text-slate-400 text-[10px] uppercase font-bold">Thắng - Thua</p>
              <p class="font-bold text-slate-800 text-sm">
                <span class="text-emerald-600">${p.wins}</span> - <span class="text-rose-500">${p.losses}</span>
              </p>
            </div>
            <div>
              <p class="text-slate-400 text-[10px] uppercase font-bold">Hiệu số</p>
              <p class="font-bold text-sm ${p.pointDiff > 0 ? 'text-emerald-600' : p.pointDiff < 0 ? 'text-rose-500' : 'text-slate-700'}">
                ${p.pointDiff > 0 ? '+' : ''}${p.pointDiff}
              </p>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  /**
   * Render Leaderboard Table
   */
  renderLeaderboardTable() {
    const tbody = document.getElementById('leaderboard-tbody');
    if (!tbody || !this.cachedLeaderboardData) return;

    let players = this.cachedLeaderboardData.players || [];
    if (this.searchQuery) {
      players = players.filter(p => p.name.toLowerCase().includes(this.searchQuery));
    }

    if (players.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center py-8 text-slate-400 text-sm">
            Không tìm thấy vận động viên nào phù hợp
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = players.map(p => {
      // Rank badge style
      let rankBadge = `<span class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600 text-xs font-extrabold">#${p.rank}</span>`;
      if (p.rank === 1) rankBadge = `<span class="inline-flex items-center justify-center w-7 h-7 rounded-lg rank-badge-1 text-xs font-black">🥇 1</span>`;
      else if (p.rank === 2) rankBadge = `<span class="inline-flex items-center justify-center w-7 h-7 rounded-lg rank-badge-2 text-xs font-black">🥈 2</span>`;
      else if (p.rank === 3) rankBadge = `<span class="inline-flex items-center justify-center w-7 h-7 rounded-lg rank-badge-3 text-xs font-black">🥉 3</span>`;

      // Streak badge
      let streakBadge = `<span class="text-slate-400 text-xs">-</span>`;
      if (p.streak && p.streak.count > 0) {
        if (p.streak.type === 'W') {
          streakBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">🔥 ${p.streak.count}W</span>`;
        } else {
          streakBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">❄️ ${p.streak.count}L</span>`;
        }
      }

      // Recent form pills (5 trận gần nhất)
      const formHtml = (p.recentForm || []).map(f => {
        return f === 'W'
          ? `<span class="w-5 h-5 rounded-full bg-emerald-500 text-white inline-flex items-center justify-center text-[10px] font-black shadow-sm" title="Thắng">W</span>`
          : `<span class="w-5 h-5 rounded-full bg-rose-400 text-white inline-flex items-center justify-center text-[10px] font-black shadow-sm" title="Thua">L</span>`;
      }).join(' ');

      return `
        <tr class="hover:bg-slate-50/80 transition duration-150">
          <td class="py-3.5 px-4 text-center font-bold">
            ${rankBadge}
          </td>
          <td class="py-3.5 px-4">
            <div class="flex items-center space-x-2.5">
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-pickle-300 font-bold flex items-center justify-center text-xs shadow-sm">
                ${p.name.charAt(0)}
              </div>
              <div>
                <span class="font-bold text-slate-900 text-sm">${p.name}</span>
              </div>
            </div>
          </td>
          <td class="py-3.5 px-4 text-center font-bold text-slate-800">
            ${p.matches}
          </td>
          <td class="py-3.5 px-4 text-center">
            <span class="font-bold text-emerald-600">${p.wins}</span>
            <span class="text-slate-300 mx-1">/</span>
            <span class="font-bold text-rose-500">${p.losses}</span>
          </td>
          <td class="py-3.5 px-4 text-center">
            <div class="inline-flex flex-col items-center">
              <span class="font-extrabold text-sm text-slate-900">${p.winRateFormatted}%</span>
              <div class="w-16 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                <div class="bg-pickle-500 h-1.5 rounded-full" style="width: ${p.winRate}%"></div>
              </div>
            </div>
          </td>
          <td class="py-3.5 px-4 text-center hidden sm:table-cell text-xs font-semibold text-slate-600 score-pill">
            ${p.pointsWon} - ${p.pointsLost}
          </td>
          <td class="py-3.5 px-4 text-center hidden md:table-cell font-bold text-xs ${p.pointDiff > 0 ? 'text-emerald-600' : p.pointDiff < 0 ? 'text-rose-500' : 'text-slate-500'}">
            ${p.pointDiff > 0 ? '+' : ''}${p.pointDiff}
          </td>
          <td class="py-3.5 px-4 text-center hidden lg:table-cell">
            <div class="flex items-center justify-center space-x-1">
              ${formHtml}
            </div>
          </td>
          <td class="py-3.5 px-4 text-center">
            ${streakBadge}
          </td>
        </tr>
      `;
    }).join('');
  },

  /**
   * Khởi tạo Dropdown danh sách các Buổi chơi
   */
  initSessionSelect() {
    const select = document.getElementById('session-select');
    if (!select) return;

    const sessions = window.PICKLEBALL_DATA.sessions || [];
    select.innerHTML = sessions.map(s => {
      const isSelected = s.id === this.currentSessionId ? 'selected' : '';
      return `<option value="${s.id}" ${isSelected}>${s.name}</option>`;
    }).join('');
  },

  /**
   * Xử lý khi người dùng chọn một buổi khác
   */
  selectSession(sessionId) {
    this.currentSessionId = sessionId;
    this.renderSessionDetail();
  },

  /**
   * Tạo Avatar viết tắt và màu sắc pastel cho từng VĐV
   */
  getPlayerAvatar(name) {
    if (!name) return { initials: '?', bgClass: 'bg-stone-200 text-stone-700' };
    const trimmed = name.trim();
    let initials = '';

    // Khởi tạo chữ viết tắt tương ứng theo ảnh mẫu của CLB
    if (trimmed === 'Tùng nhỏ') initials = 'Tn';
    else if (trimmed === 'Luân') initials = 'L';
    else if (trimmed === 'Đạt') initials = 'Đ';
    else if (trimmed === 'Tuấn Anh') initials = 'TA';
    else if (trimmed === 'Khiêm') initials = 'K';
    else if (trimmed === 'Tuấn') initials = 'T';
    else if (trimmed === 'Tùng trọc') initials = 'Tt';
    else if (trimmed === 'HAnh') initials = 'HA';
    else if (trimmed === 'Tùng lớn') initials = 'TL';
    else if (trimmed === 'Cường') initials = 'C';
    else if (trimmed === 'Bình') initials = 'B';
    else {
      const parts = trimmed.split(/\s+/);
      if (parts.length === 1) initials = parts[0].charAt(0).toUpperCase();
      else initials = parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0);
    }

    // Bảng màu pastel nhẹ nhàng đồng bộ với ảnh
    const colorMap = {
      'Tùng nhỏ': 'bg-[#e2e8dd] text-[#3d5236]',
      'Luân': 'bg-[#fae5d9] text-[#9c4d21]',
      'Đạt': 'bg-[#e3e8ea] text-[#37525a]',
      'Tuấn Anh': 'bg-[#e4ebf5] text-[#294c74]',
      'Khiêm': 'bg-[#e1e9df] text-[#395636]',
      'Tuấn': 'bg-[#fae6dd] text-[#974e2d]',
      'Tùng trọc': 'bg-[#e4e7e2] text-[#42523f]',
      'HAnh': 'bg-[#e6e2f5] text-[#48378a]',
      'Tùng lớn': 'bg-[#fceadc] text-[#924b1f]',
      'Cường': 'bg-[#e2ecf2] text-[#27536d]',
      'Bình': 'bg-[#e7f0e4] text-[#2f6128]'
    };

    const bgClass = colorMap[trimmed] || 'bg-stone-200 text-stone-700';
    return { initials, bgClass };
  },

  /**
   * Mở hoặc chỉnh liên kết Google Sheets của CLB
   */
  openGoogleSheet() {
    const sessions = window.PICKLEBALL_DATA.sessions || [];
    const session = sessions.find(s => s.id === this.currentSessionId) || sessions[0];
    if (session && session.googleSheetUrl) {
      window.open(session.googleSheetUrl, '_blank');
      return;
    }
    const input = prompt(
      "Dán liên kết Google Sheets của CLB Pickleball Văn Quán:",
      "https://docs.google.com/spreadsheets/"
    );
    if (input && input.trim().startsWith("http")) {
      if (session) session.googleSheetUrl = input.trim();
      window.open(input.trim(), '_blank');
      this.showToast("Đã lưu liên kết Google Sheets cho buổi đấu này!");
    }
  },

  /**
   * Render Chi Tiết Buổi Chơi (2 Cột: Bảng chia tiền & Chi phí buổi chơi + Matches Grid)
   */
  renderSessionDetail() {
    const sessions = window.PICKLEBALL_DATA.sessions || [];
    const session = sessions.find(s => s.id === this.currentSessionId) || sessions[0];
    if (!session) return;

    const res = Calculator.calculateSessionFinancials(session);
    if (!res) return;

    const { playerRows, summary } = res;

    // Cập nhật tiêu đề & địa điểm (không lặp lại ngày tháng)
    const titleDisplay = document.getElementById('session-title-display');
    const infoDisplay = document.getElementById('session-info-display');
    if (titleDisplay) titleDisplay.textContent = session.name || "Chi Tiết Buổi Chơi";
    if (infoDisplay) infoDisplay.textContent = session.location || 'Sân Pickleball Văn Quán';

    // 1. CỘT PHẢI: Render Card "Chi phí buổi chơi" (Chính xác, từng dòng rõ ràng)
    const costCard = document.getElementById('session-cost-summary-card');
    if (costCard) {
      costCard.innerHTML = `
        <div>
          <h3 class="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Chi phí buổi chơi</h3>
          <p class="text-xs text-slate-400 font-medium mt-0.5">Theo bảng tính của buổi chơi</p>
        </div>

        <div class="space-y-2.5 pt-1 text-xs sm:text-sm">
          <div class="flex items-center justify-between">
            <span class="text-slate-500 font-normal">Tiền sân</span>
            <span class="font-bold text-slate-900">${Calculator.formatCurrency(summary.court)}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-500 font-normal">Tiền nước</span>
            <span class="font-bold text-slate-900">${Calculator.formatCurrency(summary.water)}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-500 font-normal">Tiền bóng</span>
            <span class="font-bold text-slate-900">${Calculator.formatCurrency(summary.balls)}</span>
          </div>

          <div class="pt-1.5 border-t border-slate-100"></div>

          <div class="flex items-center justify-between">
            <span class="text-slate-600 font-semibold">Tổng tiền</span>
            <span class="font-bold text-slate-900">${Calculator.formatCurrency(summary.totalPickExpense)}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-500 font-normal">Tổng tiền thua</span>
            <span class="font-bold text-slate-900">${Calculator.formatCurrency(summary.totalLossPenalty)}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-500 font-normal">Còn lại</span>
            <span class="font-bold text-slate-900">${Calculator.formatCurrency(summary.remainingPickExpense)}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-500 font-normal">Chia đều ${summary.totalPlayers} người</span>
            <span class="font-bold text-slate-900">${Calculator.formatCurrency(summary.pickPerPerson)}</span>
          </div>

          <div class="pt-1.5 border-t border-slate-100"></div>

          <!-- Tiền bia & Chia đều tiền bia -->
          <div class="space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="text-slate-500 font-normal">Tiền bia</span>
              <span class="font-bold text-slate-900">${Calculator.formatCurrency(summary.totalBeerExpense)}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-500 font-normal">Chia đều ${summary.beerCount} người</span>
              <span class="font-bold text-slate-900">${Calculator.formatCurrency(summary.beerPerPerson)}</span>
            </div>
          </div>
        </div>
      `;
    }

    // 2. CỘT TRÁI: Render Bảng chia tiền (Financial Split Table)
    const tbody = document.getElementById('session-finances-tbody');
    if (tbody) {
      tbody.innerHTML = playerRows.map(p => {
        return `
          <tr class="hover:bg-slate-50/70 transition group">
            <td class="py-3 px-3 sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] border-r border-slate-100 min-w-[125px] sm:min-w-[140px] whitespace-nowrap">
              <div class="flex items-center space-x-1.5 whitespace-nowrap">
                <span class="font-bold text-slate-900">${p.name}</span>
                ${p.isBeer ? '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200/60 whitespace-nowrap flex-shrink-0">🍻 Đi bia</span>' : ''}
              </div>
            </td>
            <td class="py-3 px-2 text-center text-slate-600 font-normal whitespace-nowrap">${p.matches}</td>
            <td class="py-3 px-2 text-center font-bold text-[#1f6838] whitespace-nowrap">${p.wins}</td>
            <td class="py-3 px-2 text-center text-slate-600 font-normal whitespace-nowrap">${p.losses}</td>
            <td class="py-3 px-3 text-right text-slate-600 font-normal text-xs sm:text-sm whitespace-nowrap">${Calculator.formatCurrency(p.lossPenalty)}</td>
            <td class="py-3 px-3 text-right text-slate-400 font-normal text-xs sm:text-sm whitespace-nowrap">${Calculator.formatCurrency(p.extraBet || 0)}</td>
            <td class="py-3 px-3 text-right text-slate-600 font-normal text-xs sm:text-sm whitespace-nowrap">${Calculator.formatCurrency(p.pickCost)}</td>
            <td class="py-3 px-3 text-right text-slate-600 font-normal text-xs sm:text-sm whitespace-nowrap">${p.isBeer ? Calculator.formatCurrency(p.beerCost) : '—'}</td>
            <td class="py-3 px-3 text-right bg-[#f7f8f3] font-bold text-[#143d25] text-xs sm:text-sm whitespace-nowrap">${Calculator.formatCurrency(p.totalFinal)}</td>
            <td class="py-3 px-2 text-center whitespace-nowrap">
              ${p.isPaid
                ? `<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                    ok
                  </span>`
                : `<span class="text-slate-300 text-xs font-medium">—</span>`
              }
            </td>
          </tr>
        `;
      }).join('');
    }

    // Footer Table Summary
    const tfoot = document.getElementById('session-finances-tfoot');
    if (tfoot) {
      tfoot.innerHTML = `
        <tr class="font-bold text-slate-800">
          <td class="py-3 px-3 sticky left-0 bg-slate-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] border-r border-slate-200 min-w-[125px] sm:min-w-[140px] text-slate-900 whitespace-nowrap">Tổng cộng</td>
          <td class="py-3 px-2 text-center whitespace-nowrap">${summary.totalMatches * 4}</td>
          <td class="py-3 px-2 text-center text-[#1f6838] whitespace-nowrap">${summary.totalMatches * 2}</td>
          <td class="py-3 px-2 text-center whitespace-nowrap">${summary.totalMatches * 2}</td>
          <td class="py-3 px-3 text-right whitespace-nowrap">${Calculator.formatCurrency(summary.totalLossPenalty)}</td>
          <td class="py-3 px-3 text-right text-slate-400 whitespace-nowrap">0đ</td>
          <td class="py-3 px-3 text-right whitespace-nowrap">${Calculator.formatCurrency(summary.totalPickExpense)}</td>
          <td class="py-3 px-3 text-right whitespace-nowrap">${Calculator.formatCurrency(summary.totalBeerExpense)}</td>
          <td class="py-3 px-3 text-right bg-[#f1f3ec] text-[#143d25] font-black whitespace-nowrap">${Calculator.formatCurrency(summary.totalAllExpenses)}</td>
          <td class="py-3 px-2 text-center text-xs text-emerald-700 font-bold whitespace-nowrap">${summary.totalPaidCount}/${summary.totalPlayers}</td>
        </tr>
      `;
    }

    // 3. Render Match Results Grid
    this.renderMatchesGrid(session.matches);

    // Cập nhật dropdown filter người chơi trong trận đấu
    const matchFilter = document.getElementById('match-player-filter');
    if (matchFilter) {
      matchFilter.innerHTML = `<option value="">Tất cả VĐV (${playerRows.length} người)</option>` +
        playerRows.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
    }

    if (window.lucide) {
      lucide.createIcons();
    }
  },

  /**
   * Render Match Results Grid
   */
  renderMatchesGrid(matches, filterPlayer = '') {
    const grid = document.getElementById('matches-grid');
    if (!grid) return;

    let filtered = matches || [];
    if (filterPlayer) {
      filtered = filtered.filter(m => 
        (m.team1 || []).includes(filterPlayer) || (m.team2 || []).includes(filterPlayer)
      );
    }

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="col-span-2 text-center py-8 text-slate-400 text-sm">Không có trận đấu nào</div>`;
      return;
    }

    grid.innerHTML = filtered.map(m => {
      const isT1Win = m.score1 > m.score2;
      const t1Names = (m.team1 || []).join(' & ');
      const t2Names = (m.team2 || []).join(' & ');

      return `
        <div class="bg-slate-50 border border-slate-200/90 rounded-xl p-3 hover:border-slate-300 transition space-y-2">
          <div class="flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span>Trận #${m.id}</span>
            <span class="text-xs ${isT1Win ? 'text-emerald-700' : 'text-slate-600'}">
              ${isT1Win ? `🏆 ${t1Names} thắng` : `🏆 ${t2Names} thắng`}
            </span>
          </div>

          <!-- Team 1 Row -->
          <div class="flex items-center justify-between p-2 rounded-lg ${isT1Win ? 'bg-emerald-100/60 border border-emerald-300/60 font-bold text-emerald-950' : 'bg-white text-slate-700 border border-slate-200/60'}">
            <div class="flex items-center space-x-2">
              <span class="text-xs ${isT1Win ? 'text-emerald-700' : 'text-slate-400'}">${isT1Win ? '🥇' : '•'}</span>
              <span class="text-xs sm:text-sm truncate">${t1Names}</span>
            </div>
            <span class="text-sm sm:text-base font-extrabold ${isT1Win ? 'text-emerald-800' : 'text-slate-500'}">${m.score1}</span>
          </div>

          <!-- Team 2 Row -->
          <div class="flex items-center justify-between p-2 rounded-lg ${!isT1Win ? 'bg-emerald-100/60 border border-emerald-300/60 font-bold text-emerald-950' : 'bg-white text-slate-700 border border-slate-200/60'}">
            <div class="flex items-center space-x-2">
              <span class="text-xs ${!isT1Win ? 'text-emerald-700' : 'text-slate-400'}">${!isT1Win ? '🥇' : '•'}</span>
              <span class="text-xs sm:text-sm truncate">${t2Names}</span>
            </div>
            <span class="text-sm sm:text-base font-extrabold ${!isT1Win ? 'text-emerald-800' : 'text-slate-500'}">${m.score2}</span>
          </div>
        </div>
      `;
    }).join('');
  },

  /**
   * Lọc trận đấu theo tên VĐV
   */
  filterMatchesByPlayer(playerName) {
    const sessions = window.PICKLEBALL_DATA.sessions || [];
    const session = sessions.find(s => s.id === this.currentSessionId) || sessions[0];
    if (session) {
      this.renderMatchesGrid(session.matches, playerName);
    }
  },

  /**
   * Render Tab Cặp Đôi Ăn Ý
   */
  renderPairs() {
    const tbody = document.getElementById('pairs-tbody');
    if (!tbody) return;

    const sessions = window.PICKLEBALL_DATA.sessions || [];
    const stats = Calculator.calculateLeaderboard(sessions, { type: 'all' });
    const pairs = stats.pairs || [];

    if (pairs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-400 text-sm">Chưa có dữ liệu cặp đôi</td></tr>`;
      return;
    }

    tbody.innerHTML = pairs.map((pair, idx) => {
      let ratingBadge = `<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">Đang cọ xát</span>`;
      if (pair.winRate >= 80) {
        ratingBadge = `<span class="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">🔥 Song sát hủy diệt</span>`;
      } else if (pair.winRate >= 60) {
        ratingBadge = `<span class="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">✨ Cặp đôi ăn ý</span>`;
      } else if (pair.winRate <= 30) {
        ratingBadge = `<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">❄️ Cần thêm thời gian</span>`;
      }

      return `
        <tr class="hover:bg-slate-50 transition">
          <td class="py-3.5 px-4 text-center font-bold text-slate-500">#${idx + 1}</td>
          <td class="py-3.5 px-4 font-bold text-slate-900 flex items-center space-x-2">
            <span class="text-pickle-600">🎾</span>
            <span>${pair.name}</span>
          </td>
          <td class="py-3.5 px-4 text-center font-bold text-slate-800">${pair.matches}</td>
          <td class="py-3.5 px-4 text-center">
            <span class="text-emerald-600 font-bold">${pair.wins}</span> - <span class="text-rose-500 font-bold">${pair.losses}</span>
          </td>
          <td class="py-3.5 px-4 text-center">
            <div class="inline-flex flex-col items-center">
              <span class="font-extrabold text-sm text-slate-900">${pair.winRateFormatted}%</span>
              <div class="w-16 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                <div class="bg-indigo-500 h-1.5 rounded-full" style="width: ${pair.winRate}%"></div>
              </div>
            </div>
          </td>
          <td class="py-3.5 px-4 text-center">${ratingBadge}</td>
        </tr>
      `;
    }).join('');
  },

  /**
   * Sao chép bảng tổng kết chi phí để dán thẳng vào Zalo
   */
  copyZaloSummary() {
    const sessions = window.PICKLEBALL_DATA.sessions || [];
    const session = sessions.find(s => s.id === this.currentSessionId) || sessions[0];
    if (!session) return;

    const res = Calculator.calculateSessionFinancials(session);
    if (!res) return;

    const { playerRows, summary } = res;

    let text = `🎾 PICKLEBALL VĂN QUÁN - TỔNG HỢP CHI PHÍ\n`;
    text += `📅 ${session.name} (${session.date})\n`;
    text += `--------------------------------------\n`;
    text += `🏟️ Sân + Nước + Bóng: ${Calculator.formatCurrency(summary.totalPickExpense)}\n`;
    text += `🍻 Tiền Bia (${summary.beerCount} người): ${Calculator.formatCurrency(summary.totalBeerExpense)}\n`;
    text += `💰 Phạt thua (10k/trận): ${Calculator.formatCurrency(summary.totalLossPenalty)}\n`;
    text += `👉 Pick còn lại chia đều: ${Calculator.formatCurrency(summary.pickPerPerson)}/người\n`;
    text += `👉 Bia chia đều: ${Calculator.formatCurrency(summary.beerPerPerson)}/người\n`;
    text += `--------------------------------------\n`;
    text += `📋 DANH SÁCH THANH TOÁN TỪNG ANH EM:\n\n`;

    playerRows.forEach((p, idx) => {
      const beerText = p.isBeer ? ` + Bia: ${Calculator.formatCurrency(p.beerCost)}` : '';
      const paidStatus = p.isPaid ? ' (✓ Đã thanh toán)' : '';
      text += `${idx + 1}. ${p.name} (${p.matches} trận, ${p.wins}T-${p.losses}B): ${Calculator.formatCurrency(p.totalFinal)} [Pick: ${Calculator.formatCurrency(p.pickCost)}${beerText}]${paidStatus}\n`;
    });

    text += `\n💵 TỔNG CỘNG CẢ BUỔI: ${Calculator.formatCurrency(summary.totalAllExpenses)}\n`;
    text += `(Anh em chủ động kiểm tra và chuyển khoản nhé ạ! 🙏)`;

    navigator.clipboard.writeText(text).then(() => {
      this.showToast("Đã sao chép bảng tiền để gửi vào Zalo!");
    }).catch(err => {
      console.error("Lỗi sao chép clipboard:", err);
      alert("Không thể tự động sao chép, vui lòng thử lại.");
    });
  },

  /**
   * Sao chép đoạn văn bản bất kỳ vào clipboard (ví dụ: Số tài khoản)
   */
  copyText(text, message = "Đã sao chép!") {
    if (!navigator.clipboard) {
      prompt("Sao chép:", text);
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      this.showToast(message);
    }).catch(() => {
      prompt("Sao chép:", text);
    });
  },

  /**
   * Hiển thị thông báo Toast
   */
  showToast(message) {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toast-message');
    if (!toast || !msgEl) return;

    msgEl.textContent = message;
    toast.classList.remove('translate-y-24', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-24', 'opacity-0');
    }, 3000);
  }
};

// Khởi chạy khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
