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
// LOAD KNOWLEDGE
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
// GET RELEVANT NDC SECTIONS
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

  // CONTACT
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

  // IDENTITY
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
    "where does ndc",
    "where does",
    "operate",
    "ndc tanzania",
    "tanzania ndc"
  ];

  if (identityWords.some(word => q.includes(word))) {
    add("1. BASIC INFORMATION");
    add("2. WHAT IS NDC?");
  }

  // PURPOSE / ROLE
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
    "work",
    "objective",
    "objectives",
    "goal",
    "goals"
  ];

  if (purposeWords.some(word => q.includes(word))) {
    add("3. NDC VISION");
    add("4. NDC MISSION");
    add("5. MAIN PURPOSE OF NDC");
    add("6. CORE FUNCTIONS OF NDC");
  }

  // INDUSTRIES
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

  // PROJECTS
  if (
    q.includes("project") ||
    q.includes("projects") ||
    q.includes("major project") ||
    q.includes("main project")
  ) {
    add("8. MAJOR NDC PROJECTS");
    add("28. IMPORTANT PROJECT LIST");
  }

  // LIGANGA
  if (
    q.includes("liganga") ||
    q.includes("iron ore") ||
    q.includes("iron and steel") ||
    q.includes("iron extraction")
  ) {
    add("8.1 LIGANGA IRON AND STEEL PROJECT");
  }

  // MCHUCHUMA
  if (
    q.includes("mchuchuma") ||
    q.includes("coal to electricity") ||
    q.includes("coal-to-electricity")
  ) {
    add("8.2 MCHUCHUMA COAL PROJECT");
    add("8.3 MCHUCHUMA COAL-TO-ELECTRICITY");
  }

  // ENGARUKA
  if (
    q.includes("engaruka") ||
    q.includes("soda ash")
  ) {
    add("8.4 ENGARUKA SODA ASH PROJECT");
  }

  // TYRE
  if (
    q.includes("tyre") ||
    q.includes("tires") ||
    q.includes("tire")
  ) {
    add("8.5 ARUSHA TYRE MANUFACTURING PROJECT");
  }

  // MACHINE TOOLS
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

  // TBPL
  if (
    q.includes("tbpl") ||
    q.includes("biotech") ||
    q.includes("biotechnology") ||
    q.includes("biolarvicide") ||
    q.includes("biological")
  ) {
    add("8.8 TANZANIA BIOTECH PRODUCTS LIMITED (TBPL)");
  }

  // TAMCO
  if (
    q.includes("tamco") ||
    q.includes("kibaha industrial") ||
    q.includes("industrial estate")
  ) {
    add("8.9 TAMCO INDUSTRIAL ESTATE");
  }

  // INDUSTRIAL AREAS
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

  // KANGE
  if (q.includes("kange")) {
    add("8.10 KANGE INDUSTRIAL AREA");
  }

  // NYANZA
  if (q.includes("nyanza")) {
    add("8.11 NYANZA INDUSTRIAL AREA");
  }

  // ETC / DRY PORT
  if (
    q.includes("etc cargo") ||
    q.includes("dry port") ||
    q.includes("grain")
  ) {
    add("8.13 ETC CARGO / GRAIN DRY PORT");
  }

  // RUBBER
  if (
    q.includes("rubber") ||
    q.includes("kalunga") ||
    q.includes("kihuhwi")
  ) {
    add("8.14 KALUNGA RUBBER PLANTATIONS");
    add("8.15 KIHUHWI RUBBER PROJECT");
  }

  // INVESTMENT
  if (
    q.includes("invest") ||
    q.includes("investor") ||
    q.includes("investment") ||
    q.includes("partner") ||
    q.includes("partnership") ||
    q.includes("joint venture") ||
    q.includes("foreign investor") ||
    q.includes("foreigner")
  ) {
    add("10. HOW NDC WORKS WITH INVESTORS");
    add("11. WHAT SHOULD AN INVESTOR PREPARE?");
    add("12. TYPES OF INVESTMENT OPPORTUNITIES");
  }

  // TENDERS
  if (
    q.includes("tender") ||
    q.includes("procurement") ||
    q.includes("proposal") ||
    q.includes("expression of interest") ||
    q.includes("rfp")
  ) {
    add("13. TENDERS AND PROCUREMENT");
  }

  // JOBS
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

  // ORGANIZATION
  if (
    q.includes("board") ||
    q.includes("managing director") ||
    q.includes("director") ||
    q.includes("organizational structure") ||
    q.includes("organization structure")
  ) {
    add("15. NDC ORGANIZATIONAL STRUCTURE");
  }

  // GOVERNMENT
  if (
    q.includes("government") ||
    q.includes("ministry") ||
    q.includes("supervise") ||
    q.includes("supervises")
  ) {
    add("16. NDC AND THE TANZANIAN GOVERNMENT");
    add("1. BASIC INFORMATION");
  }

  // PRIVATE SECTOR
  if (
    q.includes("private sector") ||
    q.includes("private company") ||
    q.includes("private business") ||
    q.includes("entrepreneur")
  ) {
    add("17. NDC AND PRIVATE INVESTORS");
  }

  // ECONOMIC IMPACT
  if (
    q.includes("economic impact") ||
    q.includes("benefit") ||
    q.includes("employment creation") ||
    q.includes("industrialization")
  ) {
    add("18. NDC'S ECONOMIC IMPACT");
  }

  // SIDO
  if (q.includes("sido")) {
    add("20. IMPORTANT DISTINCTION: NDC IS NOT SIDO");
  }

  // TIC
  if (
    q === "tic" ||
    q.includes("tanzania investment centre") ||
    q.includes("tanzania investment center")
  ) {
    add("21. IMPORTANT DISTINCTION: NDC IS NOT TANZANIA INVESTMENT CENTRE");
  }

  // HISTORY
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

  // GENERAL NDC INFORMATION
  if (
    q.includes("what do you know") ||
    q.includes("tell me about ndc") ||
    q === "ndc" ||
    q === "about ndc" ||
    q.includes("give me information about ndc") ||
    q.includes("tell me more about ndc")
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
// IS THIS AN NDC QUESTION?
// --------------------------------------------------

function isNDCQuestion(question) {
  const q = normalize(question);

  const ndcWords = [
    "ndc",
    "national development corporation",
    "liganga",
    "mchuchuma",
    "engaruka",
    "tamco",
    "kange",
    "nyanza",
    "tbpl",
    "kmtc",
    "mang ula",
    "mang'ula",
    "ndc project",
    "ndc projects",
    "ndc investor",
    "ndc investment",
    "ndc job",
    "ndc jobs",
    "ndc contact",
    "ndc email",
    "ndc phone",
    "ndc objectives",
    "ndc mission",
    "ndc vision"
  ];

  return ndcWords.some(word => q.includes(word));
}

// --------------------------------------------------
// SIMPLE DIRECT NDC ANSWERS
// --------------------------------------------------

function getDirectAnswer(question) {
  const q = normalize(question);

  // Country
  if (
    q.includes("which country") ||
    q.includes("what country") ||
    q.includes("country does ndc") ||
    q === "country"
  ) {
    return "United Republic of Tanzania.";
  }

  // Email
  if (
    q === "email" ||
    q.includes("what is the email") ||
    q.includes("email address") ||
    q.includes("their email")
  ) {
    return "NDC's email address is info@ndc.go.tz.";
  }

  // Phone
  if (
    q === "phone" ||
    q === "telephone" ||
    q.includes("phone number") ||
    q.includes("telephone number")
  ) {
    return "NDC's telephone numbers are +255 22 2112893 and +255 22 2113618.";
  }

  // Combined contact
  if (
    (q.includes("email") || q.includes("mail")) &&
    (q.includes("phone") ||
      q.includes("telephone") ||
      q.includes("call"))
  ) {
    return (
      "You can contact NDC by email at info@ndc.go.tz or by telephone " +
      "at +255 22 2112893 or +255 22 2113618."
    );
  }

  // Headquarters
  if (
    q.includes("where is ndc headquarters") ||
    q.includes("ndc headquarters") ||
    q.includes("where is ndc located")
  ) {
    return (
      "NDC's headquarters are at Development House, Kivukoni Front / " +
      "Ohio Street, Dar es Salaam, Tanzania."
    );
  }

  return null;
}

// --------------------------------------------------
// OLLAMA - NDC MODE
// --------------------------------------------------

async function askOllamaNDC(question, relevantKnowledge) {

  const prompt = `
You are the official information assistant for the
National Development Corporation (NDC) of Tanzania.

Answer the user's question using ONLY the provided NDC information.

RULES:

1. Answer exactly what the user asked.
2. Keep the answer concise and natural.
3. If the user asks for only one piece of information, give only that.
4. Do not dump unrelated information.
5. Do not repeat the question.
6. Do not invent facts.
7. Do not use outside knowledge about NDC.
8. NDC in this conversation means the National Development
   Corporation of Tanzania.
9. Never assume NDC refers to another country or organization.
10. If the provided information does not contain the answer,
    reply exactly:

I don't know based on the provided company knowledge.

USER QUESTION:
${question}

PROVIDED NDC INFORMATION:
${relevantKnowledge}

ANSWER:
`;

  return await callOllama(prompt);
}

// --------------------------------------------------
// OLLAMA - GENERAL MODE
// --------------------------------------------------

async function askOllamaGeneral(question) {

  const prompt = `
You are a helpful conversational AI assistant.

The user may ask you anything.

You can:
- have normal conversations
- answer greetings
- answer general knowledge questions
- explain concepts
- help with writing
- answer casual questions
- answer everyday questions

IMPORTANT:

1. Be helpful and natural.
2. Answer exactly what the user asks.
3. Keep simple questions concise.
4. Do not pretend to be the National Development Corporation.
5. Do not invent facts.
6. If the user asks about NDC specifically, do not answer from
   general knowledge. NDC questions are handled separately.
7. If the user says hello, greet them naturally.
8. If the user says goodbye, respond naturally.
9. If the user asks "who are you", explain that you are an AI
   assistant.

USER QUESTION:
${question}

ANSWER:
`;

  return await callOllama(prompt);
}

// --------------------------------------------------
// CALL OLLAMA
// --------------------------------------------------

async function callOllama(prompt) {

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
        temperature: 0.2,
        top_p: 0.9,
        num_predict: 180
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
// CHAT
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

    // ------------------------------------------------
    // 1. DIRECT FACT
    // ------------------------------------------------

    const directAnswer =
      getDirectAnswer(cleanQuestion);

    if (directAnswer) {

      console.log("Answer mode: DIRECT");

      return res.json({
        answer: directAnswer
      });
    }

    // ------------------------------------------------
    // 2. NDC QUESTION
    // ------------------------------------------------

    if (isNDCQuestion(cleanQuestion)) {

      console.log("Answer mode: NDC");

      const relevantKnowledge =
        getSections(cleanQuestion);

      if (!relevantKnowledge) {

        return res.json({
          answer:
            "I don't know based on the provided company knowledge."
        });
      }

      const answer =
        await askOllamaNDC(
          cleanQuestion,
          relevantKnowledge
        );

      return res.json({
        answer
      });
    }

    // ------------------------------------------------
    // 3. GENERAL QUESTION
    // ------------------------------------------------

    console.log("Answer mode: GENERAL");

    const answer =
      await askOllamaGeneral(cleanQuestion);

    return res.json({
      answer
    });

  } catch (error) {

    console.error("Error:", error);

    res.status(500).json({
      error: error.message
    });
  }
});

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

app.listen(PORT, "127.0.0.1", () => {

  console.log(
    `API running on http://127.0.0.1:${PORT}`
  );

});
