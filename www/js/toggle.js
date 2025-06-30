// Wait for DOM to be ready
window.onload = function () {
    // Get references to DOM elements
    var lightDarkElement = document.querySelector(".light-dark");
    var body = document.body;

    // Helper function to safely use localStorage
    function getPreference() {
        try {
            return window.localStorage && window.localStorage.getItem("darkMode") === "true";
        } catch (e) {
            return false;
        }
    }

    function savePreference(isDark) {
        try {
            if (window.localStorage) {
                window.localStorage.setItem("darkMode", isDark);
            }
        } catch (e) {
            // Ignore storage errors
        }
    }

    // Apply saved preference if available
    if (getPreference()) {
        body.classList.add("dark-mode");
    }

    // Toggle dark mode on click
    if (lightDarkElement) {
        lightDarkElement.addEventListener("click", function () {
            // Toggle class
            body.classList.toggle("dark-mode");

            // Save preference
            savePreference(body.classList.contains("dark-mode"));
        });
    }
};