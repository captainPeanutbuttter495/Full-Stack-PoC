"use client";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { continueWithGoogle, signInWIthEmail } from "@/lib/auth";
import { AuthError } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await signInWIthEmail(formData.email, formData.password);

    if (result instanceof AuthError) {
      setError(result.message);
      return;
    }

    setError(null);
    router.push("/");
  };

  return (
    <div className="h-[calc(100svh-4rem)] flex items-center justify-center">
      <Card className="w-full max-w-sm py-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Sign In
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <Field>
              <FieldLabel>Email</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  type="email"
                  placeholder="Enter your email"
                  required
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
                <InputGroupAddon>
                  <Mail />
                </InputGroupAddon>
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel>Password</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  required
                  type="password"
                  placeholder="Enter your password"
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                <InputGroupAddon>
                  <Lock />
                </InputGroupAddon>
              </InputGroup>
            </Field>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-4">
          <Button
            variant="outline"
            className="w-full bg-card"
            onClick={() => continueWithGoogle()}
          >
            Sign in with Google
          </Button>
          <p>
            Don't have an account?{" "}
            <a href="/auth/register" className="text-primary hover:underline">
              Sign up
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default LoginPage;
