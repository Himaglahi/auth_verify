const fetch = require('node-fetch');
const express = require('express');
const app = express();

app.use(express.json()); // This will parse JSON in request bodies

app.post('/verify-recaptcha', async (req, res) => {
  const { recaptchaResponse } = req.body;
  const secretKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlzd2drZW14bHVleXNzbnhhcnRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNTIwMjIsImV4cCI6MjA2MDcyODAyMn0.BewVaPObxMnFHVNyRn-d1pFOnqCrHYXQ7W5BTysgRPQ'; // Your reCAPTCHA secret key

  // Send request to Google reCAPTCHA API to verify the response
  const response = await fetch(
    `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaResponse}`,
    { method: 'POST' }
  );
  
  const result = await response.json();
  
  // Check if the reCAPTCHA validation succeeded
  if (result.success) {
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'reCAPTCHA validation failed.' });
  }
});

// Start the server on port 3000
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});