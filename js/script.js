// SÉYRA — shared site behaviour

document.addEventListener('DOMContentLoaded', function () {

  // Navbar background on scroll
  var nav = document.querySelector('.navbar-seyra');
  function onScroll() {
    if (!nav) return;
    if (window.scrollY > 40) {
      nav.classList.add('is-scrolled');
    } else {
      nav.classList.remove('is-scrolled');
    }
  }
  onScroll();
  window.addEventListener('scroll', onScroll);

  // Close mobile menu after tapping a link
  var navLinks = document.querySelectorAll('.navbar-collapse .nav-link, .navbar-collapse .dropdown-item');
  var collapseEl = document.querySelector('.navbar-collapse');
  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      if (collapseEl && collapseEl.classList.contains('show') && window.bootstrap) {
        var bsCollapse = window.bootstrap.Collapse.getOrCreateInstance(collapseEl);
        bsCollapse.hide();
      }
    });
  });

  // Quick-order buttons: prefill a WhatsApp message with the item name
  var orderButtons = document.querySelectorAll('[data-order-item]');
  orderButtons.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var item = btn.getAttribute('data-order-item');
      var msg = encodeURIComponent('Hello SÉYRA, I would like to order: ' + item + '. Please share availability and delivery details.');
      window.open('https://wa.me/233537732901?text=' + msg, '_blank');
    });
  });

  // Product filters, search and sort on the shop page.
  var productGrid = document.getElementById('productGrid');
  if (productGrid) {
    var productCards = Array.from(productGrid.querySelectorAll('[data-product-card]'));
    var filterButtons = document.querySelectorAll('[data-filter]');
    var searchInput = document.getElementById('productSearch');
    var sortSelect = document.getElementById('productSort');
    var productCount = document.getElementById('productCount');
    var activeFilter = 'all';

    function updateProducts() {
      var query = searchInput ? searchInput.value.trim().toLowerCase() : '';
      var visibleCount = 0;
      productCards.forEach(function (card) {
        var categoryMatch = activeFilter === 'all' || card.dataset.category === activeFilter;
        var searchMatch = !query || card.dataset.name.toLowerCase().includes(query) || card.textContent.toLowerCase().includes(query);
        card.hidden = !(categoryMatch && searchMatch);
        if (!card.hidden) visibleCount += 1;
      });
      if (productCount) productCount.textContent = visibleCount + (visibleCount === 1 ? ' product' : ' products');
    }

    filterButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        activeFilter = button.dataset.filter;
        filterButtons.forEach(function (filterButton) {
          var selected = filterButton === button;
          filterButton.classList.toggle('active', selected);
          filterButton.setAttribute('aria-pressed', String(selected));
        });
        updateProducts();
      });
    });
    if (searchInput) searchInput.addEventListener('input', updateProducts);
    if (sortSelect) {
      sortSelect.addEventListener('change', function () {
        var sortValue = sortSelect.value;
        productCards.sort(function (a, b) {
          if (sortValue === 'name') return a.dataset.name.localeCompare(b.dataset.name);
          if (sortValue === 'price-low' || sortValue === 'price-high') {
            var priceA = Number(a.dataset.price);
            var priceB = Number(b.dataset.price);
            var knownA = Number.isFinite(priceA) && a.dataset.price !== '';
            var knownB = Number.isFinite(priceB) && b.dataset.price !== '';
            if (knownA !== knownB) return knownA ? -1 : 1;
            if (knownA) return sortValue === 'price-low' ? priceA - priceB : priceB - priceA;
          }
          return Number(a.dataset.originalOrder) - Number(b.dataset.originalOrder);
        }).forEach(function (card, index) {
          if (!card.dataset.originalOrder) card.dataset.originalOrder = String(index);
          productGrid.appendChild(card);
        });
      });
      productCards.forEach(function (card, index) { card.dataset.originalOrder = String(index); });
    }
    updateProducts();
  }

  // Saved order list: stays on this device and is only sent when the customer chooses WhatsApp.
  var orderListPanel = document.getElementById('orderListPanel');
  if (orderListPanel) {
    var storageKey = 'seyra-order-list-v1';
    var orderList = {};
    try { orderList = JSON.parse(window.localStorage.getItem(storageKey) || '{}') || {}; } catch (error) { orderList = {}; }
    var orderListItems = document.getElementById('orderListItems');
    var orderCount = document.getElementById('orderCount');
    var sendOrderList = document.getElementById('sendOrderList');
    var clearOrderList = document.getElementById('clearOrderList');

    function saveOrderList() {
      try { window.localStorage.setItem(storageKey, JSON.stringify(orderList)); } catch (error) { /* Storage may be unavailable in private browsing. */ }
    }

    function renderOrderList() {
      var names = Object.keys(orderList);
      var quantity = names.reduce(function (total, name) { return total + orderList[name]; }, 0);
      if (orderCount) orderCount.textContent = String(quantity);
      if (sendOrderList) sendOrderList.disabled = names.length === 0;
      if (clearOrderList) clearOrderList.hidden = names.length === 0;
      if (!orderListItems) return;
      orderListItems.replaceChildren();
      if (!names.length) {
        var emptyMessage = document.createElement('li');
        emptyMessage.className = 'text-secondary small';
        emptyMessage.textContent = 'Your list is empty. Add an item above to get started.';
        orderListItems.appendChild(emptyMessage);
        return;
      }
      names.forEach(function (name) {
        var row = document.createElement('li');
        var label = document.createElement('span');
        label.className = 'order-item-name';
        label.textContent = name;
        var actions = document.createElement('span');
        actions.className = 'order-item-actions';
        var decrease = document.createElement('button');
        decrease.type = 'button'; decrease.className = 'quantity-button'; decrease.textContent = '−'; decrease.setAttribute('aria-label', 'Remove one ' + name);
        decrease.addEventListener('click', function () { orderList[name] -= 1; if (orderList[name] < 1) delete orderList[name]; saveOrderList(); renderOrderList(); });
        var qty = document.createElement('span'); qty.textContent = String(orderList[name]); qty.setAttribute('aria-label', 'Quantity');
        var increase = document.createElement('button');
        increase.type = 'button'; increase.className = 'quantity-button'; increase.textContent = '+'; increase.setAttribute('aria-label', 'Add one ' + name);
        increase.addEventListener('click', function () { orderList[name] += 1; saveOrderList(); renderOrderList(); });
        var remove = document.createElement('button');
        remove.type = 'button'; remove.className = 'remove-item'; remove.textContent = 'Remove';
        remove.addEventListener('click', function () { delete orderList[name]; saveOrderList(); renderOrderList(); });
        actions.append(decrease, qty, increase, remove);
        row.append(label, actions);
        orderListItems.appendChild(row);
      });
    }

    document.querySelectorAll('[data-cart-item]').forEach(function (button) {
      button.addEventListener('click', function () {
        var name = button.dataset.cartItem;
        orderList[name] = (orderList[name] || 0) + 1;
        saveOrderList();
        renderOrderList();
        var originalLabel = button.innerHTML;
        button.innerHTML = '<i class="bi bi-check2"></i> Added to order list';
        window.setTimeout(function () { button.innerHTML = originalLabel; }, 1500);
      });
    });
    if (clearOrderList) clearOrderList.addEventListener('click', function () { orderList = {}; saveOrderList(); renderOrderList(); });
    if (sendOrderList) sendOrderList.addEventListener('click', function () {
      var orderLines = Object.keys(orderList).map(function (name) { return '• ' + name + ' × ' + orderList[name]; });
      var message = 'Hello SÉYRA, I would like to enquire about this order:\n' + orderLines.join('\n') + '\n\nPlease confirm availability, final prices, sizes and delivery fee before payment.';
      window.open('https://wa.me/233537732901?text=' + encodeURIComponent(message), '_blank', 'noopener');
    });
    renderOrderList();
  }

  // Contact page: build a WhatsApp message from the enquiry form instead of a backend
  var enquiryForm = document.getElementById('enquiryForm');
  if (enquiryForm) {
    enquiryForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('fName').value.trim();
      var item = document.getElementById('fItem').value.trim();
      var loc = document.getElementById('fLocation').value.trim();
      var note = document.getElementById('fNote').value.trim();

      var feedback = document.getElementById('formFeedback');

      if (!name || !item) {
        feedback.textContent = 'Please add your name and what you would like to order.';
        feedback.className = 'mt-3 small text-danger';
        return;
      }

      var lines = [
        'Hello SÉYRA, I would like to place an order.',
        'Name: ' + name,
        'Item(s): ' + item
      ];
      if (loc) lines.push('Delivery location: ' + loc);
      if (note) lines.push('Note: ' + note);

      var message = encodeURIComponent(lines.join('\n'));
      feedback.textContent = 'Opening WhatsApp with your order details…';
      feedback.className = 'mt-3 small text-success';
      window.open('https://wa.me/233537732901?text=' + message, '_blank');
      enquiryForm.reset();
    });
  }

  // Footer year
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

});
