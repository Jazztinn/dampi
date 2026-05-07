export const DOB_MIN_DATE = '2000-01-01';
export const DOB_MIN_YEAR = 2000;

function pad2(value) {
  return String(value).padStart(2, '0');
}

function parseDateInput(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDateInput(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function getDobMaxDate(baseDate = new Date()) {
  const maxDate = new Date(baseDate.getFullYear() + 1, 11, 31);
  maxDate.setHours(0, 0, 0, 0);
  return formatDateInput(maxDate);
}

export function getDobBounds(baseDate = new Date()) {
  return {
    min: DOB_MIN_DATE,
    max: getDobMaxDate(baseDate),
  };
}

export function validateChildDob(value, { required = true, baseDate = new Date() } = {}) {
  if (!value) {
    return {
      valid: !required,
      error: required ? 'Date of birth is required' : '',
      isFuture: false,
    };
  }

  const date = parseDateInput(value);
  if (!date) {
    return { valid: false, error: 'Enter a valid date of birth', isFuture: false };
  }

  const minDate = parseDateInput(DOB_MIN_DATE);
  const maxDate = parseDateInput(getDobMaxDate(baseDate));

  if (date < minDate) {
    return {
      valid: false,
      error: `Date must be in ${DOB_MIN_YEAR} or later`,
      isFuture: false,
    };
  }

  if (date > maxDate) {
    return {
      valid: false,
      error: `Date must be in ${baseDate.getFullYear() + 1} or earlier`,
      isFuture: false,
    };
  }

  const today = new Date(baseDate);
  today.setHours(0, 0, 0, 0);

  return { valid: true, error: '', isFuture: date > today, date };
}

export function formatChildAge(dob, baseDate = new Date()) {
  const result = validateChildDob(dob, { required: false, baseDate });
  if (!dob || !result.valid || !result.date) return 'Date unavailable';

  if (result.isFuture) {
    return `Expected ${result.date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`;
  }

  const now = new Date(baseDate);
  const months =
    (now.getFullYear() - result.date.getFullYear()) * 12 +
    (now.getMonth() - result.date.getMonth()) -
    (now.getDate() < result.date.getDate() ? 1 : 0);

  if (months < 0) {
    return `Expected ${result.date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`;
  }

  if (months < 24) return `${months}mo`;

  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem ? `${years}y ${rem}m` : `${years}y`;
}
