import { Resend } from 'resend';

const MAX_DESCRIPTION = 5000;
const MAX_OPTIONAL_TEXT = 3000;
const MAX_SCREENSHOT_BYTES = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg']);

const FEEDBACK_TYPE_LABELS = {
  bug_report: 'Bug Report',
  feature_idea: 'Feature Idea',
  ui_ux: 'UI / UX Feedback',
  incorrect_french: 'Incorrect French or AI Response',
  other: 'Other',
};

const FEEDBACK_AREA_LABELS = {
  check: 'Check',
  toolbox: 'Toolbox',
  practice: 'Practice',
  history: 'History',
  general: 'General',
  not_sure: 'Not Sure',
};

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? '').trim());
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatBlock(label, value) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  return `<p><strong>${escapeHtml(label)}</strong></p><pre style="white-space:pre-wrap;font-family:inherit;margin:0 0 16px;">${escapeHtml(text)}</pre>`;
}

function normalizeScreenshot(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const filename = String(raw.filename ?? 'screenshot.png').trim() || 'screenshot.png';
  const contentType = String(raw.contentType ?? 'image/png').trim().toLowerCase();
  const data = String(raw.data ?? '').trim();

  if (!data) return null;
  if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
    return { error: 'Screenshot must be a PNG or JPG file.' };
  }

  let buffer;
  try {
    buffer = Buffer.from(data, 'base64');
  } catch {
    return { error: 'Screenshot upload could not be processed.' };
  }

  if (!buffer.length || buffer.length > MAX_SCREENSHOT_BYTES) {
    return { error: 'Screenshot must be smaller than 4 MB.' };
  }

  return { filename, contentType, buffer };
}

export function isFeedbackConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.FEEDBACK_TO_EMAIL?.trim());
}

export async function submitFeedback(body) {
  const type = String(body?.type ?? '').trim();
  const area = String(body?.area ?? '').trim();
  const description = String(body?.description ?? '').trim();
  const aiResponse = String(body?.aiResponse ?? '').trim();
  const reproductionSteps = String(body?.reproductionSteps ?? '').trim();
  const featureIdea = String(body?.featureIdea ?? '').trim();
  const contactOk = Boolean(body?.contactOk);
  const email = String(body?.email ?? '').trim();

  if (!FEEDBACK_TYPE_LABELS[type]) {
    return { status: 400, body: { message: 'Please choose a feedback type.' } };
  }

  if (!FEEDBACK_AREA_LABELS[area]) {
    return { status: 400, body: { message: 'Please choose which part of the app this is about.' } };
  }

  if (!description) {
    return { status: 400, body: { message: 'Please tell us what happened.' } };
  }

  if (description.length > MAX_DESCRIPTION) {
    return { status: 400, body: { message: 'Description is too long.' } };
  }

  for (const [label, value] of [
    ['AI response', aiResponse],
    ['Reproduction steps', reproductionSteps],
    ['Feature idea', featureIdea],
  ]) {
    if (value.length > MAX_OPTIONAL_TEXT) {
      return { status: 400, body: { message: `${label} is too long.` } };
    }
  }

  if (type === 'feature_idea' && !featureIdea) {
    return { status: 400, body: { message: 'Please share your feature idea.' } };
  }

  if (contactOk) {
    if (!email) {
      return { status: 400, body: { message: 'Please enter your email if we may contact you.' } };
    }
    if (!isValidEmail(email)) {
      return { status: 400, body: { message: 'Please enter a valid email address.' } };
    }
  }

  const screenshot = normalizeScreenshot(body?.screenshot);
  if (screenshot?.error) {
    return { status: 400, body: { message: screenshot.error } };
  }

  if (!isFeedbackConfigured()) {
    console.warn('Feedback received but email is not configured:', {
      type,
      area,
      description,
      aiResponse,
      reproductionSteps,
      featureIdea,
      contactOk,
      email: contactOk ? email : undefined,
      hasScreenshot: Boolean(screenshot?.buffer),
    });
    return {
      status: 503,
      body: {
        message:
          'Feedback email is not configured yet. Add RESEND_API_KEY and FEEDBACK_TO_EMAIL to enable it.',
      },
    };
  }

  const resend = new Resend(process.env.RESEND_API_KEY.trim());
  const toEmail = process.env.FEEDBACK_TO_EMAIL.trim();
  const fromEmail = process.env.FEEDBACK_FROM_EMAIL?.trim() || 'onboarding@resend.dev';

  const html = [
    '<h2>New Feedback — Mot-à-Mot</h2>',
    formatBlock('Type', FEEDBACK_TYPE_LABELS[type]),
    formatBlock('Area', FEEDBACK_AREA_LABELS[area]),
    formatBlock('Description', description),
    formatBlock('AI Response', aiResponse),
    formatBlock('Reproduction Steps', reproductionSteps),
    type === 'feature_idea' ? formatBlock('Feature Idea', featureIdea) : '',
    formatBlock('User Email', contactOk ? email : 'User prefers not to be contacted'),
    screenshot?.buffer ? '<p><strong>Screenshot</strong></p><p>Attached to this email.</p>' : '',
  ]
    .filter(Boolean)
    .join('');

  const attachments = screenshot?.buffer
    ? [
        {
          filename: screenshot.filename,
          content: screenshot.buffer,
        },
      ]
    : undefined;

  try {
    await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      replyTo: contactOk && email ? email : undefined,
      subject: `Mot-à-Mot Feedback — ${FEEDBACK_TYPE_LABELS[type]} (${FEEDBACK_AREA_LABELS[area]})`,
      html,
      attachments,
    });

    return { status: 200, body: { ok: true } };
  } catch (error) {
    console.error('Resend feedback email failed:', error);
    return {
      status: 500,
      body: { message: "We couldn't send your feedback right now. Please try again." },
    };
  }
}
