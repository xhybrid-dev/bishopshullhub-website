/**
 * Plain-English explanations for Firebase Auth errors on the portal login.
 *
 * Firebase deliberately gives the same `auth/invalid-credential` answer for a
 * wrong password and for an email with no account, so that outsiders can't
 * probe which emails exist. The login page softens that by also checking the
 * public user list (the same lookup the Activate tab already does) and passing
 * the result in as `emailStatus`.
 */

export type AuthErrorInfo = {
  title: string;
  message: string;
};

/** Where the typed email stands on the admin / security-team user list. */
export type EmailStatus = 'unknown' | 'listed' | 'not-listed';

const FIREBASE_ADMIN_HINT = 'This is a site setting, not something you did wrong — tell the site administrator.';

/** Codes Firebase uses when it can't match an email and password. */
const CREDENTIAL_CODES = new Set([
  'auth/invalid-credential',
  'auth/invalid-login-credentials',
  'auth/wrong-password',
  'auth/user-not-found',
]);

/** True when Firebase can't tell us whether the password or the email was the problem. */
export function isCredentialError(code: string | undefined): boolean {
  return !!code && CREDENTIAL_CODES.has(code);
}

export function describeSignInError(code: string | undefined, emailStatus: EmailStatus = 'unknown'): AuthErrorInfo {
  if (isCredentialError(code)) {
    if (emailStatus === 'not-listed') {
      return {
        title: 'Email not on the user list',
        message:
          "This email address hasn't been added to the user list, so it can't sign in. " +
          'Check the spelling, or ask an existing admin to add it.',
      };
    }
    if (emailStatus === 'listed') {
      return {
        title: 'Incorrect password, or account not activated',
        message:
          'This email is on the user list, but the password was not accepted. ' +
          'Check the password for typos, caps lock or extra spaces. ' +
          "If you haven't signed in on this site before, open the Activate Account tab and set a password — " +
          "passwords from the previous version of the site don't always carry over.",
      };
    }
    return {
      title: 'Email or password not accepted',
      message:
        'The password is incorrect, or this email has no account on this site yet. ' +
        'Check for typos, caps lock or extra spaces. If this is your first time here, use the Activate Account tab.',
    };
  }

  if (code?.startsWith('auth/requests-from-referer')) {
    return {
      title: 'Web address blocked by the API key',
      message:
        "The site's Firebase API key has website restrictions that don't include this address. " +
        FIREBASE_ADMIN_HINT,
    };
  }

  switch (code) {
    case 'auth/invalid-email':
      return {
        title: 'Invalid email address',
        message: "That doesn't look like a valid email address. Check it for typos and try again.",
      };
    case 'auth/missing-email':
      return { title: 'Email missing', message: 'Enter your email address.' };
    case 'auth/missing-password':
      return { title: 'Password missing', message: 'Enter your password.' };
    case 'auth/too-many-requests':
      return {
        title: 'Too many attempts',
        message:
          'Sign-in is temporarily blocked from this device after repeated failed attempts. ' +
          'Wait about 15 minutes and try again. Entering the correct password will not unblock it sooner.',
      };
    case 'auth/user-disabled':
      return {
        title: 'Account disabled',
        message: 'This account has been disabled. Ask an existing admin to look into it.',
      };
    case 'auth/network-request-failed':
      return {
        title: 'Connection problem',
        message:
          "Couldn't reach the sign-in service. Check your internet connection (and any ad-blocker or firewall) and try again.",
      };
    case 'auth/timeout':
      return { title: 'Sign-in timed out', message: 'The sign-in service took too long to respond. Try again.' };
    case 'auth/unauthorized-domain':
      return {
        title: 'Web address not authorised',
        message:
          "This web address hasn't been added to the Firebase project's Authorised domains " +
          '(Firebase console → Authentication → Settings). ' +
          FIREBASE_ADMIN_HINT,
      };
    case 'auth/operation-not-allowed':
      return {
        title: 'Email/password sign-in is switched off',
        message:
          'The Email/Password sign-in method is not enabled for this Firebase project ' +
          '(Firebase console → Authentication → Sign-in method). ' +
          FIREBASE_ADMIN_HINT,
      };
    case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
    case 'auth/invalid-api-key':
      return {
        title: 'Invalid Firebase API key',
        message: "The site isn't configured with a valid Firebase API key for this project. " + FIREBASE_ADMIN_HINT,
      };
    case 'auth/app-not-authorized':
      return {
        title: 'App not authorised',
        message: "This app isn't authorised to use the Firebase project's sign-in. " + FIREBASE_ADMIN_HINT,
      };
    case 'auth/quota-exceeded':
      return {
        title: 'Sign-in limit reached',
        message: "The project's sign-in quota has been used up. Try again later. " + FIREBASE_ADMIN_HINT,
      };
    case 'auth/web-storage-unsupported':
      return {
        title: 'Browser storage blocked',
        message:
          'Your browser is blocking the storage that sign-in needs (private mode or strict cookie settings can do this). ' +
          'Allow cookies and site data for this site, or try another browser.',
      };
    case 'auth/internal-error':
      return {
        title: 'Sign-in service error',
        message: 'The sign-in service reported an internal error. Try again in a minute.',
      };
    default:
      return {
        title: 'Sign-in failed',
        message: `Something unexpected went wrong${code ? ` (${code})` : ''}. Try again, and quote the details below if it keeps happening.`,
      };
  }
}

export function describeActivateError(code: string | undefined): AuthErrorInfo {
  switch (code) {
    case 'auth/email-already-in-use':
      return {
        title: 'Account already exists',
        message:
          'This email already has an account on this site. Use the Sign In tab. ' +
          "If you've forgotten the password, ask an existing admin for help.",
      };
    case 'auth/weak-password':
      return {
        title: 'Password too weak',
        message: 'Choose a longer password — at least 6 characters, ideally a mix of letters, numbers and symbols.',
      };
    case 'auth/invalid-email':
      return {
        title: 'Invalid email address',
        message: "That doesn't look like a valid email address. Check it for typos and try again.",
      };
    default:
      // The remaining failures (network, blocked domain, provider off, bad
      // key, too many attempts) read the same whether signing in or activating.
      return describeSignInError(code);
  }
}

/** One line of facts to quote when asking for help. */
export function formatAuthDetails(parts: { code?: string; host?: string; projectId?: string }): string {
  const items = [
    parts.code ? `Code: ${parts.code}` : null,
    parts.host ? `Address: ${parts.host}` : null,
    parts.projectId ? `Project: ${parts.projectId}` : null,
  ].filter(Boolean);
  return items.join('  ·  ');
}
