document.addEventListener("DOMContentLoaded", function () {
    const lightDarkElement = document.querySelector(".light-dark");
    const body = document.body;

    const darkMode = localStorage.getItem("darkMode") === "true";

    if (darkMode) {
        body.classList.remove("white-background");
    } else {
        body.classList.add("white-background");
    }

    lightDarkElement.addEventListener("click", function () {
        body.classList.toggle("white-background");

        localStorage.setItem("darkMode",
            body.classList.contains("white-background"));
    });
});