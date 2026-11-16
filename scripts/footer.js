// Copy-to-clipboard button for the footer email address.
(function () {
    const button = document.querySelector(".site-footer__copy");
    if (!button) return;

    const status = document.querySelector(".site-footer__copy-status");
    const text = button.dataset.copy;
    let resetTimer;

    async function copy(value) {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(value);
            return;
        }
        // Fallback for browsers without the async clipboard API.
        const field = document.createElement("textarea");
        field.value = value;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        document.execCommand("copy");
        field.remove();
    }

    button.addEventListener("click", async function () {
        try {
            await copy(text);
        } catch (error) {
            if (status) status.textContent = "Couldn’t copy";
            return;
        }

        button.classList.add("is-copied");
        button.setAttribute("aria-label", "Email address copied");
        if (status) status.textContent = "Copied";

        clearTimeout(resetTimer);
        resetTimer = setTimeout(function () {
            button.classList.remove("is-copied");
            button.setAttribute("aria-label", "Copy email address");
            if (status) status.textContent = "";
        }, 2000);
    });
})();
