// Smooth scrolling for navigation links
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        
        // If it's a section link, smooth scroll
        if (href.startsWith('#')) {
            e.preventDefault();
            const targetSection = document.querySelector(href);
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// Account icon hover effect
const accountIcon = document.querySelector('.account-icon');
if (accountIcon) {
    accountIcon.addEventListener('click', function() {
        alert('Account login feature will be implemented in the backend phase with MongoDB integration.');
    });
}
