// Language Switching Functionality

// Initialize language on page load
document.addEventListener('DOMContentLoaded', () => {
    // Get saved language from localStorage, default to 'en'
    const savedLanguage = localStorage.getItem('selectedLanguage') || 'en';
    
    // Set the selector to saved language
    const languageSelector = document.getElementById('languageSelector');
    if (languageSelector) {
        languageSelector.value = savedLanguage;
    }
    
    // Apply the language
    changeLanguage(savedLanguage);
    
    // Add event listener to language selector
    if (languageSelector) {
        languageSelector.addEventListener('change', (e) => {
            changeLanguage(e.target.value);
        });
    }
});

// Main language change function
function changeLanguage(lang) {
    const trans = translations[lang];
    if (!trans) return;
    
    // Save to localStorage
    localStorage.setItem('selectedLanguage', lang);
    
    // Update all elements with data-translate attribute
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (trans[key]) {
            element.textContent = trans[key];
        }
    });

    // Update all elements with data-translate-html for HTML content
    document.querySelectorAll('[data-translate-html]').forEach(element => {
        const key = element.getAttribute('data-translate-html');
        if (trans[key]) {
            element.innerHTML = trans[key];
        }
    });

    // Update placeholder attributes
    document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        if (trans[key]) {
            element.placeholder = trans[key];
        }
    });

    // Update title and aria-label attributes
    document.querySelectorAll('[data-translate-title]').forEach(element => {
        const key = element.getAttribute('data-translate-title');
        if (trans[key]) {
            element.title = trans[key];
        }
    });
}
