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
        error: "question is required"
      });
    }

    // Read company knowledge
    const knowledge = fs.readFileSync(KNOWLEDGE_FILE, "utf8");

    const prompt = `
You are a company knowledge assistant.

IMPORTANT RULES:
1. Answer ONLY using the provided company knowledge.
2. Do not use your general knowledge.
3. If the answer is not found in the knowledge, say:
"I don't know based on the provided company knowledge."
4. Do not invent or guess information.

COMPANY KNOWLEDGE:
${knowledge}

USER QUESTION:
${question}
`;

    // Call Ollama
    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3.2:1b",
        prompt,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}`);
    }

    const data = await response.json();

    res.json({
      answer: data.response
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`API running on http://127.0.0.1:${PORT}`);
});
