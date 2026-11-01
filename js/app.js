/**
 * Application Controller - Pickleball Văn Quán
 */

window.App = {
  activeTab: 'leaderboard',
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
      return `<option value="${s.id}" ${isSelected}>${s.name} (${s.date})</option>`;
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
   * Render Chi Tiết Buổi Chơi (Summary, Financials Table & Matches Grid)
   */
  renderSessionDetail() {
    const sessions = window.PICKLEBALL_DATA.sessions || [];
    const session = sessions.find(s => s.id === this.currentSessionId) || sessions[0];
    if (!session) return;

    const res = Calculator.calculateSessionFinancials(session);
    if (!res) return;

    const { playerRows, summary } = res;

    // 1. Render Summary Cards
    const summaryCards = document.getElementById('session-summary-cards');
    if (summaryCards) {
      summaryCards.innerHTML = `
        <div class="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
          <p class="text-[11px] font-bold text-slate-400 uppercase">Tiền Sân + Nước + Bóng</p>
          <p class="text-base sm:text-lg font-black text-slate-900 mt-0.5">${Calculator.formatCurrency(summary.totalPickExpense)}</p>
          <p class="text-[10px] text-slate-500">Sân ${summary.court/1000}k + Nước ${summary.water/1000}k + Bóng ${summary.balls/1000}k</p>
        </div>
        <div class="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3">
          <p class="text-[11px] font-bold text-amber-700 uppercase">Tiền Bia (${summary.beerCount} người đi)</p>
          <p class="text-base sm:text-lg font-black text-amber-900 mt-0.5">${Calculator.formatCurrency(summary.totalBeerExpense)}</p>
          <p class="text-[10px] text-amber-700/80">Chia đều: ${Calculator.formatCurrency(summary.beerPerPerson, true)}/người</p>
        </div>
        <div class="bg-rose-50/60 border border-rose-200/80 rounded-xl p-3">
          <p class="text-[11px] font-bold text-rose-700 uppercase">Tiền Thua Thu Được</p>
          <p class="text-base sm:text-lg font-black text-rose-900 mt-0.5">${Calculator.formatCurrency(summary.totalLossPenalty)}</p>
          <p class="text-[10px] text-rose-700/80">Phạt 10k/trận thua bù vào tiền sân</p>
        </div>
        <div class="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3">
          <p class="text-[11px] font-bold text-emerald-700 uppercase">Pick Còn Lại Chia Đều</p>
          <p class="text-base sm:text-lg font-black text-emerald-900 mt-0.5">${Calculator.formatCurrency(summary.pickPerPerson, true)}</p>
          <p class="text-[10px] text-emerald-700/80">(${Calculator.formatCurrency(summary.remainingPickExpense, true)} chia ${summary.totalPlayers} người)</p>
        </div>
      `;
    }

    // Badge tổng chi phí
    const totalBadge = document.getElementById('session-total-cost-badge');
    if (totalBadge) totalBadge.textContent = Calculator.formatCurrency(summary.totalAllExpenses);

    // 2. Render Financial Split Table
    const tbody = document.getElementById('session-finances-tbody');
    if (tbody) {
      tbody.innerHTML = playerRows.map(p => {
        return `
          <tr class="hover:bg-slate-50 transition">
            <td class="py-3 px-3">
              <div class="flex items-center space-x-2">
                <span class="font-bold text-slate-900">${p.name}</span>
                ${p.isBeer ? '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800">🍻 Đi bia</span>' : ''}
              </div>
            </td>
            <td class="py-3 px-3 text-center font-bold text-slate-800">${p.matches}</td>
            <td class="py-3 px-3 text-center font-bold text-emerald-600">${p.wins}</td>
            <td class="py-3 px-3 text-center font-bold text-rose-500">${p.losses}</td>
            <td class="py-3 px-3 text-right text-xs text-rose-600 font-semibold">${Calculator.formatCurrency(p.lossPenalty, true)}</td>
            <td class="py-3 px-3 text-right text-xs font-semibold text-slate-700">${Calculator.formatCurrency(p.pickCost, true)}</td>
            <td class="py-3 px-3 text-right text-xs font-semibold ${p.isBeer ? 'text-amber-700' : 'text-slate-300'}">
              ${p.isBeer ? Calculator.formatCurrency(p.beerCost, true) : '-'}
            </td>
            <td class="py-3 px-4 text-right bg-emerald-50/50 font-black text-sm text-emerald-800">
              ${Calculator.formatCurrency(p.totalFinal, true)}
              <span class="block text-[10px] text-slate-400 font-normal">(${Calculator.formatCurrency(p.totalFinal)})</span>
            </td>
          </tr>
        `;
      }).join('');
    }

    // Footer Table Summary
    const tfoot = document.getElementById('session-finances-tfoot');
    if (tfoot) {
      tfoot.innerHTML = `
        <tr>
          <td class="py-3 px-3 font-black text-slate-900">TỔNG CỘNG</td>
          <td class="py-3 px-3 text-center font-black">${summary.totalMatches * 4} lượt</td>
          <td class="py-3 px-3 text-center text-emerald-700 font-black">${summary.totalMatches * 2}</td>
          <td class="py-3 px-3 text-center text-rose-700 font-black">${summary.totalMatches * 2}</td>
          <td class="py-3 px-3 text-right font-black text-rose-700">${Calculator.formatCurrency(summary.totalLossPenalty, true)}</td>
          <td class="py-3 px-3 text-right font-black text-slate-900">${Calculator.formatCurrency(summary.totalPickExpense, true)}</td>
          <td class="py-3 px-3 text-right font-black text-amber-800">${Calculator.formatCurrency(summary.totalBeerExpense, true)}</td>
          <td class="py-3 px-4 text-right bg-emerald-100/70 font-black text-sm text-emerald-950">
            ${Calculator.formatCurrency(summary.totalAllExpenses, true)}
            <span class="block text-[10px] text-emerald-800 font-bold">(${Calculator.formatCurrency(summary.totalAllExpenses)})</span>
          </td>
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
    text += `👉 Pick còn lại chia đều: ${Calculator.formatCurrency(summary.pickPerPerson, true)}/người\n`;
    text += `👉 Bia chia đều: ${Calculator.formatCurrency(summary.beerPerPerson, true)}/người\n`;
    text += `--------------------------------------\n`;
    text += `📋 DANH SÁCH THANH TOÁN TỪNG ANH EM:\n\n`;

    playerRows.forEach((p, idx) => {
      const beerText = p.isBeer ? ` + Bia: ${Calculator.formatCurrency(p.beerCost, true)}` : '';
      text += `${idx + 1}. ${p.name} (${p.matches} trận, ${p.wins}T-${p.losses}B): ${Calculator.formatCurrency(p.totalFinal, true)} (Pick: ${Calculator.formatCurrency(p.pickCost, true)}${beerText})\n`;
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
