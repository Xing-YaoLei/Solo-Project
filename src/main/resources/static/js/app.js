(function () {
  "use strict";

  var SIDEBAR_KEY = "sidebar_hidden";

  function $(selector, parent) {
    return (parent || document).querySelector(selector);
  }

  function $$(selector, parent) {
    return (parent || document).querySelectorAll(selector);
  }

  function initSidebarToggle() {
    var hamburger = $(".navbar__hamburger");
    var sidebar = $(".sidebar");
    if (!hamburger || !sidebar) return;

    var saved = localStorage.getItem(SIDEBAR_KEY);
    if (saved === "true") {
      sidebar.classList.add("sidebar--hidden");
    }

    hamburger.addEventListener("click", function () {
      var isHidden = sidebar.classList.toggle("sidebar--hidden");
      localStorage.setItem(SIDEBAR_KEY, isHidden);

      if (window.innerWidth <= 768) {
        sidebar.classList.toggle("sidebar--mobile-open", !isHidden);
      }
    });

    document.addEventListener("click", function (e) {
      if (
        window.innerWidth <= 768 &&
        sidebar.classList.contains("sidebar--mobile-open") &&
        !sidebar.contains(e.target) &&
        !hamburger.contains(e.target)
      ) {
        sidebar.classList.remove("sidebar--mobile-open");
        sidebar.classList.add("sidebar--hidden");
        localStorage.setItem(SIDEBAR_KEY, "true");
      }
    });
  }

  function initCollapsibles() {
    $$("[data-collapsible]").forEach(function (el) {
      var title = el.querySelector(".sidebar__title, .collapsible-trigger");
      var content = el.querySelector(".sidebar__links, .collapsible-content");
      if (!title || !content) return;

      var isOpen = el.dataset.collapsible !== "closed";
      if (!isOpen) {
        content.classList.add("sidebar__links--collapsed");
      } else {
        if (title.classList.contains("sidebar__title")) {
          title.classList.add("sidebar__title--open");
        }
      }

      title.addEventListener("click", function () {
        var visible = !content.classList.toggle("sidebar__links--collapsed");
        if (title.classList.contains("sidebar__title")) {
          title.classList.toggle("sidebar__title--open", visible);
        }
      });
    });
  }

  function validateRequired(input) {
    if (!input.value.trim()) {
      input.setCustomValidity("此字段为必填项");
      return false;
    }
    input.setCustomValidity("");
    return true;
  }

  function validatePrice(input) {
    if (!input.value.trim()) return true;
    var val = parseFloat(input.value);
    if (isNaN(val) || val < 0) {
      input.setCustomValidity("请输入有效的价格");
      return false;
    }
    input.setCustomValidity("");
    return true;
  }

  function validateVIN(input) {
    if (!input.value.trim()) return true;
    if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(input.value)) {
      input.setCustomValidity("VIN 必须为17位字母数字（不含 I、O、Q）");
      return false;
    }
    input.setCustomValidity("");
    return true;
  }

  function initFormValidation() {
    $$("form[data-validate]").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        var valid = true;

        $$("[required]", form).forEach(function (input) {
          if (!validateRequired(input)) valid = false;
        });

        $$("[data-validate-price]", form).forEach(function (input) {
          if (!validatePrice(input)) valid = false;
        });

        $$("[data-validate-vin]", form).forEach(function (input) {
          if (!validateVIN(input)) valid = false;
        });

        if (!valid) {
          e.preventDefault();
          var first = form.querySelector(":invalid");
          if (first) first.focus();
        }
      });

      $$("[required]", form).forEach(function (input) {
        input.addEventListener("blur", function () {
          validateRequired(input);
        });
      });

      $$("[data-validate-price]", form).forEach(function (input) {
        input.addEventListener("blur", function () {
          validatePrice(input);
        });
      });

      $$("[data-validate-vin]", form).forEach(function (input) {
        input.addEventListener("blur", function () {
          validateVIN(input);
        });
      });
    });
  }

  function initConfirmDialogs() {
    $$(".js-confirm").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        var msg = form.dataset.confirm || "确定要执行此操作吗？";
        if (!confirm(msg)) {
          e.preventDefault();
        }
      });
    });

    $$(".js-confirm-link").forEach(function (link) {
      link.addEventListener("click", function (e) {
        var msg = link.dataset.confirm || "确定要执行此操作吗？";
        if (!confirm(msg)) {
          e.preventDefault();
        }
      });
    });
  }

  function initTabs() {
    $$(".tabs").forEach(function (tabs) {
      var links = $$(".tabs__link", tabs);
      var container = tabs.parentElement;

      links.forEach(function (link) {
        link.addEventListener("click", function (e) {
          e.preventDefault();
          var targetId = link.dataset.tab || link.getAttribute("href");

          links.forEach(function (l) {
            l.classList.remove("tabs__link--active");
          });
          link.classList.add("tabs__link--active");

          $$(".tab-panel", container).forEach(function (panel) {
            panel.classList.remove("tab-panel--active");
          });

          var target = $(targetId);
          if (target) {
            target.classList.add("tab-panel--active");
          }
        });
      });
    });
  }

  function initAutoSubmitFilters() {
    $$("[data-auto-submit]").forEach(function (el) {
      el.addEventListener("change", function () {
        var form = el.closest("form");
        if (form) form.submit();
      });
    });
  }

  function initOverdueHighlighting() {
    $$("[data-overdue]").forEach(function (row) {
      if (row.dataset.overdue === "true") {
        row.classList.add("row--danger");
      }
    });
  }

  function showToast(message, type) {
    var toast = document.createElement("div");
    toast.className = "toast toast--" + (type || "success");
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3200);
  }

  function initToastNotifications() {
    var params = new URLSearchParams(window.location.search);
    var successMsg = params.get("success");
    var errorMsg = params.get("error");

    if (successMsg) {
      showToast(decodeURIComponent(successMsg), "success");
    }
    if (errorMsg) {
      showToast(decodeURIComponent(errorMsg), "error");
    }

    if (successMsg || errorMsg) {
      var url = new URL(window.location);
      url.searchParams.delete("success");
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url);
    }
  }

  function initDatePickerDefaults() {
    $$('input[type="date"]').forEach(function (input) {
      if (!input.value && !input.dataset.noDefault) {
        var today = new Date().toISOString().split("T")[0];
        input.value = today;
      }
    });
  }

  function initReportLoading() {
    var reportContainer = $("[data-report]");
    if (!reportContainer) return;

    var apiUrl = reportContainer.dataset.report;
    if (!apiUrl) return;

    fetch(apiUrl)
      .then(function (res) {
        if (!res.ok) throw new Error("请求失败: " + res.status);
        return res.json();
      })
      .then(function (data) {
        renderReport(reportContainer, data);
      })
      .catch(function (err) {
        reportContainer.innerHTML =
          '<div class="alert alert--danger">加载报告数据失败: ' +
          err.message +
          "</div>";
      });
  }

  function renderReport(container, data) {
    if (!data || !data.length) {
      container.innerHTML =
        '<div class="empty-state"><div class="empty-state__icon">📊</div><div class="empty-state__text">暂无报告数据</div></div>';
      return;
    }

    var keys = Object.keys(data[0]);
    var html = '<div class="table-wrapper"><table class="table"><thead><tr>';

    keys.forEach(function (key) {
      html += "<th>" + key + "</th>";
    });
    html += "</tr></thead><tbody>";

    data.forEach(function (row) {
      html += "<tr>";
      keys.forEach(function (key) {
        html += "<td>" + (row[key] != null ? row[key] : "") + "</td>";
      });
      html += "</tr>";
    });

    html += "</tbody></table></div>";
    container.innerHTML = html;
  }

  function initStatusFlow() {
    var flow = $(".status-flow");
    if (!flow) return;

    var currentStep = flow.dataset.current;
    if (currentStep === undefined) return;

    var steps = $$(".status-flow__step", flow);
    var current = parseInt(currentStep, 10);

    steps.forEach(function (step, index) {
      var circle = $(".status-flow__circle", step);
      if (!circle) return;

      if (index < current) {
        step.classList.add("status-flow__step--done");
        circle.innerHTML = "&#10003;";
      } else if (index === current) {
        step.classList.add("status-flow__step--active");
        circle.textContent = index + 1;
      } else {
        circle.textContent = index + 1;
      }
    });

    var connectors = $$(".status-flow__connector", flow);
    connectors.forEach(function (conn, index) {
      if (index < current) {
        conn.classList.add("status-flow__connector--done");
      }
    });
  }

  function initModals() {
    $$("[data-modal-open]").forEach(function (trigger) {
      trigger.addEventListener("click", function (e) {
        e.preventDefault();
        var modalId = trigger.dataset.modalOpen;
        var modal = document.getElementById(modalId);
        if (modal) modal.classList.add("modal--open");
      });
    });

    $$("[data-modal-close]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var modal = btn.closest(".modal");
        if (modal) modal.classList.remove("modal--open");
      });
    });

    $$(".modal__backdrop").forEach(function (backdrop) {
      backdrop.addEventListener("click", function () {
        var modal = backdrop.closest(".modal");
        if (modal) modal.classList.remove("modal--open");
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        var openModal = $(".modal--open");
        if (openModal) openModal.classList.remove("modal--open");
      }
    });
  }

  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  ready(function () {
    initSidebarToggle();
    initCollapsibles();
    initFormValidation();
    initConfirmDialogs();
    initTabs();
    initAutoSubmitFilters();
    initOverdueHighlighting();
    initToastNotifications();
    initDatePickerDefaults();
    initReportLoading();
    initStatusFlow();
    initModals();
  });
})();
