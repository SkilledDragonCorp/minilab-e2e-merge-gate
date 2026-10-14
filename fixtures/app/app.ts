(() => {
  const loginSection = document.getElementById("login");
  const shopSection = document.getElementById("shop");
  const statusEl = document.getElementById("status");
  const cartEl = document.getElementById("cart");
  const loginBtn = document.getElementById("login-btn");
  const addBtn = document.getElementById("add-btn");
  const confirmBtn = document.getElementById("confirm-btn");
  const emailInput = document.getElementById("email") as HTMLInputElement | null;
  const passwordInput = document.getElementById("password") as HTMLInputElement | null;

  let cartCount = 0;

  function setStatus(text: string) {
    if (statusEl) statusEl.textContent = text;
  }

  loginBtn?.addEventListener("click", () => {
    const email = emailInput?.value.trim() ?? "";
    const password = passwordInput?.value ?? "";
    if (!email || !password) {
      setStatus("Enter email and password");
      return;
    }
    loginSection?.classList.add("hidden");
    shopSection?.classList.remove("hidden");
    setStatus("Signed in");
  });

  addBtn?.addEventListener("click", () => {
    cartCount += 1;
    if (cartEl) cartEl.textContent = `Cart: ${cartCount} item${cartCount === 1 ? "" : "s"}`;
    setStatus("Item added");
  });

  confirmBtn?.addEventListener("click", () => {
    if (cartCount < 1) {
      setStatus("Cart is empty");
      return;
    }
    setStatus("Order confirmed");
  });
})();
