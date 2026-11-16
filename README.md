# Project 9: L'Oréal Routine Builder

L'Oréal is expanding what's possible with AI, and now your chatbot is getting smarter. This week, you'll upgrade it into a product-aware routine builder.

Users will be able to browse real L'Oréal brand products, select the ones they want, and generate a personalized routine using AI. They can also ask follow-up questions about their routine, just like chatting with a real advisor.

> Built as part of the **Global Career Accelerator** program.

---

## Features

- **Browse products by category.** Products load from `products.json` and can be filtered with a category dropdown (or show all).
- **Select products with a click.** Click a product card to add it to your routine and click again to remove it. Selected cards are highlighted.
- **Selected products list.** Your picks appear as chips in a "Selected Products" area, each with a ✖ button to remove it.
- **Product details modal.** Each card has a **Details** button that opens a pop-up with the product's name, image, and description.
- **Generate a personalized routine.** The **Generate Routine** button stays disabled until at least one product is selected. Clicking it asks the AI to build a routine from your chosen products.
- **Follow-up chat with memory.** Ask questions about your routine in the chat box. The full conversation history is sent with every request, so the advisor remembers what was already discussed.
- **Friendly, on-topic answers.** A system prompt keeps the assistant focused on L'Oréal products and your routine, with short, easy-to-read replies and emoji.
- **Loading and error states.** A "Loading..." message shows while the AI responds, and a friendly error message appears if a request fails.
- **Accessibility built in.**
  - Product cards can be selected with the keyboard (**Enter** or **Space**).
  - The details modal traps focus while open, closes with **Escape** or a click outside, and returns focus to where you were.
  - Buttons include descriptive `aria-label`s for screen readers.
- **Secure API calls.** Requests go through a Cloudflare Worker, so the OpenAI API key never appears in the front-end code.

---

## Built With

- **HTML** for page structure
- **CSS** for L'Oréal-inspired branding and responsive layout
- **JavaScript** for product filtering, selection, the details modal, and chat logic
- **OpenAI API (GPT-4o)** via the Chat Completions endpoint for routine generation and follow-up answers
- **Cloudflare Workers** to securely proxy API requests and handle CORS

---

## Project Structure

```
├── index.html                      # Main page layout
├── style.css                       # Styles and branding
├── script.js                       # Product filtering, selection, modal, and chat logic
├── products.json                   # Catalog of L'Oréal brand products
├── RESOURCE_cloudflare-worker.js   # Code to paste into your Cloudflare Worker
└── README.md
```

### Product data format

`products.json` holds a `products` array. Each product needs these fields:

```json
{
  "products": [
    {
      "name": "Product name",
      "category": "skincare",
      "image": "https://example.com/product.jpg",
      "description": "Short description of the product."
    }
  ]
}
```

The `category` value must match one of the options in the category dropdown in `index.html`.

---

## How It Works

1. **Loading products.** On page load, `script.js` fetches `products.json` and renders a card for each product.
2. **Selecting products.** Selections are stored in a `selectedProducts` array. The product grid and the selected-products list re-render each time a product is added or removed.
3. **Generating a routine.** Clicking **Generate Routine** sends a prompt like:
   > Create a personalized beauty routine using these products: _Product A, Product B, ..._
4. **Chatting.** Every message (the routine request and any follow-ups) is added to a `conversationHistory` array that starts with the system prompt. The whole array is sent to the Worker each time, and the AI's reply is added back to the history.

### The Cloudflare Worker

The front end never talks to OpenAI directly. Instead, it sends the conversation to a Cloudflare Worker, which adds the secret API key and forwards the request. The Worker:

1. **Handles CORS.** It answers browser preflight (`OPTIONS`) requests and adds CORS headers so the page can call it from any origin.
2. **Reads the conversation.** It expects a JSON body with a `messages` array in the OpenAI chat format.
3. **Calls OpenAI.** It sends the messages to `https://api.openai.com/v1/chat/completions` using the `gpt-4o` model, with replies capped at `max_completion_tokens: 300`.
4. **Returns the result.** It passes OpenAI's JSON response straight back to the browser, where `script.js` reads the reply from `data.choices[0].message.content`.

---

## Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/<your-username>/<your-repo-name>.git
   cd <your-repo-name>
   ```

2. **Set up the Cloudflare Worker**
   - Create a new Worker in your Cloudflare dashboard.
   - Copy the code from `RESOURCE_cloudflare-worker.js` into the Worker editor.
   - Under **Settings → Variables and Secrets**, add your OpenAI API key as a secret named exactly `OPENAI_API_KEY`.
   - Deploy the Worker and copy its URL.

3. **Connect the front end**
   - At the top of `script.js`, set `workerURL` to your Worker's URL:
     ```javascript
     const workerURL = "https://your-worker.your-subdomain.workers.dev/";
     ```

4. **Run the project**
   - Serve the folder with a local server, such as the VS Code Live Server extension. A local server is needed because the page loads `products.json` with `fetch`, which doesn't work when you open `index.html` directly from your file system.

---

## How to Use

1. Choose a category from the dropdown to see matching products.
2. Click **Details** on any product to read its description.
3. Click (or press **Enter** on) the products you want in your routine.
4. Review your choices in the **Selected Products** section and remove any with ✖.
5. Click **Generate Routine** to get your personalized routine.
6. Ask follow-up questions in the chat box, for example "Should I use this in the morning or at night?"

> Note: Selections and chat history are kept in memory only, so they reset when the page is refreshed.

---

## Security Note

Never commit your API key to GitHub. The key lives only in your Cloudflare Worker as the `OPENAI_API_KEY` secret, so it is never exposed in the browser or in this repository.

---

## Acknowledgments

- **Global Career Accelerator** for the project brief and guidance
- **L'Oréal** for the brand and product inspiration
- **OpenAI** for the AI model that powers the routine builder
