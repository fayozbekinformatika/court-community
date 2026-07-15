
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
const postSignUp = async (formData: any): Promise<AuthResponse> => {
  const { data } = await api.post("/auth/signup", formData);
  return data;
};

export default function SignUpPage() {
  const { login } = useAuth();
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm();

  // The mutation hook
  const mutation = useMutation({
    mutationFn: postSignUp,
    onSuccess: (data) => {
      // On successful signup, log the user in immediately
      login(data.user);
      // No need to redirect, the login() function handles it
    },
    onError: (error: any) => {
      // TODO: Show a toast or error message to the user
      console.error("Signup failed:", error);
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
          <CardTitle>Create an Account</CardTitle>
          <CardDescription>
            Start chatting with your friends today.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="John"
                {...register("firstName", { required: "First name is required" })}
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm">{errors.firstName.message as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="userName">Username</Label>
              <Input
                id="userName"
                placeholder="john_doe"
                {...register("userName", { required: "Username is required" })}
              />
              {errors.userName && (
                <p className="text-red-500 text-sm">{errors.userName.message as string}</p>
              )}
            </div>

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
              {mutation.isPending ? "Creating Account..." : "Create Account"}
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
            <a href="https://court-community.onrender.com/auth/google/callback">
              {/* Add Google Icon here later */}
              Sign in with Google
            </a>
          </Button>

          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
