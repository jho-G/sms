import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";

interface RegisterViewProps {
  onSwitchToLogin: () => void;
}

export function RegisterView({ onSwitchToLogin }: RegisterViewProps) {
  const { register } = useAuth();
  const { success, error } = useToast();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    role: "STUDENT",
    password: "",
    password_confirm: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (formData.password !== formData.password_confirm) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (formData.password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);
    const res = await register(formData);
    setIsLoading(false);

    if (res.success) {
      success("Registration completed successfully!");
    } else {
      setErrorMessage(res.message || "Registration failed.");
      error(res.message || "Registration failed.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="text-center sm:text-left">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Create an Account
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Self-registration is available for Students and Parents
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 text-sm rounded-lg bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-300">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="first_name" required>
              First Name
            </Label>
            <Input
              id="first_name"
              required
              placeholder="Jane"
              value={formData.first_name}
              onChange={(e) =>
                setFormData({ ...formData, first_name: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="last_name" required>
              Last Name
            </Label>
            <Input
              id="last_name"
              required
              placeholder="Doe"
              value={formData.last_name}
              onChange={(e) =>
                setFormData({ ...formData, last_name: e.target.value })
              }
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reg-username" required>
            Username
          </Label>
          <Input
            id="reg-username"
            required
            placeholder="jdoe"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reg-email" required>
            Email Address
          </Label>
          <Input
            id="reg-email"
            type="email"
            required
            placeholder="jane.doe@example.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label required>Account Type</Label>
          <Select
            value={formData.role}
            onValueChange={(val) => setFormData({ ...formData, role: val })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="STUDENT">Student</SelectItem>
              <SelectItem value="PARENT">Parent / Guardian</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            Teacher & Director accounts are provisioned by School Administration.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="reg-pass" required>
              Password
            </Label>
            <Input
              id="reg-pass"
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reg-pass-confirm" required>
              Confirm
            </Label>
            <Input
              id="reg-pass-confirm"
              type="password"
              required
              placeholder="••••••••"
              value={formData.password_confirm}
              onChange={(e) =>
                setFormData({ ...formData, password_confirm: e.target.value })
              }
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full text-base font-semibold h-11 mt-2"
          isLoading={isLoading}
        >
          Create Account
        </Button>
      </form>

      <div className="text-center pt-1">
        <p className="text-sm text-muted-foreground">
          Already registered?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </motion.div>
  );
}
