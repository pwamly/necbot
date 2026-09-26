const express = require("express");
const fs = require("fs");
const https = require("https");
const http = require("http");
const cors = require("cors");
const path = require("path");

const app = express();

const PORT = 3000;

const KNOWLEDGE_FILE = "/root/necbot/knowledge/company.txt";
const OLLAMA_URL = "http://127.0.0.1:11434/api/generate";
const OLLAMA_MODEL = "qwen2.5:1.5b";

const CERT_DIR = path.join(__dirname, "cert");
const SSL_KEY = path.join(CERT_DIR, "server.key");
const SSL_CERT = path.join(CERT_DIR, "server.crt");

app.use(cors());
app.use(express.json({ limit: "1mb" }));

/*
==================================================
KNOWLEDGE BASE
==================================================
*/

let knowledgeBase = "";

function loadKnowledgeBase() {
    try {
        knowledgeBase = fs.readFileSync(KNOWLEDGE_FILE, "utf8");

        console.log(
            `Knowledge base loaded: ${knowledgeBase.length} characters`
        );
    } catch (error) {
        console.error(
            "Failed to load knowledge base:",
            error.message
        );

        knowledgeBase = "";
    }
}

loadKnowledgeBase();

/*
==================================================
NDC MANAGEMENT DIRECTORY
==================================================
*/

const NDC_MANAGEMENT = [
    {
        name: "Dr. Nicolaus H. Shombe",
        position: "Managing Director"
    },
    {
        name: "Ernesto Doriye",
        position: "Corporate Secretary"
    },
    {
        name: "Mr. Silas Limo",
        position: "Chief Internal Auditor"
    },
    {
        name: "Mr. Emil Mkaki",
        position: "Director of Finance"
    },
    {
        name: "Mr. Mafutah Bunini",
        position: "Director of Planning, Research and Development"
    },
    {
        name: "Dr. Yohana E. Mtoni",
        position: "Director of Heavy Industries"
    },
    {
        name: "Ms. Esther Mwaigomole",
        position: "Director of Strategic Value Addition"
    },
    {
        name: "Mr. Revocatus Rasheli",
        position: "Investment Manager"
    },
    {
        name: "Ms. Valentine Simkoko",
        position: "Manager of Administration & Human Resources Management"
    },
    {
        name: "Ms. Aretha Msungu",
        position: "Manager of Procurement Management"
    },
    {
        name: "Mr. Innocent Msuha",
        position: "Ag. Manager of Communication Affairs"
    }
];

/*
==================================================
NORMALIZE TEXT
==================================================
*/

function normalize(text) {
    return String(text || "")
        .toLowerCase()
        .replace(/[’']/g, "")
        .replace(/[^a-z0-9\s&-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/*
==================================================
NORMALIZE PERSON NAME
==================================================
*/

function normalizeName(text) {
    return normalize(text)
        .replace(/^mr\s+/i, "")
        .replace(/^mrs\s+/i, "")
        .replace(/^ms\s+/i, "")
        .replace(/^dr\s+/i, "")
        .trim();
}

/*
==================================================
EXTRACT SECTIONS
==================================================
*/

function extractSections(text) {
    const sections = {};

    const regex =
        /(?:^|\n)(={10,})\s*\n(\d+)\.\s+([^\n]+)\s*\n={10,}([\s\S]*?)(?=\n={10,}\s*\n\d+\.\s+|\s*$)/g;

    let match;

    while ((match = regex.exec(text)) !== null) {
        const sectionNumber = match[2].trim();
        const sectionTitle = match[3].trim();
        const content = match[4].trim();

        sections[sectionNumber] = {
            number: sectionNumber,
            title: sectionTitle,
            content
        };
    }

    return sections;
}

const sections = extractSections(knowledgeBase);

/*
==================================================
SECTION KEYWORDS
==================================================
*/

const SECTION_KEYWORDS = {
    "1": [
        "basic information",
        "official name",
        "abbreviation",
        "headquarters",
        "email",
        "telephone",
        "phone",
        "website",
        "ministry",
        "contact"
    ],

    "2": [
        "what is ndc",
        "what does ndc stand for",
        "meaning of ndc",
        "ndc meaning"
    ],

    "3": [
        "vision"
    ],

    "4": [
        "mission"
    ],

    "5": [
        "purpose",
        "main purpose"
    ],

    "6": [
        "function",
        "functions",
        "role",
        "roles",
        "responsibilities",
        "responsibility"
    ],

    "7": [
        "strategic industrial areas",
        "industrial areas",
        "agro industries",
        "chemical industries",
        "biological industries",
        "iron and steel",
        "metallurgical",
        "machinery",
        "industrial parks"
    ],

    "8": [
        "major project",
        "major projects",
        "projects",
        "liganga",
        "mchuchuma",
        "engaruka",
        "tyre",
        "machine tools",
        "tbpl",
        "tamco",
        "kange",
        "nyanza",
        "rubber"
    ],

    "9": [
        "industrial park",
        "industrial parks",
        "industrial estate",
        "industrial estates",
        "tamco",
        "kange",
        "kmtc",
        "nyanza"
    ],

    "10": [
        "investor",
        "investors",
        "investment process",
        "work with investors",
        "partner with ndc"
    ],

    "11": [
        "investor preparation",
        "documents",
        "business plan",
        "feasibility",
        "financial projection",
        "investment amount",
        "financing",
        "technology",
        "land requirements"
    ],

    "12": [
        "investment opportunity",
        "investment opportunities",
        "joint venture",
        "jv",
        "ppp",
        "leasing",
        "factory",
        "shed"
    ],

    "13": [
        "tender",
        "tenders",
        "procurement",
        "rfp",
        "eoi",
        "expression of interest",
        "asset disposal"
    ],

    "14": [
        "job",
        "jobs",
        "vacancy",
        "vacancies",
        "career",
        "careers",
        "employment"
    ],

    "15": [
        "organization",
        "organizational structure",
        "management",
        "managing director",
        "director",
        "directors",
        "corporate secretary",
        "internal auditor",
        "finance director",
        "heavy industries",
        "strategic value addition",
        "investment manager",
        "procurement manager",
        "human resources",
        "communication affairs"
    ],

    "16": [
        "government",
        "government relationship",
        "ministry",
        "public sector"
    ],

    "17": [
        "private investor",
        "private investors",
        "private sector",
        "private partnership"
    ],

    "18": [
        "economic impact",
        "economy",
        "employment",
        "economic benefits"
    ],

    "19": [
        "history",
        "historical",
        "1962",
        "1965",
        "tdc",
        "tanganyika development corporation"
    ],

    "20": [
        "sido",
        "ndc vs sido",
        "difference between ndc and sido"
    ],

    "21": [
        "tic",
        "ndc vs tic",
        "difference between ndc and tic"
    ],

    "22": [
        "strategic project",
        "strategic projects",
        "basic industries",
        "power production",
        "automotive",
        "pharmaceutical",
        "textile",
        "apparel"
    ],

    "23": [
        "questions"
    ],

    "24": [
        "answer rules",
        "chatbot rules"
    ],

    "25": [
        "contact",
        "address",
        "phone",
        "email"
    ]
};

/*
==================================================
GET RELEVANT SECTIONS
==================================================
*/

function getSections(question) {
    const q = normalize(question);

    const matched = [];

    for (const [sectionNumber, keywords] of Object.entries(
        SECTION_KEYWORDS
    )) {
        for (const keyword of keywords) {
            if (q.includes(normalize(keyword))) {
                matched.push(sectionNumber);
                break;
            }
        }
    }

    /*
     * Always include management section for management
     * related questions.
     */
    const managementQuestion =
        q.includes("management") ||
        q.includes("managing director") ||
        q.includes("director") ||
        q.includes("directors") ||
        q.includes("manager") ||
        q.includes("corporate secretary") ||
        q.includes("internal auditor") ||
        q.includes("organizational structure") ||
        q.includes("organization structure");

    if (managementQuestion && !matched.includes("15")) {
        matched.push("15");
    }

    return [...new Set(matched)];
}

/*
==================================================
BUILD CONTEXT
==================================================
*/

function buildContext(question) {
    const matchedSections = getSections(question);

    let context = "";

    for (const sectionNumber of matchedSections) {
        const section = sections[sectionNumber];

        if (!section) {
            continue;
        }

        context += `
==================================================
${section.number}. ${section.title}
==================================================
${section.content}
`;
    }

    if (!context.trim()) {
        context = knowledgeBase;
    }

    return context;
}

/*
==================================================
PERSON / MANAGEMENT DETECTION
==================================================
*/

function isWhoQuestion(question) {
    const q = normalize(question);

    return (
        q.includes("who is") ||
        q.includes("who are") ||
        q.includes("whos") ||
        q.includes("who's") ||
        q.includes("name of") ||
        q.includes("which person")
    );
}

/*
==================================================
FIND PERSON BY NAME
==================================================
*/

function findManagementPerson(question) {
    const q = normalizeName(question);

    for (const person of NDC_MANAGEMENT) {
        const fullName = normalizeName(person.name);

        if (
            q.includes(fullName) ||
            fullName.includes(q)
        ) {
            return person;
        }
    }

    return null;
}

/*
==================================================
ANSWER PERSON QUESTION
==================================================
*/

function getPersonAnswer(question) {
    if (!isWhoQuestion(question)) {
        return null;
    }

    const person = findManagementPerson(question);

    if (!person) {
        return null;
    }

    return `${person.name} is the ${person.position} of the National Development Corporation (NDC).`;
}

/*
==================================================
ANSWER POSITION QUESTION
==================================================
*/

function getPositionAnswer(question) {
    if (!isWhoQuestion(question)) {
        return null;
    }

    const q = normalize(question);

    for (const person of NDC_MANAGEMENT) {
        const position = normalize(person.position);

        /*
         * Exact position match.
         *
         * This is important because the answer must come
         * from the management directory, NOT Ollama.
         */
        if (q.includes(position)) {
            return `${person.name} is the ${person.position} of the National Development Corporation (NDC).`;
        }
    }

    /*
     * Common variations.
     */

    if (
        q.includes("managing director") ||
        q.includes("head of ndc") ||
        q.includes("who leads ndc")
    ) {
        const person = NDC_MANAGEMENT.find(
            item => item.position === "Managing Director"
        );

        return `${person.name} is the person serving as Managing Director of the National Development Corporation (NDC).`;
    }

    if (
        q.includes("finance director") ||
        q.includes("director finance")
    ) {
        const person = NDC_MANAGEMENT.find(
            item => item.position === "Director of Finance"
        );

        return `${person.name} is the ${person.position} of the National Development Corporation (NDC).`;
    }

    if (
        q.includes("planning director") ||
        q.includes("director planning")
    ) {
        const person = NDC_MANAGEMENT.find(
            item =>
                item.position ===
                "Director of Planning, Research and Development"
        );

        return `${person.name} is the ${person.position} of the National Development Corporation (NDC).`;
    }

    if (
        q.includes("heavy industries director") ||
        q.includes("director heavy industries")
    ) {
        const person = NDC_MANAGEMENT.find(
            item =>
                item.position ===
                "Director of Heavy Industries"
        );

        return `${person.name} is the ${person.position} of the National Development Corporation (NDC).`;
    }

    if (
        q.includes("strategic value addition director") ||
        q.includes("director strategic value addition")
    ) {
        const person = NDC_MANAGEMENT.find(
            item =>
                item.position ===
                "Director of Strategic Value Addition"
        );

        return `${person.name} is the ${person.position} of the National Development Corporation (NDC).`;
    }

    if (q.includes("chief internal auditor")) {
        const person = NDC_MANAGEMENT.find(
            item =>
                item.position ===
                "Chief Internal Auditor"
        );

        return `${person.name} is the ${person.position} of the National Development Corporation (NDC).`;
    }

    if (q.includes("corporate secretary")) {
        const person = NDC_MANAGEMENT.find(
            item =>
                item.position ===
                "Corporate Secretary"
        );

        return `${person.name} is the ${person.position} of the National Development Corporation (NDC).`;
    }

    if (q.includes("investment manager")) {
        const person = NDC_MANAGEMENT.find(
            item =>
                item.position ===
                "Investment Manager"
        );

        return `${person.name} is the ${person.position} of the National Development Corporation (NDC).`;
    }

    if (
        q.includes("procurement manager") ||
        q.includes("manager of procurement")
    ) {
        const person = NDC_MANAGEMENT.find(
            item =>
                item.position ===
                "Manager of Procurement Management"
        );

        return `${person.name} is the ${person.position} of the National Development Corporation (NDC).`;
    }

    if (
        q.includes("human resources manager") ||
        q.includes("administration manager")
    ) {
        const person = NDC_MANAGEMENT.find(
            item =>
                item.position ===
                "Manager of Administration & Human Resources Management"
        );

        return `${person.name} is the ${person.position} of the National Development Corporation (NDC).`;
    }

    if (
        q.includes("communication affairs") ||
        q.includes("communication manager")
    ) {
        const person = NDC_MANAGEMENT.find(
            item =>
                item.position ===
                "Ag. Manager of Communication Affairs"
        );

        return `${person.name} is the ${person.position} of the National Development Corporation (NDC).`;
    }

    /*
     * "Director of NDC" is ambiguous because there are
     * multiple director positions.
     */
    if (
        q === "who is the director of ndc" ||
        q === "who is director of ndc"
    ) {
        const person = NDC_MANAGEMENT.find(
            item =>
                item.position ===
                "Managing Director"
        );

        return `${person.name} is the Managing Director of the National Development Corporation (NDC).`;
    }

    return null;
}

/*
==================================================
LIST MANAGEMENT
==================================================
*/

function getManagementListAnswer(question) {
    const q = normalize(question);

    const asksForList =
        q.includes("management team") ||
        q.includes("management structure") ||
        q.includes("organizational structure") ||
        q.includes("organization structure") ||
        q.includes("list all directors") ||
        q.includes("list the directors") ||
        q.includes("list all management") ||
        q.includes("list the management") ||
        q.includes("all directors") ||
        q.includes("all managers") ||
        q.includes("who are the directors") ||
        q.includes("who are the management") ||
        q.includes("management members");

    if (!asksForList) {
        return null;
    }

    let answer =
        "The current NDC management listed in the available information is:\n\n";

    NDC_MANAGEMENT.forEach((person, index) => {
        answer += `${index + 1}. ${person.name} — ${person.position}\n`;
    });

    return answer.trim();
}

/*
==================================================
IS NDC RELATED?
==================================================
*/

function isNDCRelated(question) {
    const q = normalize(question);

    /*
     * First check whether the question contains one of
     * the known management people.
     */
    for (const person of NDC_MANAGEMENT) {
        const name = normalizeName(person.name);

        if (q.includes(name)) {
            return true;
        }
    }

    const keywords = [
        "ndc",
        "national development corporation",
        "liganga",
        "mchuchuma",
        "engaruka",
        "tamco",
        "kmtc",
        "nyanza industrial",
        "kange industrial",
        "industrial park",
        "industrial estate",
        "industrial project",
        "industrialization",
        "investment",
        "investor",
        "investors",
        "tender",
        "tenders",
        "procurement",
        "vacancy",
        "vacancies",
        "jobs",
        "career",
        "managing director",
        "director",
        "manager",
        "corporate secretary",
        "internal auditor",
        "sido",
        "tic"
    ];

    return keywords.some(keyword =>
        q.includes(keyword)
    );
}

/*
==================================================
CONVERSATIONAL ANSWERS
==================================================
*/

function isGreeting(question) {
    const q = normalize(question);

    return [
        "hi",
        "hello",
        "hey",
        "good morning",
        "good afternoon",
        "good evening",
        "mambo",
        "habari"
    ].some(
        greeting =>
            q === greeting ||
            q.startsWith(`${greeting} `)
    );
}

function isThanks(question) {
    const q = normalize(question);

    return (
        q === "thanks" ||
        q === "thank you" ||
        q === "thankyou" ||
        q.includes("thanks a lot") ||
        q.includes("thank you very much")
    );
}

function isGoodbye(question) {
    const q = normalize(question);

    return (
        q === "bye" ||
        q === "goodbye" ||
        q === "see you" ||
        q === "see you later"
    );
}

function isIdentityQuestion(question) {
    const q = normalize(question);

    return (
        q.includes("who are you") ||
        q.includes("what are you") ||
        q.includes("what is your name") ||
        q.includes("are you a bot") ||
        q.includes("are you ai") ||
        q.includes("are you an ai")
    );
}

function isCapabilityQuestion(question) {
    const q = normalize(question);

    return (
        q.includes("what can you do") ||
        q.includes("how can you help") ||
        q.includes("what do you know") ||
        q.includes("what information do you have")
    );
}

function getConversationalAnswer(question) {
    if (isGreeting(question)) {
        return "Hello! I can help you with information about the National Development Corporation (NDC), including its functions, projects, investment opportunities, management, and contact information.";
    }

    if (isThanks(question)) {
        return "You're welcome! Feel free to ask another question about NDC.";
    }

    if (isGoodbye(question)) {
        return "Goodbye! Feel free to come back if you have more questions about NDC.";
    }

    if (isIdentityQuestion(question)) {
        return "I am an information assistant for the National Development Corporation (NDC).";
    }

    if (isCapabilityQuestion(question)) {
        return "I can provide information about NDC's role, functions, projects, industrial areas, investment opportunities, management, and contact details.";
    }

    return null;
}

/*
==================================================
CONTACT ANSWER
==================================================
*/

function getContactAnswer(question) {
    const q = normalize(question);

    const contactQuestion =
        q.includes("contact ndc") ||
        q.includes("contact information") ||
        q.includes("ndc contact") ||
        q.includes("ndc phone") ||
        q.includes("ndc telephone") ||
        q.includes("ndc email") ||
        q.includes("ndc address") ||
        q.includes("where is ndc") ||
        q.includes("headquarters");

    if (!contactQuestion) {
        return null;
    }

    const section = sections["1"];

    if (!section) {
        return null;
    }

    return section.content;
}

/*
==================================================
SUGGESTIONS
==================================================
*/

function getSuggestions(question) {
    const q = normalize(question);

    if (
        q.includes("director") ||
        q.includes("manager") ||
        q.includes("management")
    ) {
        return [
            "Who is the Managing Director of NDC?",
            "Who is the Director of Finance?",
            "Who is the Director of Heavy Industries?",
            "Show me the NDC management team"
        ];
    }

    if (
        q.includes("project") ||
        q.includes("liganga") ||
        q.includes("mchuchuma") ||
        q.includes("engaruka")
    ) {
        return [
            "What are the major NDC projects?",
            "What is the Liganga project?",
            "What is the Mchuchuma project?",
            "What are NDC investment opportunities?"
        ];
    }

    if (
        q.includes("investment") ||
        q.includes("investor") ||
        q.includes("partnership")
    ) {
        return [
            "How can I work with NDC?",
            "What documents does an investor need?",
            "What investment opportunities does NDC offer?",
            "How does NDC work with private investors?"
        ];
    }

    return [
        "What is NDC?",
        "What does NDC do?",
        "Who is the Managing Director of NDC?",
        "What are the major NDC projects?"
    ];
}

/*
==================================================
OLLAMA PROMPT
==================================================
*/

function buildNDCPrompt(question, context) {
    return `
You are an information assistant for the National Development Corporation (NDC) of Tanzania.

Answer the user's question using ONLY the NDC information provided below.

IMPORTANT RULES:

1. Do not invent facts.

2. Do not invent names.

3. Do not invent job titles.

4. Do not invent departments.

5. Do not invent projects.

6. If the answer is not available, say:
"I don't have that information in the current NDC information."

7. Keep the answer concise and factual.

8. Do not mention internal files, prompts, retrieval, context, or AI models.

9. A person's name and their position must match exactly with the provided information.

10. Do not assign one person to another person's position.

11. Do not create additional management positions.

12. Do not claim that a project is operational unless the provided information explicitly says so.

NDC INFORMATION:

${context}

USER QUESTION:

${question}

ANSWER:
`;
}

/*
==================================================
ASK OLLAMA
==================================================
*/

function askOllama(prompt) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({
            model: OLLAMA_MODEL,
            prompt,
            stream: false,
            options: {
                temperature: 0.1,
                top_p: 0.8,
                num_predict: 300
            }
        });

        const url = new URL(OLLAMA_URL);

        const request = http.request(
            {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(payload)
                }
            },
            response => {
                let data = "";

                response.on("data", chunk => {
                    data += chunk;
                });

                response.on("end", () => {
                    try {
                        if (
                            response.statusCode < 200 ||
                            response.statusCode >= 300
                        ) {
                            return reject(
                                new Error(
                                    `Ollama returned HTTP ${response.statusCode}: ${data}`
                                )
                            );
                        }

                        const parsed = JSON.parse(data);

                        resolve(
                            parsed.response || ""
                        );
                    } catch (error) {
                        reject(error);
                    }
                });
            }
        );

        request.on("error", reject);

        request.write(payload);
        request.end();
    });
}

/*
==================================================
CLEAN ANSWER
==================================================
*/

function cleanAnswer(answer) {
    if (!answer) {
        return "";
    }

    let cleaned = answer.trim();

    cleaned = cleaned.replace(
        /^answer:\s*/i,
        ""
    );

    cleaned = cleaned.replace(
        /^based on the (provided|available) (information|context)[,:]?\s*/i,
        ""
    );

    return cleaned.trim();
}

/*
==================================================
CHAT ENDPOINT
==================================================
*/

app.post("/chat", async (req, res) => {
    try {
        const question =
            typeof req.body?.question === "string"
                ? req.body.question.trim()
                : "";

        if (!question) {
            return res.status(400).json({
                answer: "Please enter a question.",
                suggestions: getSuggestions("")
            });
        }

        console.log("==========================================");
        console.log("Question:", question);

        /*
         * 1. Normal conversation
         */
        const conversationalAnswer =
            getConversationalAnswer(question);

        if (conversationalAnswer) {
            console.log(
                "Answer mode: CONVERSATIONAL"
            );

            return res.json({
                answer: conversationalAnswer,
                suggestions: getSuggestions(question)
            });
        }

        /*
         * 2. Contact
         */
        const contactAnswer =
            getContactAnswer(question);

        if (contactAnswer) {
            console.log(
                "Answer mode: CONTACT"
            );

            return res.json({
                answer: contactAnswer,
                suggestions: getSuggestions(question)
            });
        }

        /*
         * 3. Complete management list
         */
        const managementListAnswer =
            getManagementListAnswer(question);

        if (managementListAnswer) {
            console.log(
                "Answer mode: MANAGEMENT LIST"
            );

            return res.json({
                answer: managementListAnswer,
                suggestions: getSuggestions(question)
            });
        }

        /*
         * 4. Person lookup
         *
         * Example:
         * "Who is Mr. Mafutah Bunini?"
         */
        const personAnswer =
            getPersonAnswer(question);

        if (personAnswer) {
            console.log(
                "Answer mode: MANAGEMENT PERSON"
            );

            return res.json({
                answer: personAnswer,
                suggestions: getSuggestions(question)
            });
        }

        /*
         * 5. Position lookup
         *
         * Example:
         * "Who is the Director of Planning,
         * Research and Development?"
         */
        const positionAnswer =
            getPositionAnswer(question);

        if (positionAnswer) {
            console.log(
                "Answer mode: MANAGEMENT POSITION"
            );

            return res.json({
                answer: positionAnswer,
                suggestions: getSuggestions(question)
            });
        }

        /*
         * 6. NDC check
         */
        if (!isNDCRelated(question)) {
            console.log(
                "Answer mode: OUTSIDE NDC"
            );

            return res.json({
                answer:
                    "I can help with information about the National Development Corporation (NDC). Please ask an NDC-related question.",
                suggestions: getSuggestions(question)
            });
        }

        /*
         * 7. Retrieve relevant company.txt
         */
        const context =
            buildContext(question);

        console.log(
            "Relevant sections:",
            getSections(question)
        );

        /*
         * 8. Ollama
         */
        const prompt =
            buildNDCPrompt(
                question,
                context
            );

        console.log(
            "Answer mode: OLLAMA"
        );

        const rawAnswer =
            await askOllama(prompt);

        const answer =
            cleanAnswer(rawAnswer);

        if (!answer) {
            return res.json({
                answer:
                    "I don't have that information in the current NDC information.",
                suggestions:
                    getSuggestions(question)
            });
        }

        return res.json({
            answer,
            suggestions:
                getSuggestions(question)
        });

    } catch (error) {
        console.error(
            "Chat error:",
            error
        );

        return res.status(500).json({
            answer:
                "Sorry, I could not process your question at the moment.",
            suggestions:
                getSuggestions(
                    req.body?.question || ""
                )
        });
    }
});

/*
==================================================
HEALTH CHECK
==================================================
*/

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        service: "NDC Chatbot",
        model: OLLAMA_MODEL,
        knowledgeBaseLoaded:
            Boolean(knowledgeBase),
        managementDirectory:
            NDC_MANAGEMENT.length,
        websiteChecking:
            false
    });
});

/*
==================================================
HTTPS SERVER
==================================================
*/

if (
    !fs.existsSync(SSL_KEY) ||
    !fs.existsSync(SSL_CERT)
) {
    console.error(
        "SSL certificate files not found."
    );

    console.error(
        "Expected:"
    );

    console.error(SSL_KEY);
    console.error(SSL_CERT);

    process.exit(1);
}

const sslOptions = {
    key: fs.readFileSync(SSL_KEY),
    cert: fs.readFileSync(SSL_CERT)
};

https
    .createServer(
        sslOptions,
        app
    )
    .listen(
        PORT,
        "0.0.0.0",
        () => {
            console.log(
                "=========================================="
            );

            console.log(
                "NDC Chatbot Server Started"
            );

            console.log(
                "=========================================="
            );

            console.log(
                `HTTPS Port: ${PORT}`
            );

            console.log(
                `Model: ${OLLAMA_MODEL}`
            );

            console.log(
                `Knowledge: ${KNOWLEDGE_FILE}`
            );

            console.log(
                "Website checking: DISABLED"
            );

            console.log(
                "Management directory: ENABLED"
            );

            console.log(
                `Management records: ${NDC_MANAGEMENT.length}`
            );

            console.log(
                "=========================================="
            );
        }
    );