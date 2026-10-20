const fieldRules = {
  name(value) {
    if (!value) return 'Please enter your full name.';
    if (value.length < 2 || !/[a-z]/i.test(value)) return 'Please enter a valid full name.';
    return '';
  },
  email(value) {
    if (!value) return 'Please enter your work email.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return 'Please enter a valid work email.';
    return '';
  },
  phone(value) {
    if (!value) return 'Please enter your phone or WhatsApp number.';
    const digits = value.replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15) return 'Please enter a valid phone number.';
    return '';
  },
};

function setFieldState(field, message) {
  const control = field.querySelector('input, select');
  const error = field.querySelector('.field-error');
  field.classList.toggle('is-invalid', Boolean(message));
  if (error) error.textContent = message;
  if (control) control.setAttribute('aria-invalid', message ? 'true' : 'false');
}

function validateForm(form) {
  let firstInvalid = null;

  form.querySelectorAll('.field').forEach((field) => {
    const control = field.querySelector('input, select');
    const rule = control && fieldRules[control.name];
    if (!rule) return;
    const message = rule(control.value.trim());
    setFieldState(field, message);
    if (message && !firstInvalid) firstInvalid = control;
  });

  return firstInvalid;
}

async function submitLeadForm(form, message) {
  if (window.location.protocol === 'file:') {
    message.textContent = 'Open this page from your website, not as a file on your computer. The mail script only runs on the server.';
    message.classList.remove('is-success');
    message.classList.add('is-error');
    return;
  }

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;

  try {
    const response = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
    });
    const raw = await response.text();
    let data = null;
    try {
      data = JSON.parse(raw);
    } catch (parseError) {
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      if (start !== -1 && end > start) {
        data = JSON.parse(raw.slice(start, end + 1));
      }
    }
    if (!data) {
      throw new Error('The mail script did not return a result.');
    }

    if (!response.ok || !data.ok) {
      message.textContent = data.message || 'We could not send your request. Please try again or contact us on WhatsApp.';
      message.classList.remove('is-success');
      message.classList.add('is-error');
      return;
    }

    form.reset();
    form.querySelectorAll('.field.is-invalid').forEach((field) => setFieldState(field, ''));
    message.textContent = data.message;
    message.classList.remove('is-error');
    message.classList.add('is-success');
  } catch (error) {
    message.textContent = 'We could not send your request. Please try again or contact us on WhatsApp.';
    message.classList.remove('is-success');
    message.classList.add('is-error');
  } finally {
    button.disabled = false;
  }
}

document.querySelectorAll('.lead-form').forEach((form) => {
  const message = form.querySelector('.form-message');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const firstInvalid = validateForm(form);

    if (firstInvalid) {
      message.textContent = 'Please correct the highlighted fields and try again.';
      message.classList.remove('is-success');
      message.classList.add('is-error');
      firstInvalid.focus();
      return;
    }

    submitLeadForm(form, message);
  });

  form.addEventListener('input', (event) => {
    const control = event.target;
    const field = control.closest('.field');
    const rule = fieldRules[control.name];
    if (!field || !rule || !field.classList.contains('is-invalid')) return;

    setFieldState(field, rule(control.value.trim()));
    if (!form.querySelector('.field.is-invalid') && message.classList.contains('is-error')) {
      message.textContent = '';
      message.classList.remove('is-error');
    }
  });
});
