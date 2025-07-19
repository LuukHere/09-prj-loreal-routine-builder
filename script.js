/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateRoutineBtn = document.getElementById("generateRoutine");

const workerURL = "https://new-beauty-bot.crops1023.workers.dev/";

let selectedProducts = [];

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Display product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card" data-name="${product.name}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
        <button class="details-btn" type="button">Details</button>
      </div>
    </div>
  `
    )
    .join("");

  addProductSelectionHandlers();
  addDetailsButtonHandlers(products);
}

/* Handle selection and deselection of product cards */
function addProductSelectionHandlers() {
  const productCards = document.querySelectorAll(".product-card");

  productCards.forEach((card) => {
    const name = card.querySelector("h3").innerText;

    // Pre-select card if already in selected list
    if (selectedProducts.some((p) => p.name === name)) {
      card.classList.add("selected");
    }

    card.addEventListener("click", (e) => {
      // Prevent click if it's on the "Details" button
      if (e.target.classList.contains("details-btn")) return;

      const brand = card.querySelector("p").innerText;
      const image = card.querySelector("img").src;
      const product = { name, brand, image };

      card.classList.toggle("selected");

      if (card.classList.contains("selected")) {
        if (!selectedProducts.some((p) => p.name === name)) {
          selectedProducts.push(product);
        }
      } else {
        selectedProducts = selectedProducts.filter((p) => p.name !== name);
      }

      updateSelectedProductsUI();
    });
  });
}

/* Update the selected products section */
function updateSelectedProductsUI() {
  selectedProductsList.innerHTML = selectedProducts
    .map(
      (product) => `
      <div class="product-chip" data-name="${product.name}">
        <img src="${product.image}" alt="${product.name}" />
        <span>${product.name}</span>
        <button class="remove-chip-btn" aria-label="Remove ${product.name}">✖</button>
      </div>
    `
    )
    .join("");

  // Attach event listeners for remove buttons
  document.querySelectorAll(".remove-chip-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const chip = e.target.closest(".product-chip");
      const productName = chip.dataset.name;

      selectedProducts = selectedProducts.filter((p) => p.name !== productName);

      // Deselect product card if visible
      const matchingCard = Array.from(document.querySelectorAll(".product-card")).find(
        (card) => card.querySelector("h3").innerText === productName
      );

      if (matchingCard) {
        matchingCard.classList.remove("selected");
      }

      updateSelectedProductsUI();
    });
  });
}

/* Handle category change and filter products */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

/* Generate Routine button logic */
generateRoutineBtn.addEventListener("click", async () => {
  if (selectedProducts.length === 0) {
    alert("Please select some products first!");
    return;
  }

  // Load full product data to enrich selection with category & description
  const allProducts = await loadProducts();

  // Enrich selected products with full info
  const enrichedProducts = selectedProducts.map((selected) => {
    const match = allProducts.find((p) => p.name === selected.name);
    return {
      name: selected.name,
      brand: selected.brand,
      category: match?.category || "unknown",
      description: match?.description || "No description available.",
    };
  });

  // Prepare a system and user prompt for OpenAI
  const messages = [
    {
      role: "system",
      content: `You are a beauty expert helping users create personalized skincare, haircare, or makeup routines using product details. Use simple language and clear instructions. Focus on the products provided by the user. Make the styling of the response user-friendly and easy to follow.`,
    },
    {
      role: "user",
      content: `Here are the user's selected products:\n\n${JSON.stringify(
        enrichedProducts,
        null,
        2
      )}\n\nPlease create a custom routine using these products. Include step-by-step instructions and group them by category if applicable.`,
    },
  ];

  // Show user message in chat
  chatWindow.innerHTML += `<div><strong>You:</strong> Please create a routine using my selected products.</div>`;

  try {
    const response = await fetch(workerURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
    });

    const data = await response.json();

    if (
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      const aiResponse = data.choices[0].message.content;
      chatWindow.innerHTML += `<div><strong>AI:</strong><br>${aiResponse.replace(/\n/g, "<br>")}</div>`;
    } else {
      chatWindow.innerHTML += `<div><strong>AI:</strong> Sorry, no routine could be generated.</div>`;
    }
  } catch (error) {
    chatWindow.innerHTML += `<div><strong>AI:</strong> Error connecting to AI.</div>`;
    console.error(error);
  }

  chatWindow.scrollTop = chatWindow.scrollHeight;
});

/* Chat form submission logic */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userInput = chatForm.elements["userInput"].value;
  chatWindow.innerHTML += `<div><strong>You:</strong> ${userInput}</div>`;

  const messages = [
    { role: "system", content: "You are a helpful beauty assistant." },
    { role: "user", content: userInput },
  ];

  try {
    const response = await fetch(workerURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
    });

    const data = await response.json();

    if (
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      chatWindow.innerHTML += `<div><strong>AI:</strong> ${data.choices[0].message.content}</div>`;
    } else {
      chatWindow.innerHTML += `<div><strong>AI:</strong> Sorry, no response from AI.</div>`;
    }
  } catch (error) {
    chatWindow.innerHTML += `<div><strong>AI:</strong> Error connecting to AI.</div>`;
    console.error(error);
  }

  chatForm.reset();
  chatWindow.scrollTop = chatWindow.scrollHeight;
});

/* ---------- MODAL LOGIC ---------- */

// Modal references
const productModal = document.getElementById("productModal");
const modalTitle = document.getElementById("modalTitle");
const modalImage = document.getElementById("modalImage");
const modalDescription = document.getElementById("modalDescription");
const modalCloseBtn = document.getElementById("modalCloseBtn");

modalCloseBtn.addEventListener("click", closeModal);
productModal.addEventListener("click", (e) => {
  if (e.target === productModal) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && productModal.getAttribute("aria-hidden") === "false") {
    closeModal();
  }
});

function closeModal() {
  productModal.setAttribute("aria-hidden", "true");
  productModal.style.display = "none";
}

function openModal(product) {
  modalTitle.textContent = product.name;
  modalImage.src = product.image;
  modalImage.alt = product.name;
  modalDescription.textContent = product.description || "No description available.";
  productModal.setAttribute("aria-hidden", "false");
  productModal.style.display = "flex";
}

function addDetailsButtonHandlers(products) {
  const detailButtons = document.querySelectorAll(".details-btn");

  detailButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const card = e.target.closest(".product-card");
      const productName = card.dataset.name;
      const product = products.find((p) => p.name === productName);

      if (product) {
        openModal(product);
      }
    });
  });
}
