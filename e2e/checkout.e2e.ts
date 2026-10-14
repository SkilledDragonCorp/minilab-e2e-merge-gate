import { test } from "@e2e-dev/web";
import { expect } from "e2e";

test("login, add to cart, confirm order", async ({ app, screen, browser }) => {
  await app.open("/");
  await screen.getByLabel("Email").fill("shopper@skilleddragon.test");
  await screen.getByLabel("Password").fill("dragon-pass-1");
  await screen.getByRole("button", "Sign in").click();
  await expect(screen.getByRole("status", "Checkout status")).toContainText("Signed in");

  await screen.getByRole("button", "Add to cart").click();
  await expect(screen.getByRole("status", "Cart")).toContainText("Cart: 1 item");

  await screen.getByRole("button", "Confirm order").click();
  await expect(screen.getByRole("status", "Checkout status")).toContainText("Order confirmed");
  await expect(browser).toHaveURL("/");
});
