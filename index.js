const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors({
  origin: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

const KNOWLEDGE_FILE = "/root/necbot/knowledge/company.txt";
const OLLAMA_URL = "http://127.0.0.1:11434/api/generate";

const MODEL = "qwen2.5:1.5b";

// --------------------------------------------------
// LOAD KNOWLEDGE ONCE
// --------------------------------------------------

const knowledge = fs.readFileSync(KNOWLEDGE_FILE, "utf8");

// --------------------------------------------------
// SIMPLE IN-MEMORY CONVERSATION MEMORY
// --------------------------------------------------

// Stores recent conversations by sessionId.
//
// This is intentionally simple.
// If the server restarts, the memory is cleared.

const conversations = new Map();

const MAX_HISTORY = 8;

function getHistory(sessionId) {
  if (!conversations.has(sessionId)) {
    conversations.set(sessionId, []);
  }

  return conversations.get(sessionId);
}

function addHistory(sessionId, role, content) {
  const history = getHistory(sessionId);

  history.push({
    role,
    content
  });

  while (history.length > MAX_HISTORY) {
    history.shift();
  }
}

// --------------------------------------------------
// NORMALIZE QUESTION
// --------------------------------------------------

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[?.,!;:()[\]{}"'`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// --------------------------------------------------
// EXTRACT SECTION
// --------------------------------------------------

function extractSection(text, sectionTitle) {
  const start = text.indexOf(sectionTitle);

  if (start === -1) {
    return "";
  }

  const remaining = text.substring(start + sectionTitle.length);

  const nextSeparator = remaining.search(/\n={10,}/);

  if (nextSeparator === -1) {
    return remaining.trim();
  }

  return (
    sectionTitle +
    "\n" +
    remaining.substring(0, nextSeparator).trim()
  );
}

// --------------------------------------------------
// GET MULTIPLE RELEVANT SECTIONS
// --------------------------------------------------

function getSections(question) {
  const q = normalize(question);

  const sections = [];

  function add(title) {
    const section = extractSection(knowledge, title);

    if (section && !sections.includes(section)) {
      sections.push(section);
    }
  }

  // ------------------------------------------------
  // CONTACT
  // ------------------------------------------------

  const contactWords = [
    "contact",
    "email",
    "e mail",
    "phone",
    "telephone",
    "call",
    "address",
    "headquarters",
    "hq",
    "website",
    "reach",
    "location"
  ];

  if (contactWords.some(word => q.includes(word))) {
    add("1. BASIC INFORMATION");
    add("25. CONTACT INFORMATION");
  }

  // ------------------------------------------------
  // BASIC INFORMATION / IDENTITY
  // ------------------------------------------------

  const identityWords = [
    "what is ndc",
    "what does ndc stand for",
    "who is ndc",
    "ndc mean",
    "ndc meaning",
    "company",
    "organization",
    "government organization",
    "government institution",
    "who owns",
    "owner",
    "country",
    "which country",
    "where does",
    "operate"
  ];

  if (identityWords.some(word => q.includes(word))) {
    add("1. BASIC INFORMATION");
    add("2. WHAT IS NDC?");
  }

  // ------------------------------------------------
  // PURPOSE / ROLE / FUNCTIONS
  // ------------------------------------------------

  const purposeWords = [
    "purpose",
    "role",
    "function",
    "functions",
    "mission",
    "vision",
    "what does ndc do",
    "responsible",
    "responsibility",
    "mandate",
    "main work",
    "work"
  ];

  if (purposeWords.some(word => q.includes(word))) {
    add("3. NDC VISION");
    add("4. NDC MISSION");
    add("5. MAIN PURPOSE OF NDC");
    add("6. CORE FUNCTIONS OF NDC");
  }

  // ------------------------------------------------
  // INDUSTRIES
  // ------------------------------------------------

  const industryWords = [
    "industry",
    "industries",
    "industrial",
    "manufacturing",
    "sectors",
    "sector",
    "iron",
    "steel",
    "coal",
    "chemical",
    "chemicals",
    "biological",
    "biotechnology",
    "agro",
    "agriculture",
    "machinery",
    "machine",
    "tyre",
    "tires",
    "tire",
    "pharmaceutical",
    "medical",
    "textile",
    "automotive"
  ];

  if (industryWords.some(word => q.includes(word))) {
    add("6. CORE FUNCTIONS OF NDC");
    add("7. NDC'S STRATEGIC INDUSTRIAL AREAS");
    add("22. NDC'S CURRENT STRATEGIC PROJECT CATEGORIES");
  }

  // ------------------------------------------------
  // PROJECTS
  // ------------------------------------------------

  if (
    q.includes("project") ||
    q.includes("projects") ||
    q.includes("major project") ||
    q.includes("main project")
  ) {
    add("8. MAJOR NDC PROJECTS");
    add("28. IMPORTANT PROJECT LIST");
  }

  // ------------------------------------------------
  // LIGANGA
  // ------------------------------------------------

  if (
    q.includes("liganga") ||
    q.includes("iron ore") ||
    q.includes("iron and steel")
  ) {
    add("8.1 LIGANGA IRON AND STEEL PROJECT");
  }

  // ------------------------------------------------
  // MCHUCHUMA
  // ------------------------------------------------

  if (
    q.includes("mchuchuma") ||
    q.includes("coal to electricity") ||
    q.includes("coal-to-electricity")
  ) {
    add("8.2 MCHUCHUMA COAL PROJECT");
    add("8.3 MCHUCHUMA COAL-TO-ELECTRICITY");
  }

  // ------------------------------------------------
  // ENGARUKA
  // ------------------------------------------------

  if (
    q.includes("engaruka") ||
    q.includes("soda ash")
  ) {
    add("8.4 ENGARUKA SODA ASH PROJECT");
  }

  // ------------------------------------------------
  // TYRE
  // ------------------------------------------------

  if (
    q.includes("tyre") ||
    q.includes("tires") ||
    q.includes("tire")
  ) {
    add("8.5 ARUSHA TYRE MANUFACTURING PROJECT");
  }

  // ------------------------------------------------
  // MACHINE TOOLS
  // ------------------------------------------------

  if (
    q.includes("machine tools") ||
    q.includes("kmtc") ||
    q.includes("kilimanjaro machine") ||
    q.includes("mang ula") ||
    q.includes("mang'ula")
  ) {
    add("8.6 MANG'ULA MACHINE TOOLS PROJECT");
    add("8.7 KILIMANJARO MACHINE TOOLS / KMTC");
  }

  // ------------------------------------------------
  // TBPL
  // ------------------------------------------------

  if (
    q.includes("tbpl") ||
    q.includes("biotech") ||
    q.includes("biotechnology") ||
    q.includes("biolarvicide") ||
    q.includes("biological")
  ) {
    add("8.8 TANZANIA BIOTECH PRODUCTS LIMITED (TBPL)");
  }

  // ------------------------------------------------
  // TAMCO
  // ------------------------------------------------

  if (
    q.includes("tamco") ||
    q.includes("kibaha industrial") ||
    q.includes("industrial estate")
  ) {
    add("8.9 TAMCO INDUSTRIAL ESTATE");
  }

  // ------------------------------------------------
  // INDUSTRIAL AREAS
  // ------------------------------------------------

  if (
    q.includes("industrial park") ||
    q.includes("industrial parks") ||
    q.includes("industrial area") ||
    q.includes("industrial areas") ||
    q.includes("industrial estate") ||
    q.includes("industrial estates") ||
    q.includes("industrial land") ||
    q.includes("industrial plot") ||
    q.includes("industrial plots")
  ) {
    add("9. INDUSTRIAL PARKS / INDUSTRIAL ESTATES");
  }

  // ------------------------------------------------
  // KANGE
  // ------------------------------------------------

  if (q.includes("kange")) {
    add("8.10 KANGE INDUSTRIAL AREA");
  }

  // ------------------------------------------------
  // NYANZA
  // ------------------------------------------------

  if (q.includes("nyanza")) {
    add("8.11 NYANZA INDUSTRIAL AREA");
  }

  // ------------------------------------------------
  // KMTC INDUSTRIAL AREA
  // ------------------------------------------------

  if (
    q.includes("kmtc industrial") ||
    q.includes("kmtc area")
  ) {
    add("8.12 KMTC INDUSTRIAL AREA");
  }

  // ------------------------------------------------
  // ETC / DRY PORT
  // ------------------------------------------------

  if (
    q.includes("etc cargo") ||
    q.includes("dry port") ||
    q.includes("grain")
  ) {
    add("8.13 ETC CARGO / GRAIN DRY PORT");
  }

  // ------------------------------------------------
  // RUBBER
  // ------------------------------------------------

  if (
    q.includes("rubber") ||
    q.includes("kalunga") ||
    q.includes("kihuhwi")
  ) {
    add("8.14 KALUNGA RUBBER PLANTATIONS");
    add("8.15 KIHUHWI RUBBER PROJECT");
  }

  // ------------------------------------------------
  // INVESTMENT
  // ------------------------------------------------

  if (
    q.includes("invest") ||
    q.includes("investor") ||
    q.includes("investment") ||
    q.includes("partner") ||
    q.includes("partnership") ||
    q.includes("joint venture") ||
    q.includes("foreign investor") ||
    q.includes("foreigner") ||
    q.includes("finance") ||
    q.includes("funding") ||
    q.includes("money")
  ) {
    add("10. HOW NDC WORKS WITH INVESTORS");
    add("11. WHAT SHOULD AN INVESTOR PREPARE?");
    add("12. TYPES OF INVESTMENT OPPORTUNITIES");
  }

  // ------------------------------------------------
  // TENDERS
  // ------------------------------------------------

  if (
    q.includes("tender") ||
    q.includes("procurement") ||
    q.includes("proposal") ||
    q.includes("expression of interest") ||
    q.includes("rfp")
  ) {
    add("13. TENDERS AND PROCUREMENT");
  }

  // ------------------------------------------------
  // JOBS
  // ------------------------------------------------

  if (
    q.includes("job") ||
    q.includes("jobs") ||
    q.includes("vacancy") ||
    q.includes("vacancies") ||
    q.includes("career") ||
    q.includes("careers") ||
    q.includes("employment")
  ) {
    add("14. JOBS / EMPLOYMENT AT NDC");
  }

  // ------------------------------------------------
  // ORGANIZATION
  // ------------------------------------------------

  if (
    q.includes("board") ||
    q.includes("managing director") ||
    q.includes("director") ||
    q.includes("organizational structure") ||
    q.includes("organization structure")
  ) {
    add("15. NDC ORGANIZATIONAL STRUCTURE");
  }

  // ------------------------------------------------
  // GOVERNMENT
  // ------------------------------------------------

  if (
    q.includes("government") ||
    q.includes("ministry") ||
    q.includes("supervise") ||
    q.includes("supervises")
  ) {
    add("16. NDC AND THE TANZANIAN GOVERNMENT");
    add("1. BASIC INFORMATION");
  }

  // ------------------------------------------------
  // PRIVATE SECTOR
  // ------------------------------------------------

  if (
    q.includes("private sector") ||
    q.includes("private company") ||
    q.includes("private business") ||
    q.includes("entrepreneur")
  ) {
    add("17. NDC AND PRIVATE INVESTORS");
  }

  // ------------------------------------------------
  // ECONOMIC IMPACT
  // ------------------------------------------------

  if (
    q.includes("economic impact") ||
    q.includes("benefit") ||
    q.includes("employment creation") ||
    q.includes("industrialization")
  ) {
    add("18. NDC'S ECONOMIC IMPACT");
  }

  // ------------------------------------------------
  // SIDO
  // ------------------------------------------------

  if (q.includes("sido")) {
    add("20. IMPORTANT DISTINCTION: NDC IS NOT SIDO");
  }

  // ------------------------------------------------
  // TIC
  // ------------------------------------------------

  if (
    q.includes("tic") ||
    q.includes("tanzania investment centre") ||
    q.includes("tanzania investment center")
  ) {
    add("21. IMPORTANT DISTINCTION: NDC IS NOT TANZANIA INVESTMENT CENTRE");
  }

  // ------------------------------------------------
  // HISTORY
  // ------------------------------------------------

  if (
    q.includes("history") ||
    q.includes("historical") ||
    q.includes("established") ||
    q.includes("1962") ||
    q.includes("1965")
  ) {
    add("2. WHAT IS NDC?");
    add("19. HISTORICAL IMPORTANCE");
  }

  // ------------------------------------------------
  // GENERAL NDC QUESTIONS
  // ------------------------------------------------

  if (
    q === "ndc" ||
    q === "about ndc" ||
    q.includes("tell me about ndc") ||
    q.includes("tell me more about ndc") ||
    q.includes("give me information about ndc") ||
    q.includes("ndc tanzania") ||
    q.includes("national development corporation")
  ) {
    add("1. BASIC INFORMATION");
    add("2. WHAT IS NDC?");
    add("3. NDC VISION");
    add("4. NDC MISSION");
    add("5. MAIN PURPOSE OF NDC");
    add("7. NDC'S STRATEGIC INDUSTRIAL AREAS");
  }

  if (sections.length === 0) {
    return null;
  }

  return sections.join(
    "\n\n==============================\n\n"
  );
}

// --------------------------------------------------
// DIRECT ANSWERS
// --------------------------------------------------

function getDirectAnswer(question) {
  const q = normalize(question);

  // ------------------------------------------------
  // GREETINGS
  // ------------------------------------------------

  if (
    q === "hi" ||
    q === "hello" ||
    q === "hey" ||
    q === "good morning" ||
    q === "good afternoon" ||
    q === "good evening"
  ) {
    return {
      answer: "Hello! How can I help you with NDC or anything else?",
      suggestions: [
        "What is NDC?",
        "What projects does NDC have?",
        "How can I contact NDC?"
      ]
    };
  }

  // ------------------------------------------------
  // GOODBYE
  // ------------------------------------------------

  if (
    q === "bye" ||
    q === "goodbye" ||
    q === "see you"
  ) {
    return {
      answer: "Goodbye! Feel free to come back if you have any questions.",
      suggestions: [
        "What is NDC?",
        "Tell me about NDC projects",
        "How can I contact NDC?"
      ]
    };
  }

  // ------------------------------------------------
  // WHO ARE YOU
  // ------------------------------------------------

  if (
    q === "who are you" ||
    q === "what are you" ||
    q === "who are u"
  ) {
    return {
      answer:
        "I'm the NDC Assistant, an AI assistant that provides information about the National Development Corporation (NDC) of Tanzania.",
      suggestions: [
        "What is NDC?",
        "What does NDC do?",
        "What projects does NDC have?"
      ]
    };
  }

  // ------------------------------------------------
  // COUNTRY
  // ------------------------------------------------

  if (
    q.includes("which country") ||
    q.includes("what country") ||
    q.includes("country does ndc") ||
    q === "country"
  ) {
    return {
      answer: "NDC is a government institution of the United Republic of Tanzania.",
      suggestions: [
        "Where is NDC headquarters?",
        "Which ministry oversees NDC?",
        "What does NDC do?"
      ]
    };
  }

  // ------------------------------------------------
  // EMAIL
  // ------------------------------------------------

  if (
    q === "email" ||
    q.includes("email address") ||
    q.includes("what is the email") ||
    q.includes("their email") ||
    q.includes("ndc email") ||
    q.includes("give me the email") ||
    q.includes("email only") ||
    q.includes("contact email")
  ) {
    return {
      answer: "info@ndc.go.tz",
      suggestions: [
        "What is NDC's phone number?",
        "What is NDC's address?",
        "What is NDC's website?"
      ]
    };
  }

  // ------------------------------------------------
  // PHONE
  // ------------------------------------------------

  if (
    q === "phone" ||
    q === "telephone" ||
    q.includes("phone number") ||
    q.includes("telephone number") ||
    q.includes("ndc phone")
  ) {
    return {
      answer:
        "NDC's telephone numbers are +255 22 2112893 and +255 22 2113618.",
      suggestions: [
        "What is NDC's email?",
        "What is NDC's address?",
        "Where is NDC headquarters?"
      ]
    };
  }

  // ------------------------------------------------
  // COMBINED CONTACT
  // ------------------------------------------------

  if (
    (q.includes("email") || q.includes("mail")) &&
    (q.includes("phone") ||
      q.includes("telephone") ||
      q.includes("call"))
  ) {
    return {
      answer:
        "You can contact NDC by email at info@ndc.go.tz or by telephone at +255 22 2112893 or +255 22 2113618.",
      suggestions: [
        "What is NDC's address?",
        "Where is NDC headquarters?",
        "What is NDC's website?"
      ]
    };
  }

  // ------------------------------------------------
  // ADDRESS
  // ------------------------------------------------

  if (
    q.includes("address") ||
    q.includes("physical address") ||
    q.includes("postal address")
  ) {
    return {
      answer:
        "NDC's headquarters are at Development House, Kivukoni Front / Ohio Street, P.O. Box 2669, Dar es Salaam, Tanzania.",
      suggestions: [
        "What is NDC's email?",
        "What is NDC's phone number?",
        "What is NDC's website?"
      ]
    };
  }

  // ------------------------------------------------
  // WEBSITE
  // ------------------------------------------------

  if (
    q === "website" ||
    q.includes("ndc website") ||
    q.includes("official website")
  ) {
    return {
      answer: "NDC's official website is https://ndc.go.tz/",
      suggestions: [
        "How can I contact NDC?",
        "Where can I find NDC tenders?",
        "Where can I find NDC vacancies?"
      ]
    };
  }

  // ------------------------------------------------
  // OK / THANKS
  // ------------------------------------------------

  if (
    q === "ok" ||
    q === "okay" ||
    q === "thanks" ||
    q === "thank you"
  ) {
    return {
      answer: "You're welcome! I'm happy to help.",
      suggestions: [
        "What projects does NDC have?",
        "How can I become an NDC investor?",
        "How can I contact NDC?"
      ]
    };
  }

  return null;
}

// --------------------------------------------------
// BUILD CONVERSATION HISTORY
// --------------------------------------------------

function formatHistory(history) {
  if (!history.length) {
    return "No previous conversation.";
  }

  return history
    .map(message => {
      const role =
        message.role === "user"
          ? "USER"
          : "ASSISTANT";

      return `${role}: ${message.content}`;
    })
    .join("\n");
}

// --------------------------------------------------
// OLLAMA
// --------------------------------------------------

async function askOllama(
  question,
  relevantKnowledge,
  history
) {

  const historyText = formatHistory(history);

  const prompt = `
You are the NDC Assistant.

==================================================
IDENTITY
==================================================

NDC ALWAYS means:

National Development Corporation (NDC)
Country: United Republic of Tanzania.

This is the NDC that the user is asking about.

NEVER interpret NDC as:
- a Chinese organization
- an Indian organization
- an American organization
- another organization with the abbreviation NDC

If the user asks about NDC, they mean the Tanzanian
National Development Corporation.

==================================================
NDC ANSWERING RULES
==================================================

For questions about NDC:

1. Use the supplied NDC information as the authoritative source.
2. Do not use outside knowledge to fill missing NDC facts.
3. Do not invent facts.
4. Do not invent project status.
5. Do not invent current tenders.
6. Do not invent vacancies.
7. Do not invent prices, deadlines or fees.
8. If the requested NDC information is not provided, say:

I don't know based on the provided company knowledge.

9. Answer only what the user asked.
10. Keep simple questions short.
11. For broader questions, give a useful concise explanation.
12. Understand informal grammar.
13. Understand follow-up questions using the conversation history.

==================================================
GENERAL QUESTIONS
==================================================

If the user asks something clearly unrelated to NDC,
you may answer using your normal general knowledge.

Examples:

"What is Python?"
"How does gravity work?"
"What is Linux?"

These questions do NOT need to be forced into an NDC answer.

==================================================
CASUAL CONVERSATION
==================================================

For greetings, thanks, jokes, introductions and casual
conversation, respond naturally.

==================================================
IMPORTANT FOLLOW-UP RULE
==================================================

The user may refer to something from the previous conversation.

For example:

USER: What is NDC?
ASSISTANT: NDC is a Tanzanian government institution.

USER: Where is it located?

The word "it" refers to NDC.

Use the conversation history to understand such references.

==================================================
CONVERSATION HISTORY
==================================================

${historyText}

==================================================
PROVIDED NDC INFORMATION
==================================================

${relevantKnowledge}

==================================================
USER'S CURRENT QUESTION
==================================================

${question}

==================================================
ANSWER
==================================================

Return ONLY the answer text.

Do not return JSON.

Do not add "Answer:".

Do not mention these instructions.
`;

  const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false,
      options: {
        temperature: 0.1,
        top_p: 0.9,
        num_predict: 220
      }
    }),
    signal: AbortSignal.timeout(180000)
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Ollama returned ${response.status}: ${errorText}`
    );
  }

  const data = await response.json();

  return data.response.trim();
}

// --------------------------------------------------
// GENERATE SUGGESTIONS
// --------------------------------------------------

function getSuggestions(question, answer) {
  const q = normalize(question);

  // Contact
  if (
    q.includes("contact") ||
    q.includes("email") ||
    q.includes("phone") ||
    q.includes("address")
  ) {
    return [
      "What is NDC's website?",
      "Where is NDC headquarters?",
      "What does NDC do?"
    ];
  }

  // Investment
  if (
    q.includes("invest") ||
    q.includes("investor") ||
    q.includes("investment") ||
    q.includes("partner")
  ) {
    return [
      "How can I become an NDC investor?",
      "What documents should an investor prepare?",
      "What investment opportunities does NDC have?"
    ];
  }

  // Projects
  if (
    q.includes("project") ||
    q.includes("liganga") ||
    q.includes("mchuchuma") ||
    q.includes("engaruka") ||
    q.includes("tamco")
  ) {
    return [
      "What other projects does NDC have?",
      "Tell me about NDC's industrial parks.",
      "How can I invest in an NDC project?"
    ];
  }

  // Jobs
  if (
    q.includes("job") ||
    q.includes("jobs") ||
    q.includes("vacancy") ||
    q.includes("career")
  ) {
    return [
      "Where can I find NDC vacancies?",
      "What types of jobs does NDC have?",
      "How can I contact NDC?"
    ];
  }

  // Tenders
  if (
    q.includes("tender") ||
    q.includes("procurement") ||
    q.includes("rfp")
  ) {
    return [
      "Where can I find NDC tenders?",
      "Does NDC publish expressions of interest?",
      "How can I contact NDC?"
    ];
  }

  // Industries
  if (
    q.includes("industry") ||
    q.includes("industrial") ||
    q.includes("manufacturing") ||
    q.includes("sector")
  ) {
    return [
      "What industries does NDC focus on?",
      "What are NDC's major projects?",
      "Does NDC work with private investors?"
    ];
  }

  // SIDO
  if (q.includes("sido")) {
    return [
      "What is the difference between NDC and TIC?",
      "What does NDC do?",
      "How does NDC work with investors?"
    ];
  }

  // TIC
  if (q.includes("tic")) {
    return [
      "What is the difference between NDC and SIDO?",
      "How does NDC work with investors?",
      "What investment opportunities does NDC have?"
    ];
  }

  // Default NDC suggestions
  return [
    "What is NDC?",
    "What projects does NDC have?",
    "How can I contact NDC?"
  ];
}

// --------------------------------------------------
// CHAT ENDPOINT
// --------------------------------------------------

app.post("/chat", async (req, res) => {
  try {
    const {
      question,
      sessionId = "default"
    } = req.body;

    if (
      !question ||
      typeof question !== "string"
    ) {
      return res.status(400).json({
        error: "question is required"
      });
    }

    const cleanQuestion = question.trim();

    console.log("Question:", cleanQuestion);
    console.log("Session:", sessionId);

    const history = getHistory(sessionId);

    // ----------------------------------------------
    // DIRECT ANSWERS
    // ----------------------------------------------

    const direct = getDirectAnswer(cleanQuestion);

    if (direct) {

      addHistory(
        sessionId,
        "user",
        cleanQuestion
      );

      addHistory(
        sessionId,
        "assistant",
        direct.answer
      );

      return res.json({
        answer: direct.answer,
        suggestions: direct.suggestions,
        mode: "direct"
      });
    }

    // ----------------------------------------------
    // RETRIEVE RELEVANT NDC KNOWLEDGE
    // ----------------------------------------------

    const relevantKnowledge =
      getSections(cleanQuestion);

    // ----------------------------------------------
    // IF NO NDC KNOWLEDGE:
    // ALLOW GENERAL QUESTIONS
    // ----------------------------------------------

    const knowledgeForModel =
      relevantKnowledge ||
      "No specific NDC information is relevant to this question.";

    console.log(
      relevantKnowledge
        ? `Relevant knowledge length: ${relevantKnowledge.length}`
        : "No matching NDC section. General question."
    );

    // ----------------------------------------------
    // ASK OLLAMA
    // ----------------------------------------------

    const answer = await askOllama(
      cleanQuestion,
      knowledgeForModel,
      history
    );

    // ----------------------------------------------
    // SUGGESTIONS
    // ----------------------------------------------

    const suggestions =
      getSuggestions(
        cleanQuestion,
        answer
      );

    // ----------------------------------------------
    // SAVE CONVERSATION
    // ----------------------------------------------

    addHistory(
      sessionId,
      "user",
      cleanQuestion
    );

    addHistory(
      sessionId,
      "assistant",
      answer
    );

    // ----------------------------------------------
    // RESPONSE
    // ----------------------------------------------

    res.json({
      answer,
      suggestions,
      mode: relevantKnowledge
        ? "ndc"
        : "general"
    });

  } catch (error) {

    console.error("Error:", error);

    res.status(500).json({
      error: error.message
    });
  }
});

// --------------------------------------------------
// CLEAR SESSION
// --------------------------------------------------

app.post("/clear-chat", (req, res) => {

  const {
    sessionId = "default"
  } = req.body;

  conversations.delete(sessionId);

  res.json({
    success: true
  });
});

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

app.listen(PORT, () => {
  console.log(
    `API running on http://127.0.0.1:${PORT}`
  );
});
