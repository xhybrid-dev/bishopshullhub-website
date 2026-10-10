"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirebase } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn, KeyRound, ShieldCheck } from 'lucide-react';

/** Turns a Firebase Auth error code into something an admin can act on. */
function describeSignInError(code?: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return "That email and password don't match. If you haven't signed in on this site before, use the Activate tab.";
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Ask an existing admin for help.';
    case 'auth/unauthorized-domain':
      return 'This web address is not authorised for sign-in (auth/unauthorized-domain). It must be added to the Firebase project.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled for this project (auth/operation-not-allowed).';
    case 'auth/network-request-failed':
      return 'Could not reach the sign-in service. Check your connection and try again.';
    case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
    case 'auth/invalid-api-key':
      return 'The site is not configured with a valid Firebase key (auth/invalid-api-key).';
    default:
      return `Sign-in failed${code ? ` (${code})` : ''}. Please try again.`;
  }
}

const PRIMARY_ADMIN_EMAIL = 'bishopshullhub@gmail.com';

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const activateSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function LoginPage() {
  const { auth, firestore, user, isUserLoading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Handle redirection in an effect to avoid updating the router during render
  useEffect(() => {
    if (user && !user.isAnonymous) {
      router.push('/admin');
    }
  }, [user, router]);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const activateForm = useForm<z.infer<typeof activateSchema>>({
    resolver: zodResolver(activateSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  // Waits for the result so a failed sign-in is reported, rather than leaving
  // the visitor on this screen with no sign of what went wrong.
  async function onLogin(values: z.infer<typeof loginSchema>) {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email.trim().toLowerCase(), values.password);
      toast({ title: "Welcome back", description: "Signing you in..." });
    } catch (err: any) {
      console.error('[login] sign-in failed:', err?.code, err?.message);
      toast({ variant: "destructive", title: "Login Failed", description: describeSignInError(err?.code) });
    } finally {
      setLoading(false);
    }
  }

  async function onActivate(values: z.infer<typeof activateSchema>) {
    setLoading(true);
    const emailLower = values.email.trim().toLowerCase();
    try {
      // Pre-check allowlist: is this email already added by an admin?
      const [adminDoc, securityDoc] = await Promise.all([
        getDoc(doc(firestore, 'admins', emailLower)),
        getDoc(doc(firestore, 'security_team', emailLower)),
      ]);
      const allowed = adminDoc.exists() || securityDoc.exists() || emailLower === PRIMARY_ADMIN_EMAIL;
      if (!allowed) {
        toast({
          variant: "destructive",
          title: "Email Not Authorised",
          description: "Your email isn't on the user list. Ask an existing admin to add you first.",
        });
        return;
      }

      await createUserWithEmailAndPassword(auth, emailLower, values.password);
      toast({ title: "Account Activated", description: "Welcome to the Hub Portal." });
      // The provider's onAuthStateChanged will fire and the redirect effect above kicks in.
    } catch (err: any) {
      if (err?.code === 'auth/email-already-in-use') {
        toast({
          variant: "destructive",
          title: "Account Already Exists",
          description: "This email is already registered. Please use Sign In instead.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Activation Failed",
          description: err?.message || "Could not activate the account.",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  // Show a loader if we're already logged in and waiting for the effect to redirect
  if (isUserLoading || (user && !user.isAnonymous)) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-muted/30">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-medium">Authenticating...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-muted/30">
      <Card className="max-w-md w-full border-none shadow-2xl overflow-hidden">
        <div className="bg-primary p-6 text-primary-foreground text-center">
          <div className="mx-auto w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-headline">Portal Access</CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Sign in to manage Hub activities and enquiries.
          </CardDescription>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-none h-12">
            <TabsTrigger value="login" className="data-[state=active]:bg-background">Sign In</TabsTrigger>
            <TabsTrigger value="activate" className="data-[state=active]:bg-background">Activate Account</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="p-6">
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl><Input placeholder="admin@bishopshullhub.co.uk" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl><Input type="password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                  Sign In
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="activate" className="p-6">
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              First-time access — set a password for an email address that an existing admin has already added to the user list.
            </p>
            <Form {...activateForm}>
              <form onSubmit={activateForm.handleSubmit(onActivate)} className="space-y-4">
                <FormField
                  control={activateForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl><Input placeholder="you@bishopshullhub.co.uk" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={activateForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Choose a Password</FormLabel>
                      <FormControl><Input type="password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={activateForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl><Input type="password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  Activate Account
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>

        <CardFooter className="bg-muted/50 p-4 border-t">
          <p className="text-xs text-center w-full text-muted-foreground uppercase tracking-widest font-bold">
            Authorized Personnel Only
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
