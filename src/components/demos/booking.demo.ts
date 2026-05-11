import { FormValidator } from '@form-validator-js/core';
import { required, numeric, min, max, step } from '@form-validator-js/validators';

const form = document.querySelector<HTMLFormElement>('#booking-form');
if (form) {
  // Compute today + 30 days for the date bounds.
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const in30 = new Date(today.getTime() + 30 * 86_400_000).toISOString().slice(0, 10);

  // Inject computed bounds into the data-validation attributes.
  const dateInput = form.querySelector<HTMLInputElement>('#booking-date');
  if (dateInput) {
    dateInput.dataset.validation = `required;numeric;min(${todayIso});max(${in30})`;
  }

  new FormValidator({
    form,
    validatorDeclarations: {
      required: { ...required, errorMessage: 'Required' },
      numeric:  { ...numeric,  errorMessage: 'Not a valid value' },
      min:      { ...min,      errorMessage: 'Too early / too small' },
      max:      { ...max,      errorMessage: 'Too late / too large' },
      step:     { ...step,     errorMessage: 'Not on the allowed step' },
    },
    onErrorMessageListChanged(target, errors) {
      if (target === form) return;
      const list = (target as HTMLElement).parentElement?.querySelector('.error-list');
      if (!list) return;
      list.innerHTML = errors.map((m) => `<li>${m}</li>`).join('');
    },
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Booked.');
  });
}
