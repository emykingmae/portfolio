// Unlocks a password-protected case study.
//
// Only used on the published site, where tools/build.mjs has replaced each
// case study's content with an encrypted copy and a password form. The right
// password decrypts the content in the visitor's browser; nothing is sent
// anywhere. Once unlocked, the browser remembers, so the other case studies
// open without asking again.
(function () {
    const gate = document.getElementById("locked");
    if (!gate) return;

    // These must match tools/build.mjs.
    const SALT = "54bb079c10d0196202accdba7120ab32";
    const ITERATIONS = 600000;
    const STORAGE_KEY = "case-study-key";

    const root = document.documentElement;
    const form = document.getElementById("unlock-form");
    const input = document.getElementById("unlock-password");
    const button = form.querySelector(".locked__button");
    const errorText = document.getElementById("unlock-error");

    function showError(message) {
        root.classList.remove("has-key");
        errorText.textContent = message;
        input.setAttribute("aria-invalid", "true");
        button.disabled = false;
        button.textContent = "Unlock";
        input.focus();
        input.select();
    }

    if (!window.crypto || !window.crypto.subtle) {
        root.classList.remove("has-key");
        errorText.textContent = "This browser can’t unlock the page. Try a current version of Chrome, Safari, Firefox or Edge.";
        button.disabled = true;
        return;
    }

    function fromHex(hex) {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
        return bytes;
    }

    function fromBase64(text) {
        const binary = atob(text);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
    }

    function toBase64(bytes) {
        let binary = "";
        bytes.forEach(function (byte) { binary += String.fromCharCode(byte); });
        return btoa(binary);
    }

    function importKey(raw) {
        return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["decrypt"]);
    }

    async function keyBytesFromPassword(password) {
        const material = await crypto.subtle.importKey(
            "raw", new TextEncoder().encode(password.normalize("NFKC")), "PBKDF2", false, ["deriveBits"]
        );
        const bits = await crypto.subtle.deriveBits(
            { name: "PBKDF2", hash: "SHA-256", salt: fromHex(SALT), iterations: ITERATIONS }, material, 256
        );
        return new Uint8Array(bits);
    }

    // Each encrypted item is a 12-byte nonce followed by the encrypted data.
    function decrypt(key, bytes) {
        return crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes.slice(0, 12) }, key, bytes.slice(12));
    }

    function remembered() {
        try { return localStorage.getItem(STORAGE_KEY); } catch (error) { return null; }
    }

    function remember(value) {
        try {
            if (value) localStorage.setItem(STORAGE_KEY, value);
            else localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            // Storage blocked (e.g. private mode): the visitor is just asked again next time.
        }
    }

    // Images and video are fetched and decrypted as they come near the screen.
    function loadMedia(key, element) {
        ["src", "poster"].forEach(async function (attribute) {
            const value = element.getAttribute("data-locked-" + attribute);
            if (!value) return;
            element.removeAttribute("data-locked-" + attribute);
            const parts = value.split("|");
            try {
                const response = await fetch(parts[0]);
                if (!response.ok) throw new Error("HTTP " + response.status);
                const data = await decrypt(key, new Uint8Array(await response.arrayBuffer()));
                element.setAttribute(attribute, URL.createObjectURL(new Blob([data], { type: parts[1] })));
            } catch (error) {
                console.error("Couldn’t load protected media", parts[0], error);
            }
        });
    }

    function startMedia(key, main) {
        const media = main.querySelectorAll("[data-locked-src], [data-locked-poster]");
        if (!("IntersectionObserver" in window)) {
            media.forEach(function (element) { loadMedia(key, element); });
            return;
        }
        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                observer.unobserve(entry.target);
                loadMedia(key, entry.target);
            });
        }, { rootMargin: "800px 0px" });
        media.forEach(function (element) { observer.observe(element); });
    }

    // Returns true if the key opened the page.
    async function open(keyBytes) {
        let content;
        let key;
        try {
            key = await importKey(keyBytes);
            const plain = await decrypt(key, fromBase64(gate.getAttribute("data-payload")));
            content = JSON.parse(new TextDecoder().decode(plain));
        } catch (error) {
            return false;
        }

        const main = document.createElement("main");
        main.innerHTML = content.html;
        gate.replaceWith(main);
        root.classList.remove("has-key");
        window.scrollTo(0, 0);

        const description = document.querySelector('meta[name="description"]');
        if (description && content.description) description.setAttribute("content", content.description);

        startMedia(key, main);

        // The scroll reveal has to start after the content exists.
        const reveal = document.createElement("script");
        reveal.src = "../scripts/reveal.js";
        document.body.appendChild(reveal);
        return true;
    }

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        const password = input.value;
        if (!password) {
            showError("Enter the password to continue.");
            return;
        }

        errorText.textContent = "";
        input.removeAttribute("aria-invalid");
        button.disabled = true;
        button.textContent = "Unlocking…";

        let keyBytes;
        try {
            keyBytes = await keyBytesFromPassword(password);
        } catch (error) {
            showError("Something went wrong unlocking the page. Reload and try again.");
            return;
        }

        if (await open(keyBytes)) remember(toBase64(keyBytes));
        else showError("That password isn’t right. Check it and try again.");
    });

    // Already unlocked on an earlier visit: open straight away.
    (async function () {
        const saved = remembered();
        if (!saved) return;
        let opened = false;
        try { opened = await open(fromBase64(saved)); } catch (error) { opened = false; }
        if (!opened) {
            // The password has changed since this visitor last unlocked.
            remember(null);
            root.classList.remove("has-key");
        }
    })();
})();
