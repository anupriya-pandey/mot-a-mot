import { useEffect, useId, useRef, useState } from 'react';
import { submitFeedback } from '../api/submitFeedback';
import { StatusBanner } from './StatusBanner';
import { TextInput } from './TextInput';
import {
  FEEDBACK_AI_RESPONSE_LABEL,
  FEEDBACK_AI_RESPONSE_PLACEHOLDER,
  FEEDBACK_AREA_LABEL,
  FEEDBACK_AREA_OPTIONS,
  FEEDBACK_CLOSE,
  FEEDBACK_CONTACT_LABEL,
  FEEDBACK_CONTACT_OPTIONS,
  FEEDBACK_DESCRIPTION_LABEL,
  FEEDBACK_DESCRIPTION_PLACEHOLDER,
  FEEDBACK_EMAIL_LABEL,
  FEEDBACK_EMAIL_PLACEHOLDER,
  FEEDBACK_ERRORS,
  FEEDBACK_FEATURE_IDEA_LABEL,
  FEEDBACK_FEATURE_IDEA_PLACEHOLDER,
  FEEDBACK_FOOTER_NOTE,
  FEEDBACK_INTRO,
  FEEDBACK_REMOVE_SCREENSHOT,
  FEEDBACK_REPRO_LABEL,
  FEEDBACK_REPRO_PLACEHOLDER,
  FEEDBACK_SCREENSHOT_HINT,
  FEEDBACK_SCREENSHOT_LABEL,
  FEEDBACK_SENDING,
  FEEDBACK_SUBMIT,
  FEEDBACK_SUCCESS_BODY,
  FEEDBACK_SUCCESS_TITLE,
  FEEDBACK_TITLE,
  FEEDBACK_TYPE_LABEL,
  FEEDBACK_TYPE_OPTIONS,
  FEEDBACK_UPLOAD,
} from '../constants/feedbackMicrocopy';
import type { FeedbackArea, FeedbackScreenshotPayload, FeedbackType } from '../types/feedback';

interface FeedbackModalProps {
  onClose: () => void;
  defaultArea?: FeedbackArea;
}

const MAX_SCREENSHOT_BYTES = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg']);

function readScreenshotFile(file: File): Promise<FeedbackScreenshotPayload> {
  return new Promise((resolve, reject) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      reject(new Error(FEEDBACK_ERRORS.screenshotType));
      return;
    }

    if (file.size > MAX_SCREENSHOT_BYTES) {
      reject(new Error(FEEDBACK_ERRORS.screenshotSize));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve({
        filename: file.name,
        contentType: file.type,
        data: base64,
      });
    };
    reader.onerror = () => reject(new Error(FEEDBACK_ERRORS.submitFailed));
    reader.readAsDataURL(file);
  });
}

export function FeedbackModal({ onClose, defaultArea = 'general' }: FeedbackModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<FeedbackType | ''>('');
  const [area, setArea] = useState<FeedbackArea>(defaultArea);
  const [description, setDescription] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [reproductionSteps, setReproductionSteps] = useState('');
  const [featureIdea, setFeatureIdea] = useState('');
  const [contactOk, setContactOk] = useState<'yes' | 'no' | ''>('');
  const [email, setEmail] = useState('');
  const [screenshot, setScreenshot] = useState<FeedbackScreenshotPayload | null>(null);
  const [screenshotName, setScreenshotName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setArea(defaultArea);
  }, [defaultArea]);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, onClose]);

  const handleScreenshotChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const payload = await readScreenshotFile(file);
      setScreenshot(payload);
      setScreenshotName(file.name);
      setError(null);
    } catch (err) {
      setScreenshot(null);
      setScreenshotName('');
      setError(err instanceof Error ? err.message : FEEDBACK_ERRORS.submitFailed);
    }
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!type) nextErrors.type = FEEDBACK_ERRORS.typeRequired;
    if (!description.trim()) nextErrors.description = FEEDBACK_ERRORS.descriptionRequired;
    if (type === 'feature_idea' && !featureIdea.trim()) {
      nextErrors.featureIdea = FEEDBACK_ERRORS.featureIdeaRequired;
    }
    if (contactOk === 'yes') {
      if (!email.trim()) nextErrors.email = FEEDBACK_ERRORS.emailRequired;
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        nextErrors.email = FEEDBACK_ERRORS.emailInvalid;
      }
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    setError(null);
    if (!validate() || !type) return;

    setIsSubmitting(true);
    try {
      await submitFeedback({
        type,
        area,
        description: description.trim(),
        aiResponse: aiResponse.trim() || undefined,
        reproductionSteps: reproductionSteps.trim() || undefined,
        featureIdea: type === 'feature_idea' ? featureIdea.trim() : undefined,
        screenshot: screenshot ?? undefined,
        contactOk: contactOk === 'yes',
        email: contactOk === 'yes' ? email.trim() : undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : FEEDBACK_ERRORS.submitFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 p-m sm:items-center"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="max-h-[90vh] w-full max-w-content overflow-y-auto rounded-card border border-border bg-surface shadow-card"
        onClick={(event) => event.stopPropagation()}
      >
        {submitted ? (
          <div className="space-y-m p-l text-center">
            <h2 id={titleId} className="text-2xl font-semibold text-text-primary">
              {FEEDBACK_SUCCESS_TITLE}
            </h2>
            <p className="whitespace-pre-line text-base leading-relaxed text-text-secondary">
              {FEEDBACK_SUCCESS_BODY}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-button bg-primary px-m py-3 text-base font-medium text-white hover:bg-primary-hover"
            >
              {FEEDBACK_CLOSE}
            </button>
          </div>
        ) : (
          <div className="space-y-l p-l">
            <div>
              <h2 id={titleId} className="text-2xl font-semibold text-text-primary">
                {FEEDBACK_TITLE}
              </h2>
              <p className="mt-s text-base leading-relaxed text-text-secondary">{FEEDBACK_INTRO}</p>
            </div>

            {error && <StatusBanner type="error" message={error} />}

            <fieldset className="space-y-s">
              <legend className="text-sm font-semibold text-text-primary">
                1. {FEEDBACK_TYPE_LABEL} <span className="text-error">*</span>
              </legend>
              <div className="space-y-s">
                {FEEDBACK_TYPE_OPTIONS.map((option) => (
                  <label key={option.id} className="flex cursor-pointer items-start gap-s">
                    <input
                      type="radio"
                      name="feedback-type"
                      value={option.id}
                      checked={type === option.id}
                      onChange={() => {
                        setType(option.id);
                        setFieldErrors((current) => ({ ...current, type: '' }));
                      }}
                      className="mt-1"
                    />
                    <span className="text-base text-text-primary">{option.label}</span>
                  </label>
                ))}
              </div>
              {fieldErrors.type && <p className="text-sm text-error">{fieldErrors.type}</p>}
            </fieldset>

            <label className="block space-y-xs">
              <span className="text-sm font-semibold text-text-primary">
                2. {FEEDBACK_AREA_LABEL}
              </span>
              <select
                value={area}
                onChange={(event) => setArea(event.target.value as FeedbackArea)}
                className="w-full rounded-button border border-border bg-surface px-m py-s text-base text-text-primary"
              >
                {FEEDBACK_AREA_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-xs">
              <span className="text-sm font-semibold text-text-primary">
                3. {FEEDBACK_DESCRIPTION_LABEL} <span className="text-error">*</span>
              </span>
              <TextInput
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                  setFieldErrors((current) => ({ ...current, description: '' }));
                }}
                placeholder={FEEDBACK_DESCRIPTION_PLACEHOLDER}
                rows={6}
                error={Boolean(fieldErrors.description)}
              />
              {fieldErrors.description && (
                <p className="text-sm text-error">{fieldErrors.description}</p>
              )}
            </label>

            <label className="block space-y-xs">
              <span className="text-sm font-semibold text-text-primary">
                4. {FEEDBACK_AI_RESPONSE_LABEL}
              </span>
              <TextInput
                value={aiResponse}
                onChange={(event) => setAiResponse(event.target.value)}
                placeholder={FEEDBACK_AI_RESPONSE_PLACEHOLDER}
                rows={4}
              />
            </label>

            <label className="block space-y-xs">
              <span className="text-sm font-semibold text-text-primary">5. {FEEDBACK_REPRO_LABEL}</span>
              <TextInput
                value={reproductionSteps}
                onChange={(event) => setReproductionSteps(event.target.value)}
                placeholder={FEEDBACK_REPRO_PLACEHOLDER}
                rows={5}
              />
            </label>

            <div className="space-y-xs">
              <span className="text-sm font-semibold text-text-primary">
                6. {FEEDBACK_SCREENSHOT_LABEL}
              </span>
              <div className="flex flex-wrap items-center gap-s">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-button border border-border bg-background px-m py-s text-sm font-medium text-text-primary hover:bg-primary-light hover:text-primary"
                >
                  📷 {FEEDBACK_UPLOAD}
                </button>
                {screenshotName && (
                  <button
                    type="button"
                    onClick={() => {
                      setScreenshot(null);
                      setScreenshotName('');
                    }}
                    className="text-sm font-medium text-text-secondary underline-offset-2 hover:underline"
                  >
                    {FEEDBACK_REMOVE_SCREENSHOT} ({screenshotName})
                  </button>
                )}
              </div>
              <p className="text-sm text-text-secondary">{FEEDBACK_SCREENSHOT_HINT}</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={(event) => void handleScreenshotChange(event)}
              />
            </div>

            {type === 'feature_idea' && (
              <label className="block space-y-xs">
                <span className="text-sm font-semibold text-text-primary">
                  7. {FEEDBACK_FEATURE_IDEA_LABEL} <span className="text-error">*</span>
                </span>
                <TextInput
                  value={featureIdea}
                  onChange={(event) => {
                    setFeatureIdea(event.target.value);
                    setFieldErrors((current) => ({ ...current, featureIdea: '' }));
                  }}
                  placeholder={FEEDBACK_FEATURE_IDEA_PLACEHOLDER}
                  rows={4}
                  error={Boolean(fieldErrors.featureIdea)}
                />
                {fieldErrors.featureIdea && (
                  <p className="text-sm text-error">{fieldErrors.featureIdea}</p>
                )}
              </label>
            )}

            <fieldset className="space-y-s">
              <legend className="text-sm font-semibold text-text-primary">
                {type === 'feature_idea' ? '8.' : '7.'} {FEEDBACK_CONTACT_LABEL}
              </legend>
              <div className="flex gap-m">
                {FEEDBACK_CONTACT_OPTIONS.map((option) => (
                  <label key={option.id} className="flex cursor-pointer items-center gap-xs">
                    <input
                      type="radio"
                      name="feedback-contact"
                      value={option.id}
                      checked={contactOk === option.id}
                      onChange={() => {
                        setContactOk(option.id);
                        if (option.id === 'no') {
                          setEmail('');
                          setFieldErrors((current) => ({ ...current, email: '' }));
                        }
                      }}
                    />
                    <span className="text-base text-text-primary">{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {contactOk === 'yes' && (
              <label className="block space-y-xs">
                <span className="text-sm font-semibold text-text-primary">{FEEDBACK_EMAIL_LABEL}</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setFieldErrors((current) => ({ ...current, email: '' }));
                  }}
                  placeholder={FEEDBACK_EMAIL_PLACEHOLDER}
                  className={[
                    'w-full rounded-input border bg-surface px-m py-s text-base text-text-primary',
                    fieldErrors.email ? 'border-error' : 'border-border',
                  ].join(' ')}
                />
                {fieldErrors.email && <p className="text-sm text-error">{fieldErrors.email}</p>}
              </label>
            )}

            <p className="rounded-lg bg-background px-m py-s text-sm leading-relaxed text-text-secondary">
              {FEEDBACK_FOOTER_NOTE}
            </p>

            <div className="flex flex-col gap-s sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full rounded-button border border-border bg-background px-m py-3 text-base font-medium text-text-primary hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
              >
                {FEEDBACK_CLOSE}
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isSubmitting}
                className="w-full rounded-button bg-primary px-m py-3 text-base font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? FEEDBACK_SENDING : FEEDBACK_SUBMIT}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
