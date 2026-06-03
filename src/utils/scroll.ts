type ScrollTarget = { id: string } | { top: number };

// Note: DOM id for a timeline period's row, shared by the grid and its page.
export const timelineRowId = (id: string) => `timeline-row-${id}`;

export const scrollTo = (target: ScrollTarget) => {
  if (typeof document === "undefined") return;

  const run = () => {
    const prefersReducedMotion =
      typeof globalThis !== "undefined" &&
      globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = prefersReducedMotion ? "auto" : "smooth";

    if ("id" in target) {
      const element = document.getElementById(target.id);
      if (!element) return;
      element.scrollIntoView({ behavior, block: "start" });
      return;
    }

    globalThis.scrollTo({ top: target.top, left: 0, behavior });
  };

  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => requestAnimationFrame(run));
    return;
  }

  setTimeout(run, 0);
};
