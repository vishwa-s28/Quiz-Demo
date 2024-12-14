let currentQuestionIndex = 0;
let timerInterval;
let questions = [];
let answers = [];
let results = [];

function renderQuestionContainer() {
  const container = document.querySelector(".container");
  container.innerHTML = `
    <div class="question-container">
      <div class="timer"></div>
      <div class="question"></div>
      <div class="options">
        <ol></ol>
      </div>
      <div class="button"></div>
    </div>
  `;
}

async function fetchQuestions() {
  try {
    const response = await fetch(
      "https://vishwa-s28.github.io/quiz-api/questions.json"
    );
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    let resJson = await response.json();
    questions = resJson["questions"];
    answers = Array(questions.length).fill(undefined);
    results = Array(questions.length).fill("unanswered");

    renderQuestionContainer();

    const buttonContainer = document.querySelector(".button");
    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.className = "btn";
    nextButton.id = "next";
    nextButton.textContent = "Next";
    nextButton.disabled = true;
    buttonContainer.appendChild(nextButton);

    nextButton.addEventListener("click", () => {
      if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        displayQuestion(currentQuestionIndex);
        resetTimer(handleTimeout);
        disableNextButton();
      } else {
        clearInterval(timerInterval);
        showResults();
      }
    });

    displayQuestion(currentQuestionIndex);
    startTimer(handleTimeout);
  } catch (error) {
    console.error("Error fetching data:", error);
    const container = document.querySelector(".container");
    container.innerHTML = `
      <div class="error-message">
        <h2>Oops! Something went wrong.</h2>
        <p>We couldn't load the quiz questions. Please check your internet connection or try again later.</p>
        <button id="button" onclick="location.reload()">Try again</button>
      </div>
    `;
  }
}

function displayQuestion(index) {
  const questionContainer = document.querySelector(".question");
  const optionsContainer = document.querySelector(".options ol");
  const nextButton = document.getElementById("next");

  questionContainer.innerHTML = `<p>${index + 1} ) ${
    questions[index].question
  }</p>`;
  optionsContainer.innerHTML = "";

  questions[index].options.forEach((option, optionIndex) => {
    const li = document.createElement("li");
    li.textContent = option;

    if (answers[index] === optionIndex) {
      li.classList.add("selected");
    }

    li.addEventListener("click", () => {
      document.querySelectorAll(".options li").forEach((item) => {
        item.classList.remove("selected");
      });
      li.classList.add("selected");
      answers[index] = optionIndex;

      results[index] =
        questions[index].options[optionIndex] === questions[index].answer
          ? "correct"
          : "wrong";

      enableNextButton();
    });

    optionsContainer.appendChild(li);
  });

  if (index === questions.length - 1) {
    nextButton.textContent = "Submit Quiz";
  } else {
    nextButton.textContent = "Next";
  }

  disableNextButton();
}

function startTimer(onTimeout) {
  let timeLeft = 10;
  const timerDisplay = document.querySelector(".timer");
  timerDisplay.textContent = `00:${timeLeft < 10 ? "0" : ""}${timeLeft}`;

  timerInterval = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = `00:${timeLeft < 10 ? "0" : ""}${timeLeft}`;

    if (timeLeft === 0) {
      clearInterval(timerInterval);
      onTimeout();
    }
  }, 1000);
}

function resetTimer(onTimeout) {
  clearInterval(timerInterval);
  startTimer(onTimeout);
}

function handleTimeout() {
  if (answers[currentQuestionIndex] === undefined) {
    results[currentQuestionIndex] = "unanswered";
  }

  currentQuestionIndex++;
  if (currentQuestionIndex < questions.length) {
    displayQuestion(currentQuestionIndex);
    resetTimer(handleTimeout);
  } else {
    clearInterval(timerInterval);
    showResults();
  }
}

function showResults() {
  const container = document.querySelector(".container");
  container.innerHTML = "";

  const allQuestions = results.map((status, index) => {
    const question = questions[index];
    const options = question.options
      .map((option, optionIndex) => {
        const isCorrect = question.options[optionIndex] === question.answer;
        const isSelected = answers[index] === optionIndex;

        let liClass = "";
        if (isCorrect) {
          liClass = "correct";
        } else if (isSelected) {
          liClass = "submitted";
        }

        return `<li class="${liClass}">${escapeHTML(option)}</li>`;
      })
      .join("");

    let questionBlockClass = "";
    if (status === "correct") {
      questionBlockClass = "bg-blue";
    } else if (status === "wrong") {
      questionBlockClass = "bg-red";
    } else if (status === "unanswered") {
      questionBlockClass = "bg-yellow";
    }

    return `
      <div class="question-block ${questionBlockClass}" tootltip="correct">
        <p>${index + 1}. ${escapeHTML(question.question)}</p>
        <ol>${options}</ol>
      </div>
    `;
  });

  const resultSummary = `
    <div class="result-container">
        <div class="sub-container">
          <h2>Quiz Results</h2>
          <hr />
          <div class="result">
            <button id="correct">Correct: ${
              results.filter((r) => r === "correct").length
            }</button>
            <button id="wrong">Wrong: ${
              results.filter((r) => r === "wrong").length
            }</button>
            <button id="unanswered">Unanswered: ${
              results.filter((r) => r === "unanswered").length
            }</button>
            <button id="retry" onclick="location.reload()">Retry Quiz</button>
          </div>
          <div class="details">
            ${allQuestions.join("")}
          </div>
        </div>
    </div>
  `;

  container.innerHTML = resultSummary;
}

function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function enableNextButton() {
  document.getElementById("next").disabled = false;
}

function disableNextButton() {
  document.getElementById("next").disabled = true;
}
