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
You answer questions about NDC using ONLY the information below.

RULES:
- Answer the user's question directly.
- Never say "Here's a possible answer".
- Never say "The chatbot should respond".
- Never call your answer a sample.
- Never tell the user to verify the information.
- Never explain how you generated the answer.
- Never use information outside the knowledge below.
- If the knowledge does not contain the answer, say exactly:
I don't know based on the provided company knowledge.

KNOWLEDGE:
${knowledge}

QUESTION:
${question}

DIRECT ANSWER:
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
