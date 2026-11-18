// Gentle scroll reveal for case study content.
//
// Each heading, paragraph and image in a .case-block fades in and slides up
// a few pixels the first time it scrolls into view. Skipped entirely for
// visitors who prefer reduced motion or whose browser lacks IntersectionObserver,
// so content is always visible for them.
// For visitors who prefer reduced motion, autoplaying videos start paused
// with controls, so they can choose to play them.
(function () {
    if (!window.matchMedia || !window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.querySelectorAll("video[autoplay]").forEach(function (video) {
        video.removeAttribute("autoplay");
        video.pause();
        video.controls = true;
    });
})();

(function () {
    const prefersReduced =
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !("IntersectionObserver" in window)) return;

    // Quote bubbles have their own animation (below), so their figure isn't faded as a whole.
    const items = document.querySelectorAll(".case-block .container > :not(.case-quotes)");
    if (!items.length) return;

    items.forEach(function (item) {
        item.classList.add("reveal");
    });
    document.documentElement.classList.add("reveal-ready");

    const observer = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        },
        // Trigger slightly before the item is fully on screen.
        { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
    );

    items.forEach(function (item) {
        observer.observe(item);
    });
})();

// Speech bubble quotes: each bubble pops in from its own side as it scrolls
// into view. Bubbles that arrive together are staggered so they read like
// people speaking one after another.
(function () {
    const prefersReduced =
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !("IntersectionObserver" in window)) return;

    const bubbles = document.querySelectorAll(".case-quotes__item");
    if (!bubbles.length) return;

    document.documentElement.classList.add("quotes-ready");

    // Each bubble waits its turn: it starts at least GAP after the previous
    // one, even when the browser reports them in separate batches.
    const GAP = 180; // ms
    let nextStart = 0;

    const observer = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                const now = performance.now();
                const start = Math.max(now, nextStart);
                nextStart = start + GAP;
                entry.target.style.setProperty("--delay", (start - now) / 1000 + "s");
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        },
        { rootMargin: "0px 0px -12% 0px", threshold: 0.6 }
    );

    bubbles.forEach(function (bubble) {
        observer.observe(bubble);
    });
})();
