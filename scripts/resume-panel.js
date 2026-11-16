// Keeps the page still when the resume panel collapses.
//
// Collapsing removes a lot of height. When the reader is near the bottom of
// the page, the browser has to clamp the scroll position to the new, shorter
// page, which makes everything jump. To avoid that, we temporarily extend
// the footer to hold the current scroll position, then shrink it back as the
// reader scrolls up.
(function () {
    const panel = document.querySelector(".resume-panel");
    if (!panel) return;

    const summary = panel.querySelector("summary");
    const root = document.documentElement;
    let spacer = 0;

    function setSpacer(px) {
        spacer = Math.max(0, Math.round(px));
        // Added to the footer's bottom padding, so the space reads as more footer.
        root.style.setProperty("--page-spacer", spacer + "px");
    }

    // How much extra height is needed to keep the current scroll position.
    function shortfall(scrollTop) {
        const naturalHeight = root.scrollHeight - spacer;
        return scrollTop + window.innerHeight - naturalHeight;
    }

    summary.addEventListener("click", function (event) {
        if (!panel.open) {
            // Opening only makes the page taller, so no spacer is needed.
            setSpacer(0);
            return;
        }

        // Collapse ourselves so we can hold the scroll position in the same frame.
        event.preventDefault();
        const scrollTop = window.scrollY;
        panel.open = false;
        setSpacer(0);
        setSpacer(shortfall(scrollTop));
        // "instant" overrides the site's smooth scrolling for this correction.
        window.scrollTo({ top: scrollTop, behavior: "instant" });
    });

    function shrinkSpacer() {
        if (!spacer) return;
        setSpacer(Math.min(spacer, shortfall(window.scrollY)));
    }

    window.addEventListener("scroll", shrinkSpacer, { passive: true });
    window.addEventListener("resize", shrinkSpacer);
})();
