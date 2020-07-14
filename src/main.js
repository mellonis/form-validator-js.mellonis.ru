import { FormValidator } from '@form-validator-js/core';
import { required, equalsTo } from '@form-validator-js/validators';

const form = document.querySelector('form');

function render({ errorList, for: target }) {
  const errorListElement = target.nextElementSibling;

  errorListElement.innerHTML = '';

  const fragment = document.createDocumentFragment();

  errorList.forEach((error) => {
      const errorListItemElement = document.createElement('li');

      errorListItemElement.textContent = error;

      fragment.appendChild(errorListItemElement);
  });

  errorListElement.appendChild(fragment);
}

new FormValidator({
  form,
  validatorDeclarations: {
    required: {
      ...required,
      errorMessage: 'Required value',
    },
    equalsTo: {
      ...equalsTo,
      errorMessage: 'Passwords must be equal'
    }
  },
  onErrorMessageListChanged(target, errorList) {
    render({errorList, for: target});

    if (errorList.length) {
      target.classList.add('form__input_error');
    } else {
      target.classList.remove('form__input_error');
    }
  },
});

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const formData = ['login', 'password', 'passwordConfirmation'].reduce((result, name) => ({
    ...result,
    [name]: event.target.querySelector(`[name="${name}"]`).value,
  }), {});

  console.log(JSON.stringify(formData));
});
