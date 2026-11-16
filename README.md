# L'Oréal Routine Builder

L'Oréal is expanding what's possible with AI, and now your chatbot is getting smarter. This week, you'll upgrade it into a product-aware routine builder.

Users will be able to browse real L'Oréal brand products, select the ones they want, and generate a personalized routine using AI. They can also ask follow-up questions about their routine, just like chatting with a real advisor.

> Built as part of the **Global Career Accelerator** program.

---

## Features

- **Browse products by category.** Filter real L'Oréal brand products (skincare, haircare, makeup, fragrance, and more) loaded from a product catalog.
- **Select and manage products.** Click a product card to add it to your routine, click again to remove it, and see your picks in a "Selected Products" list.
- **Generate a personalized routine.** Send your selected products to the AI, which builds a step-by-step routine tailored to what you chose.
- **Ask follow-up questions.** Keep chatting about your routine (for example, "Can I use this at night?" or "What order should I apply these in?"). The chatbot remembers the conversation so far.
- **Stays on topic.** The assistant is instructed to only answer questions about the routine and related beauty topics like skincare, haircare, makeup, and fragrance.
- **Secure API calls.** Requests go through a Cloudflare Worker, so the API key never appears in the front-end code.

---

## Built With

- **HTML** for page structure
- **CSS** for L'Oréal-inspired branding and responsive layout
- **JavaScript** for product filtering, selection, and chat logic
- **OpenAI API** for routine generation and follow-up answers
- **Cloudflare Workers** to securely proxy API requests

---

## Project Structure

```
├── index.html        # Main page layout
├── style.css         # Styles and branding
├── script.js         # Product filtering, selection, and chat logic
├── products.json     # Catalog of L'Oréal brand products
├── secrets.js        # Local API config (do not commit)
└── README.md
```

---

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/<your-username>/<your-repo-name>.git
   cd <your-repo-name>
   ```

2. **Set up the Cloudflare Worker**
   - Create a new Worker in your Cloudflare dashboard.
   - Add your OpenAI API key as a secret environment variable (for example, `OPENAI_API_KEY`).
   - Deploy the Worker and copy its URL.

3. **Connect the front end**
   - In `script.js`, set the Worker URL as the endpoint for your API requests.

4. **Run the project**
   - Open `index.html` in your browser, or use a local server such as the VS Code Live Server extension.

---

## How to Use

1. Choose a category from the dropdown to see matching products.
2. Click the products you want to include in your routine.
3. Review your choices in the **Selected Products** section.
4. Click **Generate Routine** to get your personalized routine.
5. Ask follow-up questions in the chat box to learn more.

---

## Security Note

Never commit your API key to GitHub. Keep secrets in your Cloudflare Worker's environment variables, and add any local secrets file (such as `secrets.js`) to `.gitignore`.

---

## Acknowledgments

- **Global Career Accelerator** for the project brief and guidance
- **L'Oréal** for the brand and product inspiration
- **OpenAI** for the AI model that powers the routine builder