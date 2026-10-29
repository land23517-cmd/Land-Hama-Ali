(function () {
  "use strict";

  var bookingDialog = document.getElementById("booking-dialog");
  var adminDialog = document.getElementById("admin-dialog");
  var loginForm = document.getElementById("admin-login-form");
  var setupForm = document.getElementById("admin-setup-form");
  var adminMessage = document.querySelector(".admin-message");
  var adminBookings = document.querySelector(".admin-bookings");
  var bookingList = document.querySelector(".admin-booking-list");
  var allBookings = [];
  var activeFilter = "all";
  var searchTerm = "";
  var moneyFormat = new Intl.NumberFormat("en-IQ", { style: "currency", currency: "IQD", maximumFractionDigits: 0 });

  async function request(url, options) {
    var response = await fetch(url, Object.assign({ credentials: "same-origin" }, options || {}));
    var data = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error(data.error || "The request could not be completed.");
    return data;
  }

  function setMessage(element, message, isSuccess) {
    element.textContent = message || "";
    element.classList.toggle("success", !!isSuccess);
  }

  function openDialog(dialog) {
    if (dialog && !dialog.open) dialog.showModal();
  }

  document.querySelectorAll(".booking-open").forEach(function (button) {
    button.addEventListener("click", function () { openDialog(bookingDialog); });
  });

  document.querySelector(".dialog-close").addEventListener("click", function () { bookingDialog.close(); });
  bookingDialog.addEventListener("click", function (event) {
    if (event.target === bookingDialog) bookingDialog.close();
  });

  function showLogin() {
    adminDialog.classList.remove("dashboard-open");
    loginForm.hidden = false;
    setupForm.hidden = true;
    adminBookings.hidden = true;
    document.getElementById("admin-title").textContent = "Admin login";
  }

  async function showAdminDashboard() {
    loginForm.hidden = true;
    setupForm.hidden = true;
    adminBookings.hidden = false;
    adminDialog.classList.add("dashboard-open");
    document.getElementById("admin-title").textContent = "Bookings overview";
    try {
      allBookings = await request("/api/admin/bookings");
      renderDashboard();
    } catch (error) {
      showLogin();
      setMessage(adminMessage, error.message);
    }
  }

  function formatMoney(amount) {
    return moneyFormat.format(Number(amount) || 0);
  }

  function renderDashboard() {
    var counts = { all: allBookings.length, pending: 0, contacted: 0, confirmed: 0, completed: 0 };
    var quoted = 0;
    var paid = 0;
    allBookings.forEach(function (booking) {
      booking.status = ({ new: "pending", done: "completed" })[booking.status] || booking.status;
      counts[booking.status] = (counts[booking.status] || 0) + 1;
      quoted += Number(booking.amountQuoted) || 0;
      paid += Number(booking.amountPaid) || 0;
    });
    Object.keys(counts).forEach(function (key) {
      var target = document.querySelector('[data-booking-count="' + key + '"]');
      if (target) target.textContent = String(counts[key]);
    });
    document.querySelector('[data-total="quoted"]').textContent = formatMoney(quoted);
    document.querySelector('[data-total="paid"]').textContent = formatMoney(paid);
    document.querySelector('[data-total="balance"]').textContent = formatMoney(Math.max(0, quoted - paid));
    document.querySelector('[data-total="active"]').textContent = String(allBookings.filter(function (booking) { return booking.status !== "completed"; }).length);

    var filterNames = { all: "ALL REQUESTS", pending: "PENDING", contacted: "CONTACTED", confirmed: "CONFIRMED", completed: "COMPLETED" };
    document.querySelector(".admin-current-filter").textContent = filterNames[activeFilter];
    var filtered = allBookings.filter(function (booking) {
      var matchesStatus = activeFilter === "all" || booking.status === activeFilter;
      var searchable = [booking.name, booking.city, booking.phone, booking.email, booking.service].join(" ").toLowerCase();
      return matchesStatus && searchable.includes(searchTerm);
    });
    document.querySelector(".admin-result-count").textContent = String(filtered.length);
    bookingList.replaceChildren();
    if (!filtered.length) {
      var empty = document.createElement("p");
      empty.className = "admin-empty";
      empty.textContent = allBookings.length ? "No enquiries match this view." : "No booking requests yet. New enquiries will appear here.";
      bookingList.appendChild(empty);
      return;
    }
    filtered.forEach(renderBooking);
  }

  document.querySelectorAll(".admin-filter").forEach(function (button) {
    button.addEventListener("click", function () {
      activeFilter = button.dataset.filter;
      document.querySelectorAll(".admin-filter").forEach(function (item) { item.classList.toggle("active", item === button); });
      renderDashboard();
    });
  });
  document.querySelector(".admin-search input").addEventListener("input", function (event) {
    searchTerm = event.target.value.trim().toLowerCase();
    renderDashboard();
  });
  document.querySelector(".admin-refresh").addEventListener("click", async function () {
    var button = document.querySelector(".admin-refresh");
    button.classList.add("refreshing");
    try {
      allBookings = await request("/api/admin/bookings");
      renderDashboard();
    } catch (error) {
      setMessage(adminMessage, error.message);
    } finally {
      button.classList.remove("refreshing");
    }
  });

  function renderBooking(booking) {
    var card = document.createElement("article");
    card.className = "admin-booking-card";
    card.dataset.status = booking.status;
    var top = document.createElement("div");
    top.className = "booking-card-top";
    var service = document.createElement("span");
    service.className = "booking-service-tag";
    service.textContent = booking.service;
    var badge = document.createElement("span");
    badge.className = "status-badge status-" + booking.status;
    badge.textContent = booking.status;
    var heading = document.createElement("h4");
    heading.textContent = booking.name;
    top.append(service, badge);
    card.append(top, heading);

    var details = [
      ["Received", new Date(booking.createdAt).toLocaleString()],
      ["Location", booking.city],
      ["Phone", booking.phone],
      ["Email", booking.email]
    ];
    if (booking.details) details.push(["Brief", booking.details]);
    var detailGrid = document.createElement("div");
    detailGrid.className = "booking-detail-grid";
    details.forEach(function (pair) {
      var detail = document.createElement("div");
      detail.className = "booking-detail";
      var label = document.createElement("span");
      label.textContent = pair[0];
      var value = document.createElement("p");
      value.textContent = pair[1];
      detail.append(label, value);
      detailGrid.appendChild(detail);
    });
    card.appendChild(detailGrid);

    if (booking.photos && booking.photos.length) {
      var photos = document.createElement("div");
      photos.className = "admin-photos";
      booking.photos.forEach(function (photo) {
        var link = document.createElement("a");
        link.href = "/api/admin/bookings/" + encodeURIComponent(booking.id) + "/photos/" + encodeURIComponent(photo.storedName);
        link.target = "_blank";
        link.rel = "noopener";
        link.setAttribute("aria-label", "Open booking photo " + photo.name);
        var image = document.createElement("img");
        image.src = link.href;
        image.alt = photo.name;
        link.appendChild(image);
        photos.appendChild(link);
      });
      card.appendChild(photos);
    }

    var actions = document.createElement("div");
    actions.className = "admin-actions";
    var statusField = document.createElement("label");
    statusField.className = "finance-field";
    statusField.textContent = "PROJECT STATUS";
    var status = document.createElement("select");
    status.setAttribute("aria-label", "Booking status");
    [["pending", "Pending"], ["contacted", "Contacted"], ["confirmed", "Confirmed"], ["completed", "Completed"]].forEach(function (entry) {
      var option = document.createElement("option");
      option.value = entry[0];
      option.textContent = entry[1];
      status.appendChild(option);
    });
    status.value = booking.status;
    statusField.appendChild(status);

    var quoteField = document.createElement("label");
    quoteField.className = "finance-field";
    quoteField.textContent = "PROJECT PRICE · IQD";
    var quote = document.createElement("input");
    quote.type = "number";
    quote.min = "0";
    quote.step = "1000";
    quote.value = String(booking.amountQuoted || 0);
    quote.setAttribute("aria-label", "Project price");
    quoteField.appendChild(quote);

    var paidField = document.createElement("label");
    paidField.className = "finance-field";
    paidField.textContent = "AMOUNT PAID · IQD";
    var paid = document.createElement("input");
    paid.type = "number";
    paid.min = "0";
    paid.step = "1000";
    paid.value = String(booking.amountPaid || 0);
    paid.setAttribute("aria-label", "Amount paid");
    paidField.appendChild(paid);

    var balance = document.createElement("div");
    balance.className = "finance-balance";
    var balanceLabel = document.createElement("span");
    balanceLabel.textContent = "REMAINING";
    var balanceValue = document.createElement("strong");
    function updateBalance() {
      balanceValue.textContent = formatMoney(Math.max(0, Number(quote.value) - Number(paid.value)));
    }
    quote.addEventListener("input", updateBalance);
    paid.addEventListener("input", updateBalance);
    updateBalance();
    balance.append(balanceLabel, balanceValue);

    var save = document.createElement("button");
    save.type = "button";
    save.className = "admin-save";
    save.textContent = "SAVE CHANGES";
    save.addEventListener("click", async function () {
      save.disabled = true;
      try {
        await request("/api/admin/bookings/" + encodeURIComponent(booking.id), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: status.value, amountQuoted: quote.value, amountPaid: paid.value })
        });
        booking.status = status.value;
        booking.amountQuoted = Number(quote.value);
        booking.amountPaid = Number(paid.value);
        renderDashboard();
      } catch (error) {
        save.textContent = "RETRY";
        setMessage(adminMessage, error.message);
      } finally {
        save.disabled = false;
      }
    });
    actions.append(statusField, quoteField, paidField, balance, save);
    card.append(actions);
    bookingList.appendChild(card);
  }

  document.querySelector(".admin-login-trigger").addEventListener("click", async function () {
    document.body.classList.remove("menu-open");
    var menuToggle = document.querySelector(".nav-toggle");
    if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
    setTimeout(function () { openDialog(adminDialog); }, 850);
    setMessage(adminMessage, "");
    try {
      var state = await request("/api/admin/status");
      if (state.setupRequired) {
        adminDialog.classList.remove("dashboard-open");
        loginForm.hidden = true;
        setupForm.hidden = false;
        adminBookings.hidden = true;
        document.getElementById("admin-title").textContent = "Create admin login";
      } else if ((await request("/api/admin/session")).authenticated) {
        await showAdminDashboard();
      } else {
        showLogin();
      }
    } catch (error) {
      setMessage(adminMessage, error.message);
    }
  });

  setupForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    var values = new FormData(setupForm);
    try {
      await request("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: values.get("username"), password: values.get("password") })
      });
      setupForm.reset();
      setMessage(adminMessage, "Admin login created.", true);
      await showAdminDashboard();
    } catch (error) {
      setMessage(adminMessage, error.message);
    }
  });

  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    var values = new FormData(loginForm);
    try {
      await request("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: values.get("username"), password: values.get("password") })
      });
      loginForm.reset();
      setMessage(adminMessage, "");
      await showAdminDashboard();
    } catch (error) {
      setMessage(adminMessage, error.message);
    }
  });

  document.querySelectorAll(".admin-dialog-close").forEach(function (button) {
    button.addEventListener("click", function () { adminDialog.close(); });
  });
  adminDialog.addEventListener("click", function (event) {
    if (event.target === adminDialog) adminDialog.close();
  });
  document.querySelector(".admin-logout").addEventListener("click", async function () {
    try { await request("/api/admin/logout", { method: "POST" }); } catch (_error) {}
    showLogin();
    adminDialog.close();
  });
})();