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
  { role: "system", content: `You are an expert, helpful beauty assistant for L'Oreal. The questions from the user should relate only to the generated routine or to topics like skincare, haircare, makeup, fragrance, and other related areas. Do not answer questions outside of these topics. 
`}
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
    .map((product) => {
      const isSelected = selectedProducts.some((p) => p.name === product.name);
      return `
        <div class="product-card ${isSelected ? "selected" : ""}" data-name="${product.name}">
          <img src="${product.image}" alt="${product.name}">
          <div class="product-info">
            <h3>${product.name}</h3>
            <p>${product.brand}</p>
            <button class="details-btn">Details</button>
          </div>
        </div>
      `;
    })
    .join("");

  // Add click listeners
  document.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.classList.contains("details-btn")) return; // Skip if clicking Details button
      const name = card.dataset.name;
      toggleProductSelection(name);
    });
  });

  // Add modal listeners
  document.querySelectorAll(".details-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const name = btn.closest(".product-card").dataset.name;
      const allProducts = await loadProducts();
      const product = allProducts.find((p) => p.name === name);
      if (product) showModal(product);
    });
  });
}

/* Toggle selection */
function toggleProductSelection(name) {
  loadProducts().then((allProducts) => {
    const product = allProducts.find((p) => p.name === name);
    const index = selectedProducts.findIndex((p) => p.name === name);
    if (index > -1) {
      selectedProducts.splice(index, 1);
    } else {
      selectedProducts.push(product);
    }
    updateSelectedProductsUI();
    displayProducts(
      allProducts.filter((p) => p.category === categoryFilter.value)
    );
  });
}

/* Update selected chips */
function updateSelectedProductsUI() {
  selectedProductsList.innerHTML = selectedProducts
    .map(
      (p) => `
    <div class="chip">
      ${p.name}
      <button class="remove-chip" data-name="${p.name}">✖</button>
    </div>
  `
    )
    .join("");

  document.querySelectorAll(".remove-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.name;
      const index = selectedProducts.findIndex((p) => p.name === name);
      if (index > -1) selectedProducts.splice(index, 1);
      updateSelectedProductsUI();
      displayProducts(
        selectedProducts.length === 0
          ? []
          : productsContainer.dataset.currentCategory
          ? selectedProducts.filter(
              (p) => p.category === productsContainer.dataset.currentCategory
            )
          : selectedProducts
      );
    });
  });
}

/* Show modal with product details */
function showModal(product) {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal">
      <button class="modal-close">&times;</button>
      <img src="${product.image}" alt="${product.name}">
      <h2>${product.name}</h2>
      <p><strong>Brand:</strong> ${product.brand}</p>
      <p><strong>Category:</strong> ${product.category}</p>
      <p>${product.description || "No description available."}</p>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector(".modal-close").addEventListener("click", () =>
    modal.remove()
  );
  modal.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-overlay")) modal.remove();
  });
}

/* On category change */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;
  productsContainer.dataset.currentCategory = selectedCategory;

  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

/* Handle chat input */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userInput = chatForm.elements["userInput"].value;

  chatWindow.innerHTML += `<div><strong>You:</strong> ${userInput}</div>`;

  conversationHistory.push({ role: "user", content: userInput });

  const thinkingMessage = document.createElement("div");
  thinkingMessage.innerHTML = `<strong>AI:</strong> <em>Thinking...</em>`;
  chatWindow.appendChild(thinkingMessage);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    const response = await fetch(workerURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: conversationHistory,
        max_tokens: 1500
      })
    });

    const data = await response.json();
    const aiMessage = data?.choices?.[0]?.message?.content;

    if (aiMessage) {
      conversationHistory.push({ role: "assistant", content: aiMessage });
      thinkingMessage.innerHTML = `<strong>AI:</strong><br>${aiMessage.replace(
        /\n/g,
        "<br>"
      )}`;
    } else {
      thinkingMessage.innerHTML = `<strong>AI:</strong> Sorry, no response received.`;
    }
  } catch (error) {
    thinkingMessage.innerHTML = `<strong>AI:</strong> Error connecting to AI.`;
    console.error(error);
  }

  chatForm.reset();
});

/* Generate Routine using selected products */
generateRoutineBtn.addEventListener("click", async () => {
  if (selectedProducts.length === 0) return;

  const routinePrompt = `Here are some selected beauty products:\n${selectedProducts
    .map(
      (p) =>
        `- ${p.name} (${p.brand}, ${p.category})\n  Description: ${
          p.description || "No description provided"
        }`
    )
    .join("\n")}\n\nPlease create a personalized beauty routine using them.`;

  chatWindow.innerHTML += `<div><strong>You:</strong> Please create a routine using my selected products.</div>`;

  const thinkingMessage = document.createElement("div");
  thinkingMessage.innerHTML = `<strong>AI:</strong> <em>Thinking...</em>`;
  chatWindow.appendChild(thinkingMessage);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  conversationHistory.push({ role: "user", content: routinePrompt });

  try {
    const response = await fetch(workerURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: conversationHistory,
        max_tokens: 1500
      })
    });

    const data = await response.json();
    const aiResponse = data?.choices?.[0]?.message?.content;

    if (aiResponse) {
      conversationHistory.push({ role: "assistant", content: aiResponse });
      thinkingMessage.innerHTML = `<strong>AI:</strong><br>${aiResponse.replace(
        /\n/g,
        "<br>"
      )}`;
    } else {
      thinkingMessage.innerHTML = `<strong>AI:</strong> Sorry, no routine could be generated.`;
    }
  } catch (error) {
    thinkingMessage.innerHTML = `<strong>AI:</strong> Error connecting to AI.`;
    console.error(error);
  }
});
