import { FormValidator } from '@form-validator-js/core';
import { required, minLength } from '@form-validator-js/validators';

const form = document.querySelector<HTMLFormElement>('#home-demo-form');
if (form) {
  new FormValidator({
    form,
    validatorDeclarations: {
      required:  { ...required,  errorMessage: 'Required' },
      minLength: { ...minLength, errorMessage: 'Too short' },
    },
    onErrorMessageListChanged(target, errors) {
      if (target === form) return;
      const list = (target as HTMLElement).parentElement?.querySelector('.error-list');
      if (!list) return;
      list.innerHTML = errors.map((m) => `<li>${m}</li>`).join('');
    },
  });
}
