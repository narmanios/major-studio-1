(async () => {
  const container = document.getElementById("site-header");
  if (!container) return;
  try {
    const res = await fetch("header.html");
    if (!res.ok) throw new Error("header.html not found");
    container.innerHTML = await res.text();
    document.dispatchEvent(new CustomEvent("header:ready"));
  } catch (err) {
    console.error("loadHeader:", err);
  }
})();
