import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DemoAccountsCard } from "./DemoAccountsCard";
import { ToastProvider } from "@/context/ToastContext";

// Mock AuthContext
const mockLogin = vi.fn().mockResolvedValue({ success: true });
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

describe("DemoAccountsCard", () => {
  it("renders all four role demo account options", () => {
    render(
      <ToastProvider>
        <DemoAccountsCard />
      </ToastProvider>
    );

    expect(screen.getByText("School Director")).toBeInTheDocument();
    expect(screen.getByText("Teacher")).toBeInTheDocument();
    expect(screen.getByText("Student")).toBeInTheDocument();
    expect(screen.getByText("Parent / Guardian")).toBeInTheDocument();
  });

  it("triggers login with director credentials when director card is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <DemoAccountsCard />
      </ToastProvider>
    );

    const directorCard = screen.getByText("School Director").closest("button");
    expect(directorCard).toBeInTheDocument();
    await user.click(directorCard!);

    expect(mockLogin).toHaveBeenCalledWith({
      email: "director@sms.com",
      password: "director123",
    });
  });

  it("triggers login with teacher credentials when teacher card is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <DemoAccountsCard />
      </ToastProvider>
    );

    const teacherCard = screen.getByText("Teacher").closest("button");
    expect(teacherCard).toBeInTheDocument();
    await user.click(teacherCard!);

    expect(mockLogin).toHaveBeenCalledWith({
      email: "teacher@sms.com",
      password: "teacher123",
    });
  });
});
