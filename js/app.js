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

    // 1. Đọc nhanh dữ liệu đã lưu trong bộ nhớ máy (0ms, không cần chờ mạng)
    this.restoreFromCache();

    // Chọn buổi mới nhất làm mặc định
    const sessions = window.PICKLEBALL_DATA.sessions || [];
    if (sessions.length > 0) {
      this.currentSessionId = sessions[sessions.length - 1].id;
    }

    this.initSessionSelect();
    this.renderLeaderboard();
    this.renderSessionDetail();
    this.renderPairs();
    this.renderBeerLeaderboard();

    // Mặc định hiển thị tab Chi Tiết Buổi Chơi
    this.switchTab('sessions');

    // Lắng nghe đóng Modal thanh toán khi bấm ra ngoài hoặc phím ESC
    document.addEventListener('click', (e) => {
      const modal = document.getElementById('payment-modal');
      if (modal && e.target === modal) {
        this.closePaymentModal();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closePaymentModal();
      }
    });

    if (window.lucide) {
      lucide.createIcons();
    }

    // 2. Tự động kiểm tra Google Sheet ngay khi tải xong
    this.syncLiveFromGoogleSheet(false);

    // 3. Tự động kiểm tra Google Sheet khi người dùng chuyển lại tab này
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.syncLiveFromGoogleSheet(false);
      }
    });
    window.addEventListener('focus', () => {
      this.syncLiveFromGoogleSheet(false);
    });
  },

  /**
   * Chuyển đổi tab điều hướng
   */
  switchTab(tabName) {
    this.activeTab = tabName;

    // Ẩn tất cả các section
    ['leaderboard', 'sessions', 'pairs', 'beer'].forEach(tab => {
      const section = document.getElementById(`section-${tab}`);
      if (section) section.classList.add('hidden');
    });

    // Hiện section được chọn
    const activeSection = document.getElementById(`section-${tabName}`);
    if (activeSection) activeSection.classList.remove('hidden');

    if (tabName === 'beer') {
      this.renderBeerLeaderboard();
    }

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
      btn.className = `mobile-tab-btn flex flex-col items-center py-1 px-2 text-xs font-semibold ${isTarget ? 'text-pickle-400 font-bold' : 'text-slate-400'}`;
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
    // Hiển thị buổi mới nhất lên đầu danh sách chọn
    const reversed = [...sessions].reverse();
    select.innerHTML = reversed.map(s => {
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
    this.syncLiveFromGoogleSheet(false);
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
                : `<button onclick="App.openPaymentModal('${encodeURIComponent(p.name)}', ${Math.round(p.totalFinal)})" class="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition shadow-2xs cursor-pointer whitespace-nowrap" title="Bấm để thanh toán ${Calculator.formatCurrency(p.totalFinal)}">
                    <i data-lucide="qr-code" class="w-3 h-3"></i>
                    <span>Thanh toán</span>
                  </button>`
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
      const winnerName = isT1Win ? t1Names : t2Names;

      const videoButton = m.videoUrl ? `
        <a href="${m.videoUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 active:scale-95 text-white shadow-2xs transition group/btn shrink-0 cursor-pointer" title="Xem video trận đấu trên YouTube (Mở tab mới)">
          <svg class="w-3.5 h-3.5 fill-current text-white shrink-0" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
          <span>Xem video</span>
          <svg class="w-3 h-3 stroke-current fill-none opacity-80 group-hover/btn:opacity-100 transition shrink-0" viewBox="0 0 24 24" stroke-width="2.5">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </a>
      ` : (m.note ? `<span class="text-slate-400 italic text-[11px] shrink-0">${m.note}</span>` : '');

      return `
        <div class="bg-slate-50 border border-slate-200/90 rounded-xl p-3 hover:border-slate-300 transition space-y-2">
          <!-- Top Row: Trận # + Đội thắng bên trái; Nút Xem video bên phải -->
          <div class="flex items-center justify-between gap-2 text-[11px] font-bold">
            <div class="flex items-center space-x-1.5 min-w-0">
              <span class="text-slate-400 shrink-0">Trận #${m.id}</span>
              <span class="text-slate-300 shrink-0">•</span>
              <span class="text-xs ${isT1Win ? 'text-emerald-700' : 'text-slate-600'} font-bold truncate">
                🏆 ${winnerName} thắng
              </span>
            </div>
            ${videoButton}
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
   * Render Tab Thống Kê Vua Bia
   */
  renderBeerLeaderboard() {
    const tbody = document.getElementById('beer-tbody');
    if (!tbody) return;

    const sessions = window.PICKLEBALL_DATA.sessions || [];
    const stats = Calculator.calculateBeerLeaderboard(sessions, { type: 'all' });
    this.beerPlayers = stats.players || [];
    const summary = stats.summary || {};

    // Cập nhật 4 thẻ thống kê
    const elTopName = document.getElementById('beer-stat-top-name');
    const elTopDesc = document.getElementById('beer-stat-top-desc');
    const elTotalExp = document.getElementById('beer-stat-total-expense');
    const elSessionsCount = document.getElementById('beer-stat-sessions-count');
    const elAttendances = document.getElementById('beer-stat-total-attendances');
    const elAvgSession = document.getElementById('beer-stat-avg-session');

    if (elTopName) {
      if (summary.topDrinker && summary.topDrinker.beerCount > 0) {
        elTopName.textContent = summary.topDrinker.name;
        if (elTopDesc) {
          elTopDesc.textContent = `${summary.topDrinker.beerCount} buổi (${Calculator.formatCurrency(summary.topDrinker.totalBeerCost)})`;
        }
      } else {
        elTopName.textContent = "Chưa có";
        if (elTopDesc) elTopDesc.textContent = "Chưa có dữ liệu";
      }
    }

    if (elTotalExp) elTotalExp.textContent = Calculator.formatCurrency(summary.totalClubBeerExpense || 0);
    if (elSessionsCount) elSessionsCount.textContent = `${summary.sessionsWithBeer || 0} buổi có tăng 2`;
    if (elAttendances) elAttendances.textContent = `${summary.totalBeerAttendances || 0} lượt`;
    if (elAvgSession) elAvgSession.textContent = Calculator.formatCurrency(summary.avgPerSession || 0);

    // Render bảng người chơi
    this.renderBeerTableRows(this.beerPlayers);
  },

  /**
   * Render danh sách các dòng người chơi trong bảng Vua Bia
   */
  renderBeerTableRows(players) {
    const tbody = document.getElementById('beer-tbody');
    if (!tbody) return;

    if (!players || players.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-10 text-slate-400 text-sm">Chưa có dữ liệu đi bia</td></tr>`;
      return;
    }

    tbody.innerHTML = players.map(p => {
      // Huy hiệu thứ hạng
      let rankBadge = `<span class="font-bold text-slate-500">#${p.rank}</span>`;
      let rowHighlight = "hover:bg-slate-50";

      if (p.rank === 1 && p.beerCount > 0) {
        rankBadge = `<span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-sm shadow-xs ring-2 ring-amber-300/60" title="Vua Bia">🥇</span>`;
        rowHighlight = "bg-amber-50/40 hover:bg-amber-50/70";
      } else if (p.rank === 2 && p.beerCount > 0) {
        rankBadge = `<span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-800 font-black text-sm shadow-xs" title="Á Quân Bia">🥈</span>`;
      } else if (p.rank === 3 && p.beerCount > 0) {
        rankBadge = `<span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-white font-black text-sm shadow-xs" title="Hạng 3 Bia">🥉</span>`;
      }

      // Danh hiệu phong cách
      let badgeTitle = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500">🧃 Đội Nước Suối</span>`;
      if (p.rank === 1 && p.beerCount > 0) {
        badgeTitle = `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-2xs">👑 Vua Bia CLB</span>`;
      } else if (p.rank === 2 && p.beerCount > 0) {
        badgeTitle = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-800">🥈 Á Quân Bia</span>`;
      } else if (p.rank === 3 && p.beerCount > 0) {
        badgeTitle = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">🥉 Cao Thủ Bàn Nhậu</span>`;
      } else if (p.beerCount > 0) {
        if (p.attendanceRate >= 100) {
          badgeTitle = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">🍻 100% Có Mặt</span>`;
        } else {
          badgeTitle = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/80">🍺 Dân Chơi Tăng 2</span>`;
        }
      }

      return `
        <tr class="${rowHighlight} transition group">
          <td class="py-3.5 px-3 text-center whitespace-nowrap">${rankBadge}</td>
          <td class="py-3.5 px-4 sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] border-r border-slate-100 whitespace-nowrap min-w-[140px]">
            <div class="flex items-center space-x-2">
              <span class="font-extrabold text-slate-900 ${p.rank === 1 && p.beerCount > 0 ? 'text-amber-900' : ''}">${p.name}</span>
              ${p.rank === 1 && p.beerCount > 0 ? '<span class="text-xs">👑</span>' : ''}
            </div>
          </td>
          <td class="py-3.5 px-4 text-center whitespace-nowrap">
            ${p.beerCount > 0 
              ? `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                  🍻 ${p.beerCount} buổi
                 </span>`
              : `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs text-slate-400 bg-slate-100 font-normal">
                  0 buổi
                 </span>`
            }
          </td>
          <td class="py-3.5 px-4 text-right whitespace-nowrap">
            <span class="font-mono font-bold text-xs sm:text-sm ${p.totalBeerCost > 0 ? 'text-amber-900' : 'text-slate-400'}">
              ${Calculator.formatCurrency(p.totalBeerCost)}
            </span>
          </td>
          <td class="py-3.5 px-4 text-right whitespace-nowrap hidden sm:table-cell">
            <span class="font-mono text-xs sm:text-sm ${p.avgCost > 0 ? 'text-slate-600' : 'text-slate-400'}">
              ${p.avgCost > 0 ? Calculator.formatCurrency(p.avgCost) : '—'}
            </span>
          </td>
          <td class="py-3.5 px-4 text-center whitespace-nowrap hidden md:table-cell">
            <div class="inline-flex flex-col items-center">
              <span class="text-xs font-bold text-slate-700">${p.attendanceRate}%</span>
              <div class="w-16 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                <div class="bg-amber-500 h-1.5 rounded-full" style="width: ${Math.min(p.attendanceRate, 100)}%"></div>
              </div>
            </div>
          </td>
          <td class="py-3.5 px-4 text-center whitespace-nowrap">${badgeTitle}</td>
        </tr>
      `;
    }).join('');

    if (window.lucide) {
      lucide.createIcons();
    }
  },

  /**
   * Lọc danh sách người chơi trong bảng Vua Bia theo tên
   */
  filterBeerTable(query) {
    if (!this.beerPlayers) return;
    const cleanQuery = (query || '').toLowerCase().trim();
    if (!cleanQuery) {
      this.renderBeerTableRows(this.beerPlayers);
      return;
    }

    const filtered = this.beerPlayers.filter(p => 
      p.name.toLowerCase().includes(cleanQuery)
    );
    this.renderBeerTableRows(filtered);
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
  },

  /**
   * Khôi phục dữ liệu từ bộ nhớ cache trình duyệt (localStorage) để nạp tức thì trong 0ms
   */
  restoreFromCache() {
    try {
      const sessions = window.PICKLEBALL_DATA.sessions || [];
      sessions.forEach(s => {
        const cachedCSV = localStorage.getItem(`PICKLEBALL_CACHE_CSV_${s.id}`) || (s.id === 'session-2026-11-01' ? localStorage.getItem('PICKLEBALL_CACHE_CSV') : null);
        if (cachedCSV && cachedCSV.length > 50) {
          this.applyGoogleSheetCSV(cachedCSV, s.id);
        }
      });
    } catch (e) {
      console.warn("Không thể đọc cache trình duyệt:", e);
    }
  },

  /**
   * Đồng bộ dữ liệu trực tiếp từ Google Sheets (chạy ngầm tức thì, không bị khóa cache 10 phút)
   * @param {boolean} forceRefresh - Bắt buộc tải lại bản mới bỏ qua cache
   */
  async syncLiveFromGoogleSheet(forceRefresh = false) {
    const sheetId = window.PICKLEBALL_DATA ? window.PICKLEBALL_DATA.googleSheetId : null;
    if (!sheetId) return;

    const sessions = window.PICKLEBALL_DATA.sessions || [];
    const statusText = document.getElementById('sync-status-text');
    const refreshIcon = document.getElementById('sync-refresh-icon');

    const sessionsToSync = sessions.filter(s => !!s.sheetGid);
    if (sessionsToSync.length === 0) return;

    // Hiệu ứng đang tải xoay tròn
    if (refreshIcon) refreshIcon.classList.add('animate-spin');
    if (statusText) statusText.textContent = "Đang đồng bộ...";

    let anyUpdated = false;
    const now = Date.now();

    await Promise.all(sessionsToSync.map(async (s) => {
      const sId = s.id;
      const CACHE_KEY_CSV = `PICKLEBALL_CACHE_CSV_${sId}`;
      const CACHE_KEY_TIME = `PICKLEBALL_CACHE_TIME_${sId}`;
      const cachedCSV = localStorage.getItem(CACHE_KEY_CSV);
      const gidParam = s.sheetGid ? `&gid=${s.sheetGid}` : '';
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidParam}&t=${now}`;

      try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) return;
        const csvText = await response.text();
        if (!csvText || csvText.length < 50) return;

        const isChanged = (csvText !== cachedCSV);
        localStorage.setItem(CACHE_KEY_CSV, csvText);
        localStorage.setItem(CACHE_KEY_TIME, String(now));

        if (isChanged || forceRefresh) {
          const updated = this.applyGoogleSheetCSV(csvText, sId);
          if (updated) anyUpdated = true;
        }
      } catch (err) {
        console.warn(`Lỗi đồng bộ ${sId}:`, err);
      }
    }));

    if (anyUpdated) {
      this.renderLeaderboard();
      this.renderSessionDetail();
      this.renderPairs();
      this.renderBeerLeaderboard();
      if (forceRefresh) {
        this.showToast("✓ Đã cập nhật dữ liệu mới nhất từ Google Sheet!");
      }
    }

    if (statusText) statusText.textContent = "Đã đồng bộ ✓";
    if (refreshIcon) refreshIcon.classList.remove('animate-spin');

    setTimeout(() => {
      if (statusText && statusText.textContent === "Đã đồng bộ ✓") {
        statusText.textContent = "Đồng bộ Sheet";
      }
    }, 2500);
  },

  /**
   * Nút bấm chủ động làm mới dữ liệu từ Google Sheet
   */
  forceRefreshFromSheet() {
    this.syncLiveFromGoogleSheet(true);
  },

  /**
   * Phân tích nội dung CSV từ Google Sheet và cập nhật vào dữ liệu buổi chơi
   */
  applyGoogleSheetCSV(csvText, targetSessionId = null) {
    const lines = csvText.split(/\r?\n/).map(l => this.parseCSVLine(l));
    if (lines.length < 5) return false;

    let court = null;
    let water = null;
    let balls = null;
    let beer = null;

    const matches = [];
    const paidMembers = [];
    const beerParticipants = [];
    const playerNames = [];

    let playerHeaderRowIdx = -1;
    let matchHeaderRowIdx = -1;
    let colNameIdx = -1;
    let colBeerIdx = -1;
    let colPaidIdx = -1;
    let colYoutubeIdx = -1;

    for (let r = 0; r < lines.length; r++) {
      const row = lines[r];

      // Tìm thông tin chi phí
      for (let c = 0; c < row.length; c++) {
        const cell = (row[c] || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        if (cell === 'san' && row[c + 1]) court = this.parseMoney(row[c + 1]);
        if (cell === 'nuoc' && row[c + 1]) water = this.parseMoney(row[c + 1]);
        if (cell === 'bong' && row[c + 1]) balls = this.parseMoney(row[c + 1]);
        if (cell === 'bia' && row[c + 1]) beer = this.parseMoney(row[c + 1]);
      }

      // Tìm dòng tiêu đề bảng trận đấu: STT, Team 1, Team 2, Kết Quả, Note, Link youtube...
      if (matchHeaderRowIdx === -1) {
        for (let c = 0; c < row.length; c++) {
          const cellH = (row[c] || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
          if (cellH === 'stt' || cellH.includes('team 1') || cellH.includes('doi 1')) {
            matchHeaderRowIdx = r;
            for (let k = 0; k < row.length; k++) {
              const kH = (row[k] || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
              if (kH.includes('youtube') || kH.includes('video') || (kH.includes('link') && !kH.includes('sheet'))) {
                colYoutubeIdx = k;
              }
            }
            break;
          }
        }
      }

      // Tìm dòng tiêu đề bảng người chơi: Tên, Số trận... Đã thanh toán
      if (playerHeaderRowIdx === -1) {
        for (let c = 0; c < row.length; c++) {
          const rawHeader = (row[c] || '').trim();
          const cleanH = rawHeader.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          if (cleanH === 'ten' || cleanH === 'name' || cleanH.includes('vdv')) {
            playerHeaderRowIdx = r;
            colNameIdx = c;
            for (let k = c; k < row.length; k++) {
              const hClean = (row[k] || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
              if (hClean.includes('bia')) colBeerIdx = k;
              if (hClean.includes('thanh toan') || hClean.includes('tt') || hClean.includes('paid')) colPaidIdx = k;
            }
            break;
          }
        }
      }

      // Đọc các trận đấu (STT 1 -> 50)
      const stt = parseInt(row[0], 10);
      if (!isNaN(stt) && stt >= 1 && stt <= 50 && row[1] && row[2] && row[3]) {
        const team1 = row[1].split('&').map(n => n.trim()).filter(Boolean);
        const team2 = row[2].split('&').map(n => n.trim()).filter(Boolean);
        const scoreParts = row[3].split('-').map(s => parseInt(s.trim(), 10));
        if (scoreParts.length === 2 && !isNaN(scoreParts[0]) && !isNaN(scoreParts[1])) {
          // Lấy link video YouTube
          let videoUrl = '';
          if (colYoutubeIdx !== -1 && row[colYoutubeIdx]) {
            videoUrl = (row[colYoutubeIdx] || '').trim();
          }

          // Quét thêm các cột từ cột 4 trở đi nếu chưa thấy ở colYoutubeIdx
          if (!videoUrl) {
            for (let k = 4; k < row.length; k++) {
              const val = (row[k] || '').trim();
              if (val.startsWith('http://') || val.startsWith('https://') || val.includes('youtube.com') || val.includes('youtu.be')) {
                videoUrl = val;
                break;
              }
            }
          }

          // Xử lý nếu link là công thức =HYPERLINK("https://...", "...")
          if (videoUrl.startsWith('=')) {
            const match = videoUrl.match(/"(https?:\/\/[^"]+)"/i);
            if (match) videoUrl = match[1];
          }

          // Tự động thêm https:// nếu thiếu giao thức
          if (videoUrl && !videoUrl.startsWith('http://') && !videoUrl.startsWith('https://')) {
            if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
              videoUrl = 'https://' + videoUrl;
            }
          }

          const hasValidVideo = Boolean(videoUrl && (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')));

          // Note trận đấu (lấy từ cột 4 nếu không phải link video)
          let note = '';
          if (row[4]) {
            const rawNote = row[4].trim();
            if (!rawNote.startsWith('http') && !rawNote.includes('youtu.be') && !rawNote.includes('youtube.com') && colYoutubeIdx !== 4) {
              note = rawNote;
            }
          }

          matches.push({
            id: stt,
            team1,
            team2,
            score1: scoreParts[0],
            score2: scoreParts[1],
            note,
            videoUrl: hasValidVideo ? videoUrl : ''
          });
        }
      }
    }

    // Đọc danh sách người chơi từ sau dòng tiêu đề
    if (playerHeaderRowIdx !== -1 && colNameIdx !== -1) {
      for (let r = playerHeaderRowIdx + 1; r < lines.length; r++) {
        const row = lines[r];
        const name = (row[colNameIdx] || '').trim();
        const cleanName = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        if (!name || cleanName.includes('tong') || cleanName.includes('con') || cleanName.includes('so nguoi')) break;
        playerNames.push(name);

        // Đi bia
        if (colBeerIdx !== -1 && row[colBeerIdx]) {
          const beerVal = parseFloat(row[colBeerIdx].replace(/,/g, '').trim());
          if (!isNaN(beerVal) && beerVal > 0) {
            beerParticipants.push(name);
          }
        }

        // Đã thanh toán
        if (colPaidIdx !== -1 && row[colPaidIdx]) {
          const cleanPaid = (row[colPaidIdx] || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
          if (cleanPaid === 'ok' || cleanPaid.includes('roi') || cleanPaid.includes('xong') || cleanPaid === 'x' || cleanPaid === 'v' || cleanPaid === 'yes') {
            paidMembers.push(name);
          }
        }
      }
    }

    // Nhận diện session tương ứng để cập nhật
    const sessions = window.PICKLEBALL_DATA.sessions || [];
    let session = null;

    if (targetSessionId) {
      session = sessions.find(s => s.id === targetSessionId);
    }

    if (!session) {
      const hasWeek2Players = playerNames.some(n => ['Tín', 'Vững', 'Đức', 'Hưng'].includes(n));
      const hasWeek1Players = playerNames.some(n => ['Đạt', 'Luân', 'Khiêm', 'HAnh'].includes(n));

      if (hasWeek2Players) {
        session = sessions.find(s => s.id === 'session-2026-11-08');
      } else if (hasWeek1Players) {
        session = sessions.find(s => s.id === 'session-2026-11-01');
      }
    }

    if (!session) {
      session = sessions.find(s => s.id === this.currentSessionId) || sessions[0];
    }
    if (!session) return false;

    if (matches.length > 0) session.matches = matches;
    session.expenses = {
      court: court !== null ? court : (session.expenses?.court || 0),
      water: water !== null ? water : (session.expenses?.water || 0),
      balls: balls !== null ? balls : (session.expenses?.balls || 0),
      beer: beer !== null ? beer : (session.expenses?.beer || 0)
    };
    session.beerParticipants = beerParticipants;
    session.paidMembers = paidMembers;

    return true;
  },

  /**
   * Helper parse chuỗi tiền từ Sheet
   */
  parseMoney(val) {
    if (!val) return 0;
    const clean = val.replace(/,/g, '').replace(/[^\d.]/g, '').trim();
    const num = parseFloat(clean);
    if (isNaN(num)) return 0;
    return num < 10000 ? num * 1000 : num;
  },

  /**
   * Tách dòng CSV có chứa dấu phẩy trong ngoặc kép
   */
  parseCSVLine(line) {
    const values = [];
    let current = '';
    let insideQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  },

  // ==========================================
  // CHỨC NĂNG THANH TOÁN (VIETQR & DEEPLINK NGÂN HÀNG)
  // ==========================================

  currentPaymentData: null,
  currentQRBlob: null,

  /**
   * Chuyển đổi chuỗi tiếng Việt có dấu thành không dấu để tương thích với nội dung chuyển khoản ngân hàng
   */
  removeVietnameseTones(str) {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .trim();
  },

  /**
   * Tạo đường dẫn ảnh QR từ thông tin hiện tại
   */
  getQRImageUrl() {
    if (!this.currentPaymentData) return '';
    const { amount, note } = this.currentPaymentData;
    return `https://img.vietqr.io/image/970436-0451000202671-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(note)}&accountName=CAN%20TUAN%20ANH`;
  },

  /**
   * Tạo đường dẫn proxy có hỗ trợ CORS để lấy dữ liệu ảnh sang Blob
   */
  getQRProxyUrl() {
    const rawUrl = this.getQRImageUrl();
    if (!rawUrl) return '';
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      return `/api/vietqr?url=${encodeURIComponent(rawUrl)}`;
    }
    return rawUrl;
  },

  /**
   * Mở Popup thanh toán thông minh cho từng người chơi
   */
  openPaymentModal(encodedPlayerName, amount) {
    const playerName = decodeURIComponent(encodedPlayerName);
    const cleanAsciiName = this.removeVietnameseTones(playerName).toUpperCase();
    const note = `${cleanAsciiName} PICKLEBALL`;

    this.currentPaymentData = {
      name: playerName,
      amount: amount,
      note: note
    };

    // Điền thông tin vào Popup
    const nameEl = document.getElementById('pay-modal-player-name');
    if (nameEl) nameEl.textContent = playerName;

    const amountEl = document.getElementById('pay-modal-amount');
    if (amountEl) amountEl.textContent = Calculator.formatCurrency(amount);

    const copyAmountEl = document.getElementById('pay-copy-amount');
    if (copyAmountEl) copyAmountEl.textContent = Calculator.formatCurrency(amount);

    const noteEl = document.getElementById('pay-modal-note');
    if (noteEl) noteEl.textContent = note;

    const copyNoteEl = document.getElementById('pay-copy-note');
    if (copyNoteEl) copyNoteEl.textContent = note;

    // Hiển thị ảnh QR trực tiếp từ link gốc
    const qrImg = document.getElementById('pay-dynamic-qr-img');
    const qrUrl = this.getQRImageUrl();
    if (qrImg) {
      qrImg.src = qrUrl;
    }

    // TẢI TRƯỚC BLOB ẢNH QR QUA PROXY ĐỂ SAO CHÉP NGAY TỨC THÌ (0ms)
    this.currentQRBlob = null;
    const proxyUrl = this.getQRProxyUrl();
    if (proxyUrl) {
      fetch(proxyUrl)
        .then(r => r.ok ? r.blob() : null)
        .then(blob => {
          if (blob) {
            this.currentQRBlob = blob.type === 'image/png' ? blob : new Blob([blob], { type: 'image/png' });
          }
        })
        .catch(err => {
          console.warn("Không thể tải trước blob ảnh QR:", err);
        });
    }

    // Render danh sách app ngân hàng nếu chưa có
    this.renderBankList();

    // Mở Modal
    const modal = document.getElementById('payment-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    if (window.lucide) lucide.createIcons();
  },

  /**
   * Đóng Popup thanh toán
   */
  closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  /**
   * Tải ảnh mã QR động về điện thoại/máy tính để quét từ thư viện ảnh
   */
  async downloadQRCode() {
    if (!this.currentPaymentData) return;
    const { amount, name } = this.currentPaymentData;
    const cleanName = this.removeVietnameseTones(name).replace(/\s+/g, '');
    const filename = `VietQR_${cleanName}_${amount}d.png`;

    try {
      this.showToast("Đang tải ảnh mã QR...");
      let blob = this.currentQRBlob;
      if (!blob) {
        const proxyUrl = this.getQRProxyUrl();
        const res = await fetch(proxyUrl);
        blob = await res.blob();
      }

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      this.showToast("✓ Đã tải ảnh QR! Mở app ngân hàng ➔ Quét QR ➔ Chọn ảnh từ Thư viện.");
    } catch (e) {
      window.open(this.getQRImageUrl(), '_blank');
      this.showToast("Đã mở ảnh QR. Bạn nhấn giữ ảnh để Lưu vào Thư viện!");
    }
  },

  /**
   * Render danh sách các ứng dụng ngân hàng phổ biến tại Việt Nam
   */
  renderBankList() {
    const container = document.getElementById('pay-banks-grid');
    if (!container || container.children.length > 0) return;

    const banks = [
      { id: 'vcb', code: 'VCB', name: 'Vietcombank', short: 'VCB Digibank', logo: 'https://api.vietqr.io/img/VCB.png' },
      { id: 'mb', code: 'MB', name: 'MB Bank', short: 'MBBank', logo: 'https://api.vietqr.io/img/MB.png' },
      { id: 'tcb', code: 'TCB', name: 'Techcombank', short: 'Techcombank', logo: 'https://api.vietqr.io/img/TCB.png' },
      { id: 'bidv', code: 'BIDV', name: 'BIDV', short: 'SmartBanking', logo: 'https://api.vietqr.io/img/BIDV.png' },
      { id: 'icb', code: 'ICB', name: 'VietinBank', short: 'iPay Mobile', logo: 'https://api.vietqr.io/img/ICB.png' },
      { id: 'vpb', code: 'VPB', name: 'VPBank', short: 'VPBank NEO', logo: 'https://api.vietqr.io/img/VPB.png' },
      { id: 'tpb', code: 'TPB', name: 'TPBank', short: 'TPBank Mobile', logo: 'https://api.vietqr.io/img/TPB.png' },
      { id: 'acb', code: 'ACB', name: 'ACB', short: 'ACB ONE', logo: 'https://api.vietqr.io/img/ACB.png' },
      { id: 'vba', code: 'VBA', name: 'Agribank', short: 'E-Mobile', logo: 'https://api.vietqr.io/img/VBA.png' },
      { id: 'vib', code: 'VIB', name: 'VIB', short: 'MyVIB 2.0', logo: 'https://api.vietqr.io/img/VIB.png' },
      { id: 'msb', code: 'MSB', name: 'MSB', short: 'MSB mBank', logo: 'https://api.vietqr.io/img/MSB.png' },
      { id: 'shb', code: 'SHB', name: 'SHB', short: 'SHB Mobile', logo: 'https://api.vietqr.io/img/SHB.png' },
      { id: 'ocb', code: 'OCB', name: 'OCB', short: 'OCB OMNI', logo: 'https://api.vietqr.io/img/OCB.png' },
      { id: 'stb', code: 'STB', name: 'Sacombank', short: 'Sacombank Pay', logo: 'https://api.vietqr.io/img/STB.png' }
    ];

    container.innerHTML = banks.map(b => `
      <button onclick="App.openBankApp('${b.id}', '${b.name}')" class="flex items-center space-x-2 p-1.5 sm:p-2 rounded-xl bg-white hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 transition text-left cursor-pointer active:scale-95 group shadow-2xs">
        <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-50 p-1 flex items-center justify-center border border-slate-100 flex-shrink-0">
          <img src="${b.logo}" alt="${b.name}" class="w-full h-full object-contain" onerror="this.onerror=null; this.src='img/qr-payment.png';">
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-bold text-slate-800 group-hover:text-emerald-900 truncate">${b.code}</p>
          <p class="text-[10px] text-slate-400 group-hover:text-emerald-700 truncate">${b.short}</p>
        </div>
      </button>
    `).join('');
  },

  /**
   * Mở ứng dụng ngân hàng và tự động sao chép STK
   */
  openBankApp(appId, bankName) {
    if (!this.currentPaymentData) return;
    const { amount, note } = this.currentPaymentData;

    // Tự động sao chép STK vào Clipboard để dán nếu ngân hàng không hỗ trợ tự điền
    if (navigator.clipboard) {
      navigator.clipboard.writeText('0451000202671').catch(() => {});
    }

    this.showToast(`✓ Đã sao chép STK: 0451000202671. Đang mở ${bankName || 'ngân hàng'}...`);

    const url = `https://dl.vietqr.io/pay?app=${appId}&ba=0451000202671@vcb&am=${amount}&tn=${encodeURIComponent(note)}`;
    setTimeout(() => {
      window.location.href = url;
    }, 350);
  },

  /**
   * Sao chép số tiền cần thanh toán
   */
  copyCurrentAmount() {
    if (!this.currentPaymentData) return;
    this.copyText(String(this.currentPaymentData.amount), `Đã sao chép số tiền: ${Calculator.formatCurrency(this.currentPaymentData.amount)}!`);
  },

  /**
   * Sao chép nội dung chuyển khoản
   */
  copyCurrentNote() {
    if (!this.currentPaymentData) return;
    this.copyText(this.currentPaymentData.note, `Đã sao chép nội dung: ${this.currentPaymentData.note}!`);
  }
};

// Khởi chạy khi DOM sẵn sàng (hỗ trợ cả trường hợp đã nạp xong từ cache)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    App.init();
  });
} else {
  App.init();
}
