import { FormValidator } from '@form-validator-js/core';
import { required, minLength, pattern } from '@form-validator-js/validators';

const form = document.querySelector<HTMLFormElement>('#wizard-form');
if (!form) throw new Error('Wizard form missing');

const steps = Array.from(form.querySelectorAll<HTMLFieldSetElement>('fieldset[data-step]'));
const backBtn = form.querySelector<HTMLButtonElement>('[data-action="back"]')!;
const nextBtn = form.querySelector<HTMLButtonElement>('[data-action="next"]')!;
const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
const reviewList = form.querySelector<HTMLDListElement>('.wizard-review')!;

// What to show on the Review step. Order matters — drives the dl rows.
const reviewFields: Array<{ id: string; label: string }> = [
  { id: 'wiz-name',   label: 'Name' },
  { id: 'wiz-email',  label: 'Email' },
  { id: 'wiz-street', label: 'Street' },
  { id: 'wiz-city',   label: 'City' },
];

function renderReview() {
  // Build the dl via DOM API rather than innerHTML — visitor input is
  // never re-rendered as HTML, no XSS surface.
  const children: HTMLElement[] = [];
  for (const { id, label } of reviewFields) {
    const input = form.querySelector<HTMLInputElement>(`#${id}`);
    const value = input?.value.trim() ?? '';
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    if (value) {
      dd.textContent = value;
    } else {
      dd.textContent = '(empty)';
      dd.classList.add('empty');
    }
    children.push(dt, dd);
  }
  reviewList.replaceChildren(...children);
}

let currentStep = 0;

function showStep(i: number) {
  steps.forEach((step, idx) => {
    step.hidden = idx !== i;
  });
  form.querySelector<HTMLElement>('.wizard-progress')!.textContent =
    `Step ${i + 1} of ${steps.length}`;

  // Nav buttons: Back hidden on the first step; Next hidden on the last;
  // Submit only on the last. Avoids the "Back on step 1 leads nowhere"
  // dead affordance and the symmetric "Next on the final step" confusion.
  const isFirst = i === 0;
  const isLast = i === steps.length - 1;
  backBtn.hidden = isFirst;
  nextBtn.hidden = isLast;
  submitBtn.hidden = !isLast;

  // Render the data summary each time we land on Review so going back
  // to fix a field and coming forward again shows the updated value.
  if (isLast) renderReview();
}

const validator = new FormValidator({
  form,
  validatorDeclarations: {
    required:  { ...required,  errorMessage: 'Required' },
    minLength: { ...minLength, errorMessage: 'Too short' },
    pattern:   { ...pattern,   errorMessage: 'Not a valid format' },
  },
  onErrorMessageListChanged(target, errors) {
    if (target === form) return;
    const list = (target as HTMLElement).parentElement?.querySelector('.error-list');
    if (!list) return;
    list.innerHTML = errors.map((m) => `<li>${m}</li>`).join('');
  },
});

nextBtn.addEventListener('click', () => {
  // Validate every field within the current step. If any are invalid, stay.
  const stepEl = steps[currentStep];
  const fields = stepEl.querySelectorAll<HTMLInputElement>('[data-validation]');
  let allValid = true;
  fields.forEach((f) => {
    f.dispatchEvent(FormValidator.createValidateEvent());
    if (f.getAttribute('aria-invalid') === 'true') allValid = false;
  });
  if (allValid && currentStep < steps.length - 1) {
    currentStep++;
    showStep(currentStep);
  }
});

backBtn.addEventListener('click', () => {
  if (currentStep > 0) {
    currentStep--;
    showStep(currentStep);
  }
});

// Submit handler attached AFTER new FormValidator(). The engine runs
// validation first and stops propagation on any invalid field, so this
// only fires when the whole form is valid. On the final step that means
// the user is done — alert. On an earlier step (only reachable here if
// the user backtracked from a fully-filled state) route the submit to
// Next as a small UX nicety.
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (currentStep === steps.length - 1) {
    alert('Submitted.');
  } else {
    nextBtn.click();
  }
});

showStep(0);
