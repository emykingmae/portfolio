// Light / dark mode.
//
// Loaded in <head> (not deferred) so the saved theme is applied before the
// page paints, which avoids a flash of the wrong theme. With no saved choice,
// it follows the visitor's system setting.
(function () {
    const root = document.documentElement;
    const STORAGE_KEY = "theme";

    function savedTheme() {
        try {
            return localStorage.getItem(STORAGE_KEY);
        } catch (error) {
            return null;
        }
    }

    function systemTheme() {
        return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    }

    function apply(theme) {
        root.setAttribute("data-theme", theme);
        document.querySelectorAll(".theme-toggle").forEach(function (button) {
            button.setAttribute(
                "aria-label",
                theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            );
        });
    }

    apply(savedTheme() || systemTheme());

    document.addEventListener("DOMContentLoaded", function () {
        apply(root.getAttribute("data-theme"));

        document.querySelectorAll(".theme-toggle").forEach(function (button) {
            button.addEventListener("click", function () {
                const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
                apply(next);
                try {
                    localStorage.setItem(STORAGE_KEY, next);
                } catch (error) {
                    // Storage blocked (e.g. private mode): the toggle still works for this page.
                }
            });
        });
    });

    // Follow system changes until the visitor picks a theme themselves.
    if (window.matchMedia) {
        window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (event) {
            if (!savedTheme()) apply(event.matches ? "dark" : "light");
        });
    }
})();
