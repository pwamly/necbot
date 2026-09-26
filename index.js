const express = require("express");
const fs = require("fs");
const path = require("path");
const https = require("https");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 3000;

const KNOWLEDGE_FILE = "/root/necbot/knowledge/company.txt";

const OLLAMA_URL = "http://127.0.0.1:11434/api/generate";
const OLLAMA_MODEL = "qwen2.5:1.5b";

// ============================================================
// LOAD KNOWLEDGE BASE
// ============================================================

let knowledge = "";

try {
    knowledge = fs.readFileSync(KNOWLEDGE_FILE, "utf8");
    console.log(`Knowledge loaded: ${knowledge.length} characters`);
} catch (error) {
    console.error("Failed to load knowledge file:", error.message);
}

// ============================================================
// NORMALIZE TEXT
// ============================================================

function normalize(text) {
    return String(text || "")
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

// ============================================================
// EXTRACT SECTIONS FROM company.txt
// ============================================================

function extractSections(text) {
    const sections = {};

    const regex = /^(\d+)\.\s+(.+)$/gm;

    const matches = [...text.matchAll(regex)];

    for (let i = 0; i < matches.length; i++) {
        const number = matches[i][1];
        const title = matches[i][2].trim();

        const start = matches[i].index + matches[i][0].length;

        const end =
            i + 1 < matches.length
                ? matches[i + 1].index
                : text.length;

        const content = text.substring(start, end).trim();

        sections[`${number}. ${title}`] = content;
    }

    return sections;
}

const sections = extractSections(knowledge);

console.log(`Knowledge sections loaded: ${Object.keys(sections).length}`);

// ============================================================
// ADD SECTION
// ============================================================

function addSection(result, sectionName) {
    const key = Object.keys(sections).find(
        key => normalize(key) === normalize(sectionName)
    );

    if (key && !result.includes(key)) {
        result.push(key);
    }
}

// ============================================================
// GET RELEVANT SECTIONS
// ============================================================

function getSections(question) {
    const q = normalize(question);

    const result = [];

    // --------------------------------------------------------
    // BASIC INFORMATION
    // --------------------------------------------------------

    if (
        q.includes("what is ndc") ||
        q.includes("what does ndc stand for") ||
        q.includes("meaning of ndc") ||
        q.includes("ndc stand for") ||
        q.includes("about ndc")
    ) {
        addSection(result, "1. BASIC INFORMATION");
        addSection(result, "2. WHAT IS NDC?");
    }

    // --------------------------------------------------------
    // VISION
    // --------------------------------------------------------

    if (
        q.includes("vision") ||
        q.includes("ndc vision")
    ) {
        addSection(result, "3. VISION");
    }

    // --------------------------------------------------------
    // MISSION
    // --------------------------------------------------------

    if (
        q.includes("mission") ||
        q.includes("ndc mission")
    ) {
        addSection(result, "4. MISSION");
    }

    // --------------------------------------------------------
    // PURPOSE
    // --------------------------------------------------------

    if (
        q.includes("purpose") ||
        q.includes("main purpose")
    ) {
        addSection(result, "5. MAIN PURPOSE");
    }

    // --------------------------------------------------------
    // FUNCTIONS
    // --------------------------------------------------------

    if (
        q.includes("function") ||
        q.includes("functions") ||
        q.includes("what does ndc do") ||
        q.includes("role of ndc") ||
        q.includes("responsibilities")
    ) {
        addSection(result, "6. CORE FUNCTIONS");
    }

    // --------------------------------------------------------
    // INDUSTRIAL AREAS
    // --------------------------------------------------------

    if (
        q.includes("industrial area") ||
        q.includes("industrial sector") ||
        q.includes("strategic industrial") ||
        q.includes("industries")
    ) {
        addSection(result, "7. STRATEGIC INDUSTRIAL AREAS");
    }

    // --------------------------------------------------------
    // PROJECTS
    // --------------------------------------------------------

    if (
        q.includes("project") ||
        q.includes("projects") ||
        q.includes("liganga") ||
        q.includes("mchuchuma") ||
        q.includes("engaruka") ||
        q.includes("maganga") ||
        q.includes("matitu") ||
        q.includes("katewaka") ||
        q.includes("kilimanjaro machine") ||
        q.includes("kmtc") ||
        q.includes("tanzania biotech") ||
        q.includes("tbpl")
    ) {
        addSection(result, "8. MAJOR PROJECTS");
        addSection(result, "22. CURRENT STRATEGIC PROJECT CATEGORIES");
        addSection(result, "28. IMPORTANT PROJECT LIST");
    }

    // --------------------------------------------------------
    // INDUSTRIAL PARKS
    // --------------------------------------------------------

    if (
        q.includes("industrial park") ||
        q.includes("industrial parks") ||
        q.includes("industrial estate") ||
        q.includes("industrial estates")
    ) {
        addSection(result, "9. INDUSTRIAL PARKS/ESTATES");
        addSection(result, "22. CURRENT STRATEGIC PROJECT CATEGORIES");
    }

    // --------------------------------------------------------
    // INVESTORS
    // --------------------------------------------------------

    if (
        q.includes("investor") ||
        q.includes("investors") ||
        q.includes("investment") ||
        q.includes("invest") ||
        q.includes("partnership") ||
        q.includes("partner")
    ) {
        addSection(result, "10. HOW NDC WORKS WITH INVESTORS");
        addSection(result, "11. INVESTOR PREPARATION");
        addSection(result, "12. INVESTMENT OPPORTUNITIES");
    }

    // --------------------------------------------------------
    // TENDERS / PROCUREMENT
    // --------------------------------------------------------

    if (
        q.includes("tender") ||
        q.includes("tenders") ||
        q.includes("procurement") ||
        q.includes("rfp") ||
        q.includes("expression of interest")
    ) {
        addSection(result, "13. TENDERS AND PROCUREMENT");
    }

    // --------------------------------------------------------
    // JOBS
    // --------------------------------------------------------

    if (
        q.includes("job") ||
        q.includes("jobs") ||
        q.includes("vacancy") ||
        q.includes("vacancies") ||
        q.includes("career") ||
        q.includes("careers") ||
        q.includes("employment") ||
        q.includes("work at ndc")
    ) {
        addSection(result, "14. JOBS");
    }

    // --------------------------------------------------------
    // ORGANIZATIONAL STRUCTURE / LEADERSHIP
    // --------------------------------------------------------

    if (
        q.includes("board") ||
        q.includes("managing director") ||
        q.includes("current director") ||
        q.includes("director") ||
        q.includes("leadership") ||
        q.includes("organizational structure") ||
        q.includes("organization structure") ||
        q.includes("who leads ndc") ||
        q.includes("head of ndc")
    ) {
        addSection(result, "15. NDC ORGANIZATIONAL STRUCTURE");
    }

    // --------------------------------------------------------
    // GOVERNMENT
    // --------------------------------------------------------

    if (
        q.includes("government") ||
        q.includes("government organization") ||
        q.includes("government institution") ||
        q.includes("ministry") ||
        q.includes("supervise") ||
        q.includes("supervises") ||
        q.includes("parent ministry")
    ) {
        addSection(result, "16. NDC and Government");
    }

    // --------------------------------------------------------
    // PRIVATE INVESTORS
    // --------------------------------------------------------

    if (
        q.includes("private investor") ||
        q.includes("private investors") ||
        q.includes("private sector")
    ) {
        addSection(result, "17. NDC and Private Investors");
    }

    // --------------------------------------------------------
    // ECONOMIC IMPACT
    // --------------------------------------------------------

    if (
        q.includes("economic impact") ||
        q.includes("economy") ||
        q.includes("economic") ||
        q.includes("employment creation") ||
        q.includes("jobs created")
    ) {
        addSection(result, "18. Economic Impact");
    }

    // --------------------------------------------------------
    // HISTORY
    // --------------------------------------------------------

    if (
        q.includes("history") ||
        q.includes("historical") ||
        q.includes("established") ||
        q.includes("founded")
    ) {
        addSection(result, "19. Historical Importance");
    }

    // --------------------------------------------------------
    // COMPARISONS
    // --------------------------------------------------------

    if (
        q.includes("sido") ||
        q.includes("compare ndc and sido") ||
        q.includes("ndc vs sido")
    ) {
        addSection(result, "20. NDC vs SIDO");
    }

    if (
        q.includes("tic") ||
        q.includes("compare ndc and tic") ||
        q.includes("ndc vs tic")
    ) {
        addSection(result, "21. NDC vs TIC");
    }

    // --------------------------------------------------------
    // STRATEGIC PROJECTS
    // --------------------------------------------------------

    if (
        q.includes("strategic project") ||
        q.includes("strategic projects") ||
        q.includes("strategy") ||
        q.includes("strategic plan")
    ) {
        addSection(result, "22. Current Strategic Project Categories");
        addSection(result, "23. Questions chatbot should answer");
        addSection(result, "24. Chatbot Answer Rules");
    }

    // --------------------------------------------------------
    // CONTACT
    // --------------------------------------------------------

    if (
        q.includes("contact") ||
        q.includes("phone") ||
        q.includes("telephone") ||
        q.includes("email") ||
        q.includes("address") ||
        q.includes("location") ||
        q.includes("headquarters") ||
        q.includes("where is ndc")
    ) {
        addSection(result, "25. Contact info");
    }

    // --------------------------------------------------------
    // DESCRIPTION
    // --------------------------------------------------------

    if (
        q.includes("describe ndc") ||
        q.includes("short description") ||
        q.includes("brief description")
    ) {
        addSection(result, "26. Short description");
    }

    // --------------------------------------------------------
    // ONE SENTENCE
    // --------------------------------------------------------

    if (
        q.includes("one sentence") ||
        q.includes("in one sentence")
    ) {
        addSection(result, "27. One sentence description");
    }

    // --------------------------------------------------------
    // KEYWORDS
    // --------------------------------------------------------

    if (result.length === 0) {
        addSection(result, "29. Keywords for RAG/vector search");
    }

    return result;
}

// ============================================================
// BUILD KNOWLEDGE CONTEXT
// ============================================================

function buildContext(selectedSections) {
    if (!selectedSections || selectedSections.length === 0) {
        return knowledge;
    }

    let context = "";

    for (const section of selectedSections) {
        context += `\n\n### ${section}\n`;
        context += sections[section] || "";
    }

    return context.trim();
}

// ============================================================
// CONTACT QUESTIONS
// ============================================================

function getContactAnswer(question) {
    const q = normalize(question);

    if (
        q.includes("phone") ||
        q.includes("telephone") ||
        q.includes("contact number") ||
        q.includes("contact details")
    ) {
        const section = Object.keys(sections).find(
            key => normalize(key) === normalize("25. Contact info")
        );

        if (section) {
            return sections[section];
        }
    }

    if (
        q.includes("email") ||
        q.includes("email address")
    ) {
        const section = Object.keys(sections).find(
            key => normalize(key) === normalize("25. Contact info")
        );

        if (section) {
            return sections[section];
        }
    }

    if (
        q.includes("address") ||
        q.includes("headquarters") ||
        q.includes("where is ndc") ||
        q.includes("location")
    ) {
        const section = Object.keys(sections).find(
            key => normalize(key) === normalize("25. Contact info")
        );

        if (section) {
            return sections[section];
        }
    }

    return null;
}

// ============================================================
// CONVERSATIONAL QUESTIONS
// ============================================================

function getConversationalAnswer(question) {
    const q = normalize(question);

    // Greetings
    if (
        /^(hi|hello|hey|good morning|good afternoon|good evening)$/.test(q)
    ) {
        return "Hello! How can I help you with information about the National Development Corporation (NDC)?";
    }

    // Identity
    if (
        q.includes("who are you") ||
        q.includes("what are you") ||
        q.includes("your name")
    ) {
        return "I am the NDC information assistant. I can help answer questions using the available NDC information.";
    }

    // Capabilities
    if (
        q.includes("what can you do") ||
        q.includes("how can you help") ||
        q.includes("what do you know")
    ) {
        return "I can provide information about NDC, including its functions, projects, investment opportunities, industrial parks, tenders, jobs, organizational structure, government relationship, and contact information.";
    }

    // Thanks
    if (
        q === "thanks" ||
        q === "thank you" ||
        q === "thank you very much"
    ) {
        return "You're welcome!";
    }

    // Goodbye
    if (
        q === "bye" ||
        q === "goodbye" ||
        q === "see you"
    ) {
        return "Goodbye! Feel free to ask if you need more information about NDC.";
    }

    return null;
}

// ============================================================
// NDC RELATED CHECK
// ============================================================

function isNDCRelated(question) {
    const q = normalize(question);

    const keywords = [
        "ndc",
        "national development corporation",
        "development corporation",
        "liganga",
        "mchuchuma",
        "engaruka",
        "maganga",
        "matitu",
        "katewaka",
        "kmtc",
        "tbpl",
        "industrial park",
        "industrial parks",
        "industrial estate",
        "investment",
        "investor",
        "investors",
        "project",
        "projects",
        "tender",
        "tenders",
        "procurement",
        "vacancy",
        "vacancies",
        "job",
        "jobs",
        "career",
        "careers",
        "managing director",
        "director",
        "board",
        "organizational structure",
        "organization structure",
        "government organization",
        "government institution",
        "ministry",
        "sido",
        "tic",
        "industrialization",
        "manufacturing"
    ];

    return keywords.some(keyword => q.includes(keyword));
}

// ============================================================
// SUGGESTIONS
// ============================================================

function getSuggestions(question) {
    const q = normalize(question);

    if (
        q.includes("managing director") ||
        q.includes("director") ||
        q.includes("leadership")
    ) {
        return [
            "What is NDC?",
            "What does NDC do?",
            "What is NDC's organizational structure?",
            "Which ministry supervises NDC?"
        ];
    }

    if (
        q.includes("project") ||
        q.includes("liganga") ||
        q.includes("mchuchuma")
    ) {
        return [
            "What is the Liganga project?",
            "What is the Mchuchuma project?",
            "What are NDC's major projects?",
            "What are NDC's strategic projects?"
        ];
    }

    if (
        q.includes("investment") ||
        q.includes("investor")
    ) {
        return [
            "What investment opportunities does NDC offer?",
            "How does NDC work with investors?",
            "What industrial parks does NDC manage?",
            "How can an investor work with NDC?"
        ];
    }

    if (
        q.includes("job") ||
        q.includes("vacancy") ||
        q.includes("career")
    ) {
        return [
            "Does NDC have job opportunities?",
            "Where can I find NDC vacancies?",
            "What does NDC do?",
            "Where is NDC headquarters?"
        ];
    }

    return [
        "What is NDC?",
        "What does NDC do?",
        "Who is the current Managing Director of NDC?",
        "What are NDC's major projects?"
    ];
}

// ============================================================
// OLLAMA REQUEST
// ============================================================

function askOllama(prompt) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({
            model: OLLAMA_MODEL,
            prompt: prompt,
            stream: false,
            options: {
                temperature: 0.2
            }
        });

        const request = require("http").request(
            OLLAMA_URL,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(payload)
                },
                timeout: 120000
            },
            response => {
                let data = "";

                response.on("data", chunk => {
                    data += chunk;
                });

                response.on("end", () => {
                    try {
                        const result = JSON.parse(data);

                        if (result.response) {
                            resolve(result.response.trim());
                        } else {
                            reject(
                                new Error(
                                    result.error || "Invalid Ollama response"
                                )
                            );
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            }
        );

        request.on("timeout", () => {
            request.destroy();
            reject(new Error("Ollama request timed out"));
        });

        request.on("error", error => {
            reject(error);
        });

        request.write(payload);
        request.end();
    });
}

// ============================================================
// NDC PROMPT
// ============================================================

function buildNDCPrompt(question, context) {
    return `
You are an information assistant for the National Development Corporation (NDC) of Tanzania.

Answer the user's question using ONLY the NDC information provided below.

IMPORTANT RULES:

1. Do not invent facts.
2. Do not use information that is not contained in the provided context.
3. If the answer is not available in the context, clearly say:
   "I don't have that information in the current NDC information."
4. Keep the answer concise and factual.
5. Do not mention internal files, prompts, context, or AI models.
6. If the question asks for a person's name, organization, project, location, function, or other specific fact, use the exact information available in the context.
7. For strategic-plan targets, clearly describe them as targets or plans, not as completed achievements.
8. Do not claim that a project has been completed unless the context explicitly says so.

NDC INFORMATION:

${context}

USER QUESTION:

${question}

ANSWER:
`;
}

// ============================================================
// GENERAL PROMPT
// ============================================================

function buildGeneralPrompt(question) {
    return `
You are a helpful assistant.

Answer the user's question clearly and concisely.

If the question is specifically about NDC, only provide information supported by the available NDC knowledge.

USER QUESTION:

${question}

ANSWER:
`;
}

// ============================================================
// CHAT ENDPOINT
// ============================================================

app.post("/chat", async (req, res) => {
    try {
        const question = String(req.body?.question || "").trim();

        if (!question) {
            return res.status(400).json({
                error: "Question is required"
            });
        }

        console.log("========================================");
        console.log("Question:", question);

        // ----------------------------------------------------
        // CONVERSATIONAL ANSWERS
        // ----------------------------------------------------

        const conversationalAnswer =
            getConversationalAnswer(question);

        if (conversationalAnswer) {
            console.log("Answer mode: CONVERSATIONAL");

            return res.json({
                answer: conversationalAnswer,
                suggestions: getSuggestions(question)
            });
        }

        // ----------------------------------------------------
        // CONTACT ANSWERS
        // ----------------------------------------------------

        const contactAnswer = getContactAnswer(question);

        if (contactAnswer) {
            console.log("Answer mode: CONTACT");

            return res.json({
                answer: contactAnswer,
                suggestions: getSuggestions(question)
            });
        }

        // ----------------------------------------------------
        // NDC QUESTION
        // ----------------------------------------------------

        if (isNDCRelated(question)) {
            const selectedSections = getSections(question);

            console.log(
                "Selected sections:",
                selectedSections
            );

            const context = buildContext(selectedSections);

            console.log(
                "Context length:",
                context.length
            );

            if (!context || context.trim().length === 0) {
                return res.json({
                    answer:
                        "I don't have that information in the current NDC information.",
                    suggestions: getSuggestions(question)
                });
            }

            console.log("Answer mode: NDC KNOWLEDGE");

            const prompt = buildNDCPrompt(
                question,
                context
            );

            const answer = await askOllama(prompt);

            return res.json({
                answer,
                suggestions: getSuggestions(question)
            });
        }

        // ----------------------------------------------------
        // GENERAL QUESTION
        // ----------------------------------------------------

        console.log("Answer mode: GENERAL AI");

        const prompt = buildGeneralPrompt(question);

        const answer = await askOllama(prompt);

        return res.json({
            answer,
            suggestions: getSuggestions(question)
        });

    } catch (error) {
        console.error("Chat error:", error);

        return res.status(500).json({
            error: "Failed to process question",
            details: error.message
        });
    }
});

// ============================================================
// HTTPS SERVER
// ============================================================

const certPath = path.join(__dirname, "cert");

const httpsOptions = {
    key: fs.readFileSync(
        path.join(certPath, "server.key")
    ),
    cert: fs.readFileSync(
        path.join(certPath, "server.crt")
    )
};

https.createServer(
    httpsOptions,
    app
).listen(PORT, "0.0.0.0", () => {
    console.log("========================================");
    console.log("NDC Chatbot Backend Started");
    console.log(`HTTPS server running on port ${PORT}`);
    console.log(`Ollama model: ${OLLAMA_MODEL}`);
    console.log(`Knowledge file: ${KNOWLEDGE_FILE}`);
    console.log("Website checking: DISABLED");
    console.log("========================================");
});