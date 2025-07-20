/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const generateRoutineBtn = document.getElementById("generateRoutine");
const selectedProductsList = document.getElementById("selectedProductsList");

const workerURL = "https://new-beauty-bot.crops1023.workers.dev/";

// Persistent conversation history
const conversationHistory = [
  { role: "system", content: "You are an expert beatuy assistant with L'Oreal. You are tasked with answering follow up questions on the generated routine you make. You will only responses relevant to L'Oreal beauty products and the generated response. Keep your responses below 500 tokens. Keep your responses short and to the point. Make your responses clear and easy to read. Add emoji." }
];

// Track selected products globally
const selectedProducts = [];

/* Load product data */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Display products */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(p => `
      <article tabindex="0" class="product-card ${isSelected(p.name) ? "selected" : ""}" data-name="${p.name}" data-description="${p.description}" data-image="${p.image}">
        <img src="${p.image}" alt="${p.name} image" />
        <div class="product-info">
          <h3>${p.name}</h3>
          <button class="details-btn" aria-label="View details of ${p.name}">Details</button>
        </div>
      </article>
    `)
    .join("");

  // Add click and keyboard accessibility for product selection
  const productCards = productsContainer.querySelectorAll(".product-card");
  productCards.forEach(card => {
    card.addEventListener("click", (e) => {
      // Prevent toggling selection when clicking "Details" button
      if (e.target.classList.contains("details-btn")) return;
      toggleProductSelection(card);
    });
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleProductSelection(card);
      }
    });
  });

  // Add event listeners for details buttons
  const detailsButtons = productsContainer.querySelectorAll(".details-btn");
  detailsButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent triggering card click
      const card = btn.closest(".product-card");
      openDetailsModal(card.dataset.name, card.dataset.image, card.dataset.description);
    });
  });
}

/* Check if product is selected */
function isSelected(name) {
  return selectedProducts.some(p => p.name === name);
}

/* Toggle selection */
function toggleProductSelection(card) {
  const name = card.dataset.name;
  const description = card.dataset.description;
  const image = card.dataset.image;

  const index = selectedProducts.findIndex(p => p.name === name);

  if (index > -1) {
    // Remove product
    selectedProducts.splice(index, 1);
  } else {
    // Add product
    selectedProducts.push({ name, description, image });
  }
  updateSelectedProductsUI();
  displayProducts(currentProducts);
}

/* Update selected products UI */
function updateSelectedProductsUI() {
  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = "<p>No products selected.</p>";
    generateRoutineBtn.disabled = true;
    return;
  }
  generateRoutineBtn.disabled = false;

  selectedProductsList.innerHTML = selectedProducts
    .map(
      p => `
    <div class="product-chip" tabindex="0">
      ${p.name}
      <button class="remove-chip-btn" aria-label="Remove ${p.name}" data-name="${p.name}">✖</button>
    </div>
  `
    )
    .join("");

  // Add remove button listeners
  const removeButtons = selectedProductsList.querySelectorAll(".remove-chip-btn");
  removeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.name;
      const index = selectedProducts.findIndex(p => p.name === name);
      if (index > -1) {
        selectedProducts.splice(index, 1);
        updateSelectedProductsUI();
        displayProducts(currentProducts);
      }
    });
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        btn.click();
      }
    });
  });
}

/* Filter products by category */
function filterProducts(products, category) {
  if (!category || category === "all") {
    return products;
  }
  return products.filter(p => p.category === category);
}

/* Chat send message */
function appendMessage(role, text) {
  const message = document.createElement("div");
  message.className = role === "user" ? "user-message" : "bot-message";
  message.textContent = text;
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Fetch and display bot response */
async function fetchBotResponse(message) {
  conversationHistory.push({ role: "user", content: message });

  appendMessage("user", message);

  chatForm.querySelector("input").value = "";
  chatForm.querySelector("input").focus();

  appendMessage("bot", "Loading...");

  try {
    const res = await fetch(workerURL, {
      method: "POST",
      body: JSON.stringify({
        messages: conversationHistory,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) throw new Error("Failed to fetch response");

    const data = await res.json();

    // Remove "Loading..." placeholder
    const loadingMsg = chatWindow.querySelector(".bot-message:last-child");
    if (loadingMsg && loadingMsg.textContent === "Loading...") {
      loadingMsg.remove();
    }

    const botReply = data.choices[0].message.content;
    conversationHistory.push({ role: "assistant", content: botReply });
    appendMessage("bot", botReply);
  } catch (error) {
    const loadingMsg = chatWindow.querySelector(".bot-message:last-child");
    if (loadingMsg && loadingMsg.textContent === "Loading...") {
      loadingMsg.remove();
    }
    appendMessage("bot", "Sorry, something went wrong.");
    console.error(error);
  }
}

/* Generate routine (stub) */
function generateRoutine() {
  const routinePrompt = `Create a personalized beauty routine using these products: ${selectedProducts.map(p => p.name).join(", ")}.`;
  fetchBotResponse(routinePrompt);
}

/* Modal accessibility focus trap */
function trapFocus(element) {
  const focusableSelectors = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable]';
  const focusableElements = Array.from(element.querySelectorAll(focusableSelectors))
    .filter(el => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement);
  
  if (focusableElements.length === 0) return;

  const first = focusableElements[0];
  const last = focusableElements[focusableElements.length - 1];

  function handleKey(e) {
    if (e.key === "Tab") {
      if (e.shiftKey) { // shift + tab
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else { // tab
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    } else if (e.key === "Escape") {
      closeModal();
    }
  }

  element.addEventListener("keydown", handleKey);

  return () => {
    element.removeEventListener("keydown", handleKey);
  };
}

/* Modal open and close handlers */
const modal = document.querySelector(".modal");
const modalContent = document.querySelector(".modal-content");
const modalCloseBtn = document.querySelector(".modal-close");
let lastFocusedElement = null;
let removeFocusTrap = null;

function openModal(imageSrc, altText) {
  lastFocusedElement = document.activeElement;
  modalContent.querySelector("img").src = imageSrc;
  modalContent.querySelector("img").alt = altText;

  modal.setAttribute("aria-hidden", "false");
  modalContent.setAttribute("tabindex", "-1");
  modalContent.focus();

  removeFocusTrap = trapFocus(modalContent);
}

function closeModal() {
  modal.setAttribute("aria-hidden", "true");
  if (removeFocusTrap) removeFocusTrap();
  if (lastFocusedElement) lastFocusedElement.focus();
}

/* Open details modal with product info */
function openDetailsModal(name, image, description) {
  lastFocusedElement = document.activeElement;
  modalContent.innerHTML = `
    <button class="modal-close" aria-label="Close modal">&times;</button>
    <h2>${name}</h2>
    <img src="${image}" alt="${name} image" />
    <p>${description}</p>
  `;

  modal.setAttribute("aria-hidden", "false");
  modalContent.setAttribute("tabindex", "-1");
  modalContent.focus();

  removeFocusTrap = trapFocus(modalContent);

  // Add close button event listener
  const closeBtn = modalContent.querySelector(".modal-close");
  closeBtn.addEventListener("click", closeModal);
}

/* Event listeners for modal */
modal.addEventListener("click", e => {
  if (e.target === modal) {
    closeModal();
  }
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.getAttribute("aria-hidden") === "false") {
    closeModal();
  }
});

/* Variables to hold products */
let allProducts = [];
let currentProducts = [];

/* Initialization */
loadProducts().then(products => {
  allProducts = products;
  currentProducts = products;
  displayProducts(currentProducts);

  categoryFilter.addEventListener("change", e => {
    const filtered = filterProducts(allProducts, e.target.value);
    currentProducts = filtered;
    displayProducts(currentProducts);
  });
});

chatForm.addEventListener("submit", e => {
  e.preventDefault();
  const input = chatForm.querySelector("input");
  if (input.value.trim() === "") return;
  fetchBotResponse(input.value.trim());
});

/* Generate routine button */
generateRoutineBtn.disabled = true;
generateRoutineBtn.addEventListener("click", generateRoutine);
