document.addEventListener("DOMContentLoaded", function () {
    const lightDarkElement = document.querySelector(".light-dark");
    const body = document.body;

    const isLightMode = localStorage.getItem("isLightMode") === "true";

    if (isLightMode) {
        body.classList.add("white-background");
    } else {
        body.classList.remove("white-background");
    }

    lightDarkElement.addEventListener("click", function () {
        body.classList.toggle("white-background");

        localStorage.setItem("isLightMode",
            body.classList.contains("white-background"));
    });
});