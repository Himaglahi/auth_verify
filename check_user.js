import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  'https://yswgkemxlueyssnxartr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlzd2drZW14bHVleXNzbnhhcnRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNTIwMjIsImV4cCI6MjA2MDcyODAyMn0.BewVaPObxMnFHVNyRn-d1pFOnqCrHYXQ7W5BTysgRPQ'
);

// Function to check user status
async function checkUserStatus(email) {
  console.log('Checking user status for:', email);

  try {
    // Check auth user
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('Auth error:', authError);
      return;
    }

    const authUser = authData.users.find(u => u.email === email);
    console.log('Auth user:', authUser);

    if (!authUser) {
      console.log('User not found in auth system');
      return;
    }

    // Check users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError) {
      console.error('Database error:', userError);
      return;
    }

    console.log('Database user:', userData);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Add to window for console access
window.checkUserStatus = checkUserStatus; 