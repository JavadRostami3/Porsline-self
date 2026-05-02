import { useState } from "react";
import { useLocation } from "wouter";
import { useAdminLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const login = useAdminLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(
      { data: { password } },
      {
        onSuccess: () => {
          setLocation("/admin");
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "رمز عبور اشتباه است",
            description: "لطفاً دوباره تلاش کنید",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl p-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">ورود پژوهشگر</h1>
          <p className="text-muted-foreground text-sm mt-1">پنل مدیریت پژوهش</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password" className="font-medium">رمز عبور</Label>
            <Input
              id="password"
              data-testid="input-admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="رمز عبور را وارد کنید"
              required
              autoFocus
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            data-testid="button-admin-login"
            disabled={login.isPending}
          >
            {login.isPending ? "در حال ورود..." : "ورود به پنل"}
          </Button>
        </form>
      </div>
    </div>
  );
}
