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

    const items = document.querySelectorAll(".case-block .container > *");
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
