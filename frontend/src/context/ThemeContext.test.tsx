import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme } from "./ThemeContext";

function ThemeConsumer() {
  const { theme, setTheme, isDark } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <span data-testid="is-dark">{isDark ? "DARK_YES" : "DARK_NO"}</span>
      <button onClick={() => setTheme("dark")}>Set Dark</button>
      <button onClick={() => setTheme("light")}>Set Light</button>
      <button onClick={() => setTheme("system")}>Set System</button>
    </div>
  );
}

describe("ThemeContext", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  it("applies default light theme and updates document root class", () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId("current-theme")).toHaveTextContent("light");
    expect(screen.getByTestId("is-dark")).toHaveTextContent("DARK_NO");
    expect(document.documentElement.classList.contains("light")).toBe(true);
  });

  it("toggles to dark theme and updates localStorage and document root", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeConsumer />
      </ThemeProvider>
    );

    await user.click(screen.getByText("Set Dark"));

    expect(screen.getByTestId("current-theme")).toHaveTextContent("dark");
    expect(screen.getByTestId("is-dark")).toHaveTextContent("DARK_YES");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("sms-ui-theme")).toBe("dark");
  });

  it("reads saved theme from localStorage on initial render", () => {
    localStorage.setItem("sms-ui-theme", "dark");

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId("current-theme")).toHaveTextContent("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("throws error when useTheme is called outside ThemeProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<ThemeConsumer />)).toThrow(
      "useTheme must be used within a ThemeProvider"
    );
    spy.mockRestore();
  });
});
