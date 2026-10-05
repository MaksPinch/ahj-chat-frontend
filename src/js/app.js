// После размещения backend здесь будет его HTTPS-адрес.
const serverUrl = "http://localhost:3000";
const loginModal = document.querySelector(".login-modal");
const loginForm = document.querySelector(".login-form");
const nicknameInput = document.querySelector("#nickname");
const loginButton = document.querySelector(".login-button");
const loginError = document.querySelector(".login-error");
const chat = document.querySelector(".chat");
const usersList = document.querySelector(".users");
const messagesList = document.querySelector(".messages");
const messageForm = document.querySelector(".message-form");
const messageInput = document.querySelector("#message");
const sendButton = document.querySelector(".send-button");
const exitButton = document.querySelector(".exit-button");
const chatStatus = document.querySelector(".chat-status");

let user = null;
let socket = null;
let leaving = false;

function showUsers(users) {
  usersList.replaceChildren();
  users.forEach((participant) => {
    const item = document.createElement("li");
    item.classList.add("user");
    const isMe = participant.id === user.id;
    item.textContent = isMe ? "You" : participant.name;
    if (isMe) item.classList.add("user-me");
    usersList.append(item);
  });
}

function showMessage(data) {
  const item = document.createElement("li");
  item.classList.add("message");
  const isMe = data.user.id === user.id;
  if (isMe) item.classList.add("message-me");
  const author = document.createElement("p");
  author.classList.add("message-author");
  const name = isMe ? "You" : data.user.name;
  const date = new Date(data.created || Date.now());
  const time = date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  author.textContent = `${name}, ${time} ${date.toLocaleDateString("ru-RU")}`;
  const text = document.createElement("p");
  text.classList.add("message-text");
  text.textContent = data.message;
  item.append(author, text);
  messagesList.append(item);
  messagesList.scrollTop = messagesList.scrollHeight;
}

function connectChat() {
  const url = serverUrl.replace(/^http/, "ws");
  // id связывает подключение с зарегистрированным участником.
  socket = new WebSocket(url + "?id=" + encodeURIComponent(user.id));
  socket.addEventListener("open", () => {
    loginModal.hidden = true;
    chat.hidden = false;
    messagesList.replaceChildren();
    chatStatus.textContent = "Вы в чате: " + user.name;
    sendButton.disabled = false;
    messageInput.focus();
  });
  socket.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);
      if (Array.isArray(data)) {
        showUsers(data);
      } else if (data.type === "send") {
        showMessage(data);
      }
    } catch (error) {
      chatStatus.textContent = "Не удалось прочитать сообщение сервера.";
      console.error(error);
    }
  });
  socket.addEventListener("error", () => {
    loginError.textContent = "Не удалось подключиться. Проверьте backend.";
  });
  socket.addEventListener("close", () => {
    chat.hidden = true;
    loginModal.hidden = false;
    loginButton.disabled = false;
    loginButton.textContent = "Продолжить";
    sendButton.disabled = true;
    usersList.replaceChildren();
    user = null;
    socket = null;
    loginError.textContent = leaving
      ? ""
      : "Соединение закрыто. Проверьте сервер и войдите снова.";
    leaving = false;
    nicknameInput.focus();
  });
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (loginButton.disabled) return;
  const name = nicknameInput.value.trim();
  if (!name) {
    loginError.textContent = "Введите псевдоним.";
    return;
  }
  loginError.textContent = "";
  loginButton.disabled = true;
  loginButton.textContent = "Подключение...";
  leaving = false;
  try {
    const response = await fetch(serverUrl + "/new-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (response.status === 409) {
      throw new Error("Этот псевдоним занят. Выберите другой.");
    }
    if (!response.ok) throw new Error("Не удалось зарегистрироваться.");
    const data = await response.json();
    user = data.user;
    connectChat();
  } catch (error) {
    loginError.textContent =
      error instanceof TypeError
        ? "Сервер недоступен. Проверьте, запущен ли backend."
        : error.message;
    loginButton.disabled = false;
    loginButton.textContent = "Продолжить";
    user = null;
  }
});

messageForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = messageInput.value.trim();
  if (!message || !socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ type: "send", message, user }));
  messageInput.value = "";
  messageInput.focus();
});

function leaveChat() {
  if (!socket) return;
  leaving = true;
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "exit", user }));
  }
  socket.close();
}

exitButton.addEventListener("click", leaveChat);
window.addEventListener("pagehide", leaveChat);
// При возврате из кэша браузера создаём новое подключение через форму.
window.addEventListener("pageshow", (event) => {
  if (event.persisted) window.location.reload();
});
