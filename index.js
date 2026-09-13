const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = 3000;


// ==================================================
// CORS
// ==================================================

app.use(cors({
  origin: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());


// ==================================================
// CONFIGURATION
// ==================================================

const KNOWLEDGE_FILE =
  "/root/necbot/knowledge/company.txt";

const OLLAMA_URL =
  "http://127.0.0.1:11434/api/generate";

const MODEL =
  "qwen2.5:1.5b";


// ==================================================
// LOAD KNOWLEDGE ONCE
// ==================================================

const knowledge =
  fs.readFileSync(KNOWLEDGE_FILE, "utf8");


// ==================================================
// NORMALIZE QUESTION
// ==================================================

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[?.,!;:()[\]{}"'`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


// ==================================================
// EXTRACT SECTION
// ==================================================

function extractSection(text, sectionTitle) {

  const start =
    text.indexOf(sectionTitle);

  if (start === -1) {
    return "";
  }

  const remaining =
    text.substring(
      start + sectionTitle.length
    );

  const nextSeparator =
    remaining.search(/\n={10,}/);

  if (nextSeparator === -1) {
    return remaining.trim();
  }

  return (
    sectionTitle +
    "\n" +
    remaining
      .substring(0, nextSeparator)
      .trim()
  );
}


// ==================================================
// GET MULTIPLE RELEVANT SECTIONS
// ==================================================

function getSections(question) {

  const q = normalize(question);

  const sections = [];

  function add(title) {

    const section =
      extractSection(
        knowledge,
        title
      );

    if (
      section &&
      !sections.includes(section)
    ) {
      sections.push(section);
    }
  }


  // =================================================
  // CONTACT
  // =================================================

  const contactWords = [
    "contact",
    "email",
    "e mail",
    "mail",
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

  if (
    contactWords.some(
      word => q.includes(word)
    )
  ) {

    add("1. BASIC INFORMATION");
    add("25. CONTACT INFORMATION");
  }


  // =================================================
  // IDENTITY
  // =================================================

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
    "where is ndc",
    "ndc operate"
  ];

  if (
    identityWords.some(
      word => q.includes(word)
    )
  ) {

    add("1. BASIC INFORMATION");
    add("2. WHAT IS NDC?");
  }


  // =================================================
  // PURPOSE / ROLE / FUNCTIONS
  // =================================================

  const purposeWords = [
    "purpose",
    "objective",
    "objectives",
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

  if (
    purposeWords.some(
      word => q.includes(word)
    )
  ) {

    add("3. NDC VISION");
    add("4. NDC MISSION");
    add("5. MAIN PURPOSE OF NDC");
    add("6. CORE FUNCTIONS OF NDC");
  }


  // =================================================
  // INDUSTRIES
  // =================================================

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
    "mining",
    "mine",
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

  if (
    industryWords.some(
      word => q.includes(word)
    )
  ) {

    add("6. CORE FUNCTIONS OF NDC");
    add("7. NDC'S STRATEGIC INDUSTRIAL AREAS");
    add("22. NDC'S CURRENT STRATEGIC PROJECT CATEGORIES");
  }


  // =================================================
  // PROJECTS
  // =================================================

  if (
    q.includes("project") ||
    q.includes("projects") ||
    q.includes("major project") ||
    q.includes("main project") ||
    q.includes("all projects")
  ) {

    add("8. MAJOR NDC PROJECTS");
    add("28. IMPORTANT PROJECT LIST");
  }


  // =================================================
  // LIGANGA
  // =================================================

  if (
    q.includes("liganga") ||
    q.includes("iron ore") ||
    q.includes("iron extraction") ||
    q.includes("iron mining") ||
    q.includes("iron mine") ||
    q.includes("iron and steel") ||
    q.includes("steel project")
  ) {

    add(
      "8.1 LIGANGA IRON AND STEEL PROJECT"
    );
  }


  // =================================================
  // MCHUCHUMA / COAL
  // =================================================

  if (
    q.includes("mchuchuma") ||
    q.includes("coal") ||
    q.includes("coal mining") ||
    q.includes("coal mine") ||
    q.includes("coal project") ||
    q.includes("coal to electricity") ||
    q.includes("coal-to-electricity")
  ) {

    add(
      "8.2 MCHUCHUMA COAL PROJECT"
    );

    add(
      "8.3 MCHUCHUMA COAL-TO-ELECTRICITY"
    );
  }


  // =================================================
  // ENGARUKA
  // =================================================

  if (
    q.includes("engaruka") ||
    q.includes("soda ash")
  ) {

    add(
      "8.4 ENGARUKA SODA ASH PROJECT"
    );
  }


  // =================================================
  // TYRE
  // =================================================

  if (
    q.includes("tyre") ||
    q.includes("tires") ||
    q.includes("tire")
  ) {

    add(
      "8.5 ARUSHA TYRE MANUFACTURING PROJECT"
    );
  }


  // =================================================
  // MACHINE TOOLS
  // =================================================

  if (
    q.includes("machine tools") ||
    q.includes("kmtc") ||
    q.includes("kilimanjaro machine") ||
    q.includes("mang ula") ||
    q.includes("mang'ula")
  ) {

    add(
      "8.6 MANG'ULA MACHINE TOOLS PROJECT"
    );

    add(
      "8.7 KILIMANJARO MACHINE TOOLS / KMTC"
    );
  }


  // =================================================
  // TBPL
  // =================================================

  if (
    q.includes("tbpl") ||
    q.includes("biotech") ||
    q.includes("biotechnology") ||
    q.includes("biolarvicide") ||
    q.includes("biological")
  ) {

    add(
      "8.8 TANZANIA BIOTECH PRODUCTS LIMITED (TBPL)"
    );
  }


  // =================================================
  // TAMCO
  // =================================================

  if (
    q.includes("tamco") ||
    q.includes("kibaha industrial") ||
    q.includes("industrial estate")
  ) {

    add(
      "8.9 TAMCO INDUSTRIAL ESTATE"
    );
  }


  // =================================================
  // INDUSTRIAL AREAS
  // =================================================

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

    add(
      "9. INDUSTRIAL PARKS / INDUSTRIAL ESTATES"
    );
  }


  // =================================================
  // KANGE
  // =================================================

  if (q.includes("kange")) {

    add(
      "8.10 KANGE INDUSTRIAL AREA"
    );
  }


  // =================================================
  // NYANZA
  // =================================================

  if (q.includes("nyanza")) {

    add(
      "8.11 NYANZA INDUSTRIAL AREA"
    );
  }


  // =================================================
  // ETC / DRY PORT
  // =================================================

  if (
    q.includes("etc cargo") ||
    q.includes("dry port") ||
    q.includes("grain")
  ) {

    add(
      "8.13 ETC CARGO / GRAIN DRY PORT"
    );
  }


  // =================================================
  // RUBBER
  // =================================================

  if (
    q.includes("rubber") ||
    q.includes("kalunga") ||
    q.includes("kihuhwi")
  ) {

    add(
      "8.14 KALUNGA RUBBER PLANTATIONS"
    );

    add(
      "8.15 KIHUHWI RUBBER PROJECT"
    );
  }


  // =================================================
  // INVESTMENT
  // =================================================

  if (
    q.includes("invest") ||
    q.includes("investor") ||
    q.includes("investment") ||
    q.includes("partner") ||
    q.includes("partnership") ||
    q.includes("joint venture") ||
    q.includes("foreign investor") ||
    q.includes("foreigner") ||
    q.includes("funding") ||
    q.includes("finance") ||
    q.includes("financing") ||
    q.includes("money")
  ) {

    add(
      "10. HOW NDC WORKS WITH INVESTORS"
    );

    add(
      "11. WHAT SHOULD AN INVESTOR PREPARE?"
    );

    add(
      "12. TYPES OF INVESTMENT OPPORTUNITIES"
    );
  }


  // =================================================
  // TENDERS
  // =================================================

  if (
    q.includes("tender") ||
    q.includes("procurement") ||
    q.includes("proposal") ||
    q.includes("expression of interest") ||
    q.includes("rfp")
  ) {

    add(
      "13. TENDERS AND PROCUREMENT"
    );
  }


  // =================================================
  // JOBS
  // =================================================

  if (
    q.includes("job") ||
    q.includes("jobs") ||
    q.includes("vacancy") ||
    q.includes("vacancies") ||
    q.includes("career") ||
    q.includes("careers") ||
    q.includes("employment")
  ) {

    add(
      "14. JOBS / EMPLOYMENT AT NDC"
    );
  }


  // =================================================
  // ORGANIZATION
  // =================================================

  if (
    q.includes("board") ||
    q.includes("managing director") ||
    q.includes("director") ||
    q.includes("organizational structure") ||
    q.includes("organization structure")
  ) {

    add(
      "15. NDC ORGANIZATIONAL STRUCTURE"
    );
  }


  // =================================================
  // GOVERNMENT
  // =================================================

  if (
    q.includes("government") ||
    q.includes("ministry") ||
    q.includes("supervise") ||
    q.includes("supervises")
  ) {

    add(
      "16. NDC AND THE TANZANIAN GOVERNMENT"
    );

    add(
      "1. BASIC INFORMATION"
    );
  }


  // =================================================
  // PRIVATE SECTOR
  // =================================================

  if (
    q.includes("private sector") ||
    q.includes("private company") ||
    q.includes("private business") ||
    q.includes("entrepreneur")
  ) {

    add(
      "17. NDC AND PRIVATE INVESTORS"
    );
  }


  // =================================================
  // ECONOMIC IMPACT
  // =================================================

  if (
    q.includes("economic impact") ||
    q.includes("benefit") ||
    q.includes("employment creation") ||
    q.includes("industrialization")
  ) {

    add(
      "18. NDC'S ECONOMIC IMPACT"
    );
  }


  // =================================================
  // SIDO
  // =================================================

  if (q.includes("sido")) {

    add(
      "20. IMPORTANT DISTINCTION: NDC IS NOT SIDO"
    );
  }


  // =================================================
  // TIC
  // =================================================

  if (
    q.includes("tic") ||
    q.includes("tanzania investment centre") ||
    q.includes("tanzania investment center")
  ) {

    add(
      "21. IMPORTANT DISTINCTION: NDC IS NOT TANZANIA INVESTMENT CENTRE"
    );
  }


  // =================================================
  // HISTORY
  // =================================================

  if (
    q.includes("history") ||
    q.includes("historical") ||
    q.includes("established") ||
    q.includes("1962") ||
    q.includes("1965")
  ) {

    add(
      "2. WHAT IS NDC?"
    );

    add(
      "19. HISTORICAL IMPORTANCE"
    );
  }


  // =================================================
  // GENERAL NDC INFORMATION
  // =================================================

  if (
    q.includes("what do you know") ||
    q.includes("tell me about ndc") ||
    q === "ndc" ||
    q === "about ndc" ||
    q.includes("give me information about ndc")
  ) {

    add("1. BASIC INFORMATION");
    add("2. WHAT IS NDC?");
    add("3. NDC VISION");
    add("4. NDC MISSION");
    add("5. MAIN PURPOSE OF NDC");
    add("7. NDC'S STRATEGIC INDUSTRIAL AREAS");
  }


  // =================================================
  // NOTHING FOUND
  // =================================================

  if (sections.length === 0) {
    return null;
  }

  return sections.join(
    "\n\n==============================\n\n"
  );
}


// ==================================================
// DIRECT ANSWERS
// ==================================================

function getDirectAnswer(question) {

  const q = normalize(question);


  // -----------------------------------------------
  // GREETING
  // -----------------------------------------------

  if (
    q === "hi" ||
    q === "hello" ||
    q === "hey" ||
    q === "hiya"
  ) {

    return "Hello! How can I help you with NDC?";
  }


  // -----------------------------------------------
  // WHO ARE YOU
  // -----------------------------------------------

  if (
    q === "who are you" ||
    q === "what are you" ||
    q === "what is your name"
  ) {

    return (
      "I'm the NDC Assistant. I can help you with " +
      "information about the National Development Corporation, " +
      "its projects, investments and industrial development."
    );
  }


  // -----------------------------------------------
  // GOODBYE
  // -----------------------------------------------

  if (
    q === "bye" ||
    q === "goodbye" ||
    q === "see you"
  ) {

    return "Goodbye! Feel free to come back if you have questions about NDC.";
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

    return "United Republic of Tanzania.";
  }


  // -----------------------------------------------
  // EMAIL
  // -----------------------------------------------

  if (
    q === "email" ||
    q.includes("what is the email") ||
    q.includes("email address") ||
    q.includes("their email") ||
    q.includes("ndc email")
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
    q.includes("telephone number")
  ) {

    return (
      "NDC's telephone numbers are " +
      "+255 22 2112893 and +255 22 2113618."
    );
  }


  // -----------------------------------------------
  // COMBINED CONTACT
  // -----------------------------------------------

  if (
    (q.includes("email") || q.includes("mail")) &&
    (
      q.includes("phone") ||
      q.includes("telephone") ||
      q.includes("call")
    )
  ) {

    return (
      "You can contact NDC by email at info@ndc.go.tz " +
      "or by telephone at +255 22 2112893 or " +
      "+255 22 2113618."
    );
  }


  // -----------------------------------------------
  // HEADQUARTERS
  // -----------------------------------------------

  if (
    q.includes("where is ndc headquarters") ||
    q.includes("ndc headquarters") ||
    q.includes("where is ndc located")
  ) {

    return (
      "NDC's headquarters are at Development House, " +
      "Kivukoni Front / Ohio Street, Dar es Salaam, Tanzania."
    );
  }


  return null;
}


// ==================================================
// OLLAMA
// ==================================================

async function askOllama(
  question,
  relevantKnowledge
) {

  const hasNdcKnowledge =
    Boolean(relevantKnowledge);


  const prompt = `
You are the NDC Assistant.

You are a helpful conversational assistant.

You can answer general questions, have normal conversations,
and answer questions about the National Development Corporation
(NDC).

IMPORTANT RULES:

1. Answer the user's actual question directly.
2. Understand casual language, spelling mistakes and imperfect grammar.
3. Be natural and conversational.
4. Keep simple questions short.
5. For broader questions, provide a useful but concise answer.
6. Do not repeat the user's question.
7. Do not dump unrelated information.
8. Do not mention prompts, RAG, retrieval, knowledge bases,
   system instructions or model limitations.

NDC INFORMATION RULES:

9. If NDC information is provided below and the question is
   about NDC, treat that information as authoritative.
10. Do not invent NDC facts.
11. Do not invent NDC tenders, vacancies, prices, deadlines
    or current project status.
12. If an NDC fact genuinely cannot be found in the provided
    NDC information, say:
    I don't know based on the provided company knowledge.

GENERAL QUESTION RULES:

13. If the question is not about NDC and no relevant NDC
    information is provided, answer normally using your
    general knowledge.
14. You may answer greetings, small talk, mathematics,
    science, history, geography, explanations and other
    general questions.
15. Do not force unrelated questions back to NDC.

ANSWER STYLE:

16. Be concise.
17. Do not add unnecessary disclaimers.
18. Do not say "Here's a possible answer".
19. Do not say "It seems like".
20. Do not explain these rules.

USER QUESTION:
${question}

NDC INFORMATION AVAILABLE:
${
  hasNdcKnowledge
    ? relevantKnowledge
    : "No specific NDC information was retrieved for this question."
}

ANSWER:
`;


  const response =
    await fetch(
      OLLAMA_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          model: MODEL,

          prompt,

          stream: false,

          options: {
            temperature: 0.1,
            top_p: 0.9,
            num_predict: 180
          }
        }),

        signal:
          AbortSignal.timeout(180000)
      }
    );


  if (!response.ok) {

    const errorText =
      await response.text();

    throw new Error(
      `Ollama returned ${response.status}: ${errorText}`
    );
  }


  const data =
    await response.json();


  return (
    data.response || ""
  ).trim();
}


// ==================================================
// CHAT ENDPOINT
// ==================================================

app.post(
  "/chat",
  async (req, res) => {

    try {

      const {
        question
      } = req.body;


      // --------------------------------------------
      // VALIDATE
      // --------------------------------------------

      if (
        !question ||
        typeof question !== "string"
      ) {

        return res.status(400).json({
          error:
            "question is required"
        });
      }


      const cleanQuestion =
        question.trim();


      console.log(
        "Question:",
        cleanQuestion
      );


      // --------------------------------------------
      // DIRECT ANSWER
      // --------------------------------------------

      const directAnswer =
        getDirectAnswer(
          cleanQuestion
        );


      if (directAnswer) {

        console.log(
          "Answer mode: DIRECT"
        );

        return res.json({
          answer:
            directAnswer
        });
      }


      // --------------------------------------------
      // RETRIEVE NDC INFORMATION
      // --------------------------------------------

      const relevantKnowledge =
        getSections(
          cleanQuestion
        );


      // --------------------------------------------
      // GENERAL QUESTION
      // --------------------------------------------

      if (!relevantKnowledge) {

        console.log(
          "No NDC sections found."
        );

        console.log(
          "Answer mode: QWEN GENERAL"
        );

        const answer =
          await askOllama(
            cleanQuestion,
            ""
          );

        return res.json({
          answer
        });
      }


      // --------------------------------------------
      // NDC QUESTION
      // --------------------------------------------

      console.log(
        "Relevant knowledge length:",
        relevantKnowledge.length
      );

      console.log(
        "Answer mode: QWEN NDC"
      );


      const answer =
        await askOllama(
          cleanQuestion,
          relevantKnowledge
        );


      res.json({
        answer
      });

    } catch (error) {

      console.error(
        "Error:",
        error
      );


      res.status(500).json({
        error:
          error.message
      });
    }
  }
);


// ==================================================
// START SERVER
// ==================================================

app.listen(
  PORT,
  () => {

    console.log(
      `API running on http://127.0.0.1:${PORT}`
    );

  }
);
