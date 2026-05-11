import {
  FormValidator,
  FormValidatorInitResult,
  FormValidatorValidationResult,
} from '@form-validator-js/core';
import { required, minLength } from '@form-validator-js/validators';

interface User {
  id: number;
  username: string;
}

// Mock server backed by JSONPlaceholder. Returns true when no user in the
// fixture list has this exact username. Throws if the request fails for
// any reason other than abort — surfaced to the user via the reserved
// 'error' subtype below.
async function checkUsernameAvailable(value: string, signal: AbortSignal): Promise<boolean> {
  const response = await fetch('https://jsonplaceholder.typicode.com/users', { signal });
  if (!response.ok) throw new Error(`Server responded ${response.status}`);
  const users: User[] = await response.json();
  return !users.some((u) => u.username === value);
}

const form = document.querySelector<HTMLFormElement>('#async-form');
if (form) {
  const status = form.querySelector<HTMLElement>('#async-status')!;

  // Delay the "Checking…" hint until 500ms have passed — for fast
  // responses, the flash is more distracting than helpful.
  const CHECKING_DELAY_MS = 500;
  let checkingTimer: number | null = null;

  // The availability cache lives in init()'s extraData (see below) so
  // it's owned by the validator declaration rather than this outer
  // scope. Useful pattern when the same validator might be reused on
  // multiple fields — each field gets its own cache.
  interface CacheData extends Record<string, unknown> {
    cache: Map<string, boolean>;
  }

  new FormValidator({
    form,
    validatorDeclarations: {
      required:  { ...required,  errorMessage: 'Required' },
      minLength: { ...minLength, errorMessage: 'Too short' },
      // Async validator: may return a Promise from validate(). The engine
      // awaits it at submit time, manages race-by-latest, and aborts stale
      // checks via the AbortSignal in options.signal. New in 1.1.0.
      //
      // Short-circuit: skip the network roundtrip when `required`/`minLength`
      // will fail anyway. Returning a plain (non-Promise) value keeps validate
      // synchronous, so onPendingChange never fires for those cases.
      uniqueUsername: {
        init: (target) => new FormValidatorInitResult({
          observableElementList: [target],
          // extraData is shallow-frozen by the engine, but the Map inside
          // is the same object the consumer (validate) holds a reference
          // to — mutating it via .set() is fine.
          extraData: { cache: new Map<string, boolean>() } satisfies CacheData,
        }),
        validate: (target, data, options) => {
          const { cache } = data as CacheData;
          const value = (target as HTMLInputElement).value;
          if (value.length < 3) {
            return new FormValidatorValidationResult({ isValid: true });
          }
          // Cache hit: return synchronously so the engine doesn't even
          // enter async mode — no onPendingChange, no abortable cycle.
          const cached = cache.get(value);
          if (cached !== undefined) {
            return new FormValidatorValidationResult({ isValid: cached });
          }
          return checkUsernameAvailable(value, options!.signal).then((available) => {
            cache.set(value, available);
            return new FormValidatorValidationResult({ isValid: available });
          });
        },
        errorMessage: {
          '':      'Username is taken',
          // Reserved 'error' subtype: emitted if the Promise rejects (other
          // than abort). Lets the consumer distinguish "taken" from "couldn't
          // verify" (network down, server error, etc.).
          error:   'Could not verify availability — try again',
        },
      },
    },
    onErrorMessageListChanged(target, errors) {
      if (target === form) return;
      const list = (target as HTMLElement).parentElement?.querySelector('.error-list');
      if (!list) return;
      list.innerHTML = errors.map((m) => `<li>${m}</li>`).join('');
    },
    // Per-element pending callback — fires when an async validator is in
    // flight for that element. Show "Checking…" only if the request is
    // still in flight after 500ms; otherwise don't flash it at all.
    onPendingChange(target, isPending) {
      if (target.id !== 'async-username') return;
      if (isPending) {
        checkingTimer = window.setTimeout(() => {
          status.textContent = 'Checking…';
          checkingTimer = null;
        }, CHECKING_DELAY_MS);
      } else {
        if (checkingTimer !== null) {
          window.clearTimeout(checkingTimer);
          checkingTimer = null;
        }
        status.textContent = '';
      }
    },
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Signed up — username confirmed');
  });
}
