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
You are an NDC information assistant.

Answer the user's question using ONLY the knowledge provided below.

RULES:
- Answer directly.
- Do not say "Here's a possible answer".
- Do not say "The chatbot should respond".
- Do not provide sample answers.
- Do not tell the user to verify the information.
- Do not add information that is not in the knowledge.
- Do not omit relevant information that is explicitly in the knowledge.
- If the user asks for contact information, include ALL relevant contact details found in the knowledge.
- If the answer is not in the knowledge, say exactly:
"I don't know based on the provided company knowledge."
- Keep the answer concise.

KNOWLEDGE:
${knowledge}

USER QUESTION:
${question}

ANSWER:
`;

    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3.2:1b",
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1,
        },
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
