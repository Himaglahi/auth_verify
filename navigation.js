// Handle navigation between pages
function navigateTo(path) {
    // Store current page in session storage for back navigation
    sessionStorage.setItem('previousPage', window.location.pathname);
    
    // Navigate to the new page
    window.location.href = path;
}

// Add click handlers to all navigation links
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const path = this.getAttribute('href');
            navigateTo(path);
        });
    });
});

// Handle mobile menu toggle
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('hidden');
    sidebar.classList.toggle('fixed');
    sidebar.classList.toggle('inset-0');
    sidebar.classList.toggle('z-50');
} 