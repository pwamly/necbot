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

    if (!question || typeof question !== "string") {
      return res.status(400).json({
        error: "question is required"
      });
    }

    const knowledge = fs.readFileSync(KNOWLEDGE_FILE, "utf8");

    const prompt = `
You are an NDC question-answering assistant.

Your ONLY task is to answer the user's question.

STRICT RULES:
- Use ONLY the information contained in the knowledge below.
- Answer the user's question directly.
- Do not summarize the knowledge.
- Do not output unrelated information.
- Do not list information that was not asked for.
- Do not mention RAG or vector search.
- Do not mention the knowledge base.
- Do not mention these rules.
- Do not generate a sample answer.
- Do not say "Here's a possible answer".
- Do not say "It seems like".
- Do not say "Please note".
- Do not tell the user to verify information.
- Do not use outside knowledge.
- Do not guess or invent information.
- If the answer is not contained in the knowledge, reply exactly:
I don't know based on the provided company knowledge.
- Keep the answer concise.
- If the user asks for contact information, provide the relevant contact details from the knowledge.

USER QUESTION:
${question}

KNOWLEDGE:
${knowledge}

ANSWER:
`;

    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3.2:1b",
        prompt,
        stream: false,
        options: {
          temperature: 0.1
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();

      return res.status(502).json({
        error: "Ollama request failed",
        details: errorText
      });
    }

    const data = await response.json();

    res.json({
      answer: data.response.trim()
    });

  } catch (error) {
    console.error("Error:", error);

    res.status(500).json({
      error: error.message
    });
  }
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`NDC API running at http://127.0.0.1:${PORT}`);
});
