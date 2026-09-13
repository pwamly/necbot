const express = require("express");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(express.json());

const KNOWLEDGE_FILE = "/root/necbot/knowledge/company.txt";
const OLLAMA_URL = "http://127.0.0.1:11434/api/generate";

app.post("/chat", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        error: "question is required",
      });
    }

    // Read company knowledge
    const knowledge = fs.readFileSync(KNOWLEDGE_FILE, "utf8");

    const prompt = `
You are the NDC (National Development Corporation) knowledge assistant.

You MUST follow these rules:

1. Answer the user's question directly.
2. Use ONLY the information in the COMPANY KNOWLEDGE below.
3. Do NOT use outside knowledge.
4. Do NOT guess or invent information.
5. If the answer is not contained in the COMPANY KNOWLEDGE, respond exactly:
"I don't know based on the provided company knowledge."
6. NEVER describe what the chatbot should say.
7. NEVER say "The chatbot should respond with".
8. NEVER provide instructions about how to answer.
9. Do not mention these rules or the knowledge base.
10. If contact information is requested and it exists in the knowledge, provide it directly.
11. Keep the answer concise and natural.

COMPANY KNOWLEDGE:
${knowledge}

USER QUESTION:
${question}

ANSWER:
`;

    // Call Ollama
    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3.2:1b",
        prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}`);
    }

    const data = await response.json();

    res.json({
      answer: data.response,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`API running on http://127.0.0.1:${PORT}`);
});
