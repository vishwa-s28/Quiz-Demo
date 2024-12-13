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
    const response = await fetch("http://localhost:3000/questions");
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    questions = await response.json();
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
        <button id="retry" onclick="location.reload()">Retry</button>
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

  const correctIndices = results
    .map((status, index) => (status === "correct" ? index : -1))
    .filter((index) => index !== -1);

  const wrongIndices = results
    .map((status, index) => (status === "wrong" ? index : -1))
    .filter((index) => index !== -1);

  const unansweredIndices = results
    .map((status, index) => (status === "unanswered" ? index : -1))
    .filter((index) => index !== -1);

  const resultSummary = `
    <div class="result-container">
        <div class="sub-container">
          <h2>Quiz Results</h2>
          <hr />
          <div class="result">
            <button id="correct">Correct: ${correctIndices.length}</button>
            <button id="wrong">Wrong: ${wrongIndices.length}</button>
            <button id="unanswered">Unanswered: ${unansweredIndices.length}</button>
            <button id="retry" onclick="location.reload()">Retry Quiz</button>
          </div>
          <div class="details"></div>
        </div>
    </div>
  `;

  container.innerHTML = resultSummary;

  document.getElementById("correct").addEventListener("click", () => {
    showDetails("Correct Questions", correctIndices);
  });
  document.getElementById("wrong").addEventListener("click", () => {
    showDetails("Wrong Questions", wrongIndices);
  });
  document.getElementById("unanswered").addEventListener("click", () => {
    showDetails("Unanswered Questions", unansweredIndices);
  });
}

function showDetails(title, indices) {
  const detailsContainer = document.querySelector(".details");

  if (indices.length === 0) {
    detailsContainer.innerHTML =
      "<p style='text-align: center;'>No questions in this category.</p>";
    detailsContainer.scrollTop = 0;
    return;
  }

  const questionList = indices
    .map((id, index) => {
      const question = questions[id];
      const options = question.options
        .map((option, optionIndex) => {
          const isCorrect = question.options[optionIndex] === question.answer;
          const isSelected = answers[id] === optionIndex;

          let liClass = "";
          if (isCorrect) {
            liClass = "correct";
          } else if (isSelected) {
            liClass = "selected";
          }

          return `<li class="${liClass}">${escapeHTML(option)}</li>`;
        })
        .join("");

      return `
        <div class="question-block">
          <p>${index + 1}. ${escapeHTML(question.question)}</p>
          <ol>${options}</ol>
        </div>
      `;
    })
    .join("");

  detailsContainer.innerHTML = `
    <div class="question-container">
      <p style="text-align: center; text-decoration: underline;">${title}</p>
      ${questionList}
    </div>
  `;
  detailsContainer.scrollTop = 0;
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
