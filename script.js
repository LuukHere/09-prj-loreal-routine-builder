/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

const workerURL = "https://new-beauty-bot.crops1023.workers.dev/";

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
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

/* Chat form submission handler - sends user message to AI and shows response in chatbox */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get the user's message from the input field
  const userInput = chatForm.elements["userInput"].value;

  // Show the user's message in the chat window
  chatWindow.innerHTML += `<div><strong>You:</strong> ${userInput}</div>`;

  // Prepare messages array for OpenAI API (system + user)
  const messages = [
    { role: "system", content: "You are a helpful beauty assistant." },
    { role: "user", content: userInput },
  ];

  // Send the messages to the workerURL using fetch
  try {
    const response = await fetch(workerURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
    });

    const data = await response.json();

    // Check if the AI returned a response
    if (
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      // Show the AI's response in the chat window
      chatWindow.innerHTML += `<div><strong>AI:</strong> ${data.choices[0].message.content}</div>`;
    } else {
      chatWindow.innerHTML += `<div><strong>AI:</strong> Sorry, no response from AI.</div>`;
    }
  } catch (error) {
    chatWindow.innerHTML += `<div><strong>AI:</strong> Error connecting to AI.</div>`;
    console.error(error);
  }

  // Clear the input field after sending
  chatForm.reset();
});
