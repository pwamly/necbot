const express = require("express");
const fs = require("fs");
const path = require("path");
const https = require("https");
const cors = require("cors");

const app = express();
const PORT = 3000;

// --------------------------------------------------
// HTTPS CERTIFICATE
// --------------------------------------------------

const HTTPS_OPTIONS = {
  key: fs.readFileSync(
    path.join(__dirname, "cert", "server.key")
  ),

  cert: fs.readFileSync(
    path.join(__dirname, "cert", "server.crt")
  )
};

// --------------------------------------------------
// CORS
// --------------------------------------------------

app.use(cors({
  origin: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// --------------------------------------------------
// CONFIGURATION
// --------------------------------------------------

const KNOWLEDGE_FILE =
  "/root/necbot/knowledge/company.txt";

const OLLAMA_URL =
  "http://127.0.0.1:11434/api/generate";

const MODEL =
  "qwen2.5:1.5b";

// --------------------------------------------------
// LOAD KNOWLEDGE
// --------------------------------------------------

let knowledge;

try {

  knowledge =
    fs.readFileSync(
      KNOWLEDGE_FILE,
      "utf8"
    );

  console.log(
    "Knowledge loaded:",
    knowledge.length,
    "characters"
  );

} catch (error) {

  console.error(
    "Could not load knowledge file:",
    error
  );

  process.exit(1);
}

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

function extractSection(
  text,
  sectionTitle
) {

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

    return (
      sectionTitle +
      "\n" +
      remaining.trim()
    );
  }

  return (
    sectionTitle +
    "\n" +
    remaining
      .substring(0, nextSeparator)
      .trim()
  );
}

// --------------------------------------------------
// ADD SECTION
// --------------------------------------------------

function addSection(
  sections,
  title
) {

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

// --------------------------------------------------
// CONTACT DETECTION
// --------------------------------------------------

function getContactAnswer(question) {

  const q =
    normalize(question);

  const asksEmail =
    q.includes("email") ||
    q.includes("e mail") ||
    q.includes("mail address");

  const asksPhone =
    q.includes("phone") ||
    q.includes("telephone") ||
    q.includes("phone number") ||
    q.includes("call");

  const asksAddress =
    q.includes("address") ||
    q.includes("location") ||
    q.includes("headquarters") ||
    q.includes("hq") ||
    q.includes("where is ndc");

  const asksContact =
    q.includes("contact") ||
    q.includes("contacts") ||
    q.includes("reach ndc") ||
    q.includes("reach them") ||
    q.includes("contact information") ||
    q.includes("contact details") ||
    q.includes("how can i contact") ||
    q.includes("how do i contact") ||
    q.includes("how can i reach");

  if (
    asksEmail &&
    !asksPhone &&
    !asksAddress &&
    !asksContact
  ) {

    return {

      answer:
        "NDC's email address is info@ndc.go.tz.",

      suggestions: [
        "What is NDC's phone number?",
        "What is NDC's address?",
        "What is NDC?"
      ]
    };
  }

  if (
    asksPhone &&
    !asksEmail &&
    !asksAddress &&
    !asksContact
  ) {

    return {

      answer:
        "NDC's telephone numbers are +255 22 2112893 and +255 22 2113618.",

      suggestions: [
        "What is NDC's email?",
        "What is NDC's address?",
        "How can I contact NDC?"
      ]
    };
  }

  if (
    asksAddress &&
    !asksEmail &&
    !asksPhone &&
    !asksContact
  ) {

    return {

      answer:
        "NDC's headquarters are at Development House, Kivukoni Front / Ohio Street, P.O. Box 2669, Dar es Salaam, Tanzania.",

      suggestions: [
        "What is NDC's email?",
        "What is NDC's phone number?",
        "What does NDC do?"
      ]
    };
  }

  if (
    asksContact ||
    (asksEmail && asksPhone) ||
    (asksEmail && asksAddress) ||
    (asksPhone && asksAddress)
  ) {

    return {

      answer:
        "You can contact the National Development Corporation (NDC) using:\n\n" +
        "Email: info@ndc.go.tz\n" +
        "Telephone: +255 22 2112893 / +255 22 2113618\n" +
        "Address: Development House, Kivukoni Front / Ohio Street, P.O. Box 2669, Dar es Salaam, Tanzania.",

      suggestions: [
        "What is NDC's official website?",
        "What does NDC do?",
        "How can I become an NDC investor?",
        "What projects does NDC have?"
      ]
    };
  }

  return null;
}

// --------------------------------------------------
// CONVERSATIONAL RESPONSES
// --------------------------------------------------

function getConversationAnswer(question) {

  const q =
    normalize(question);

  // ----------------------------------------------
  // GREETINGS
  // ----------------------------------------------

  if (
    q === "hi" ||
    q === "hello" ||
    q === "hey" ||
    q === "good morning" ||
    q === "good afternoon" ||
    q === "good evening"
  ) {

    return {

      answer:
        "Hello! I'm the NDC Assistant. I can help you learn about the National Development Corporation, its projects, investment opportunities, industrial areas, contacts, and more.",

      suggestions: [
        "What is NDC?",
        "What does NDC do?",
        "What projects does NDC have?",
        "How can I become an NDC investor?"
      ]
    };
  }

    // ----------------------------------------------
    // IDENTITY / ORIGIN
    // ----------------------------------------------

    const identityQuestion =
      q === "who are you" ||
      q === "what are you" ||
      q === "who is this" ||
      q === "what is your name" ||
      q === "tell me about yourself" ||
      q.includes("where are you from") ||
      q.includes("where do you come from") ||
      q.includes("which country are you from") ||
      q.includes("what country are you from") ||
      q.includes("are you from china") ||
      q.includes("are you from alibaba") ||
      q.includes("are you from alibaba cloud");

    if (identityQuestion) {

      return {

        answer:
          "I am the NDC Assistant, an AI assistant that provides information about the National Development Corporation (NDC) of Tanzania.",

        suggestions: [
          "What is NDC?",
          "What does NDC do?",
          "What projects does NDC have?",
          "How can I contact NDC?"
        ]
      };
    }



  // ----------------------------------------------
  // GOODBYE
  // ----------------------------------------------

  if (
    q === "bye" ||
    q === "goodbye" ||
    q === "see you"
  ) {

    return {

      answer:
        "Goodbye! Feel free to come back if you have questions about NDC.",

      suggestions: [
        "What is NDC?",
        "What projects does NDC have?",
        "How can I contact NDC?"
      ]
    };
  }

  // ----------------------------------------------
  // THANKS
  // ----------------------------------------------

  if (
    q === "thanks" ||
    q === "thank you" ||
    q === "thank"
  ) {

    return {

      answer:
        "You're welcome! I'm happy to help.",

      suggestions: [
        "What projects does NDC have?",
        "How can I become an NDC investor?",
        "How can I contact NDC?"
      ]
    };
  }

  // ----------------------------------------------
  // CAPABILITIES
  // ----------------------------------------------

  if (
    q.includes("what can i ask") ||
    q.includes("what else can i ask") ||
    q.includes("what can you help") ||
    q.includes("what do you know")
  ) {

    return {

      answer:
        "You can ask me about NDC's projects, industrial sectors, investment partnerships, industrial parks, history, government role, jobs, tenders, or contact information.",

      suggestions: [
        "What is NDC?",
        "Tell me about the Liganga project",
        "How can I become an NDC investor?",
        "What industrial parks does NDC have?"
      ]
    };
  }

  return null;
}

// --------------------------------------------------
// GET RELEVANT SECTIONS
// --------------------------------------------------

function getSections(question) {

  const q =
    normalize(question);

  const sections = [];

  // ----------------------------------------------
  // IDENTITY
  // ----------------------------------------------

  const identityWords = [

    "what is ndc",
    "what does ndc stand for",
    "who is ndc",
    "ndc meaning",
    "ndc mean",
    "what is national development corporation",
    "national development corporation",
    "is ndc a government",
    "government organization",
    "government institution",
    "who owns ndc",
    "owner",
    "which country",
    "what country",
    "country",
    "where does ndc operate"
  ];

  if (
    identityWords.some(
      word => q.includes(word)
    )
  ) {

    addSection(
      sections,
      "1. BASIC INFORMATION"
    );

    addSection(
      sections,
      "2. WHAT IS NDC?"
    );
  }

  // ----------------------------------------------
  // PURPOSE
  // ----------------------------------------------

  const purposeWords = [

    "purpose",
    "role",
    "function",
    "functions",
    "mission",
    "vision",
    "objective",
    "objectives",
    "what does ndc do",
    "what is ndc responsible for",
    "responsibility",
    "responsibilities",
    "mandate",
    "main work",
    "work",
    "aim",
    "aims"
  ];

  if (
    purposeWords.some(
      word => q.includes(word)
    )
  ) {

    addSection(
      sections,
      "3. NDC VISION"
    );

    addSection(
      sections,
      "4. NDC MISSION"
    );

    addSection(
      sections,
      "5. MAIN PURPOSE OF NDC"
    );

    addSection(
      sections,
      "6. CORE FUNCTIONS OF NDC"
    );
  }

  // ----------------------------------------------
  // CONTACT
  // ----------------------------------------------

  const contactWords = [

    "contact",
    "contacts",
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

  if (
    contactWords.some(
      word => q.includes(word)
    )
  ) {

    addSection(
      sections,
      "1. BASIC INFORMATION"
    );

    addSection(
      sections,
      "25. CONTACT INFORMATION"
    );
  }

  // ----------------------------------------------
  // INDUSTRIES
  // ----------------------------------------------

  const industryWords = [

    "industry",
    "industries",
    "industrial",
    "manufacturing",
    "sector",
    "sectors",
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

  if (
    industryWords.some(
      word => q.includes(word)
    )
  ) {

    addSection(
      sections,
      "6. CORE FUNCTIONS OF NDC"
    );

    addSection(
      sections,
      "7. NDC'S STRATEGIC INDUSTRIAL AREAS"
    );

    addSection(
      sections,
      "22. NDC'S CURRENT STRATEGIC PROJECT CATEGORIES"
    );
  }

  // ----------------------------------------------
  // PROJECTS
  // ----------------------------------------------

  if (
    q.includes("project") ||
    q.includes("projects")
  ) {

    addSection(
      sections,
      "8. MAJOR NDC PROJECTS"
    );

    addSection(
      sections,
      "28. IMPORTANT PROJECT LIST"
    );
  }

  // ----------------------------------------------
  // LIGANGA
  // ----------------------------------------------

  if (
    q.includes("liganga") ||
    q.includes("iron ore") ||
    q.includes("iron extraction") ||
    q.includes("iron and steel")
  ) {

    addSection(
      sections,
      "8.1 LIGANGA IRON AND STEEL PROJECT"
    );
  }

  // ----------------------------------------------
  // MCHUCHUMA
  // ----------------------------------------------

  if (
    q.includes("mchuchuma") ||
    q.includes("coal mining") ||
    q.includes("coal mine") ||
    q.includes("coal to electricity") ||
    q.includes("coal-to-electricity")
  ) {

    addSection(
      sections,
      "8.2 MCHUCHUMA COAL PROJECT"
    );

    addSection(
      sections,
      "8.3 MCHUCHUMA COAL-TO-ELECTRICITY"
    );
  }

  // ----------------------------------------------
  // ENGARUKA
  // ----------------------------------------------

  if (
    q.includes("engaruka") ||
    q.includes("soda ash")
  ) {

    addSection(
      sections,
      "8.4 ENGARUKA SODA ASH PROJECT"
    );
  }

  // ----------------------------------------------
  // TYRE
  // ----------------------------------------------

  if (
    q.includes("tyre") ||
    q.includes("tires") ||
    q.includes("tire")
  ) {

    addSection(
      sections,
      "8.5 ARUSHA TYRE MANUFACTURING PROJECT"
    );
  }

  // ----------------------------------------------
  // MACHINE TOOLS
  // ----------------------------------------------

  if (
    q.includes("machine tools") ||
    q.includes("kmtc") ||
    q.includes("kilimanjaro machine") ||
    q.includes("mang ula") ||
    q.includes("mang'ula")
  ) {

    addSection(
      sections,
      "8.6 MANG'ULA MACHINE TOOLS PROJECT"
    );

    addSection(
      sections,
      "8.7 KILIMANJARO MACHINE TOOLS / KMTC"
    );
  }

  // ----------------------------------------------
  // TBPL
  // ----------------------------------------------

  if (
    q.includes("tbpl") ||
    q.includes("biotech") ||
    q.includes("biotechnology") ||
    q.includes("biolarvicide")
  ) {

    addSection(
      sections,
      "8.8 TANZANIA BIOTECH PRODUCTS LIMITED (TBPL)"
    );
  }

  // ----------------------------------------------
  // TAMCO
  // ----------------------------------------------

  if (
    q.includes("tamco") ||
    q.includes("kibaha industrial") ||
    q.includes("industrial estate")
  ) {

    addSection(
      sections,
      "8.9 TAMCO INDUSTRIAL ESTATE"
    );
  }

  // ----------------------------------------------
  // INDUSTRIAL PARKS
  // ----------------------------------------------

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

    addSection(
      sections,
      "9. INDUSTRIAL PARKS / INDUSTRIAL ESTATES"
    );
  }

  // ----------------------------------------------
  // KANGE
  // ----------------------------------------------

  if (q.includes("kange")) {

    addSection(
      sections,
      "8.10 KANGE INDUSTRIAL AREA"
    );
  }

  // ----------------------------------------------
  // NYANZA
  // ----------------------------------------------

  if (q.includes("nyanza")) {

    addSection(
      sections,
      "8.11 NYANZA INDUSTRIAL AREA"
    );
  }

  // ----------------------------------------------
  // ETC CARGO
  // ----------------------------------------------

  if (
    q.includes("etc cargo") ||
    q.includes("dry port") ||
    q.includes("grain")
  ) {

    addSection(
      sections,
      "8.13 ETC CARGO / GRAIN DRY PORT"
    );
  }

  // ----------------------------------------------
  // RUBBER
  // ----------------------------------------------

  if (
    q.includes("rubber") ||
    q.includes("kalunga") ||
    q.includes("kihuhwi")
  ) {

    addSection(
      sections,
      "8.14 KALUNGA RUBBER PLANTATIONS"
    );

    addSection(
      sections,
      "8.15 KIHUHWI RUBBER PROJECT"
    );
  }

  // ----------------------------------------------
  // INVESTMENT
  // ----------------------------------------------

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

    addSection(
      sections,
      "10. HOW NDC WORKS WITH INVESTORS"
    );

    addSection(
      sections,
      "11. WHAT SHOULD AN INVESTOR PREPARE?"
    );

    addSection(
      sections,
      "12. TYPES OF INVESTMENT OPPORTUNITIES"
    );
  }

  // ----------------------------------------------
  // TENDERS
  // ----------------------------------------------

  if (
    q.includes("tender") ||
    q.includes("procurement") ||
    q.includes("proposal") ||
    q.includes("expression of interest") ||
    q.includes("rfp")
  ) {

    addSection(
      sections,
      "13. TENDERS AND PROCUREMENT"
    );
  }

  // ----------------------------------------------
  // JOBS
  // ----------------------------------------------

  if (
    q.includes("job") ||
    q.includes("jobs") ||
    q.includes("vacancy") ||
    q.includes("vacancies") ||
    q.includes("career") ||
    q.includes("careers") ||
    q.includes("employment")
  ) {

    addSection(
      sections,
      "14. JOBS / EMPLOYMENT AT NDC"
    );
  }

  // ----------------------------------------------
  // ORGANIZATION
  // ----------------------------------------------

  if (
    q.includes("board") ||
    q.includes("managing director") ||
    q.includes("director") ||
    q.includes("organizational structure") ||
    q.includes("organization structure")
  ) {

    addSection(
      sections,
      "15. NDC ORGANIZATIONAL STRUCTURE"
    );
  }

  // ----------------------------------------------
  // GOVERNMENT
  // ----------------------------------------------

  if (
    q.includes("government") ||
    q.includes("ministry") ||
    q.includes("supervise") ||
    q.includes("supervises")
  ) {

    addSection(
      sections,
      "16. NDC AND THE TANZANIAN GOVERNMENT"
    );

    addSection(
      sections,
      "1. BASIC INFORMATION"
    );
  }

  // ----------------------------------------------
  // PRIVATE SECTOR
  // ----------------------------------------------

  if (
    q.includes("private sector") ||
    q.includes("private company") ||
    q.includes("private business") ||
    q.includes("entrepreneur")
  ) {

    addSection(
      sections,
      "17. NDC AND PRIVATE INVESTORS"
    );
  }

  // ----------------------------------------------
  // ECONOMIC IMPACT
  // ----------------------------------------------

  if (
    q.includes("economic impact") ||
    q.includes("benefit") ||
    q.includes("employment creation") ||
    q.includes("industrialization")
  ) {

    addSection(
      sections,
      "18. NDC'S ECONOMIC IMPACT"
    );
  }

  // ----------------------------------------------
  // SIDO
  // ----------------------------------------------

  if (q.includes("sido")) {

    addSection(
      sections,
      "20. IMPORTANT DISTINCTION: NDC IS NOT SIDO"
    );
  }

  // ----------------------------------------------
  // TIC
  // ----------------------------------------------

  if (
    q.includes("tic") ||
    q.includes("tanzania investment centre") ||
    q.includes("tanzania investment center")
  ) {

    addSection(
      sections,
      "21. IMPORTANT DISTINCTION: NDC IS NOT TANZANIA INVESTMENT CENTRE"
    );
  }

  // ----------------------------------------------
  // HISTORY
  // ----------------------------------------------

  if (
    q.includes("history") ||
    q.includes("historical") ||
    q.includes("established") ||
    q.includes("1962") ||
    q.includes("1965")
  ) {

    addSection(
      sections,
      "2. WHAT IS NDC?"
    );

    addSection(
      sections,
      "19. HISTORICAL IMPORTANCE"
    );
  }

  // ----------------------------------------------
  // ABOUT NDC
  // ----------------------------------------------

  if (
    q === "ndc" ||
    q === "about ndc" ||
    q.includes("tell me about ndc") ||
    q.includes("information about ndc")
  ) {

    addSection(
      sections,
      "1. BASIC INFORMATION"
    );

    addSection(
      sections,
      "2. WHAT IS NDC?"
    );

    addSection(
      sections,
      "3. NDC VISION"
    );

    addSection(
      sections,
      "4. NDC MISSION"
    );

    addSection(
      sections,
      "5. MAIN PURPOSE OF NDC"
    );

    addSection(
      sections,
      "7. NDC'S STRATEGIC INDUSTRIAL AREAS"
    );
  }

  if (sections.length === 0) {
    return null;
  }

  return sections.join(
    "\n\n==============================\n\n"
  );
}

// --------------------------------------------------
// SUGGESTIONS
// --------------------------------------------------

function getSuggestions(
  question,
  answer,
  relevantKnowledge
) {

  const q =
    normalize(question);

  if (
    q.includes("contact") ||
    q.includes("email") ||
    q.includes("phone") ||
    q.includes("address")
  ) {

    return [
      "What is NDC?",
      "What does NDC do?",
      "What projects does NDC have?",
      "How can I become an NDC investor?"
    ];
  }

  if (q.includes("liganga")) {

    return [
      "What is the Mchuchuma project?",
      "What is the purpose of the Liganga project?",
      "What resources are involved in Liganga?",
      "How can investors participate in NDC projects?"
    ];
  }

  if (
    q.includes("mchuchuma") ||
    q.includes("coal")
  ) {

    return [
      "Tell me about the Liganga project",
      "What is Mchuchuma coal-to-electricity?",
      "What are NDC's strategic industries?",
      "How can investors work with NDC?"
    ];
  }

  if (
    q.includes("invest") ||
    q.includes("partner") ||
    q.includes("joint venture")
  ) {

    return [
      "What documents should an investor prepare?",
      "How does NDC work with investors?",
      "What investment opportunities does NDC offer?",
      "Can foreigners invest through NDC?"
    ];
  }

  if (q.includes("project")) {

    return [
      "Tell me about the Liganga project",
      "What is the Mchuchuma project?",
      "What is the Engaruka Soda Ash Project?",
      "What industrial parks does NDC have?"
    ];
  }

  if (
    q.includes("industry") ||
    q.includes("industrial") ||
    q.includes("manufacturing")
  ) {

    return [
      "What industries does NDC focus on?",
      "What industrial parks does NDC have?",
      "What is TAMCO Industrial Estate?",
      "Does NDC support private investors?"
    ];
  }

  if (
    q.includes("job") ||
    q.includes("vacancy") ||
    q.includes("career")
  ) {

    return [
      "Where can I find NDC vacancies?",
      "What areas does NDC employ professionals in?",
      "What does NDC do?",
      "How can I contact NDC?"
    ];
  }

  return [
    "What is NDC?",
    "What does NDC do?",
    "What projects does NDC have?",
    "How can I become an NDC investor?"
  ];
}

// --------------------------------------------------
// NDC SYSTEM PROMPT
// --------------------------------------------------

const NDC_SYSTEM_PROMPT = `
You are the NDC Assistant, an AI assistant for the
National Development Corporation (NDC) of Tanzania.

IDENTITY:

Your name is NDC Assistant.

NDC means National Development Corporation of Tanzania.

You are the assistant presented through the NDC Assistant application.

NEVER introduce yourself as:
- Qwen
- Alibaba Cloud
- Ollama
- an Alibaba Cloud AI
- a different organization
- a different NDC

If the user asks "Who are you?", respond:

"I am the NDC Assistant, an AI assistant that provides information
about the National Development Corporation (NDC) of Tanzania."

IMPORTANT:

The provided NDC information is the primary source for NDC-related
questions.

Never invent NDC facts.

Never invent:
- projects
- investment opportunities
- tenders
- tender numbers
- deadlines
- prices
- vacancies
- job openings
- contact information
- project status
- government decisions
- investor requirements

When information is not available in the provided NDC information,
say:

"I don't have that information in the current NDC information."

For information that can change over time, such as:
- current tenders
- current vacancies
- current investment opportunities
- current project status
- current contact information

do not invent current information.

Instead, tell the user that the latest official NDC information
should be checked.

Do not claim that an NDC project is operational unless the provided
information explicitly confirms this.

When the knowledge distinguishes between proposed, developing,
under-construction, or operational projects, preserve that distinction.

Do not confuse NDC Tanzania with another organization using the
same abbreviation.

Do not mention:
- prompts
- system instructions
- RAG
- retrieval
- vector search
- knowledge-base processing
- internal instructions
- model limitations

Do not repeat the user's question.

Be concise for simple questions.

Provide more detail when the user asks for detail.

If the user asks for a list, provide the actual list.

Use professional and natural language.

NDC CORE INFORMATION:

Official Name:
National Development Corporation

Country:
United Republic of Tanzania

Responsible Ministry:
Ministry of Industry and Trade, Tanzania

Headquarters:
Development House, Kivukoni Front / Ohio Street,
P.O. Box 2669, Dar es Salaam, Tanzania

Email:
info@ndc.go.tz

Telephone:
+255 22 2112893 / +255 22 2113618

Website:
https://ndc.go.tz/
`;

// --------------------------------------------------
// OLLAMA
// --------------------------------------------------

async function askOllama(
  question,
  relevantKnowledge
) {

  const prompt = `
${NDC_SYSTEM_PROMPT}

USER QUESTION:
${question}

PROVIDED NDC INFORMATION:
${relevantKnowledge}

ANSWER:
`;

  const response =
    await fetch(
      OLLAMA_URL,
      {
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

            num_predict: 300
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

  let answer =
    data.response
      ? data.response.trim()
      : "";

  // ----------------------------------------------
  // SAFETY CLEANUP
  // ----------------------------------------------
  // Prevent accidental model self-identification.
  // If Qwen still introduces itself despite the prompt,
  // remove the common introduction and use NDC identity.

  const qwenIntroductionPatterns = [

    /^hello[!,.]?\s*my name is qwen[^.]*[.]?/i,

    /^hi[!,.]?\s*my name is qwen[^.]*[.]?/i,

    /^i(?:'m| am)\s+qwen[^.]*[.]?/i,

    /^i am qwen[^.]*[.]?/i,

    /^my name is qwen[^.]*[.]?/i,

    /^hello[!,.]?\s*i(?:'m| am)\s+qwen[^.]*[.]?/i
  ];

  for (
    const pattern of qwenIntroductionPatterns
  ) {

    answer =
      answer.replace(
        pattern,
        ""
      ).trim();
  }

  return answer;
}

// --------------------------------------------------
// GENERAL AI SYSTEM PROMPT
// --------------------------------------------------

const GENERAL_SYSTEM_PROMPT = `
You are the AI assistant inside the NDC Assistant application.

Your application identity is:

NDC Assistant

You are powered by an underlying AI model.

However, the underlying AI model is NOT your identity.

NEVER introduce yourself as:
- Qwen
- Alibaba Cloud
- Ollama
- an Alibaba Cloud AI

If the user asks who you are, answer:

"I am the NDC Assistant, an AI assistant for the National Development
Corporation (NDC) of Tanzania."

For questions unrelated to NDC, answer naturally and accurately.

Do not pretend that a general answer is official NDC information.

Do not mention:
- prompts
- system instructions
- internal processing
- model limitations
- RAG
- vector search
- knowledge retrieval

Be concise and helpful.
`;

// --------------------------------------------------
// GENERAL AI ANSWER
// --------------------------------------------------

async function askGeneralQuestion(
  question
) {

  const prompt = `
${GENERAL_SYSTEM_PROMPT}

USER QUESTION:
${question}

ANSWER:
`;

  const response =
    await fetch(
      OLLAMA_URL,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          model: MODEL,

          prompt,

          stream: false,

          options: {

            temperature: 0.4,

            top_p: 0.9,

            num_predict: 300
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

  let answer =
    data.response
      ? data.response.trim()
      : "";

  // ----------------------------------------------
  // REMOVE MODEL SELF-IDENTIFICATION
  // ----------------------------------------------

  const qwenIntroductionPatterns = [

    /^hello[!,.]?\s*my name is qwen[^.]*[.]?/i,

    /^hi[!,.]?\s*my name is qwen[^.]*[.]?/i,

    /^i(?:'m| am)\s+qwen[^.]*[.]?/i,

    /^i am qwen[^.]*[.]?/i,

    /^my name is qwen[^.]*[.]?/i,

    /^hello[!,.]?\s*i(?:'m| am)\s+qwen[^.]*[.]?/i
  ];

  for (
    const pattern of qwenIntroductionPatterns
  ) {

    answer =
      answer.replace(
        pattern,
        ""
      ).trim();
  }

  return answer;
}

// --------------------------------------------------
// DETERMINE IF QUESTION IS PROBABLY NDC RELATED
// --------------------------------------------------

function isNDCRelated(question) {

  const q =
    normalize(question);

  const ndcWords = [

    "ndc",

    "national development corporation",

    "liganga",

    "mchuchuma",

    "engaruka",

    "tamco",

    "kmtc",

    "kilimanjaro machine",

    "mang ula",

    "tbpl",

    "biolarvicide",

    "kange",

    "nyanza",

    "kalunga",

    "kihuhwi",

    "industrial park",

    "industrial estate",

    "industrial area",

    "ndc investor",

    "ndc investment",

    "ndc project",

    "ndc tender",

    "ndc job",

    "ndc vacancy"
  ];

  return ndcWords.some(
    word => q.includes(word)
  );
}

// --------------------------------------------------
// CHAT ENDPOINT
// --------------------------------------------------

app.post(
  "/chat",
  async (req, res) => {

    try {

      const {
        question
      } = req.body;

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

      if (!cleanQuestion) {

        return res.status(400).json({
          error:
            "question is required"
        });
      }

      console.log(
        "Question:",
        cleanQuestion
      );

      // ------------------------------------------
      // 1. CONVERSATION
      // ------------------------------------------

      const conversationAnswer =
        getConversationAnswer(
          cleanQuestion
        );

      if (conversationAnswer) {

        console.log(
          "Answer mode: CONVERSATION"
        );

        return res.json(
          conversationAnswer
        );
      }

      // ------------------------------------------
      // 2. CONTACT
      // ------------------------------------------

      const contactAnswer =
        getContactAnswer(
          cleanQuestion
        );

      if (contactAnswer) {

        console.log(
          "Answer mode: CONTACT"
        );

        return res.json(
          contactAnswer
        );
      }

      // ------------------------------------------
      // 3. NDC KNOWLEDGE
      // ------------------------------------------

      if (
        isNDCRelated(
          cleanQuestion
        )
      ) {

        const relevantKnowledge =
          getSections(
            cleanQuestion
          );

        if (!relevantKnowledge) {

          return res.json({

            answer:
              "I don't have that information in the current NDC information.",

            suggestions: [
              "What is NDC?",
              "What does NDC do?",
              "What projects does NDC have?",
              "How can I contact NDC?"
            ]
          });
        }

        console.log(
          "Answer mode: NDC KNOWLEDGE"
        );

        console.log(
          "Relevant knowledge length:",
          relevantKnowledge.length
        );

        const answer =
          await askOllama(
            cleanQuestion,
            relevantKnowledge
          );

        const suggestions =
          getSuggestions(
            cleanQuestion,
            answer,
            relevantKnowledge
          );

        return res.json({

          answer,

          suggestions
        });
      }

      // ------------------------------------------
      // 4. GENERAL QUESTION
      // ------------------------------------------

      console.log(
        "Answer mode: GENERAL AI"
      );

      const answer =
        await askGeneralQuestion(
          cleanQuestion
        );

      const suggestions = [

        "What is NDC?",

        "What projects does NDC have?",

        "How can I become an NDC investor?",

        "How can I contact NDC?"
      ];

      return res.json({

        answer,

        suggestions
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

// --------------------------------------------------
// START HTTPS SERVER
// --------------------------------------------------

https.createServer(
  HTTPS_OPTIONS,
  app
).listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log("");

    console.log(
      "================================="
    );

    console.log(
      "NDC ASSISTANT HTTPS SERVER"
    );

    console.log(
      "================================="
    );

    console.log(
      `https://95.111.255.86:${PORT}`
    );

    console.log(
      `https://95.111.255.86:${PORT}/chat`
    );

    console.log(
      "================================="
    );

    console.log("");
  }
);