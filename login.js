import {
  getUserByCredentials,
  getUserById,
  getUserByPhone,
  createUser,
} from "./firebase-config.js";

class LoginManager {
  constructor() {
    this.userLoginForm = document.getElementById("userLoginForm");
    this.adminLoginForm = document.getElementById("adminLoginForm");
    this.userSignupForm = document.getElementById("userSignupForm");
    this.tabButtons = document.querySelectorAll(".tab-btn");
    this.tabPanes = document.querySelectorAll(".tab-pane");

    this.adminAccount = {
      id: "123",
      password: "123",
    };

    this.init();
  }

  init() {
    this.setupTabs();
    this.setupForms();
    this.checkExistingSession();
  }

  setupTabs() {
    this.tabButtons.forEach((btn) => {
      btn.addEventListener("click", (event) => {
        const tabName = event.currentTarget.dataset.tab;
        this.switchTab(tabName);
      });
    });
  }

  switchTab(tabName) {
    this.tabButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tabName);
    });

    this.tabPanes.forEach((pane) => {
      pane.classList.toggle("active", pane.id === `${tabName}-tab`);
    });

    this.clearAllErrors();
  }

  setupForms() {
    if (this.userLoginForm) {
      this.userLoginForm.addEventListener("submit", (event) =>
        this.handleUserLogin(event),
      );
    }

    if (this.adminLoginForm) {
      this.adminLoginForm.addEventListener("submit", (event) =>
        this.handleAdminLogin(event),
      );
    }

    if (this.userSignupForm) {
      this.userSignupForm.addEventListener("submit", (event) =>
        this.handleUserSignup(event),
      );
    }
  }

  async handleUserLogin(event) {
    event.preventDefault();

    const userId = document.getElementById("userId").value.trim();
    const password = document.getElementById("userPassword").value.trim();
    const submitBtn = this.userLoginForm?.querySelector(".btn-submit");

    if (!this.validateUserLogin(userId, password)) {
      return;
    }

    this.setButtonLoading(submitBtn, true);

    try {
      const user = await getUserByCredentials(userId, password);
      if (!user) {
        this.showError(
          "userIdError",
          "아이디 또는 비밀번호가 일치하지 않습니다.",
        );
        this.setButtonLoading(submitBtn, false);
        Toast.error("로그인 실패: 회원 정보를 확인해주세요.");
        return;
      }

      this.createUserSession(user);
      this.setButtonLoading(submitBtn, false);
      Toast.success("로그인 성공! 예약 페이지로 이동합니다.");
      setTimeout(() => {
        window.location.href = "reservation.html";
      }, 800);
    } catch (error) {
      this.handleAuthError("로그인", error);
      this.setButtonLoading(submitBtn, false);
    }
  }

  validateUserLogin(userId, password) {
    this.clearAllErrors();
    let isValid = true;

    if (!userId) {
      this.showError("userIdError", "아이디를 입력해주세요.");
      isValid = false;
    }

    if (!password) {
      this.showError("userPasswordError", "비밀번호를 입력해주세요.");
      isValid = false;
    }

    return isValid;
  }

  async handleAdminLogin(event) {
    event.preventDefault();

    const id = document.getElementById("adminId").value.trim();
    const password = document.getElementById("adminPassword").value.trim();
    const submitBtn = this.adminLoginForm?.querySelector(".btn-submit");

    if (!this.validateAdminLogin(id, password)) {
      return;
    }

    this.setButtonLoading(submitBtn, true);

    try {
      if (
        id !== this.adminAccount.id ||
        password !== this.adminAccount.password
      ) {
        this.showError("adminIdError", "관리자 인증 정보가 올바르지 않습니다.");
        this.setButtonLoading(submitBtn, false);
        Toast.error("관리자 로그인 실패");
        return;
      }

      this.createAdminSession();
      this.setButtonLoading(submitBtn, false);
      Toast.success("관리자 로그인 성공! 예약 관리 페이지로 이동합니다.");
      setTimeout(() => {
        window.location.href = "reservation.html?admin=true";
      }, 800);
    } catch (error) {
      this.handleAuthError("관리자 로그인", error);
      this.setButtonLoading(submitBtn, false);
    }
  }

  validateAdminLogin(id, password) {
    this.clearAllErrors();
    let isValid = true;

    if (!id) {
      this.showError("adminIdError", "아이디를 입력해주세요.");
      isValid = false;
    }

    if (!password) {
      this.showError("adminPasswordError", "비밀번호를 입력해주세요.");
      isValid = false;
    }

    return isValid;
  }

  async handleUserSignup(event) {
    event.preventDefault();

    const id = document.getElementById("signupId").value.trim();
    const password = document.getElementById("signupPassword").value.trim();
    const name = document.getElementById("signupName").value.trim();
    const phone = document.getElementById("signupPhone").value.trim();
    const submitBtn = this.userSignupForm?.querySelector(".btn-submit");

    if (!this.validateSignupForm(id, password, name, phone)) {
      return;
    }

    this.setButtonLoading(submitBtn, true);

    try {
      const existingUserById = await getUserById(id);
      if (existingUserById) {
        this.showError("signupIdError", "이미 사용 중인 아이디입니다.");
        this.setButtonLoading(submitBtn, false);
        return;
      }

      const existingUserByPhone = await getUserByPhone(phone);
      if (existingUserByPhone) {
        this.showError("signupPhoneError", "이미 가입된 전화번호입니다.");
        this.setButtonLoading(submitBtn, false);
        return;
      }

      const user = await createUser({ id, password, name, phone });
      this.createUserSession(user);
      this.setButtonLoading(submitBtn, false);
      Toast.success("회원가입이 완료되었습니다. 예약 페이지로 이동합니다.");
      this.userSignupForm.reset();
      setTimeout(() => {
        window.location.href = "reservation.html";
      }, 800);
    } catch (error) {
      this.handleAuthError("회원가입", error);
      this.setButtonLoading(submitBtn, false);
    }
  }

  validateSignupForm(id, password, name, phone) {
    this.clearAllErrors();
    let isValid = true;

    if (!id) {
      this.showError("signupIdError", "아이디를 입력해주세요.");
      isValid = false;
    }
    if (!password) {
      this.showError("signupPasswordError", "비밀번호를 입력해주세요.");
      isValid = false;
    }
    if (!name) {
      this.showError("signupNameError", "이름을 입력해주세요.");
      isValid = false;
    }
    if (!phone) {
      this.showError("signupPhoneError", "전화번호를 입력해주세요.");
      isValid = false;
    } else if (!this.isValidPhone(phone)) {
      this.showError("signupPhoneError", "유효한 전화번호 형식이 아닙니다.");
      isValid = false;
    }

    return isValid;
  }

  isValidPhone(phone) {
    const phoneRegex = /^(\d{3}[-]?\d{3,4}[-]?\d{4}|\d{10,11})$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  }

  // 사용자 세션 생성 및 보관 (reservation.html에서 조회할 수 있도록 함)
  createUserSession(user) {
    sessionStorage.setItem(
      "currentUser",
      JSON.stringify({
        uid: user.id,
        name: user.name,
        phone: user.phone,
        role: "user",
      }),
    );
  }

  // 관리자 세션 생성 및 보관
  createAdminSession() {
    sessionStorage.setItem(
      "currentUser",
      JSON.stringify({
        uid: "admin",
        name: "관리자",
        role: "admin",
      }),
    );
  }

  // 기존 로그인 상태 체크 자동 분기
  checkExistingSession() {
    const user = sessionStorage.getItem("currentUser");
    if (user) {
      const parsed = JSON.parse(user);
      if (parsed.role === "admin") {
        window.location.href = "reservation.html?admin=true";
      } else {
        window.location.href = "reservation.html";
      }
    }
  }

  showError(elementId, message) {
    const errEl = document.getElementById(elementId);
    if (errEl) {
      errEl.textContent = message;
      errEl.style.display = "block";
      errEl.classList.add("show");
    }
  }

  clearAllErrors() {
    const errorMessages = document.querySelectorAll(".error-message");
    errorMessages.forEach((el) => {
      el.textContent = "";
      el.style.display = "none";
      el.classList.remove("show");
    });
  }

  handleAuthError(type, error) {
    console.error(`${type} 에러 발생:`, error);
    Toast.error(`${type} 중 오류가 발생했습니다. 다시 시도해 주세요.`);
  }

  setButtonLoading(button, isLoading) {
    if (!button) return;
    button.disabled = isLoading;
    button.classList.toggle("loading", isLoading);
    button.textContent = isLoading
      ? "처리 중..."
      : button.dataset.originalText || button.textContent;
  }
}

class Toast {
  static show(message, type = "info", duration = 3000) {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  static success(message) {
    this.show(message, "success");
  }

  static error(message) {
    this.show(message, "error");
  }
}

// 스타일 시트 등록 처리 포함
const style = document.createElement("style");
style.textContent = `
  .toast {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    padding: 0.85rem 1rem;
    border-radius: 10px;
    color: #fff;
    background: #1f2937;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9999;
    transition: opacity 0.25s ease;
  }
  .toast.success { background: #10b981; }
  .toast.error { background: #ef4444; }
`;
document.head.appendChild(style);

export default LoginManager;
