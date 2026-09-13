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

// --------------------------------------------------
// LOAD KNOWLEDGE ONCE
// --------------------------------------------------

const knowledge = fs.readFileSync(KNOWLEDGE_FILE, "utf8");

// --------------------------------------------------
// NORMALIZE
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
// GET SECTIONS
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
  // BASIC / IDENTITY
  // ------------------------------------------------

  if (
    q === "ndc" ||
    q.includes("what is ndc") ||
    q.includes("what does ndc stand for") ||
    q.includes("who is ndc") ||
    q.includes("ndc meaning") ||
    q.includes("what is the national development corporation") ||
    q.includes("tell me about ndc") ||
    q.includes("tell me about ndc tanzania") ||
    q.includes("about ndc")
  ) {
    add("1. BASIC INFORMATION");
    add("2. WHAT IS NDC?");
    add("26. SHORT CHATBOT DESCRIPTION");
    add("27. ONE-SENTENCE DESCRIPTION");
  }

  // ------------------------------------------------
  // CONTACT
  // ------------------------------------------------

  if (
    q.includes("contact") ||
    q.includes("email") ||
    q.includes("e mail") ||
    q.includes("phone") ||
    q.includes("telephone") ||
    q.includes("address") ||
    q.includes("headquarters") ||
    q.includes("hq") ||
    q.includes("website") ||
    q.includes("location")
  ) {
    add("1. BASIC INFORMATION");
    add("25. CONTACT INFORMATION");
  }

  // ------------------------------------------------
  // VISION
  // ------------------------------------------------

  if (
    q.includes("vision") ||
    q.includes("what is ndc vision") ||
    q.includes("ndc vision")
  ) {
    add("3. NDC VISION");
  }

  // ------------------------------------------------
  // MISSION
  // ------------------------------------------------

  if (
    q.includes("mission") ||
    q.includes("what is ndc mission") ||
    q.includes("ndc mission")
  ) {
    add("4. NDC MISSION");
  }

  // ------------------------------------------------
  // OBJECTIVES / PURPOSE
  // ------------------------------------------------

  if (
    q.includes("objective") ||
    q.includes("objectives") ||
    q.includes("goal") ||
    q.includes("goals") ||
    q.includes("purpose") ||
    q.includes("main purpose") ||
    q.includes("aim") ||
    q.includes("aims")
  ) {
    add("5. MAIN PURPOSE OF NDC");
    add("18. NDC'S ECONOMIC IMPACT");
  }

  // ------------------------------------------------
  // FUNCTIONS / ROLE
  // ------------------------------------------------

  if (
    q.includes("function") ||
    q.includes("functions") ||
    q.includes("role") ||
    q.includes("responsibilit") ||
    q.includes("mandate") ||
    q.includes("what does ndc do") ||
    q.includes("what does ndc actually do")
  ) {
    add("5. MAIN PURPOSE OF NDC");
    add("6. CORE FUNCTIONS OF NDC");
  }

  // ------------------------------------------------
  // INDUSTRIES
  // ------------------------------------------------

  if (
    q.includes("industry") ||
    q.includes("industries") ||
    q.includes("industrial") ||
    q.includes("manufacturing") ||
    q.includes("sector") ||
    q.includes("sectors") ||
    q.includes("iron") ||
    q.includes("steel") ||
    q.includes("coal") ||
    q.includes("chemical") ||
    q.includes("biological") ||
    q.includes("biotechnology") ||
    q.includes("agro") ||
    q.includes("agriculture") ||
    q.includes("machinery") ||
    q.includes("machine") ||
    q.includes("tyre") ||
    q.includes("tire") ||
    q.includes("pharmaceutical") ||
    q.includes("medical") ||
    q.includes("textile") ||
    q.includes("automotive")
  ) {
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
    q.includes("main project") ||
    q.includes("all projects") ||
    q.includes("list projects")
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
    q.includes("coal-to-electricity") ||
    q.includes("coal mining")
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
    add("8.12 KMTC INDUSTRIAL AREA");
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
    q.includes("industrial estate") ||
    q.includes("industrial park")
  ) {
    add("8.9 TAMCO INDUSTRIAL ESTATE");
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
    q.includes("become an investor")
  ) {
    add("10. HOW NDC WORKS WITH INVESTORS");
    add("11. WHAT SHOULD AN INVESTOR PREPARE?");
    add("12. TYPES OF INVESTMENT OPPORTUNITIES");
  }

  // ------------------------------------------------
  // MONEY / FINANCING
  // ------------------------------------------------

  if (
    q.includes("money") ||
    q.includes("fund") ||
    q.includes("funding") ||
    q.includes("finance") ||
    q.includes("financing") ||
    q.includes("loan") ||
    q.includes("financial support")
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
  // FULL INFORMATION
  // ------------------------------------------------

  if (
    q.includes("what do you know") ||
    q.includes("everything about ndc") ||
    q.includes("tell me everything") ||
    q.includes("give me information about ndc")
  ) {
    add("1. BASIC INFORMATION");
    add("2. WHAT IS NDC?");
    add("3. NDC VISION");
    add("4. NDC MISSION");
    add("5. MAIN PURPOSE OF NDC");
    add("6. CORE FUNCTIONS OF NDC");
    add("7. NDC'S STRATEGIC INDUSTRIAL AREAS");
  }

  if (sections.length === 0) {
    return null;
  }

  return sections.join("\n\n==============================\n\n");
}

// --------------------------------------------------
// DIRECT ANSWERS
// --------------------------------------------------

function getDirectAnswer(question) {
  const q = normalize(question);

  // -----------------------------------------------
  // GREETINGS
  // -----------------------------------------------

  if (
    q === "hi" ||
    q === "hello" ||
    q === "hey" ||
    q === "good morning" ||
    q === "good afternoon" ||
    q === "good evening"
  ) {
    return "Hello! I'm the NDC Assistant. I can help you learn about NDC, its projects, investment opportunities, industrial areas, contacts, and more.";
  }

  // -----------------------------------------------
  // BYE
  // -----------------------------------------------

  if (
    q === "bye" ||
    q === "goodbye" ||
    q === "see you"
  ) {
    return "Goodbye! Feel free to come back if you have questions about NDC.";
  }

  // -----------------------------------------------
  // WHO ARE YOU
  // -----------------------------------------------

  if (
    q === "who are you" ||
    q === "what are you" ||
    q === "what is your name"
  ) {
    return "I'm the NDC Assistant, an AI assistant that provides information about the National Development Corporation (NDC) using the provided NDC information.";
  }

  // -----------------------------------------------
  // COUNTRY
  // -----------------------------------------------

  if (
    q.includes("which country") ||
    q.includes("what country") ||
    q.includes("country does ndc") ||
    q === "country"
  ) {
    return "NDC is a government institution of the United Republic of Tanzania.";
  }

  // -----------------------------------------------
  // EMAIL
  // -----------------------------------------------

  if (
    q === "email" ||
    q === "mail" ||
    q.includes("what is the email") ||
    q.includes("email address") ||
    q.includes("email for ndc")
  ) {
    return "NDC's email address is info@ndc.go.tz.";
  }

  // -----------------------------------------------
  // PHONE
  // -----------------------------------------------

  if (
    q === "phone" ||
    q === "telephone" ||
    q.includes("phone number") ||
    q.includes("telephone number") ||
    q.includes("phone for ndc")
  ) {
    return "NDC's telephone numbers are +255 22 2112893 and +255 22 2113618.";
  }

  // -----------------------------------------------
  // CONTACT
  // -----------------------------------------------

  if (
    q === "contact ndc" ||
    q === "contacts" ||
    q === "contact information" ||
    q.includes("how can i contact ndc") ||
    q.includes("contact for ndc") ||
    q.includes("where can i contact ndc")
  ) {
    return (
      "You can contact NDC by email at info@ndc.go.tz or by telephone " +
      "at +255 22 2112893 or +255 22 2113618."
    );
  }

  // -----------------------------------------------
  // ADDRESS
  // -----------------------------------------------

  if (
    q === "address" ||
    q.includes("ndc address") ||
    q.includes("where is ndc headquarters") ||
    q.includes("ndc headquarters") ||
    q.includes("where is ndc located")
  ) {
    return (
      "NDC's headquarters are at Development House, Kivukoni Front / " +
      "Ohio Street, P.O. Box 2669, Dar es Salaam, Tanzania."
    );
  }

  // -----------------------------------------------
  // WEBSITE
  // -----------------------------------------------

  if (
    q === "website" ||
    q.includes("ndc website") ||
    q.includes("official website")
  ) {
    return "NDC's official website is https://ndc.go.tz/.";
  }

  // -----------------------------------------------
  // VISION
  // -----------------------------------------------

  if (
    q === "vision" ||
    q === "what is ndc vision" ||
    q === "ndc vision"
  ) {
    return 'NDC\'s vision is: "Leading industrialization of Tanzania."';
  }

  // -----------------------------------------------
  // MISSION
  // -----------------------------------------------

  if (
    q === "mission" ||
    q === "what is ndc mission" ||
    q === "ndc mission"
  ) {
    return 'NDC\'s mission is: "Implementing strategic industrial development projects in partnership with private sectors."';
  }

  return null;
}

// --------------------------------------------------
// DETECT CASUAL / GENERAL QUESTIONS
// --------------------------------------------------

function isCasualQuestion(question) {
  const q = normalize(question);

  const casualPatterns = [
    "how are you",
    "how are u",
    "are you okay",
    "are you good",
    "what are you doing",
    "nice to meet you",
    "good to meet you",
    "thank you",
    "thanks",
    "thank",
    "ok",
    "okay",
    "haha",
    "ha ha",
    "lol",
    "i am new here",
    "i'm new here",
    "new here",
    "help me",
    "can you help me"
  ];

  return casualPatterns.some(pattern => q.includes(pattern));
}

// --------------------------------------------------
// SUGGESTIONS
// --------------------------------------------------

function getSuggestions(question, answer) {
  const q = normalize(question);

  // Contact suggestions
  if (
    q.includes("contact") ||
    q.includes("email") ||
    q.includes("phone") ||
    q.includes("address")
  ) {
    return [
      "What is NDC's mission?",
      "What does NDC do?",
      "Where is NDC headquarters?",
      "What projects does NDC have?"
    ];
  }

  // Mission / vision / objectives
  if (
    q.includes("mission") ||
    q.includes("vision") ||
    q.includes("objective") ||
    q.includes("purpose")
  ) {
    return [
      "What are NDC's core functions?",
      "What industries does NDC focus on?",
      "What projects does NDC have?",
      "How does NDC contribute to Tanzania's industrialization?"
    ];
  }

  // Projects
  if (
    q.includes("project") ||
    q.includes("liganga") ||
    q.includes("mchuchuma") ||
    q.includes("engaruka")
  ) {
    return [
      "Tell me about the Liganga project",
      "What is the Mchuchuma coal project?",
      "What is the Engaruka Soda Ash project?",
      "List all NDC projects"
    ];
  }

  // Investment
  if (
    q.includes("invest") ||
    q.includes("investor") ||
    q.includes("partner")
  ) {
    return [
      "How can I become an NDC investor?",
      "What documents should an investor prepare?",
      "Does NDC offer industrial land?",
      "What investment opportunities does NDC have?"
    ];
  }

  // Industrial
  if (
    q.includes("industry") ||
    q.includes("industrial") ||
    q.includes("manufacturing")
  ) {
    return [
      "What industries does NDC focus on?",
      "What industrial parks does NDC have?",
      "Tell me about TAMCO Industrial Estate",
      "What are NDC's strategic industrial areas?"
    ];
  }

  // Jobs
  if (
    q.includes("job") ||
    q.includes("vacancy") ||
    q.includes("career")
  ) {
    return [
      "What types of jobs does NDC have?",
      "Where can I find NDC vacancies?",
      "What does NDC do?",
      "How can I contact NDC?"
    ];
  }

  // General fallback
  return [
    "What is NDC?",
    "What does NDC do?",
    "What projects does NDC have?",
    "How can I become an NDC investor?"
  ];
}

// --------------------------------------------------
// FORMAT FINAL RESPONSE
// --------------------------------------------------

function formatResponse(answer, question) {
  const suggestions = getSuggestions(question, answer);

  return {
    answer: answer,
    suggestions: suggestions
  };
}

// --------------------------------------------------
// OLLAMA
// --------------------------------------------------

async function askOllama(question, relevantKnowledge, casual = false) {

  let prompt;

  if (casual) {

    prompt = `
You are a friendly AI assistant associated with the NDC Assistant.

The user is having a normal conversation.

Answer naturally and briefly.

You may respond to casual conversation such as:
- greetings
- thanks
- goodbye
- small talk
- asking what you are
- asking for general help

Do NOT invent facts about NDC.

If the user asks about NDC, use the supplied NDC information.

USER:
${question}

NDC INFORMATION:
${relevantKnowledge || "No NDC information was retrieved."}

ANSWER:
`;

  } else {

    prompt = `
You are the National Development Corporation (NDC) Assistant for Tanzania.

You must answer the user's question accurately.

CRITICAL RULES:

1. NDC ALWAYS refers to the National Development Corporation of TANZANIA.
2. Never assume NDC is a Chinese organization or an organization from another country.
3. Use ONLY the supplied NDC information for questions about NDC.
4. Never use outside knowledge for NDC facts.
5. Answer exactly what the user asks.
6. Do not add unrelated information.
7. If the user asks for a list, provide the actual list contained in the supplied information.
8. If the user asks for "all", provide all relevant items available in the supplied information.
9. If the user asks for details, provide the relevant details from the supplied information.
10. Do not replace a detailed answer with a generic summary.
11. Do not invent facts.
12. Do not invent names, phone numbers, emails, projects, dates, prices, vacancies, tenders or project status.
13. Do not claim that a project is operational unless the supplied information explicitly says so.
14. Distinguish between project opportunities, projects under development and operational projects when the supplied information allows it.
15. If information is not available, say:
I don't know based on the provided company knowledge.
16. Keep simple factual answers concise.
17. For detailed questions, use clear bullet points or numbered lists.
18. Do not mention prompts, RAG, vector search, knowledge bases, context windows or model limitations.
19. Do not repeat the user's question.
20. Do not say "Here's a possible answer".
21. Do not say "It seems like".

VERY IMPORTANT:

If the user asks about objectives, use SECTION 5.

If the user asks about the mission, use SECTION 4.

If the user asks about the vision, use SECTION 3.

If the user asks about functions, use SECTION 6.

If the user asks about projects, use SECTION 8 or SECTION 28.

If the user asks about contacts, use SECTION 1 or SECTION 25.

USER QUESTION:
${question}

PROVIDED NDC INFORMATION:
${relevantKnowledge}

ANSWER:
`;
  }

  const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "qwen2.5:1.5b",
      prompt,
      stream: false,
      options: {
        temperature: 0.05,
        top_p: 0.9,
        num_predict: 400
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
// CHAT ENDPOINT
// --------------------------------------------------

app.post("/chat", async (req, res) => {

  try {

    const { question } = req.body;

    if (!question || typeof question !== "string") {

      return res.status(400).json({
        error: "question is required"
      });

    }

    const cleanQuestion = question.trim();

    console.log("Question:", cleanQuestion);

    // ----------------------------------------------
    // DIRECT ANSWER
    // ----------------------------------------------

    const directAnswer = getDirectAnswer(cleanQuestion);

    if (directAnswer) {

      console.log("Answer mode: DIRECT");

      return res.json(
        formatResponse(
          directAnswer,
          cleanQuestion
        )
      );
    }

    // ----------------------------------------------
    // RETRIEVE KNOWLEDGE
    // ----------------------------------------------

    const relevantKnowledge = getSections(cleanQuestion);

    // ----------------------------------------------
    // CASUAL QUESTION
    // ----------------------------------------------

    if (isCasualQuestion(cleanQuestion)) {

      console.log("Answer mode: CASUAL");

      const answer = await askOllama(
        cleanQuestion,
        relevantKnowledge,
        true
      );

      return res.json(
        formatResponse(
          answer,
          cleanQuestion
        )
      );
    }

    // ----------------------------------------------
    // NO KNOWLEDGE
    // ----------------------------------------------

    if (!relevantKnowledge) {

      console.log(
        "No matching NDC sections. Allowing general answer."
      );

      const answer = await askOllama(
        cleanQuestion,
        "",
        true
      );

      return res.json(
        formatResponse(
          answer,
          cleanQuestion
        )
      );
    }

    // ----------------------------------------------
    // ASK QWEN
    // ----------------------------------------------

    console.log(
      "Relevant knowledge length:",
      relevantKnowledge.length
    );

    console.log("Answer mode: QWEN");

    const answer = await askOllama(
      cleanQuestion,
      relevantKnowledge,
      false
    );

    return res.json(
      formatResponse(
        answer,
        cleanQuestion
      )
    );

  } catch (error) {

    console.error("Error:", error);

    res.status(500).json({
      error: error.message
    });

  }

});

// --------------------------------------------------
// SERVER
// --------------------------------------------------

app.listen(PORT, () => {
  console.log(
    `NDC API running on http://127.0.0.1:${PORT}`
  );
});
