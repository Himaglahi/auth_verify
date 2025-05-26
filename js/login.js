import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import { SUPABASE_CONFIG } from './config/index.js';

// Initialize Supabase client
const supabase = createClient(
  SUPABASE_CONFIG.SUPABASE_URL,
  SUPABASE_CONFIG.SUPABASE_ANON_KEY,
  {
    ...SUPABASE_CONFIG.CLIENT_OPTIONS,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
);

// DOM Elements
const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const message = document.getElementById("message");
const loginButton = document.getElementById("loginButton");
const togglePassword = document.getElementById("togglePassword");
const buttonText = loginButton?.querySelector('.button-text');
const spinner = loginButton?.querySelector('.spinner');

// Show message function
function showMessage(text, type = 'info') {
  console.log(`Message (${type}):`, text);
  if (!message) return;
  
  message.textContent = text;
  message.className = `alert ${type} show`;
  
  // Auto-hide success messages after 3 seconds
  if (type === 'success') {
    setTimeout(() => {
      message.className = 'alert';
    }, 3000);
  }
}

// Show loading state
function setLoading(isLoading) {
  if (!loginButton || !buttonText || !spinner) return;
  
  loginButton.disabled = isLoading;
  buttonText.textContent = isLoading ? 'Logging in...' : 'Login';
  spinner.style.display = isLoading ? 'block' : 'none';
  
  // Disable inputs while loading
  emailInput.disabled = isLoading;
  passwordInput.disabled = isLoading;
  togglePassword.disabled = isLoading;
}

// Password toggle functionality
togglePassword?.addEventListener('click', function(e) {
  e.preventDefault();
  e.stopPropagation();
  
  const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
  passwordInput.setAttribute('type', type);
  
  const eyeIcon = togglePassword.querySelector('i');
  if (eyeIcon) {
    eyeIcon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
  }
});

// Form validation
function validateForm() {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    showMessage('Please fill in all fields', 'warning');
    return false;
  }

  if (!email.includes('@')) {
    showMessage('Please enter a valid email address', 'warning');
    emailInput.focus();
    return false;
  }

  if (password.length < 6) {
    showMessage('Password must be at least 6 characters', 'warning');
    passwordInput.focus();
    return false;
  }

  return true;
}

// Handle redirect after successful login
function handleSuccessfulLogin(session) {
  showMessage("Login successful! Redirecting...", "success");
  
  // Store session data
  try {
    localStorage.setItem('auth_session', JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      user: session.user
    }));
  } catch (err) {
    console.error('Error storing session:', err);
  }

  // Get the base URL
  const baseUrl = window.location.pathname.includes('/auth_verify') 
    ? '/auth_verify'
    : '';

  // Redirect after a short delay to show the success message
  setTimeout(() => {
    window.location.href = `${baseUrl}/dashboard.html`;
  }, 1000);
}

// Form submission handler
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  // Clear any existing messages
  message.className = 'alert';

  if (!validateForm()) return;

  setLoading(true);

  try {
    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailInput.value.trim(),
      password: passwordInput.value.trim()
    });

    if (error) {
      console.error('Login error:', error);
      showMessage(error.message || "Invalid login credentials", "error");
      return;
    }

    if (!data?.session) {
      console.error('No session data received');
      showMessage("Login failed - no session data received", "error");
      return;
    }

    handleSuccessfulLogin(data.session);

  } catch (err) {
    console.error('Unexpected login error:', err);
    showMessage("An unexpected error occurred. Please try again.", "error");
  } finally {
    setLoading(false);
  }
});

// Check for existing session on page load
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      handleSuccessfulLogin(session);
    }
  } catch (err) {
    console.error('Session check error:', err);
  }
});

// Handle Enter key in password field
passwordInput?.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    loginButton.click();
  }
});

// Prevent form submission when pressing Enter in email field
emailInput?.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    passwordInput.focus();
  }
});

// Clear error messages when user starts typing
emailInput?.addEventListener('input', () => {
  message.className = 'alert';
});

passwordInput?.addEventListener('input', () => {
  message.className = 'alert';
}); 