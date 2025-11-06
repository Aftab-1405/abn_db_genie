// Enable strict mode for better error checking
"use strict";

// Import Firebase SDK (modular v9+)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";

// Firebase configuration (keep sensitive values in environment variables in production)
const firebaseConfig = {
  apiKey: "AIzaSyCzmz7H7OgKXQplbg1UNMuQ2B4QMwU_FT4",
  authDomain: "myproject-5216c.firebaseapp.com",
  projectId: "myproject-5216c",
  storageBucket: "myproject-5216c.appspot.com",
  messagingSenderId: "89584435724",
  appId: "1:89584435724:web:0a5d357fc2c76e554b6429",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Cache DOM elements once
const elements = {
  notification: document.getElementById("notification"),
  loginContainer: document.getElementById("login-container"),
  registerContainer: document.getElementById("register-container"),
  showRegisterBtn: document.getElementById("show-register"),
  showLoginBtn: document.getElementById("show-login"),
  registerForm: document.getElementById("register-form"),
  loginForm: document.getElementById("login-form"),
  registerEmail: document.getElementById("register-email"),
  registerPassword: document.getElementById("register-password"),
  loginEmail: document.getElementById("login-email"),
  loginPassword: document.getElementById("login-password"),
  forgotPasswordLink: document.getElementById("forgot-password"),
  googleLoginBtn: document.getElementById("google-login"),
  googleRegisterBtn: document.getElementById("google-register"),
};

// Utility: Show a temporary notification message
function showNotification(message, duration = 3000) {
  const { notification } = elements;
  notification.textContent = message;
  notification.classList.add("show");

  setTimeout(() => {
    notification.classList.remove("show");
    notification.textContent = "";
  }, duration);
}

// Utility: Toggle between login and registration forms
function toggleForms(showLogin = true) {
  const { loginContainer, registerContainer } = elements;
  loginContainer.classList.toggle("hidden", !showLogin);
  loginContainer.classList.toggle("visible", showLogin);
  registerContainer.classList.toggle("hidden", showLogin);
  registerContainer.classList.toggle("visible", !showLogin);
}

// Utility: Send session data to backend and redirect on success
async function setSession(userEmail) {
  try {
    const response = await fetch("/set_session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: userEmail }),
    });

    const data = await response.json();
    if (data.status === "success") {
      // Delay slightly for UX, then redirect to homepage using replace to prevent back navigation
      setTimeout(() => {
        window.location.replace("/index");
      }, 2000);
    } else {
      showNotification("Failed to set session");
    }
  } catch (error) {
    showNotification(`Error: ${error.message}`);
  }
}

// Handler: Registration with email & password
async function handleRegister(event) {
  event.preventDefault();

  const email = elements.registerEmail.value.trim();
  const password = elements.registerPassword.value.trim();

  if (!email || !password) {
    showNotification("Email and password are required");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    showNotification("Registration successful!");
    await setSession(userCredential.user.email);
  } catch (error) {
    showNotification(`Error: ${error.message}`);
  }
}

// Handler: Login with email & password
async function handleLogin(event) {
  event.preventDefault();

  const email = elements.loginEmail.value.trim();
  const password = elements.loginPassword.value.trim();

  if (!email || !password) {
    showNotification("Email and password are required");
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    showNotification("Login successful!");
    await setSession(userCredential.user.email);
  } catch (error) {
    showNotification(`Error: ${error.message}`);
  }
}

// Handler: Password reset
async function handlePasswordReset(event) {
  event.preventDefault();

  const email = elements.loginEmail.value.trim();
  if (!email) {
    showNotification("Please enter your email address");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    showNotification("Password reset email sent!");
  } catch (error) {
    showNotification(`Error: ${error.message}`);
  }
}

// Handler: Google authentication (both login and registration)
async function handleGoogleAuth(isLogin = true) {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    showNotification(
      `Google ${isLogin ? "login" : "registration"} successful!`
    );
    await setSession(result.user.email);
  } catch (error) {
    showNotification(`Error: ${error.message}`);
  }
}

// Attach event listeners once DOM is ready
function initializeEventListeners() {
  // Toggle between forms
  elements.showRegisterBtn.addEventListener("click", () => toggleForms(false));
  elements.showLoginBtn.addEventListener("click", () => toggleForms(true));

  // Form submissions
  elements.registerForm.addEventListener("submit", handleRegister);
  elements.loginForm.addEventListener("submit", handleLogin);

  // Forgot password
  elements.forgotPasswordLink.addEventListener("click", handlePasswordReset);

  // Google auth buttons
  elements.googleLoginBtn.addEventListener("click", () =>
    handleGoogleAuth(true)
  );
  elements.googleRegisterBtn.addEventListener("click", () =>
    handleGoogleAuth(false)
  );
}

// Initialize everything on script load
(function init() {
  initializeEventListeners();
  // If desired, re-enable auth state check below—but it's commented out per original code:
  // import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
  // onAuthStateChanged(auth, (user) => {
  //   if (user) {
  //     setSession(user.email);
  //   }
  // });
})();
