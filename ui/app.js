// const API_URL = "http://127.0.0.1:3000/chat";

// const API_URL = "/chat";
const API_URL = "/ndc/chat";

const messages = document.getElementById("messages");
const questionInput = document.getElementById("question");
const sendButton = document.getElementById("sendButton");
const newChatButton = document.getElementById("newChat");
const clearChatButton = document.getElementById("clearChat");
const welcome = document.getElementById("welcome");

let sending = false;


/* ==========================================
   SEND QUESTION
========================================== */

async function sendQuestion(question) {

  question = question.trim();

  if (!question || sending) {
    return;
  }

  sending = true;

  // Disable controls while waiting
  sendButton.disabled = true;
  questionInput.disabled = true;

  // Remove welcome screen
  if (welcome) {
    welcome.remove();
  }

  // Add user message
  addMessage("user", question);

  // Clear input
  questionInput.value = "";
  autoResize();

  // Add loading message
  const loading = addLoadingMessage();

  try {

    const response = await fetch(API_URL, {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        question: question
      })
    });

    /*
     * Try to read JSON even when the server returns an error.
     */
    let data;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {

      const serverError =
        data && data.error
          ? data.error
          : `Server returned ${response.status}`;

      throw new Error(serverError);
    }

    loading.remove();

    /*
     * Successful answer
     */
    if (data && data.answer) {

      addMessage(
        "assistant",
        data.answer
      );

    } else {

      addMessage(
        "assistant",
        "Sorry, I couldn't generate an answer."
      );
    }

  } catch (error) {

    console.error("NDC Assistant error:", error);

    loading.remove();

    addMessage(
      "assistant",
      "Sorry, I couldn't connect to the NDC Assistant. Please try again."
    );

  } finally {

    sending = false;

    sendButton.disabled = false;
    questionInput.disabled = false;

    questionInput.focus();
  }
}


/* ==========================================
   ADD MESSAGE
========================================== */

function addMessage(type, text) {

  const row = document.createElement("div");

  row.className =
    `message-row ${type}`;


  const avatar = document.createElement("div");

  avatar.className =
    `avatar ${type}`;

  avatar.textContent =
    type === "assistant"
      ? "NDC"
      : "YOU";


  const content = document.createElement("div");

  content.className =
    "message-content";


  const name = document.createElement("div");

  name.className =
    "message-name";

  name.textContent =
    type === "assistant"
      ? "NDC Assistant"
      : "You";


  const message = document.createElement("div");

  message.className =
    `message ${
      type === "assistant"
        ? "assistant-message"
        : "user-message"
    }`;

  /*
   * IMPORTANT:
   * textContent prevents the model response from
   * injecting HTML/JavaScript into the page.
   */
  message.textContent = text;


  content.appendChild(name);
  content.appendChild(message);


  if (type === "assistant") {

    row.appendChild(avatar);
    row.appendChild(content);

  } else {

    row.appendChild(content);
    row.appendChild(avatar);

  }


  messages.appendChild(row);

  scrollToBottom();

  return row;
}


/* ==========================================
   LOADING MESSAGE
========================================== */

function addLoadingMessage() {

  const row = document.createElement("div");

  row.className =
    "message-row assistant";


  const avatar = document.createElement("div");

  avatar.className =
    "avatar assistant";

  avatar.textContent =
    "NDC";


  const content = document.createElement("div");

  content.className =
    "message-content";


  const name = document.createElement("div");

  name.className =
    "message-name";

  name.textContent =
    "NDC Assistant";


  const message = document.createElement("div");

  message.className =
    "message assistant-message";


  const typing = document.createElement("div");

  typing.className =
    "typing";


  for (let i = 0; i < 3; i++) {

    const dot =
      document.createElement("span");

    typing.appendChild(dot);
  }


  message.appendChild(typing);

  content.appendChild(name);
  content.appendChild(message);

  row.appendChild(avatar);
  row.appendChild(content);

  messages.appendChild(row);

  scrollToBottom();

  return row;
}


/* ==========================================
   SCROLL
========================================== */

function scrollToBottom() {

  requestAnimationFrame(() => {

    messages.scrollTo({
      top: messages.scrollHeight,
      behavior: "smooth"
    });

  });
}


/* ==========================================
   TEXTAREA AUTO RESIZE
========================================== */

function autoResize() {

  questionInput.style.height = "auto";

  questionInput.style.height =
    Math.min(
      questionInput.scrollHeight,
      130
    ) + "px";
}


questionInput.addEventListener(
  "input",
  autoResize
);


/* ==========================================
   ENTER TO SEND
========================================== */

questionInput.addEventListener(
  "keydown",
  event => {

    /*
     * Enter = send
     * Shift + Enter = new line
     */

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      sendQuestion(
        questionInput.value
      );
    }

  }
);


/* ==========================================
   SEND BUTTON
========================================== */

sendButton.addEventListener(
  "click",
  () => {

    sendQuestion(
      questionInput.value
    );

  }
);


/* ==========================================
   SUGGESTED QUESTIONS
========================================== */

document.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(
        "[data-question]"
      );

    if (!button) {
      return;
    }

    /*
     * Don't allow suggestion clicks while
     * another question is being processed.
     */
    if (sending) {
      return;
    }

    const question =
      button.dataset.question;

    if (!question) {
      return;
    }

    sendQuestion(question);

  }
);


/* ==========================================
   CLEAR / NEW CHAT
========================================== */

function clearConversation() {

  if (sending) {
    return;
  }

  messages.innerHTML = `
    <div id="welcome" class="welcome">

      <div class="welcome-logo">
        NDC
      </div>

      <h2>How can I help you?</h2>

      <p>
        Ask questions about the National Development Corporation,
        its projects, investment opportunities and industrial
        development activities.
      </p>

      <div class="suggestions">

        <button data-question="What is NDC?">
          <strong>What is NDC?</strong>
          <span>Learn about NDC</span>
        </button>

        <button data-question="What are the objectives of NDC?">
          <strong>What are the objectives?</strong>
          <span>Understand NDC's role</span>
        </button>

        <button data-question="What projects does NDC have?">
          <strong>What projects does NDC have?</strong>
          <span>Explore major projects</span>
        </button>

        <button data-question="How can I contact NDC?">
          <strong>How can I contact NDC?</strong>
          <span>Contact information</span>
        </button>

      </div>

    </div>
  `;

  questionInput.value = "";

  questionInput.disabled = false;
  sendButton.disabled = false;

  autoResize();

  questionInput.focus();
}


newChatButton.addEventListener(
  "click",
  clearConversation
);


clearChatButton.addEventListener(
  "click",
  clearConversation
);


/* ==========================================
   INITIAL FOCUS
========================================== */

questionInput.focus();
