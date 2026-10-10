/**
 * Login error wording: every Firebase code an admin is likely to hit should
 * explain itself, and the "wrong password or no account?" ambiguity should be
 * narrowed down by the user-list lookup.
 * Run with: npm run test:auth-errors
 */
import { describeSignInError, describeActivateError, formatAuthDetails, isCredentialError } from '../src/lib/auth-errors';

const results: Array<[boolean, string, string]> = [];
const check = (name: string, got: unknown, want: unknown) =>
  results.push([got === want, name, `got=${got} want=${want}`]);
const mentions = (name: string, text: string, needle: string) =>
  results.push([text.toLowerCase().includes(needle.toLowerCase()), name, `"${needle}" not found in: ${text}`]);

// --- credential errors: Firebase can't say which of password/email is wrong ---
for (const code of ['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-login-credentials']) {
  check(`${code} counts as a credential error`, isCredentialError(code), true);
}
check('other codes are not credential errors', isCredentialError('auth/too-many-requests'), false);
check('undefined is not a credential error', isCredentialError(undefined), false);

const unknown = describeSignInError('auth/invalid-credential');
mentions('unknown status mentions both possibilities', unknown.message, 'incorrect');
mentions('unknown status points at Activate', unknown.message, 'Activate');

const listed = describeSignInError('auth/invalid-credential', 'listed');
check('listed email titled as password/activation problem', listed.title, 'Incorrect password, or account not activated');
mentions('listed email: suggests Activate', listed.message, 'Activate Account');
mentions('listed email: mentions previous site', listed.message, 'previous version');

const notListed = describeSignInError('auth/invalid-credential', 'not-listed');
check('unlisted email says so', notListed.title, 'Email not on the user list');
mentions('unlisted email: suggests asking an admin', notListed.message, 'ask an existing admin');

// --- other failures each get their own explanation ---
const cases: Array<[string, string]> = [
  ['auth/too-many-requests', '15 minutes'],
  ['auth/user-disabled', 'disabled'],
  ['auth/network-request-failed', 'internet connection'],
  ['auth/unauthorized-domain', 'Authorised domains'],
  ['auth/operation-not-allowed', 'Sign-in method'],
  ['auth/invalid-api-key', 'API key'],
  ['auth/api-key-not-valid.-please-pass-a-valid-api-key.', 'API key'],
  ['auth/requests-from-referer-https://example.com-are-blocked', 'website restrictions'],
  ['auth/invalid-email', 'valid email'],
  ['auth/missing-password', 'Enter your password'],
  ['auth/web-storage-unsupported', 'storage'],
];
for (const [code, needle] of cases) {
  mentions(`${code} explains itself`, describeSignInError(code).message, needle);
}

const fallback = describeSignInError('auth/something-new');
mentions('unrecognised code is quoted in the message', fallback.message, 'auth/something-new');
mentions('missing code still reads sensibly', describeSignInError(undefined).message, 'unexpected');

// --- activation ---
check('activate: existing account', describeActivateError('auth/email-already-in-use').title, 'Account already exists');
mentions('activate: existing account points at Sign In', describeActivateError('auth/email-already-in-use').message, 'Sign In');
check('activate: weak password', describeActivateError('auth/weak-password').title, 'Password too weak');
mentions('activate: network falls through to the shared wording', describeActivateError('auth/network-request-failed').message, 'internet connection');

// --- details line ---
check('details line has code, address and project',
  formatAuthDetails({ code: 'auth/invalid-credential', host: 'bishopshullhub.co.uk', projectId: 'bishopshullhub-web' }),
  'Code: auth/invalid-credential  ·  Address: bishopshullhub.co.uk  ·  Project: bishopshullhub-web');
check('details line skips missing parts', formatAuthDetails({ host: 'x.test' }), 'Address: x.test');

let failed = 0;
for (const [ok, name, detail] of results) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  (${detail})`}`);
  if (!ok) failed++;
}
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
