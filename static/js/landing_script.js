document.addEventListener("DOMContentLoaded", function () {
    const menuToggle = document.getElementById("menu-toggle");
    const menu = document.getElementById("menu");
    const themeToggle = document.getElementById("theme-toggle");

    // Mobile Menu Toggle
    menuToggle.addEventListener("click", function () {
        menu.classList.toggle("hidden");
    });

    // Theme Toggle
    themeToggle.addEventListener("click", function () {
        document.documentElement.classList.toggle("dark");
    });

    // Smooth scrolling for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener("click", function (e) {
            e.preventDefault();
            const targetId = this.getAttribute("href").substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: "smooth" });
            }
        });
    });
});
