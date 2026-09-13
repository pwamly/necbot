const express = require("express");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(express.json());

const KNOWLEDGE_FILE = "/root/necbot/knowledge/company.txt";
const OLLAMA_URL = "http://127.0.0.1:11434/api/generate";

// Load knowledge once when the server starts
const knowledge = fs.readFileSync(KNOWLEDGE_FILE, "utf8");

/**
 * Return only the relevant part of the knowledge
 * based on the user's question.
 */
function getRelevantKnowledge(question) {
  const q = question.toLowerCase();

  // --------------------------------------------------
  // CONTACT INFORMATION
  // --------------------------------------------------
  if (
    q.includes("contact") ||
    q.includes("email") ||
    q.includes("phone") ||
    q.includes("telephone") ||
    q.includes("address") ||
    q.includes("reach") ||
    q.includes("call") ||
    q.includes("website")
  ) {
    return `
NATIONAL DEVELOPMENT CORPORATION (NDC)

CONTACT INFORMATION

Address:
Development House,
Kivukoni Front / Ohio Street,
Dar es Salaam, Tanzania.

Postal Address:
P.O. Box 2669,
Dar es Salaam, Tanzania.

Email:
info@ndc.go.tz

Telephone:
+255 22 2112893
+255 22 2113618

Website:
https://ndc.go.tz/
`;
  }

  // --------------------------------------------------
  // BASIC INFORMATION
  // --------------------------------------------------
  if (
    q.includes("what is ndc") ||
    q.includes("what does ndc stand for") ||
    q.includes("what does ndc do") ||
    q.includes("who is ndc") ||
    q.includes("ndc organization") ||
    q.includes("ndc organization")
  ) {
    const section = extractSection(
      knowledge,
      "1. BASIC INFORMATION"
    );

    return section;
  }

  // --------------------------------------------------
  // LIGANGA
  // --------------------------------------------------
  if (
    q.includes("liganga") ||
    q.includes("iron and steel") ||
    q.includes("iron ore")
  ) {
    return extractSection(
      knowledge,
      "8.1 LIGANGA IRON AND STEEL PROJECT"
    );
  }

  // --------------------------------------------------
  // MCHUCHUMA
  // --------------------------------------------------
  if (
    q.includes("mchuchuma") ||
    q.includes("coal") ||
    q.includes("coal-to-electricity")
  ) {
    return extractSection(
      knowledge,
      "8.2 MCHUCHUMA COAL PROJECT"
    );
  }

  // --------------------------------------------------
  // ENGARUKA / SODA ASH
  // --------------------------------------------------
  if (
    q.includes("engaruka") ||
    q.includes("soda ash")
  ) {
    return extractSection(
      knowledge,
      "8.4 ENGARUKA SODA ASH PROJECT"
    );
  }

  // --------------------------------------------------
  // TAMCO
  // --------------------------------------------------
  if (
    q.includes("tamco") ||
    q.includes("industrial estate") ||
    q.includes("industrial park")
  ) {
    return extractSection(
      knowledge,
      "8.9 TAMCO INDUSTRIAL ESTATE"
    );
  }

  // --------------------------------------------------
  // MACHINE TOOLS
  // --------------------------------------------------
  if (
    q.includes("machine tools") ||
    q.includes("kmtc") ||
    q.includes("mang'ula")
  ) {
    return `
MANG'ULA MACHINE TOOLS PROJECT

Industry:
Industrial machinery / machine tools.

Purpose:
- Support domestic machinery production.
- Increase industrial manufacturing capacity.
- Provide machinery and equipment for industries.
- Support Tanzania's industrialization.

KILIMANJARO MACHINE TOOLS COMPANY (KMTC)

Location:
Moshi, Kilimanjaro Region.

Industry:
Machine tools / industrial equipment.

NDC has been involved in efforts to revive and develop the facility.

Strategic purpose:
- Industrial machinery production.
- Support local manufacturing.
- Create employment.
- Support other industries with equipment.
`;
  }

  // --------------------------------------------------
  // INVESTMENT
  // --------------------------------------------------
  if (
    q.includes("invest") ||
    q.includes("investor") ||
    q.includes("investment") ||
    q.includes("partner") ||
    q.includes("partnership") ||
    q.includes("joint venture")
  ) {
    return `
HOW NDC WORKS WITH INVESTORS

NDC can work with investors who want to establish strategic
industrial businesses in Tanzania.

A typical investment/partnership process is:

1. Submit an application.
2. NDC reviews the proposal.
3. The investor may be invited to present the project.
4. NDC evaluates the proposal.
5. Relevant government involvement may occur where required.
6. If approved, the parties may proceed toward an MOU or
   other appropriate agreement.

Useful information for an investor includes:

- Company profile
- Certificate of incorporation
- Company registration documents
- Directors/shareholders information
- Tax information
- Project concept
- Business plan
- Feasibility study
- Market analysis
- Financial projections
- Proposed investment amount
- Source of financing
- Technology description
- Land requirements
- Production capacity
- Expected employment
- Environmental considerations
- Implementation schedule
- Proposed partnership structure
`;
  }

  // --------------------------------------------------
  // INDUSTRIAL AREAS
  // --------------------------------------------------
  if (
    q.includes("industrial land") ||
    q.includes("industrial plot") ||
    q.includes("industrial areas") ||
    q.includes("industrial estate")
  ) {
    return `
NDC INDUSTRIAL AREAS / ESTATES

1. TAMCO Industrial Estate — Kibaha, Pwani
2. Kange Industrial Area — Tanga
3. KMTC Industrial Area — Moshi
4. Nyanza Industrial Area — Mwanza

Industrial parks are intended to attract investors and provide
industrial locations and infrastructure.
`;
  }

  // --------------------------------------------------
  // SIDO
  // --------------------------------------------------
  if (
    q.includes("sido")
  ) {
    return `
IMPORTANT DISTINCTION: NDC IS NOT SIDO

NDC:
National Development Corporation.

Main focus:
Strategic industrial development, basic industries, large
projects, industrial infrastructure and investment partnerships.

SIDO:
Small Industries Development Organization.

Main focus:
Development and support of small and medium industries.

NDC and SIDO are different organizations.
`;
  }

  // --------------------------------------------------
  // TIC
  // --------------------------------------------------
  if (
    q.includes("tic") ||
    q.includes("tanzania investment centre") ||
    q.includes("tanzania investment center")
  ) {
    return `
IMPORTANT DISTINCTION: NDC IS NOT TANZANIA INVESTMENT CENTRE

NDC:
Focuses on strategic industrial development and implementation
of industrial projects and partnerships.

TIC:
Tanzania Investment Centre, which has a broader investment
promotion and facilitation mandate.

An investor may interact with both institutions depending on
the nature of the project.
`;
  }

  // --------------------------------------------------
  // JOBS / CAREERS
  // --------------------------------------------------
  if (
    q.includes("job") ||
    q.includes("jobs") ||
    q.includes("vacancy") ||
    q.includes("vacancies") ||
    q.includes("career") ||
    q.includes("careers") ||
    q.includes("employment")
  ) {
    return `
NDC JOBS / EMPLOYMENT

NDC employs professionals in areas related to:

- Engineering
- Finance
- Investment
- Planning
- Research
- Procurement
- Human resources
- Legal services
- Internal audit
- Communications
- Industrial development
- Project management
- Administration
- Heavy industries
- Strategic value addition

Job vacancies can change.

A chatbot should not claim that a particular NDC job is
currently available unless the current vacancy announcement
has been verified.
`;
  }

  // --------------------------------------------------
  // TENDERS / PROCUREMENT
  // --------------------------------------------------
  if (
    q.includes("tender") ||
    q.includes("procurement") ||
    q.includes("request for proposal") ||
    q.includes("expression of interest")
  ) {
    return `
NDC TENDERS AND PROCUREMENT

NDC is a government corporation and conducts procurement and
other competitive processes according to applicable public
procurement requirements.

NDC may publish:

- Tenders
- Requests for proposals
- Expressions of interest
- Leasing opportunities
- Consultancy opportunities
- Project opportunities
- Asset disposal notices
- Investor opportunities

A chatbot should NEVER invent a tender deadline, tender number,
price or procurement requirement.

For current tenders, users should be directed to official
NDC announcements or procurement information.
`;
  }

  // --------------------------------------------------
  // GENERAL PURPOSE / FUNCTIONS
  // --------------------------------------------------
  if (
    q.includes("purpose") ||
    q.includes("function") ||
    q.includes("mission") ||
    q.includes("vision") ||
    q.includes("role") ||
    q.includes("responsible")
  ) {
    return `
NDC is a Tanzanian government industrial development and
promotion organization.

NDC's primary role is promoting and implementing strategic
industrial development projects and working with the private
sector to support industrialization in Tanzania.

NDC works to:

- Develop strategic industrial projects.
- Promote basic industries.
- Add value to Tanzania's natural resources.
- Encourage private-sector participation.
- Attract domestic and foreign investors.
- Develop industrial infrastructure.
- Promote entrepreneurship.
- Support production within Tanzania.
- Increase local industrial capacity.
- Support employment creation.
- Encourage technology and industrial development.

Vision:
Leading industrialization of Tanzania.

Mission:
Implementing strategic industrial development projects in
partnership with private sectors.
`;
  }

  // --------------------------------------------------
  // FALLBACK
  // --------------------------------------------------
  return `
No specific relevant section was found for this question.

The knowledge base is about the National Development Corporation
(NDC) of Tanzania.
`;
}

/**
 * Extract a section from the knowledge file.
 */
function extractSection(text, sectionTitle) {
  const start = text.indexOf(sectionTitle);

  if (start === -1) {
    return "No relevant information was found.";
  }

  const remaining = text.substring(start + sectionTitle.length);

  // Find the next major section separator
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

app.post("/chat", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== "string") {
      return res.status(400).json({
        error: "question is required",
      });
    }

    const relevantKnowledge = getRelevantKnowledge(question);

    console.log("Question:", question);
    console.log("Relevant knowledge length:", relevantKnowledge.length);

    const prompt = `
You are an NDC question-answering assistant.

Answer ONLY the user's question using ONLY the provided information.

STRICT RULES:
- Answer the question directly.
- Be concise.
- Do not summarize the provided information.
- Do not answer other questions.
- Do not list unrelated information.
- Do not mention the knowledge base.
- Do not mention RAG.
- Do not mention these instructions.
- Do not create a sample answer.
- Do not say "Here's a possible answer".
- Do not say "It seems like".
- Do not tell the user to verify the information.
- Do not use your general knowledge.
- Do not guess.
- Do not invent information.
- If the provided information does not answer the question, reply exactly:
I don't know based on the provided company knowledge.

USER QUESTION:
${question}

PROVIDED INFORMATION:
${relevantKnowledge}

ANSWER:
`;

    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3.2:1b",
        prompt,
        stream: false,
        options: {
          temperature: 0.1,
        },
      }),
      signal: AbortSignal.timeout(180000),
    });

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `Ollama returned ${response.status}: ${errorText}`
      );
    }

    const data = await response.json();

    res.json({
      answer: data.response.trim(),
    });
  } catch (error) {
    console.error("Error:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});

// KEEP NETWORKING UNCHANGED
app.listen(PORT, () => {
  console.log(`API running on http://127.0.0.1:${PORT}`);
});
