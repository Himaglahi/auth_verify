import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import { SUPABASE_CONFIG } from './config.js';
import { offlineStorage } from './offlineStorage.js';

// Initialize Supabase client
const supabase = createClient(
  "https://yswgkemxlueyssnxartr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlzd2drZW14bHVleXNzbnhhcnRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNTIwMjIsImV4cCI6MjA2MDcyODAyMn0.BewVaPObxMnFHVNyRn-d1pFOnqCrHYXQ7W5BTysgRPQ"
);

// Security Configuration
const SECURITY_CONFIG = {
  minPasswordLength: 8,
  maxPasswordLength: 128,
  maxRegistrationAttempts: 5,
  registrationCooldown: 15 * 60 * 1000, // 15 minutes in milliseconds
  passwordStrengthLevels: {
    weak: 30,
    medium: 60,
    strong: 80
  }
};

// Initialize security state
let registrationAttempts = parseInt(localStorage.getItem('registrationAttempts') || '0');
let lastRegistrationAttempt = parseInt(localStorage.getItem('lastRegistrationAttempt') || '0');

// DOM Elements
const form = document.querySelector('form');
const messageDiv = document.getElementById("message");
const passwordInput = document.getElementById("password");
const strengthBar = document.getElementById("strengthBar");
const strengthText = document.getElementById("strengthText");
const registerButton = document.getElementById("registerButton");
const togglePassword = document.getElementById("togglePassword");
const emailInput = document.getElementById("email");
const nameInput = document.getElementById("name");
const offlineIndicator = document.createElement('div');

// Add offline mode indicator
offlineIndicator.id = 'offline-mode';
offlineIndicator.style.position = 'fixed';
offlineIndicator.style.top = '10px';
offlineIndicator.style.right = '10px';
offlineIndicator.style.padding = '5px 10px';
offlineIndicator.style.borderRadius = '5px';
offlineIndicator.style.backgroundColor = '#ff9900';
offlineIndicator.style.color = 'white';
offlineIndicator.style.display = 'none';
offlineIndicator.textContent = '📴 Offline Mode';
document.body.appendChild(offlineIndicator);

// Password requirements
const requirements = {
  length: { regex: /.{8,}/, element: document.getElementById('length') },
  uppercase: { regex: /[A-Z]/, element: document.getElementById('uppercase') },
  lowercase: { regex: /[a-z]/, element: document.getElementById('lowercase') },
  number: { regex: /[0-9]/, element: document.getElementById('number') },
  special: { regex: /[^A-Za-z0-9]/, element: document.getElementById('special') }
};

// Show message function
function showMessage(text, type = 'info') {
  messageDiv.textContent = text;
  messageDiv.className = `alert ${type}`;
  messageDiv.style.display = 'block';
}

// Handle online/offline status
window.addEventListener('online', () => {
  offlineIndicator.style.display = 'none';
  showMessage('Connection restored. Online mode activated.', 'success');
  syncOfflineData();
});

window.addEventListener('offline', () => {
  offlineIndicator.style.display = 'block';
  showMessage('Working in offline mode. Changes will sync when online.', 'warning');
});

// Sync offline data when connection is restored
async function syncOfflineData() {
  const pendingSync = offlineStorage.getPendingSync();
  if (pendingSync.length === 0) return;

  showMessage('Syncing offline data...', 'info');

  for (const item of pendingSync) {
    try {
      if (item.operation === 'create') {
        const { error } = await supabase.auth.signUp({
          email: item.data.email,
          password: item.data.password,
          options: {
            data: {
              name: item.data.name,
              registration_date: item.data.created_at
            }
          }
        });

        if (!error) {
          // Remove from pending sync after successful sync
          offlineStorage.clearPendingSync();
        }
      }
    } catch (err) {
      console.error('Sync error:', err);
    }
  }

  showMessage('Offline data synced successfully!', 'success');
}

// Check if email already exists
async function checkEmailExists(email) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    return !!data;
  } catch (err) {
    console.error('Email check error:', err);
    return false;
  }
}

// Check password strength
function checkPasswordStrength(password) {
  let score = 0;
  let metRequirements = 0;

  // Check each requirement
  Object.entries(requirements).forEach(([key, { regex, element }]) => {
    const isValid = regex.test(password);
    element.classList.toggle('met', isValid);
    element.querySelector('i').className = `fas fa-${isValid ? 'check' : 'circle'}`;
    if (isValid) metRequirements++;
  });

  // Calculate score based on requirements met
  score = (metRequirements / Object.keys(requirements).length) * 100;

  // Update UI
  strengthBar.style.width = `${score}%`;
  strengthBar.className = score < 40 ? 'weak' :
                         score < 80 ? 'medium' : 'strong';
  
  strengthText.textContent = `Password strength: ${
    score < 40 ? 'Weak' :
    score < 80 ? 'Medium' : 'Strong'
  }`;

  return score;
}

// Password visibility toggle
togglePassword?.addEventListener("click", () => {
  const type = passwordInput.type === "password" ? "text" : "password";
  passwordInput.type = type;
  togglePassword.classList.toggle("fa-eye");
  togglePassword.classList.toggle("fa-eye-slash");
});

// Email input validation
emailInput?.addEventListener('input', async () => {
  const email = emailInput.value.trim();
  if (email && email.includes('@')) {
    const exists = await checkEmailExists(email);
    if (exists) {
      showMessage('This email is already registered. Please login instead.', 'warning');
      registerButton.disabled = true;
    } else {
      messageDiv.style.display = 'none';
      registerButton.disabled = false;
    }
  }
});

// Password input monitoring
passwordInput?.addEventListener('input', () => {
  const score = checkPasswordStrength(passwordInput.value);
  if (score < 40) {
    registerButton.disabled = true;
    showMessage('Please choose a stronger password', 'warning');
  } else {
    registerButton.disabled = false;
    messageDiv.style.display = 'none';
  }
});

// Form submission handler
form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  messageDiv.style.display = 'none';

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const termsAccepted = document.getElementById("termsCheckbox").checked;

  // Validation
  if (!name || !email || !password) {
    showMessage("Please fill in all fields.", "warning");
    return;
  }

  if (!termsAccepted) {
    showMessage("Please accept the Terms of Service.", "warning");
    return;
  }

  if (!/^[a-zA-Z\s]*$/.test(name)) {
    showMessage("Name should only contain letters and spaces", "warning");
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showMessage("Please enter a valid email address", "warning");
    return;
  }

  const passwordScore = checkPasswordStrength(password);
  if (passwordScore < 40) {
    showMessage("Please choose a stronger password.", "warning");
    return;
  }

  // Check if email already exists
  const emailExists = await checkEmailExists(email);
  if (emailExists) {
    showMessage("This email is already registered. Please login instead.", "warning");
    return;
  }

  registerButton.disabled = true;
  registerButton.textContent = 'Creating Account...';

  try {
    // Register user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          registration_date: new Date().toISOString()
        }
      }
    });

    if (error) throw error;

    // The users table will be automatically populated by the trigger we created
    // We just need to show the success message and redirect

    showMessage("Registration successful! Please check your email to verify your account.", "success");
    
    // Clear form
    form.reset();
    strengthBar.style.width = '0%';
    strengthText.textContent = 'Password strength: Too weak';
    Object.values(requirements).forEach(({ element }) => {
      element.classList.remove('met');
      element.querySelector('i').className = 'fas fa-circle';
    });

    // Redirect to login after delay
    setTimeout(() => {
      window.location.href = "login.html";
    }, 3000);

  } catch (err) {
    console.error('Registration error:', err);
    showMessage(err.message || "Registration failed. Please try again.", "error");
  } finally {
    registerButton.disabled = false;
    registerButton.textContent = 'Create Account';
  }
});

// Check initial online/offline status
if (!navigator.onLine) {
  offlineIndicator.style.display = 'block';
  showMessage('Working in offline mode. Changes will sync when online.', 'warning');
}