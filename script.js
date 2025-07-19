/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");
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

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
    </div>
  `
    )
    .join("");

  addProductSelectionHandlers(); // Enable selection after rendering
}

/* Update the selected products UI */
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

  // Add event listeners for each remove button
  document.querySelectorAll(".remove-chip-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const chip = e.target.closest(".product-chip");
      const productName = chip.dataset.name;

      // Remove from selectedProducts array
      selectedProducts = selectedProducts.filter(
        (product) => product.name !== productName
      );

      // Unselect the corresponding product card if still visible
      const matchingCard = Array.from(document.querySelectorAll(".product-card"))
        .find((card) => card.querySelector("h3").innerText === productName);

      if (matchingCard) {
        matchingCard.classList.remove("selected");
      }

      updateSelectedProductsUI(); // Re-render the chips
    });
  });
}


/* Enable click-to-select on each product card */
function addProductSelectionHandlers() {
  const productCards = document.querySelectorAll(".product-card");

  productCards.forEach((card) => {
    const name = card.querySelector("h3").innerText;

    // PRE-SELECT if already in selectedProducts
    const isAlreadySelected = selectedProducts.some((p) => p.name === name);
    if (isAlreadySelected) {
      card.classList.add("selected");
    }

    card.addEventListener("click", () => {
      const brand = card.querySelector("p").innerText;
      const image = card.querySelector("img").src;
      const product = { name, brand, image };

      card.classList.toggle("selected");

      const isNowSelected = card.classList.contains("selected");

      if (isNowSelected) {
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


/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  

  displayProducts(filteredProducts);
});

/* Chat form submission handler - sends user message to AI and shows response in chatbox */
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
});
