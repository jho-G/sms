import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "./AuthContext";
import { api } from "@/services/api";

// Mock the API client
vi.mock("@/services/api", () => ({
  api: {
    isAuthenticated: vi.fn(),
    getCurrentUser: vi.fn(),
    setCurrentUser: vi.fn(),
    clearTokens: vi.fn(),
    getMe: vi.fn(),
    getMyProfile: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  },
}));

function Consumer() {
  const { user, isAuthenticated, role, isDirector, isTeacher, login, logout } = useAuth();

  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? "AUTH_YES" : "AUTH_NO"}</div>
      <div data-testid="user-role">{role || "NO_ROLE"}</div>
      <div data-testid="is-director">{isDirector ? "DIRECTOR_YES" : "DIRECTOR_NO"}</div>
      <div data-testid="is-teacher">{isTeacher ? "TEACHER_YES" : "TEACHER_NO"}</div>
      <div data-testid="user-name">{user?.first_name || "NO_USER"}</div>
      <button
        onClick={() =>
          login({ email: "director@sms.com", password: "director123" })
        }
      >
        Sign In
      </button>
      <button onClick={() => logout()}>Sign Out</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.isAuthenticated).mockReturnValue(false);
    vi.mocked(api.getCurrentUser).mockReturnValue(null);
  });

  it("initializes with unauthenticated state when no tokens exist", async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent("AUTH_NO");
      expect(screen.getByTestId("user-role")).toHaveTextContent("NO_ROLE");
    });
  });

  it("initializes with user data when active session is present", async () => {
    const mockUser = {
      id: "u-1",
      email: "director@sms.com",
      username: "director",
      first_name: "Dana",
      last_name: "Director",
      role: "DIRECTOR" as const,
      is_active: true,
      is_email_verified: true,
      date_joined: "2026-01-01",
    };

    vi.mocked(api.isAuthenticated).mockReturnValue(true);
    vi.mocked(api.getCurrentUser).mockReturnValue(mockUser);
    vi.mocked(api.getMe).mockResolvedValue({ success: true, data: mockUser });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent("AUTH_YES");
      expect(screen.getByTestId("user-role")).toHaveTextContent("DIRECTOR");
      expect(screen.getByTestId("is-director")).toHaveTextContent("DIRECTOR_YES");
      expect(screen.getByTestId("is-teacher")).toHaveTextContent("TEACHER_NO");
      expect(screen.getByTestId("user-name")).toHaveTextContent("Dana");
    });
  });

  it("handles login flow and updates authentication state", async () => {
    const user = userEvent.setup();
    const mockUser = {
      id: "u-2",
      email: "teacher@sms.com",
      username: "teacher",
      first_name: "Tariq",
      last_name: "Teacher",
      role: "TEACHER" as const,
      is_active: true,
      is_email_verified: true,
      date_joined: "2026-01-01",
    };

    vi.mocked(api.login).mockResolvedValue({
      success: true,
      data: {
        user: mockUser,
        tokens: { access: "acc-token", refresh: "ref-token" },
      },
    });
    vi.mocked(api.isAuthenticated).mockReturnValue(true);
    vi.mocked(api.getMe).mockResolvedValue({ success: true, data: mockUser });
    vi.mocked(api.getMyProfile).mockResolvedValue({
      success: true,
      data: { profile_id: "p-teacher-1" },
    });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await user.click(screen.getByText("Sign In"));

    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent("AUTH_YES");
      expect(screen.getByTestId("user-role")).toHaveTextContent("TEACHER");
      expect(screen.getByTestId("is-teacher")).toHaveTextContent("TEACHER_YES");
    });
  });

  it("handles logout and clears user state", async () => {
    const user = userEvent.setup();
    vi.mocked(api.logout).mockResolvedValue({ success: true });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await user.click(screen.getByText("Sign Out"));

    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent("AUTH_NO");
      expect(screen.getByTestId("user-name")).toHaveTextContent("NO_USER");
    });
    expect(api.logout).toHaveBeenCalled();
  });
});
