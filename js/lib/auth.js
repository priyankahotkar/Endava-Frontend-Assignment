const USERS_KEY = "parkwise_users";
const SESSION_KEY = "parkwise_session";

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getUsers() {
  const raw = localStorage.getItem(USERS_KEY);
  const list = safeParse(raw);
  return Array.isArray(list) ? list : [];
}

export function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function findUserByEmail(email) {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  return getUsers().find((u) => (u.email || "").toLowerCase() === normalized) || null;
}

export function registerUser({ email, password, name }) {
  const errors = [];
  const normalizedEmail = (email || "").trim().toLowerCase();
  const trimmedName = (name || "").trim();

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    errors.push("Please enter a valid email address.");
  }
  if (!password || password.length < 6) {
    errors.push("Password must be at least 6 characters.");
  }
  if (!trimmedName) {
    errors.push("Please enter your name.");
  }

  if (findUserByEmail(normalizedEmail)) {
    errors.push("An account with this email already exists.");
  }

  if (errors.length) {
    return { success: false, errors };
  }

  const users = getUsers();
  const user = {
    id: `u_${Date.now()}`,
    email: normalizedEmail,
    password,
    name: trimmedName,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  saveUsers(users);
  setSession(user);

  return { success: true, user };
}

export function loginUser({ email, password }) {
  const user = findUserByEmail(email);
  if (!user) {
    return { success: false, errors: ["No account found with that email."] };
  }
  if (user.password !== password) {
    return { success: false, errors: ["Incorrect password."] };
  }

  setSession(user);
  return { success: true, user };
}

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  return safeParse(raw);
}

export function setSession(user) {
  if (!user) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    id: user.id,
    email: user.email,
    name: user.name,
    loggedAt: new Date().toISOString(),
  }));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function isAuthenticated() {
  return Boolean(getSession());
}

export function initAuthNav() {
  const session = getSession();
  const nav = document.querySelector(".nav");
  if (!nav) return;

  const existing = nav.querySelector("[data-auth-status]");
  if (existing) existing.remove();

  const statusWrap = document.createElement("div");
  statusWrap.dataset.authStatus = "";
  statusWrap.className = "auth-status";

  if (session) {
    const nameSpan = document.createElement("span");
    nameSpan.textContent = session.name || session.email;
    nameSpan.className = "auth-name";

    const logout = document.createElement("a");
    logout.href = "#";
    logout.textContent = "Logout";
    logout.className = "auth-link";
    logout.addEventListener("click", (e) => {
      e.preventDefault();
      clearSession();
      window.location.href = "./login.html";
    });

    statusWrap.appendChild(nameSpan);
    statusWrap.appendChild(logout);
  } else {
    const loginLink = document.createElement("a");
    loginLink.href = "./login.html";
    loginLink.textContent = "Login";
    loginLink.className = "auth-link";

    const signupLink = document.createElement("a");
    signupLink.href = "./signup.html";
    signupLink.textContent = "Sign up";
    signupLink.className = "auth-link";

    statusWrap.appendChild(loginLink);
    statusWrap.appendChild(signupLink);
  }

  nav.appendChild(statusWrap);
}

export function initLoginForm() {
  const form = document.querySelector("[data-auth-login-form]");
  if (!form) return;

  const emailInput = form.querySelector("[name='email']");
  const passwordInput = form.querySelector("[name='password']");
  const message = form.querySelector("[data-auth-message]");

  function setMessage(text, isError = true) {
    if (!message) return;
    message.textContent = text || "";
    message.classList.toggle("text-error", isError);
    message.classList.toggle("text-success", !isError);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    setMessage("");

    const res = loginUser({
      email: emailInput.value,
      password: passwordInput.value,
    });

    if (!res.success) {
      setMessage(res.errors[0] || "Login failed.");
      return;
    }

    window.location.href = "./index.html";
  });
}

export function initSignupForm() {
  const form = document.querySelector("[data-auth-signup-form]");
  if (!form) return;

  const nameInput = form.querySelector("[name='name']");
  const emailInput = form.querySelector("[name='email']");
  const passwordInput = form.querySelector("[name='password']");
  const confirmInput = form.querySelector("[name='confirmPassword']");
  const message = form.querySelector("[data-auth-message]");

  function setMessage(text, isError = true) {
    if (!message) return;
    message.textContent = text || "";
    message.classList.toggle("text-error", isError);
    message.classList.toggle("text-success", !isError);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    setMessage("");

    if (passwordInput.value !== confirmInput.value) {
      setMessage("Passwords do not match.");
      return;
    }

    const res = registerUser({
      name: nameInput.value,
      email: emailInput.value,
      password: passwordInput.value,
    });

    if (!res.success) {
      setMessage(res.errors[0] || "Sign up failed.");
      return;
    }

    window.location.href = "./login.html?registered=1";
  });
}
