// web/src/app/login/page.tsx
"use client";

import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";
import { AuthResponse } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// This is the function our mutation will call
const postLogin = async (formData: any): Promise<AuthResponse> => {
  const { data } = await api.post("/auth/login", formData);
  return data;
};

export default function LoginPage() {
  const { login }  = useAuth();
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm();

  // The mutation hook
  const mutation = useMutation({
    mutationFn: postLogin,
    onSuccess: (data) => {
      // On successful login, update the context
      login(data.user);
    },
    onError: (error: any) => {
      // Show an error message
      console.error("Login failed:", error);
      alert(error.response?.data?.message || "An error occurred.");
    },
  });

  // This function is called when the form is valid
  const onSubmit = (formData: any) => {
    mutation.mutate(formData);
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome Back!</CardTitle>
          <CardDescription>
            Log in to your account to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email", { required: "Email is required" })}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password", { required: "Password is required" })}
              />
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password.message as string}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Logging In..." : "Log In"}
            </Button>
          </form>

          {/* --- Divider --- */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* --- Google Button --- */}
          <Button asChild variant="outline" className="w-full">
            <a href="https://court-community.onrender.com/auth/google">
              {/* Add Google Icon here later */}
              Sign in with Google
            </a>
          </Button>

          <div className="mt-4 text-center text-sm">
            Don't have an account?{" "}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}   
