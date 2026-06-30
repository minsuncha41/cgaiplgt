/* ============================================
   Mobile Menu Toggle
   ============================================ */

class MobileMenu {
  constructor() {
    this.hamburger = document.getElementById("hamburger");
    this.navMenu = document.getElementById("navMenu");
    this.navLinks = this.navMenu.querySelectorAll("a");

    this.init();
  }

  init() {
    this.hamburger.addEventListener("click", () => this.toggle());
    this.navLinks.forEach((link) => {
      link.addEventListener("click", () => this.close());
    });
    document.addEventListener("click", (e) => this.handleClickOutside(e));
  }

  toggle() {
    this.hamburger.classList.toggle("active");
    this.navMenu.classList.toggle("active");
  }

  close() {
    this.hamburger.classList.remove("active");
    this.navMenu.classList.remove("active");
  }

  handleClickOutside(e) {
    if (!e.target.closest(".navbar")) {
      this.close();
    }
  }
}

/* ============================================
   Toast Notification System
   ============================================ */

class Toast {
  static show(message, type = "info", duration = 3000) {
    const toast = document.createElement("div");
    toast.className = `toast ${type} fade-in`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "slideInRight 0.3s ease reverse";
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  static success(message) {
    this.show(message, "success");
  }

  static error(message) {
    this.show(message, "error");
  }

  static info(message) {
    this.show(message, "info");
  }
}

/* ============================================
   Scroll Animation
   ============================================ */

class ScrollAnimation {
  constructor() {
    this.observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };
    this.observer = new IntersectionObserver(
      (entries) => this.onIntersect(entries),
      this.observerOptions,
    );
    this.init();
  }

  init() {
    const elements = document.querySelectorAll(
      ".about, .services, .process, .cta, .notice, .feature-item, .service-card, .process-step",
    );
    elements.forEach((el, index) => {
      el.classList.add("scroll-animate");
      el.style.animationDelay = `${index * 0.1}s`;
      this.observer.observe(el);
    });
  }

  onIntersect(entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        this.observer.unobserve(entry.target);
      }
    });
  }
}

/* ============================================
   Notice Manager
   ============================================ */

class NoticeManager {
  constructor() {
    this.noticeList = document.getElementById("noticeList");
    this.notices = [];
    this.init();
  }

  async init() {
    try {
      await this.loadNotices();
      this.renderNotices();
    } catch (error) {
      console.error("Notice loading error:", error);
      Toast.error("공지사항을 불러올 수 없습니다.");
    }
  }

  async loadNotices() {
    // 실제 환경에서는 JSON 파일에서 로드
    const noticeData = [
      {
        id: 1,
        title: "2024년 진료 휴무 안내",
        date: "2024-01-15",
        content: "새해 맞이 특별 휴무 일정을 안내드립니다.",
        category: "공지",
      },
      {
        id: 2,
        title: "신규 장비 도입 안내",
        date: "2024-01-10",
        content:
          "최신 치과 진료 장비가 도입되었습니다. 더욱 정확한 진료를 받으실 수 있습니다.",
        category: "소식",
      },
      {
        id: 3,
        title: "정기검진 이벤트",
        date: "2024-01-05",
        content: "1월 한 달간 정기검진 시 20% 할인 이벤트를 진행합니다.",
        category: "이벤트",
      },
    ];

    // 가장 최신 순서로 정렬
    this.notices = noticeData.sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );
  }

  renderNotices() {
    if (this.notices.length === 0) {
      this.noticeList.innerHTML =
        '<div class="notice-loading">공지사항이 없습니다.</div>';
      return;
    }

    this.noticeList.innerHTML = this.notices
      .slice(0, 3)
      .map((notice, index) => this.createNoticeHTML(notice, index))
      .join("");

    // 클릭 이벤트 추가
    this.noticeList.querySelectorAll(".notice-item").forEach((item) => {
      item.addEventListener("click", () => {
        const title = item.querySelector("h4").textContent;
        Toast.info(`"${title}" 공지사항 상세 페이지로 이동합니다.`);
      });
    });
  }

  createNoticeHTML(notice, index) {
    const formattedDate = this.formatDate(new Date(notice.date));

    return `
            <div class="notice-item fade-in" style="animation-delay: ${index * 0.1}s">
                <div class="notice-content">
                    <h4>${this.escapeHTML(notice.title)}</h4>
                    <p>${this.escapeHTML(notice.content)}</p>
                </div>
                <div class="notice-date">${formattedDate}</div>
            </div>
        `;
  }

  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}`;
  }

  escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

/* ============================================
   Navigation Scroll Effect
   ============================================ */

class HeaderScroll {
  constructor() {
    this.header = document.querySelector(".header");
    this.lastScrollTop = 0;
    this.init();
  }

  init() {
    window.addEventListener("scroll", () => this.updateHeader(), {
      passive: true,
    });
  }

  updateHeader() {
    const scrollTop = window.scrollY;

    if (scrollTop > 50) {
      this.header.style.boxShadow = "var(--shadow-md)";
    } else {
      this.header.style.boxShadow = "var(--shadow-sm)";
    }

    this.lastScrollTop = scrollTop;
  }
}

/* ============================================
   Smooth Scroll Navigation
   ============================================ */

class SmoothScroll {
  constructor() {
    this.navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');
    this.init();
  }

  init() {
    this.navLinks.forEach((link) => {
      link.addEventListener("click", (e) => this.handleClick(e));
    });
  }

  handleClick(e) {
    const href = e.currentTarget.getAttribute("href");
    if (href === "#") return;

    const targetId = href.substring(1);
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      e.preventDefault();
      const headerHeight = document.querySelector(".header").offsetHeight;
      const offsetTop = targetElement.offsetTop - headerHeight - 20;

      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });

      const mobileMenu = document.querySelector(".nav-menu");
      if (mobileMenu.classList.contains("active")) {
        const hamburger = document.getElementById("hamburger");
        hamburger.classList.remove("active");
        mobileMenu.classList.remove("active");
      }
    }
  }
}

/* ============================================
   Service Card Interactive
   ============================================ */

class ServiceCard {
  constructor() {
    this.cards = document.querySelectorAll(".service-card");
    this.init();
  }

  init() {
    this.cards.forEach((card) => {
      card.addEventListener("mouseenter", () => this.onHover(card));
      card.addEventListener("click", () => this.onClick(card));
    });
  }

  onHover(card) {
    const image = card.querySelector(".service-image");
    if (image) {
      image.style.transform = "scale(1.1)";
    }
  }

  onClick(card) {
    const link = card.querySelector(".service-link");
    if (link) {
      const href = link.getAttribute("href");
      window.location.href = href;
    }
  }
}

/* ============================================
   Performance Monitor
   ============================================ */

class PerformanceMonitor {
  constructor() {
    this.init();
  }

  init() {
    if (window.performance && window.performance.timing) {
      window.addEventListener("load", () => {
        this.logMetrics();
      });
    }
  }

  logMetrics() {
    const timing = window.performance.timing;
    const navigation = timing.navigationStart;
    const loadComplete = timing.loadEventEnd;
    const readyStart = timing.domContentLoadedEventStart;

    const loadTime = loadComplete - navigation;
    const readyTime = readyStart - navigation;

    console.log(`📊 Performance Metrics:`);
    console.log(`   ⏱️ DOM Ready: ${readyTime}ms`);
    console.log(`   ⏱️ Page Load: ${loadTime}ms`);
  }
}

/* ============================================
   Lazy Loading Images
   ============================================ */

class LazyLoadImages {
  constructor() {
    this.init();
  }

  init() {
    const images = document.querySelectorAll("img[data-src]");

    if ("IntersectionObserver" in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.add("loaded");
            imageObserver.unobserve(img);
          }
        });
      });

      images.forEach((img) => imageObserver.observe(img));
    } else {
      images.forEach((img) => {
        img.src = img.dataset.src;
      });
    }
  }
}

/* ============================================
   Event Tracking
   ============================================ */

class EventTracker {
  constructor() {
    this.init();
  }

  init() {
    // 주요 버튼 클릭 추적
    document
      .querySelectorAll(".btn-primary, .btn-secondary, .service-link")
      .forEach((btn) => {
        btn.addEventListener("click", (e) => {
          this.trackEvent("button_click", {
            text: e.target.textContent.trim(),
            href: e.target.href || "N/A",
          });
        });
      });

    // 섹션 방문 추적
    document.querySelectorAll("[id]").forEach((section) => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.trackEvent("section_view", {
              section: entry.target.id,
            });
          }
        });
      });
      observer.observe(section);
    });
  }

  trackEvent(eventName, data = {}) {
    console.log(`📍 Event: ${eventName}`, data);
    // 실제 환경에서는 분석 서비스로 전송
  }
}

/* ============================================
   App Initialization
   ============================================ */

class App {
  constructor() {
    this.init();
  }

  init() {
    document.addEventListener("DOMContentLoaded", () => {
      // 모든 기능 초기화
      new MobileMenu();
      new ScrollAnimation();
      new NoticeManager();
      new HeaderScroll();
      new SmoothScroll();
      new ServiceCard();
      new PerformanceMonitor();
      new LazyLoadImages();
      new EventTracker();

      // 페이지 로드 완료 알림
      console.log("✅ App initialized successfully");

      // 첫 방문자 인사
      if (!this.hasVisited()) {
        setTimeout(() => {
          Toast.info("스마일 치과에 방문해주셨습니다!");
        }, 1000);
        this.markVisited();
      }
    });
  }

  hasVisited() {
    return localStorage.getItem("visited_smiledental");
  }

  markVisited() {
    localStorage.setItem("visited_smiledental", "true");
  }
}

// 앱 시작
new App();

/* ============================================
   Utility Functions
   ============================================ */

// 요소가 viewport에 보이는지 확인
function isElementInViewport(el) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.bottom >= 0
  );
}

// 디바운스 함수
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// throttle 함수
function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// LocalStorage 헬퍼
const Storage = {
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error("Storage error:", e);
      return false;
    }
  },
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error("Storage error:", e);
      return defaultValue;
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error("Storage error:", e);
      return false;
    }
  },
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.error("Storage error:", e);
      return false;
    }
  },
};

// API 요청 헬퍼
const API = {
  get: async (url, options = {}) => {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("API error:", error);
      throw error;
    }
  },

  post: async (url, data, options = {}) => {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        body: JSON.stringify(data),
        ...options,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("API error:", error);
      throw error;
    }
  },

  put: async (url, data, options = {}) => {
    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        body: JSON.stringify(data),
        ...options,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("API error:", error);
      throw error;
    }
  },

  delete: async (url, options = {}) => {
    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("API error:", error);
      throw error;
    }
  },
};

// 이벤트 에미터
class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off(event, listener) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter((l) => l !== listener);
  }

  emit(event, data) {
    if (!this.events[event]) return;
    this.events[event].forEach((listener) => listener(data));
  }

  once(event, listener) {
    const onceWrapper = (data) => {
      listener(data);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }
}

// 유틸리티: 폼 검증
class FormValidator {
  static validate(formData) {
    const errors = {};

    if (!formData.name || formData.name.trim() === "") {
      errors.name = "이름을 입력해주세요";
    }

    if (!formData.email || !this.isValidEmail(formData.email)) {
      errors.email = "유효한 이메일을 입력해주세요";
    }

    if (!formData.phone || !this.isValidPhone(formData.phone)) {
      errors.phone = "유효한 전화번호를 입력해주세요";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPhone(phone) {
    const phoneRegex = /^(\d{3}[-]?\d{3,4}[-]?\d{4}|\d{10,11})$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  }
}

// 날짜 포매팅 유틸
const DateUtils = {
  format: (date, format = "YYYY-MM-DD") => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    return format
      .replace("YYYY", year)
      .replace("MM", month)
      .replace("DD", day)
      .replace("HH", hours)
      .replace("mm", minutes);
  },

  formatRelative: (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    if (seconds < 60) return "방금 전";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}일 전`;

    return DateUtils.format(date, "YYYY-MM-DD");
  },
};
