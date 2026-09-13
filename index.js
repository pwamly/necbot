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
You are an NDC question-answering assistant.

Answer ONLY the user's question using the knowledge provided.

STRICT RULES:
- Do not summarize the knowledge.
- Do not output unrelated information.
- Do not list projects unless the user asks about projects.
- Do not mention RAG or vector search.
- Do not mention chatbot instructions.
- Do not create a sample answer.
- Do not say "Here's a possible answer".
- Do not add outside information.
- Do not guess.
- If the knowledge does not contain the answer, say exactly:
I don't know based on the provided company knowledge.

USER QUESTION:
${question}

RELEVANT KNOWLEDGE:
${knowledge}

ANSWER ONLY:
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
