import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./button";
import { Input } from "./input";
import { Badge } from "./badge";

describe("UI Primitives", () => {
  describe("Button", () => {
    it("renders with default variant and responds to click", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Click Me</Button>);
      const button = screen.getByRole("button", { name: "Click Me" });

      expect(button).toBeInTheDocument();
      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("renders destructive variant correctly", () => {
      render(<Button variant="destructive">Delete Item</Button>);
      const button = screen.getByRole("button", { name: "Delete Item" });
      expect(button.className).toContain("rose");
    });

    it("does not fire click when disabled", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <Button disabled onClick={handleClick}>
          Disabled Button
        </Button>
      );
      const button = screen.getByRole("button", { name: "Disabled Button" });

      expect(button).toBeDisabled();
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe("Input", () => {
    it("renders input and accepts typed value", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <Input
          placeholder="Enter username"
          onChange={(e) => handleChange(e.target.value)}
        />
      );

      const input = screen.getByPlaceholderText("Enter username");
      await user.type(input, "student123");

      expect(input).toHaveValue("student123");
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe("Badge", () => {
    it("renders badge text with default variant", () => {
      render(<Badge>Active</Badge>);
      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("renders badge with success variant styling", () => {
      render(<Badge variant="success">Passed</Badge>);
      const badge = screen.getByText("Passed");
      expect(badge.className).toContain("emerald");
    });

    it("renders badge with destructive variant styling", () => {
      render(<Badge variant="destructive">Failed</Badge>);
      const badge = screen.getByText("Failed");
      expect(badge.className).toContain("rose");
    });
  });
});
