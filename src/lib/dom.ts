export async function waitForAndScroll(
  selector: string,
  { timeout = 2000, interval = 100 } = {}
): Promise<boolean> {
  const start = Date.now();

  const tryScroll = () => {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      try {
        window.history.replaceState(null, "", selector);
      } catch (e) {
        void e;
        window.location.hash = selector;
      }
      return true;
    }
    return false;
  };

  if (tryScroll()) return true;

  return new Promise<boolean>((resolve) => {
    const id = setInterval(() => {
      if (tryScroll() || Date.now() - start >= timeout) {
        clearInterval(id);
        resolve(false);
      }
    }, interval);
  });
}
