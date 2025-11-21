/**
 * Main Application JavaScript
 * Organized and refactored for better maintainability
 */

// =============================================================================
// CONFIGURATION & CONSTANTS
// =============================================================================
const CONFIG = {
  API_BASE: "http://localhost:3000/api",
  ENDPOINTS: {
    register: "/api/auth/register",
    login: "http://localhost:3000/api/auth/login",
    logout: "/api/auth/logout",
  },
  STORAGE_KEYS: {
    USER: "user",
  },
  HOURLY_WAGE: 29000,
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
const Utils = {
  // Generic API request handler
  async makeRequest(url, method = "GET", data = null) {
    try {
      const options = {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (data) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP Error: ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error("Request error:", error);
      throw error;
    }
  },

  // DOM utilities
  getElement(selector) {
    return (
      document.getElementById(selector) || document.querySelector(selector)
    );
  },

  getAllElements(selector) {
    return document.querySelectorAll(selector);
  },

  // Show/hide elements
  showElement(element) {
    if (element) element.classList.remove("hidden");
  },

  hideElement(element) {
    if (element) element.classList.add("hidden");
  },

  // Format currency
  formatCurrency(amount) {
    return amount.toLocaleString("vi-VN") + " VND";
  },

  // Debounce function
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
};

// =============================================================================
// AUTHENTICATION MODULE
// =============================================================================
const Auth = {
  // Initialize auth module
  init() {
    this.bindEvents();
  },

  // Bind authentication events
  bindEvents() {
    const registerForm = Utils.getElement("registerForm");
    const loginForm = Utils.getElement("loginForm");

    if (registerForm) {
      registerForm.addEventListener("submit", this.handleRegister.bind(this));
    }

    if (loginForm) {
      loginForm.addEventListener("submit", this.handleLogin.bind(this));
    }
  },

  // Handle user registration
  async handleRegister(e) {
    e.preventDefault();

    const username = Utils.getElement("username").value.trim();
    const password = Utils.getElement("password").value;

    if (!username || !password) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    try {
      const result = await Utils.makeRequest(
        CONFIG.ENDPOINTS.register,
        "POST",
        {
          username,
          password,
        }
      );

      alert(result.message || "Đăng ký thành công!");
      window.location.href = "/login";
    } catch (error) {
      alert(error.message || "Đăng ký thất bại!");
    }
  },

  // Handle user login
  async handleLogin(e) {
    e.preventDefault();

    const username = Utils.getElement("username").value.trim();
    const password = Utils.getElement("password").value;
    const errorElement = Utils.getElement("error-message");
    const submitBtn = e.target.querySelector('button[type="submit"]');

    if (!username || !password) {
      this.showError(errorElement, "Vui lòng điền đầy đủ thông tin!");
      return;
    }

    try {
      // Show loading state
      this.setLoadingState(submitBtn, true);
      this.hideError(errorElement);

      const result = await Utils.makeRequest(CONFIG.ENDPOINTS.login, "POST", {
        username,
        password,
      });

      // Save user data
      sessionStorage.setItem(
        CONFIG.STORAGE_KEYS.USER,
        JSON.stringify(result.user)
      );

      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Login error:", error);
      this.showError(errorElement, error.message);
    } finally {
      this.setLoadingState(submitBtn, false);
    }
  },

  // Handle logout
  async handleLogout() {
    try {
      await Utils.makeRequest(CONFIG.ENDPOINTS.logout, "POST");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      sessionStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
      window.location.href = "../frontend/login.html";
    }
  },

  // UI helper methods
  setLoadingState(button, isLoading) {
    if (!button) return;

    if (isLoading) {
      button.disabled = true;
      button.innerHTML = '<span class="spinner"></span> Đang đăng nhập...';
    } else {
      button.disabled = false;
      button.textContent = "Đăng nhập";
    }
  },

  showError(errorElement, message) {
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = "block";
    }
  },

  hideError(errorElement) {
    if (errorElement) {
      errorElement.style.display = "none";
    }
  },
};

// =============================================================================
// NAVIGATION MODULE
// =============================================================================
const Navigation = {
  init() {
    this.navButtons = Utils.getAllElements(".nav-btn");
    this.sections = Utils.getAllElements(".section");
    this.bindEvents();
  },

  bindEvents() {
    this.navButtons.forEach((btn) => {
      btn.addEventListener("click", this.handleNavigation.bind(this, btn));
    });

    // Handle add task button navigation
    const addTaskBtn = Utils.getElement("add-task-btn");
    if (addTaskBtn) {
      addTaskBtn.addEventListener("click", () => {
        this.navigateToSection("work");
      });
    }
  },

  handleNavigation(btn) {
    const targetSection = btn.dataset.section;
    this.navigateToSection(targetSection);
  },

  navigateToSection(sectionName) {
    // Update navigation buttons state
    this.navButtons.forEach((btn) => {
      btn.classList.remove("bg-gray-300", "text-gray-900");
      btn.classList.add("text-gray-600", "hover:bg-gray-200");
      btn.removeAttribute("aria-current");
    });

    // Find and activate target button
    const targetBtn = document.querySelector(`[data-section="${sectionName}"]`);
    if (targetBtn) {
      targetBtn.classList.add("bg-gray-300", "text-gray-900");
      targetBtn.classList.remove("text-gray-600", "hover:bg-gray-200");
      targetBtn.setAttribute("aria-current", "page");
    }

    // Update sections visibility
    this.sections.forEach((section) => {
      section.classList.remove("active");
    });

    const targetSection = Utils.getElement(`${sectionName}-section`);
    if (targetSection) {
      targetSection.classList.add("active");
    }
    if (sectionName === "schedule") {
      ScheduleRenderer.render();
    }

    // Scroll to top
    window.scrollTo(0, 0);
  },
};

// =============================================================================
// TAB MANAGEMENT MODULE
// =============================================================================
const TabManager = {
  init() {
    this.initSalaryTabs();
  },

  initSalaryTabs() {
    const salaryTab = Utils.getElement("salary-tab");
    const salaryStatsTab = Utils.getElement("salary-stats-tab");
    const salaryContent = Utils.getElement("salary-content");
    const salaryStatsContent = Utils.getElement("stats-content");

    if (
      !salaryTab ||
      !salaryStatsTab ||
      !salaryContent ||
      !salaryStatsContent
    ) {
      return;
    }

    salaryTab.addEventListener("click", () => {
      this.activateTab(salaryTab, salaryStatsTab);
      this.showContent(salaryContent, salaryStatsContent);
    });

    salaryStatsTab.addEventListener("click", () => {
      this.activateTab(salaryStatsTab, salaryTab);
      this.showContent(salaryStatsContent, salaryContent);
    });
  },

  activateTab(activeTab, inactiveTab) {
    // Activate target tab
    activeTab.classList.remove("text-gray-700", "bg-gray-200");
    activeTab.classList.add("text-white", "bg-blue-600");

    // Deactivate other tab
    inactiveTab.classList.remove("text-white", "bg-blue-600");
    inactiveTab.classList.add("text-gray-700", "bg-gray-200");
  },

  showContent(activeContent, inactiveContent) {
    Utils.showElement(activeContent);
    Utils.hideElement(inactiveContent);
  },
};

// =============================================================================
// MODAL MANAGEMENT MODULE
// =============================================================================
const ModalManager = {
  init() {
    this.initAIModal();
    this.initTaskModal();
    this.initSettingsModal();
    this.bindGlobalEvents();
  },

  initAIModal() {
    const aiBtn = Utils.getElement("ai-consultation-btn");
    const modal = Utils.getElement("aiCriteriaModal");
    const closeBtn = Utils.getElement("closeModalBtn");
    const cancelBtn = Utils.getElement("cancelBtn");
    const submitBtn = Utils.getElement("submitBtn");

    if (aiBtn && modal) {
      aiBtn.addEventListener("click", () => this.showModal(modal));
    }

    if (closeBtn)
      closeBtn.addEventListener("click", () => this.hideModal(modal));
    if (cancelBtn)
      cancelBtn.addEventListener("click", () => this.hideModal(modal));

    if (submitBtn) {
      submitBtn.addEventListener(
        "click",
        this.handleAISubmit.bind(this, modal)
      );
    }

    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) this.hideModal(modal);
      });
    }
  },

  initTaskModal() {
    const createTaskBtn =
      Utils.getElement("work-content")?.querySelector("button");
    const modal = Utils.getElement("createTaskModal");
    const closeBtn = Utils.getElement("closeCreateTaskBtn");
    const cancelBtn = Utils.getElement("cancelCreateTaskBtn");
    const form = Utils.getElement("createTaskForm");
    const hasFixedTimeCheckbox = Utils.getElement("hasFixedTime");
    const datetimeGroup = Utils.getElement("datetimeGroup");

    if (createTaskBtn && modal) {
      createTaskBtn.addEventListener("click", () => {
        this.showModal(modal);
        setTimeout(() => {
          const titleInput = Utils.getElement("taskTitle");
          if (titleInput) titleInput.focus();
        }, 300);
      });
    }

    if (closeBtn)
      closeBtn.addEventListener("click", () => this.hideModal(modal));
    if (cancelBtn)
      cancelBtn.addEventListener("click", () => this.hideModal(modal));

    if (hasFixedTimeCheckbox && datetimeGroup) {
      hasFixedTimeCheckbox.addEventListener("change", (e) => {
        if (e.target.checked) {
          datetimeGroup.classList.add("enabled");
        } else {
          datetimeGroup.classList.remove("enabled");
        }
      });
    }

    if (form) {
      form.addEventListener(
        "submit",
        this.handleTaskSubmit.bind(this, modal, form)
      );
    }

    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) this.hideModal(modal);
      });
    }

    // Add duration change listener for salary estimation
    const durationInput = Utils.getElement("taskDuration");
    if (durationInput) {
      durationInput.addEventListener("change", this.calculateEstimatedEarnings);
    }
  },

  initSettingsModal() {
    const settingsBtn = Utils.getElement("settingsBtn");
    const modal = Utils.getElement("settingsModal");
    const updateProfileBtn = Utils.getElement("updateProfileBtn");
    const logoutBtn = Utils.getElement("logoutBtn");

    if (settingsBtn && modal) {
      settingsBtn.addEventListener("click", () => this.showModal(modal));
    }

    if (updateProfileBtn) {
      updateProfileBtn.addEventListener("click", () => {
        this.hideModal(modal);
        Navigation.navigateToSection("profile");
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        this.hideModal(modal);
        Auth.handleLogout();
      });
    }

    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) this.hideModal(modal);
      });
    }
  },

  bindGlobalEvents() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const activeModals = document.querySelectorAll(".modal.show");
        activeModals.forEach((modal) => this.hideModal(modal));
      }
    });
  },

  showModal(modal) {
    if (modal) {
      modal.classList.add("show");
      document.body.style.overflow = "hidden";
    }
  },

  hideModal(modal) {
    if (modal) {
      modal.classList.remove("show");
      document.body.style.overflow = "auto";
    }
  },

  handleAISubmit(modal) {
    const formData = this.collectAIFormData();
    console.log("AI Criteria Data:", formData);
    alert("Dữ liệu tiêu chí AI đã được gửi!");
    this.hideModal(modal);
  },

  handleTaskSubmit(modal, form, e) {
    e.preventDefault();

    const formData = this.collectTaskFormData();

    if (!formData.title.trim()) {
      alert("Vui lòng nhập tiêu đề công việc!");
      Utils.getElement("taskTitle")?.focus();
      return;
    }

    console.log("Task Data:", formData);
    alert("Công việc đã được tạo thành công!");

    form.reset();
    const datetimeGroup = Utils.getElement("datetimeGroup");
    const hasFixedTimeCheckbox = Utils.getElement("hasFixedTime");

    if (datetimeGroup) datetimeGroup.classList.remove("enabled");
    if (hasFixedTimeCheckbox) hasFixedTimeCheckbox.checked = false;

    this.hideModal(modal);
  },

  collectAIFormData() {
    const formData = {
      tasks: [],
      criteria: {
        priority: Utils.getElement("priority")?.value || "",
        focus: Utils.getElement("focus")?.value || "",
        complexity: Utils.getElement("complexity")?.value || "",
        time: Utils.getElement("time")?.value || "",
        energy: Utils.getElement("energy")?.value || "",
      },
      other: [],
    };

    // Collect task checkboxes
    const taskCheckboxes = Utils.getAllElements(
      'input[type="checkbox"][id^="task"]'
    );
    taskCheckboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        formData.tasks.push({
          id: checkbox.id,
          name: checkbox.nextElementSibling?.textContent || "",
        });
      }
    });

    // Collect other checkboxes
    const otherCheckboxes = Utils.getAllElements(
      'input[type="checkbox"][id^="other"]'
    );
    otherCheckboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        formData.other.push({
          id: checkbox.id,
          text: checkbox.parentElement?.textContent?.trim() || "",
        });
      }
    });

    return formData;
  },

  collectTaskFormData() {
    const hasFixedTimeCheckbox = Utils.getElement("hasFixedTime");
    const hasFixedTime = hasFixedTimeCheckbox?.checked || false;

    return {
      title: Utils.getElement("taskTitle")?.value || "",
      completed: Utils.getElement("completedStatus")?.checked || false,
      category: Utils.getElement("taskCategory")?.value || "",
      duration: Utils.getElement("taskDuration")?.value || "",
      description: Utils.getElement("taskDescription")?.value || "",
      hasFixedTime,
      date: hasFixedTime ? Utils.getElement("taskDate")?.value : null,
      time: hasFixedTime ? Utils.getElement("taskTime")?.value : null,
      hourlyWage: CONFIG.HOURLY_WAGE,
    };
  },

  calculateEstimatedEarnings() {
    const durationInput = Utils.getElement("taskDuration");
    if (!durationInput) return;

    const duration = parseInt(durationInput.value) || 0;
    const earnings = (duration / 60) * CONFIG.HOURLY_WAGE;

    if (duration > 0) {
      console.log(`Estimated earnings: ${Utils.formatCurrency(earnings)}`);
    }
  },
};

// =============================================================================
// SALARY MODULE
// =============================================================================
const SalaryManager = {
  init() {
    this.bindEvents();
  },

  bindEvents() {
    // Add event listeners for salary calculation inputs
    const salaryInputs = Utils.getAllElements(
      "#salary-content input, #salary-content select"
    );
    salaryInputs.forEach((input) => {
      input.addEventListener(
        "change",
        Utils.debounce(this.updateSalarySummary.bind(this), 300)
      );
    });
  },

  addWorkShift() {
    console.log("Thêm ca làm việc mới");
    // Implementation for adding work shift
    this.updateSalarySummary();
  },

  deleteWorkShift(element) {
    if (confirm("Bạn có chắc chắn muốn xóa ca làm này?")) {
      const shiftElement = element.closest(".grid, .work-shift");
      if (shiftElement) {
        shiftElement.remove();
        this.updateSalarySummary();
      }
    }
  },

  updateSalarySummary() {
    console.log("Cập nhật tổng kết lương");
    // Implementation for updating salary summary
  },
};

// =============================================================================
// CALENDAR MODULE
// =============================================================================
const CalendarModule = {
  init() {
    console.log("Calendar module initialized");
    // Calendar-specific implementation
  },

  initializeWhenActive() {
    const scheduleSection = Utils.getElement("schedule-section");
    if (!scheduleSection) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class" &&
          scheduleSection.classList.contains("active")
        ) {
          this.init();
        }
      });
    });

    observer.observe(scheduleSection, {
      attributes: true,
      attributeFilter: ["class"],
    });
  },
};

// =============================================================================
// APPLICATION INITIALIZATION
// =============================================================================
const App = {
  init() {
    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () =>
        this.initializeModules()
      );
    } else {
      this.initializeModules();
    }
  },

  initializeModules: async function () {
    try {
      await this.loadSidebar();
      Auth.init();
      Navigation.init();
      TabManager.init();
      ModalManager.init();
      SalaryManager.init();
      CalendarModule.initializeWhenActive();

      console.log("Application initialized successfully");
    } catch (error) {
      console.error("Error initializing application:", error);
    }
  },
  loadSidebar: async function () {
    const placeholder = Utils.getElement("sidebar-placeholder");
    if (!placeholder) return;

    try {
      const response = await fetch("components/sidebar.html");
      const html = await response.text();
      placeholder.innerHTML = html;

      // Khởi tạo lại sự kiện sau khi sidebar được chèn vào DOM
      this.initSidebarEvents();
    } catch (error) {
      console.error("Không thể tải sidebar:", error);
    }
  },
};

// =============================================================================
// ToiUuIndex
// =============================================================================
const ScheduleRenderer = {
  days: ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"],
  hours: Array.from({ length: 13 }, (_, i) => `${i + 7}h`), // 7h đến 19h

  sampleData: {
    // Mô phỏng công việc theo từng ngày-giờ
    "Thứ 2": { "7h": "Gym", "9h": "Họp" },
    "Thứ 4": { "10h": "Học" },
    "Thứ 7": { "17h": "Đi chơi" },
  },

  render() {
    const container = Utils.getElement("schedule-grid-container");
    if (!container) return;

    container.innerHTML = "";

    this.hours.forEach((hour) => {
      this.days.forEach((day) => {
        const task = this.sampleData[day]?.[hour] || "";
        const div = document.createElement("div");

        div.className =
          "bg-gray-100 text-xs text-gray-700 rounded-md text-center py-1 px-2";
        div.textContent = task || hour;

        container.appendChild(div);
      });
    });
  },
};

// =============================================================================
// Login
// =============================================================================

// =============================================================================
// START APPLICATION
// =============================================================================
App.init();
