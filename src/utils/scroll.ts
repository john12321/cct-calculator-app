export const scrollToElement = (id: string) => {
  if (typeof document === "undefined") return;

  const run = () => {
    const element = document.getElementById(id);
    if (!element) return;

    const prefersReducedMotion =
      typeof globalThis !== "undefined" &&
      globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;

    element.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start"
    });
  };

  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => requestAnimationFrame(run));
    return;
  }

  setTimeout(run, 0);
};
