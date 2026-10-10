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
import { Loader2, LogIn, KeyRound, ShieldCheck, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { describeSignInError, describeActivateError, formatAuthDetails, isCredentialError, type EmailStatus } from '@/lib/auth-errors';

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
  const { auth, firestore, firebaseApp, user, isUserLoading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  // Kept on screen (unlike a toast) so it can be read, screenshotted or quoted.
  const [authError, setAuthError] = useState<{ title: string; message: string; details: string } | null>(null);

  const reportAuthError = (info: { title: string; message: string }, code?: string) => {
    setAuthError({
      ...info,
      details: formatAuthDetails({
        code,
        host: typeof window !== 'undefined' ? window.location.host : undefined,
        projectId: firebaseApp.options.projectId,
      }),
    });
  };

  /** Is this email on the admin or security-team list? Public lookup, same as Activate. */
  async function checkUserList(emailLower: string): Promise<EmailStatus> {
    if (emailLower === PRIMARY_ADMIN_EMAIL) return 'listed';
    try {
      const [adminDoc, securityDoc] = await Promise.all([
        getDoc(doc(firestore, 'admins', emailLower)),
        getDoc(doc(firestore, 'security_team', emailLower)),
      ]);
      return adminDoc.exists() || securityDoc.exists() ? 'listed' : 'not-listed';
    } catch {
      return 'unknown';
    }
  }

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
    setAuthError(null);
    const emailLower = values.email.trim().toLowerCase();
    try {
      await signInWithEmailAndPassword(auth, emailLower, values.password);
      toast({ title: "Welcome back", description: "Signing you in..." });
    } catch (err: any) {
      const code: string | undefined = err?.code;
      console.error('[login] sign-in failed:', code, err?.message);
      // Firebase answers a wrong password and an unknown email identically;
      // the user list lets us say which of the two is more likely.
      const emailStatus: EmailStatus = isCredentialError(code) ? await checkUserList(emailLower) : 'unknown';
      reportAuthError(describeSignInError(code, emailStatus), code);
    } finally {
      setLoading(false);
    }
  }

  async function onActivate(values: z.infer<typeof activateSchema>) {
    setLoading(true);
    setAuthError(null);
    const emailLower = values.email.trim().toLowerCase();
    try {
      // Pre-check allowlist: is this email already added by an admin?
      const [adminDoc, securityDoc] = await Promise.all([
        getDoc(doc(firestore, 'admins', emailLower)),
        getDoc(doc(firestore, 'security_team', emailLower)),
      ]);
      const allowed = adminDoc.exists() || securityDoc.exists() || emailLower === PRIMARY_ADMIN_EMAIL;
      if (!allowed) {
        reportAuthError({
          title: 'Email not on the user list',
          message: "This email address hasn't been added to the user list, so an account can't be activated for it. " +
            'Check the spelling, or ask an existing admin to add you first.',
        });
        return;
      }

      await createUserWithEmailAndPassword(auth, emailLower, values.password);
      toast({ title: "Account Activated", description: "Welcome to the Hub Portal." });
      // The provider's onAuthStateChanged will fire and the redirect effect above kicks in.
    } catch (err: any) {
      const code: string | undefined = err?.code;
      console.error('[login] activation failed:', code, err?.message);
      reportAuthError(describeActivateError(code), code);
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

        <Tabs defaultValue="login" className="w-full" onValueChange={() => setAuthError(null)}>
          <TabsList className="grid w-full grid-cols-2 rounded-none h-12">
            <TabsTrigger value="login" className="data-[state=active]:bg-background">Sign In</TabsTrigger>
            <TabsTrigger value="activate" className="data-[state=active]:bg-background">Activate Account</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="p-6">
            {authError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{authError.title}</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>{authError.message}</p>
                  {authError.details && (
                    <p className="font-mono text-[11px] opacity-80 break-all select-all">{authError.details}</p>
                  )}
                </AlertDescription>
              </Alert>
            )}
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
            {authError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{authError.title}</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>{authError.message}</p>
                  {authError.details && (
                    <p className="font-mono text-[11px] opacity-80 break-all select-all">{authError.details}</p>
                  )}
                </AlertDescription>
              </Alert>
            )}
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
