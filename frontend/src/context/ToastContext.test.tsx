import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitForElementToBeRemoved } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider, useToast } from "./ToastContext";

function TestConsumer() {
  const { success, error, info, warning } = useToast();
  return (
    <div>
      <button onClick={() => success("Operation succeeded", "Done")}>
        Trigger Success
      </button>
      <button onClick={() => error("Operation failed", "Failed")}>
        Trigger Error
      </button>
      <button onClick={() => info("Informational note", "FYI")}>
        Trigger Info
      </button>
      <button onClick={() => warning("Check this alert", "Alert")}>
        Trigger Warning
      </button>
    </div>
  );
}

describe("ToastContext", () => {
  it("renders toast when success is called", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    await user.click(screen.getByText("Trigger Success"));
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("Operation succeeded")).toBeInTheDocument();
  });

  it("renders toast when error is called", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    await user.click(screen.getByText("Trigger Error"));
    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.getByText("Operation failed")).toBeInTheDocument();
  });

  it("dismisses toast when close button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    await user.click(screen.getByText("Trigger Info"));
    expect(screen.getByText("FYI")).toBeInTheDocument();

    const closeBtn = screen.getByLabelText("Dismiss notification");
    await user.click(closeBtn);

    await waitForElementToBeRemoved(() => screen.queryByText("FYI"));
    expect(screen.queryByText("FYI")).not.toBeInTheDocument();
  });

  it("throws error when useToast is used outside of ToastProvider", () => {
    // Suppress expected console.error during throw test
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow(
      "useToast must be used within a ToastProvider"
    );
    spy.mockRestore();
  });
});
