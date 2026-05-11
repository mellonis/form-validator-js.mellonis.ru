import { FormValidator } from '@form-validator-js/core';
import { required, minLength, pattern, equalsTo } from '@form-validator-js/validators';

const form = document.querySelector<HTMLFormElement>('#signup-form');
if (form) {
  const validator = new FormValidator({
    form,
    validatorDeclarations: {
      required:  { ...required,  errorMessage: 'Required' },
      minLength: { ...minLength, errorMessage: 'Too short' },
      pattern:   { ...pattern,   errorMessage: 'Not a valid format' },
      equalsTo:  { ...equalsTo,  errorMessage: 'Passwords must match' },
    },
    onErrorMessageListChanged(target, errors) {
      if (target === form) return;
      const list = (target as HTMLElement).parentElement?.querySelector('.error-list');
      if (!list) return;
      list.innerHTML = errors.map((m) => `<li>${m}</li>`).join('');
    },
  });

  // Per-field overrides: tell users what the password rules are.
  const password = form.querySelector<HTMLInputElement>('#signup-password');
  if (password) {
    validator.elementToSpecificErrorMessageMap.set(password, {
      minLength: 'Use at least 8 characters',
      pattern: 'Include at least one digit',
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Signed up (this is a demo — no actual submission).');
  });
}
