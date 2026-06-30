import {
  addNotice,
  createReservation,
  deleteNotice,
  deleteReservation,
  deleteUser,
  getAllReservations,
  getAllUsers,
  getNotices,
  getReservationsByUserId,
  updateNotice,
  updateReservationStatus,
  updateUser,
} from "./firebase-config.js";

class ReservationManager {
  constructor() {
    this.welcomeMessage = document.getElementById("welcomeMessage");
    this.btnLogout = document.getElementById("btnLogout");
    this.pageTitle = document.getElementById("pageTitle");
    this.pageSubtitle = document.getElementById("pageSubtitle");
    this.infoName = document.getElementById("infoName");
    this.infoPhone = document.getElementById("infoPhone");
    this.userPanel = document.getElementById("userPanel");
    this.adminPanel = document.getElementById("adminPanel");

    this.currentUser = null;
    this.users = [];
    this.reservations = [];
    this.notices = [];
    this.userReservations = [];
    this.editingUserId = null;
    this.editingNoticeId = null;

    this.init();
  }

  init() {
    this.checkAuth();
    if (this.btnLogout) {
      this.btnLogout.addEventListener("click", () => this.handleLogout());
    }
    this.render();
  }

  async render() {
    if (!this.currentUser) return;

    if (this.currentUser.role === "admin") {
      await this.loadAdminData();
      this.renderAdminDashboard();
    } else {
      await this.loadUserData();
      this.renderUserDashboard();
    }
  }

  checkAuth() {
    const sessionData = sessionStorage.getItem("currentUser");

    if (!sessionData) {
      alert("로그인이 필요한 서비스입니다. 로그인 페이지로 이동합니다.");
      window.location.href = "login.html";
      return;
    }

    this.currentUser = JSON.parse(sessionData);

    if (this.currentUser.role === "admin") {
      this.welcomeMessage.textContent = `👑 ${this.currentUser.name}님 환영합니다.`;
      this.infoName.textContent = `접속자: 관리자 계정`;
      this.infoPhone.textContent = `권한: 모든 예약 제어 가능`;
    } else {
      this.welcomeMessage.textContent = `안녕하세요, ${this.currentUser.name}님`;
      this.infoName.textContent = `환자명: ${this.currentUser.name}`;
      this.infoPhone.textContent = `연락처: ${this.currentUser.phone || "미등록"}`;
    }
  }

  async loadAdminData() {
    try {
      const [users, reservations, notices] = await Promise.all([
        getAllUsers(),
        getAllReservations(),
        getNotices(),
      ]);
      this.users = users;
      this.reservations = reservations;
      this.notices = notices;
    } catch (error) {
      console.error("관리자 데이터 로드 실패:", error);
      this.users = [];
      this.reservations = [];
      this.notices = [];
    }
  }

  async loadUserData() {
    try {
      this.userReservations = await getReservationsByUserId(
        this.currentUser.uid || this.currentUser.id || "unknown",
      );
    } catch (error) {
      console.error("사용자 예약 조회 실패:", error);
      this.userReservations = [];
    }
  }

  renderUserDashboard() {
    this.pageTitle.textContent = "진료 예약 신청";
    this.pageSubtitle.textContent =
      "원하시는 진료 항목과 일시를 선택해 주세요.";

    this.userPanel.innerHTML = `
      <section class="dashboard-section">
        <h3>예약 신청</h3>
        <p>원하시는 진료 항목과 일시를 선택해 주세요.</p>
        <form id="reservationForm">
          <div class="form-group">
            <label for="treatmentType">진료 항목</label>
            <select id="treatmentType" required>
              <option value="">-- 진료 항목 선택 --</option>
              <option value="임플란트">임플란트</option>
              <option value="치아교정">치아교정</option>
              <option value="심미보철">심미보철 / 라미네이트</option>
              <option value="일반진료">일반 보존 치료 (충치/스케일링)</option>
              <option value="구강검진">구강 검진</option>
            </select>
            <p class="error-message" id="treatmentError"></p>
          </div>

          <div class="form-group">
            <label for="reservationDate">예약 일시</label>
            <input type="datetime-local" id="reservationDate" required>
            <p class="error-message" id="dateError"></p>
          </div>

          <div class="form-group">
            <label for="reservationNotes">증상 및 요청사항 (선택)</label>
            <textarea id="reservationNotes" rows="4" placeholder="불편하신 부위나 상담받고 싶으신 내용을 간단히 적어주세요."></textarea>
          </div>

          <button type="submit" id="btnSubmit" class="btn-block">예약 신청하기</button>
        </form>
      </section>

      <section class="dashboard-section">
        <h3>내 예약 내역</h3>
        <p>신청한 예약 상태를 확인할 수 있습니다.</p>
        ${
          this.userReservations.length > 0
            ? this.userReservations
                .map(
                  (item) => `
          <div class="list-card">
            <div>
              <strong>${item.treatmentType || "진료"}</strong>
              <small>${item.date || "일시 미정"}</small>
              <div class="badges" style="margin-top: 0.35rem;">
                <span class="badge ${this.getStatusClass(item.status)}">${this.getStatusLabel(item.status)}</span>
              </div>
            </div>
            <div style="color: #6b7280; font-size: 0.92rem;">${item.notes || "요청사항 없음"}</div>
          </div>
        `,
                )
                .join("")
            : `<div class="empty-state">아직 예약 내역이 없습니다.</div>`
        }
      </section>
    `;
    this.adminPanel.innerHTML = "";
    this.setupDateLimit();
    const form = this.userPanel.querySelector("#reservationForm");
    if (form) {
      form.addEventListener("submit", (event) => this.handleReservation(event));
    }
  }

  renderAdminDashboard() {
    this.pageTitle.textContent = "관리자 대시보드";
    this.pageSubtitle.textContent =
      "가입자 정보와 예약 내용을 한 번에 관리할 수 있습니다.";

    this.adminPanel.innerHTML = `
      <section class="dashboard-section">
        <h3>가입자 정보 관리</h3>
        <p>가입자 정보를 수정하거나 탈퇴시킬 수 있습니다.</p>
        <form id="editUserForm" class="admin-grid">
          <div class="form-group">
            <label for="editUserName">이름</label>
            <input id="editUserName" required>
          </div>
          <div class="form-group">
            <label for="editUserId">아이디</label>
            <input id="editUserId" required>
          </div>
          <div class="form-group">
            <label for="editUserPassword">비밀번호</label>
            <input id="editUserPassword" type="password" placeholder="변경할 비밀번호 입력">
          </div>
          <div class="form-group">
            <label for="editUserPhone">전화번호</label>
            <input id="editUserPhone" required>
          </div>
          <div class="action-row">
            <button type="submit" class="btn-inline">정보 저장</button>
            <button type="button" id="cancelEditBtn" class="btn-inline">취소</button>
          </div>
        </form>

        <div style="margin-top: 1rem;">
          ${
            this.users.length > 0
              ? this.users
                  .map(
                    (user) => `
            <div class="list-card">
              <div>
                <strong>${user.name || "이름 미등록"}</strong>
                <small>아이디: ${user.id || "-"} / 연락처: ${user.phone || "-"}</small>
                <div class="badges" style="margin-top: 0.35rem;">
                  <span class="badge">${user.role === "admin" ? "관리자" : "가입자"}</span>
                </div>
              </div>
              <div class="action-row">
                <button class="btn-inline btn-edit-user" data-user-id="${user.id}">수정</button>
                <button class="btn-inline btn-danger btn-delete-user" data-user-id="${user.id}">삭제</button>
              </div>
            </div>
          `,
                  )
                  .join("")
              : `<div class="empty-state">등록된 가입자가 없습니다.</div>`
          }
        </div>
      </section>

      <section class="dashboard-section">
        <h3>가입자 예약 내용</h3>
        <p>각 가입자의 예약 신청 내역을 한눈에 확인하세요.</p>
        ${
          this.reservations.length > 0
            ? this.reservations
                .map(
                  (item) => `
          <div class="list-card" style="align-items: flex-start; flex-direction: column;">
            <div style="display: flex; justify-content: space-between; width: 100%; gap: 1rem; flex-wrap: wrap;">
              <div>
                <strong>${item.name || "이름 미등록"}</strong>
                <small>${item.phone || "-"}</small>
              </div>
              <span class="badge ${this.getStatusClass(item.status)}">${this.getStatusLabel(item.status)}</span>
            </div>
            <div style="margin-top: 0.45rem; color: #374151;">
              <div><strong>진료:</strong> ${item.treatmentType || "-"}</div>
              <div><strong>일시:</strong> ${item.date || "-"}</div>
              <div><strong>요청사항:</strong> ${item.notes || "없음"}</div>
            </div>
            <div class="action-row" style="margin-top: 0.75rem;">
              <select class="status-select" data-reservation-id="${item.id}">
                <option value="pending" ${item.status === "pending" ? "selected" : ""}>대기</option>
                <option value="confirmed" ${item.status === "confirmed" ? "selected" : ""}>확정</option>
                <option value="cancelled" ${item.status === "cancelled" ? "selected" : ""}>취소</option>
              </select>
              <button class="btn-inline btn-delete-reservation" data-reservation-id="${item.id}">삭제</button>
            </div>
          </div>
        `,
                )
                .join("")
            : `<div class="empty-state">예약 내역이 없습니다.</div>`
        }
      </section>

      <section class="dashboard-section">
        <h3>공지사항 관리</h3>
        <p>새 공지를 추가하거나 기존 공지를 수정·삭제할 수 있습니다.</p>
        <form id="noticeForm" class="admin-grid">
          <div class="form-group">
            <label for="noticeTitle">공지 제목</label>
            <input id="noticeTitle" required>
          </div>
          <div class="form-group">
            <label for="noticeCategory">분류</label>
            <input id="noticeCategory" value="공지">
          </div>
          <div class="form-group">
            <label for="noticeContent">공지 내용</label>
            <textarea id="noticeContent" rows="4" required></textarea>
          </div>
          <div class="form-group">
            <label for="noticeImage">이미지 URL</label>
            <input id="noticeImage" placeholder="https://...">
          </div>
          <div class="action-row">
            <button type="submit" class="btn-block">${this.editingNoticeId ? "공지 수정" : "공지 등록"}</button>
            ${this.editingNoticeId ? '<button type="button" id="cancelNoticeEditBtn" class="btn-inline">취소</button>' : ""}
          </div>
        </form>

        <div style="margin-top: 1rem;">
          ${
            this.notices.length > 0
              ? this.notices
                  .map(
                    (notice) => `
            <div class="notice-item">
              <strong>${notice.title || "공지"}</strong>
              <small>${notice.category || "공지"}</small>
              <div style="margin-top: 0.35rem; color: #4b5563;">${notice.content || ""}</div>
              <div class="action-row" style="margin-top: 0.7rem;">
                <button class="btn-inline btn-edit-notice" data-notice-id="${notice.id}">수정</button>
                <button class="btn-inline btn-danger btn-delete-notice" data-notice-id="${notice.id}">삭제</button>
              </div>
            </div>
          `,
                  )
                  .join("")
              : `<div class="empty-state">등록된 공지사항이 없습니다.</div>`
          }
        </div>
      </section>
    `;
    this.userPanel.innerHTML = "";
    this.attachAdminEvents();
  }

  attachAdminEvents() {
    const editForm = this.adminPanel.querySelector("#editUserForm");
    if (editForm) {
      editForm.addEventListener("submit", (event) =>
        this.handleUserEdit(event),
      );
    }

    const cancelEdit = this.adminPanel.querySelector("#cancelEditBtn");
    if (cancelEdit) {
      cancelEdit.addEventListener("click", () => this.resetEditForm());
    }

    this.adminPanel.querySelectorAll(".btn-edit-user").forEach((button) => {
      button.addEventListener("click", () =>
        this.selectUserForEdit(button.dataset.userId),
      );
    });

    this.adminPanel.querySelectorAll(".btn-delete-user").forEach((button) => {
      button.addEventListener("click", () =>
        this.handleUserDelete(button.dataset.userId),
      );
    });

    const noticeForm = this.adminPanel.querySelector("#noticeForm");
    if (noticeForm) {
      noticeForm.addEventListener("submit", (event) =>
        this.handleNoticeSubmit(event),
      );
    }

    const cancelNoticeEdit = this.adminPanel.querySelector(
      "#cancelNoticeEditBtn",
    );
    if (cancelNoticeEdit) {
      cancelNoticeEdit.addEventListener("click", () => this.resetNoticeForm());
    }

    this.adminPanel.querySelectorAll(".btn-edit-notice").forEach((button) => {
      button.addEventListener("click", () =>
        this.selectNoticeForEdit(button.dataset.noticeId),
      );
    });

    this.adminPanel.querySelectorAll(".btn-delete-notice").forEach((button) => {
      button.addEventListener("click", () =>
        this.handleNoticeDelete(button.dataset.noticeId),
      );
    });

    this.adminPanel.querySelectorAll(".status-select").forEach((select) => {
      select.addEventListener("change", (event) =>
        this.handleReservationStatusChange(event),
      );
    });

    this.adminPanel
      .querySelectorAll(".btn-delete-reservation")
      .forEach((button) => {
        button.addEventListener("click", () =>
          this.handleReservationDelete(button.dataset.reservationId),
        );
      });
  }

  setupDateLimit() {
    const dateInput = document.getElementById("reservationDate");
    if (!dateInput) return;

    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now - tzOffset).toISOString().slice(0, 16);
    dateInput.min = localISOTime;
  }

  async handleReservation(event) {
    event.preventDefault();

    const treatmentType = document.getElementById("treatmentType").value;
    const reservationDate = document.getElementById("reservationDate").value;
    const notes = document.getElementById("reservationNotes").value.trim();
    const btnSubmit = document.getElementById("btnSubmit");

    if (!treatmentType) {
      this.showError("treatmentError", "진료 항목을 선택해 주세요.");
      return;
    }
    if (!reservationDate) {
      this.showError("dateError", "예약 일시를 정확히 선택해 주세요.");
      return;
    }

    this.clearErrors();
    this.setLoading(btnSubmit, true);

    const reservationData = {
      userId: this.currentUser.uid || this.currentUser.id || "unknown",
      name: this.currentUser.name,
      phone: this.currentUser.phone || "010-0000-0000",
      treatmentType,
      date: reservationDate,
      notes,
      status: "pending",
    };

    try {
      const result = await createReservation(reservationData);
      if (result && result.id) {
        alert(`🎉 예약 신청이 완료되었습니다!\n[예약번호: ${result.id}]`);
        this.userReservations = await getReservationsByUserId(
          this.currentUser.uid || this.currentUser.id || "unknown",
        );
        this.renderUserDashboard();
      } else {
        throw new Error("Invalid response from database");
      }
    } catch (error) {
      console.error("예약 등록 실패:", error);
      alert("예약 처리 중 네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      this.setLoading(btnSubmit, false);
    }
  }

  selectUserForEdit(userId) {
    const user = this.users.find((item) => item.id === userId);
    if (!user) return;

    this.editingUserId = user.id;
    const nameInput = this.adminPanel.querySelector("#editUserName");
    const idInput = this.adminPanel.querySelector("#editUserId");
    const passwordInput = this.adminPanel.querySelector("#editUserPassword");
    const phoneInput = this.adminPanel.querySelector("#editUserPhone");

    if (nameInput) nameInput.value = user.name || "";
    if (idInput) idInput.value = user.id || "";
    if (passwordInput) passwordInput.value = "";
    if (phoneInput) phoneInput.value = user.phone || "";
  }

  async handleUserEdit(event) {
    event.preventDefault();
    if (!this.editingUserId) {
      alert("수정할 가입자를 먼저 선택해 주세요.");
      return;
    }

    const name = this.adminPanel.querySelector("#editUserName").value.trim();
    const id = this.adminPanel.querySelector("#editUserId").value.trim();
    const password = this.adminPanel
      .querySelector("#editUserPassword")
      .value.trim();
    const phone = this.adminPanel.querySelector("#editUserPhone").value.trim();

    try {
      const updates = {
        name,
        id,
        phone,
        phoneNormalized: phone.replace(/\D/g, ""),
      };
      if (password) {
        updates.password = password;
      }
      await updateUser(this.editingUserId, updates);
      alert("가입자 정보가 수정되었습니다.");
      this.editingUserId = null;
      await this.loadAdminData();
      this.renderAdminDashboard();
    } catch (error) {
      console.error("가입자 수정 실패:", error);
      alert("가입자 정보 수정 중 오류가 발생했습니다.");
    }
  }

  async handleUserDelete(userId) {
    if (!confirm("정말로 이 가입자를 삭제하시겠습니까?")) return;

    try {
      await deleteUser(userId);
      alert("가입자가 삭제되었습니다.");
      await this.loadAdminData();
      this.renderAdminDashboard();
    } catch (error) {
      console.error("가입자 삭제 실패:", error);
      alert("가입자 삭제 중 오류가 발생했습니다.");
    }
  }

  async handleNoticeSubmit(event) {
    event.preventDefault();
    const title = this.adminPanel.querySelector("#noticeTitle").value.trim();
    const category = this.adminPanel
      .querySelector("#noticeCategory")
      .value.trim();
    const content = this.adminPanel
      .querySelector("#noticeContent")
      .value.trim();
    const image = this.adminPanel.querySelector("#noticeImage").value.trim();

    if (!title || !content) {
      alert("제목과 내용을 모두 입력해 주세요.");
      return;
    }

    try {
      if (this.editingNoticeId) {
        await updateNotice(this.editingNoticeId, {
          title,
          category,
          content,
          image,
        });
        alert("공지사항이 수정되었습니다.");
      } else {
        await addNotice({ title, category, content, image });
        alert("공지사항이 등록되었습니다.");
      }
      this.editingNoticeId = null;
      await this.loadAdminData();
      this.renderAdminDashboard();
    } catch (error) {
      console.error("공지 등록/수정 실패:", error);
      alert("공지사항 처리 중 오류가 발생했습니다.");
    }
  }

  selectNoticeForEdit(noticeId) {
    const notice = this.notices.find((item) => item.id === noticeId);
    if (!notice) return;

    this.editingNoticeId = notice.id;
    this.adminPanel.querySelector("#noticeTitle").value = notice.title || "";
    this.adminPanel.querySelector("#noticeCategory").value =
      notice.category || "공지";
    this.adminPanel.querySelector("#noticeContent").value =
      notice.content || "";
    this.adminPanel.querySelector("#noticeImage").value = notice.image || "";
  }

  async handleNoticeDelete(noticeId) {
    if (!confirm("이 공지사항을 삭제하시겠습니까?")) return;

    try {
      await deleteNotice(noticeId);
      alert("공지사항이 삭제되었습니다.");
      await this.loadAdminData();
      this.renderAdminDashboard();
    } catch (error) {
      console.error("공지 삭제 실패:", error);
      alert("공지사항 삭제 중 오류가 발생했습니다.");
    }
  }

  resetNoticeForm() {
    this.editingNoticeId = null;
    this.adminPanel.querySelector("#noticeTitle").value = "";
    this.adminPanel.querySelector("#noticeCategory").value = "공지";
    this.adminPanel.querySelector("#noticeContent").value = "";
    this.adminPanel.querySelector("#noticeImage").value = "";
  }

  async handleReservationStatusChange(event) {
    const reservationId = event.target.dataset.reservationId;
    const status = event.target.value;

    try {
      await updateReservationStatus(reservationId, { status });
      alert("예약 상태가 변경되었습니다.");
      await this.loadAdminData();
      this.renderAdminDashboard();
    } catch (error) {
      console.error("예약 상태 변경 실패:", error);
      alert("예약 상태 변경 중 오류가 발생했습니다.");
    }
  }

  async handleReservationDelete(reservationId) {
    if (!confirm("이 예약을 삭제하시겠습니까?")) return;

    try {
      await deleteReservation(reservationId);
      alert("예약이 삭제되었습니다.");
      await this.loadAdminData();
      this.renderAdminDashboard();
    } catch (error) {
      console.error("예약 삭제 실패:", error);
      alert("예약 삭제 중 오류가 발생했습니다.");
    }
  }

  resetEditForm() {
    this.editingUserId = null;
    this.adminPanel.querySelector("#editUserName").value = "";
    this.adminPanel.querySelector("#editUserId").value = "";
    this.adminPanel.querySelector("#editUserPassword").value = "";
    this.adminPanel.querySelector("#editUserPhone").value = "";
  }

  showError(id, message) {
    const errorEl = document.getElementById(id);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = "block";
      errorEl.classList.add("show");
    }
  }

  clearErrors() {
    const errors = document.querySelectorAll(".error-message");
    errors.forEach((el) => {
      el.textContent = "";
      el.style.display = "none";
    });
  }

  setLoading(button, isLoading) {
    if (!button) return;
    button.disabled = isLoading;
    button.textContent = isLoading
      ? "예약 데이터를 전송 중..."
      : "예약 신청하기";
  }

  handleLogout() {
    sessionStorage.removeItem("currentUser");
    alert("로그아웃 되었습니다.");
    window.location.href = "index.html";
  }

  getStatusClass(status) {
    switch (status) {
      case "confirmed":
        return "confirmed";
      case "cancelled":
        return "cancelled";
      default:
        return "pending";
    }
  }

  getStatusLabel(status) {
    switch (status) {
      case "confirmed":
        return "확정";
      case "cancelled":
        return "취소";
      default:
        return "대기";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ReservationManager();
});
