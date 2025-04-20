import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://yswgkemxlueyssnxartr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlzd2drZW14bHVleXNzbnhhcnRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNTIwMjIsImV4cCI6MjA2MDcyODAyMn0.BewVaPObxMnFHVNyRn-d1pFOnqCrHYXQ7W5BTysgRPQ"
);

window.register = async function (e) {
  e.preventDefault();
  
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const messageDiv = document.getElementById("message");
  messageDiv.textContent = "";
  messageDiv.style.color = "red"; // default color for errors

  // Basic validation
  if (!name || !email || !password) {
    messageDiv.textContent = "Please fill in all fields.";
    return;
  }

  try {
    // Register user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: window.location.origin + "/verify.html" // optional redirect for email verification
      },
    });

    if (error) {
      messageDiv.textContent = error.message;
      return;
    }

    // Insert user data into 'users' table
    const { error: dbError } = await supabase
      .from('users')
      .insert([
        { auth_user_id: data.user.id, email, name }
      ]);

    if (dbError) {
      messageDiv.textContent = `Error storing user details: ${dbError.message}`;
      return;
    }

    // Success message
    messageDiv.style.color = "green";
    messageDiv.textContent = "Registered successfully! Please check your email to verify.";
  } catch (err) {
    messageDiv.textContent = "Something went wrong.";
    console.error(err);
  }
};