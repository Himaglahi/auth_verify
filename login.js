import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import { signInWithGoogle, signInWithFacebook, signInWithInstagram } from './oauth.js';
import { SUPABASE_CONFIG } from './config/index.js';

// Initialize Supabase client
const supabase = createClient(
  SUPABASE_CONFIG.SUPABASE_URL,
  SUPABASE_CONFIG.SUPABASE_ANON_KEY,
  SUPABASE_CONFIG.CLIENT_OPTIONS
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

// Show message function with console logging
function showMessage(text, type = 'info') {
  console.log(`Message (${type}):`, text);
  if (!message) return;
  message.textContent = text;
  message.className = `alert ${type} show`;
}

// Show loading state
function setLoading(isLoading) {
  if (!loginButton || !buttonText || !spinner) return;
  loginButton.disabled = isLoading;
  buttonText.textContent = isLoading ? 'Logging in...' : 'Login';
  spinner.style.display = isLoading ? 'block' : 'none';
}

// Password toggle functionality
togglePassword?.addEventListener('click', function(e) {
  e.preventDefault();
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
    return false;
  }

  if (password.length < 6) {
    showMessage('Password must be at least 6 characters', 'warning');
    return false;
  }

  return true;
}

// Form submission handler
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  console.log('Form submitted');

  if (!validateForm()) return;

  setLoading(true);
  console.log('Attempting login with:', { email: emailInput.value.trim() });

  try {
    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailInput.value.trim(),
      password: passwordInput.value.trim()
    });

    console.log('Sign in response:', { data, error });

    if (error) {
      console.error('Login error:', error);
      showMessage(error.message || "Invalid login credentials", "error");
      return;
    }

    if (!data?.user) {
      console.error('No user data received');
      showMessage("Login failed - no user data received", "error");
      return;
    }

    console.log('Login successful, storing session');

    // Store session data in localStorage
    const sessionData = {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: data.user
    };
    localStorage.setItem('auth_session', JSON.stringify(sessionData));

    showMessage("Login successful! Redirecting...", "success");

    // Wait for the session to be properly stored
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get the base URL
    const baseUrl = window.location.pathname.includes('/auth_verify') 
      ? '/auth_verify'
      : '';

    // Redirect to dashboard with full path
    window.location.href = `${baseUrl}/dashboard.html`;

  } catch (err) {
    console.error('Unexpected login error:', err);
    showMessage("An unexpected error occurred. Please try again.", "error");
  } finally {
    setLoading(false);
  }
});

// Social login handlers
document.getElementById('googleLogin')?.addEventListener('click', async () => {
  try {
    const data = await signInWithGoogle();
    if (data) {
      window.location.href = "dashboard.html";
    }
  } catch (error) {
    showMessage(error.message, 'error');
  }
});

document.getElementById('facebookLogin')?.addEventListener('click', async () => {
  try {
    const data = await signInWithFacebook();
    if (data) {
      window.location.href = "dashboard.html";
    }
  } catch (error) {
    showMessage(error.message, 'error');
  }
});

document.getElementById('instagramLogin')?.addEventListener('click', async () => {
  try {
    const data = await signInWithInstagram();
    if (data) {
      window.location.href = "dashboard.html";
    }
  } catch (error) {
    showMessage(error.message, 'error');
  }
});

// Check for existing session on page load
window.addEventListener('DOMContentLoaded', async () => {
  console.log('Checking for existing session...');
  
  try {
    // Check for existing session
    const { data: { session }, error } = await supabase.auth.getSession();
    console.log('Session check result:', { session, error });
    
    if (session?.user) {
      console.log('Found valid session, redirecting to dashboard');
      // Get the base URL
      const baseUrl = window.location.pathname.includes('/auth_verify') 
        ? '/auth_verify'
        : '';
      window.location.href = `${baseUrl}/dashboard.html`;
    }
  } catch (err) {
    console.error('Session check error:', err);
  }
});