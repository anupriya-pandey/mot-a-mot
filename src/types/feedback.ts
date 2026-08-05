export type FeedbackType =
  | 'bug_report'
  | 'feature_idea'
  | 'ui_ux'
  | 'incorrect_french'
  | 'other';

export type FeedbackArea =
  | 'check'
  | 'toolbox'
  | 'practice'
  | 'history'
  | 'general'
  | 'not_sure';

export interface FeedbackScreenshotPayload {
  filename: string;
  contentType: string;
  data: string;
}

export interface FeedbackRequest {
  type: FeedbackType;
  area: FeedbackArea;
  description: string;
  aiResponse?: string;
  reproductionSteps?: string;
  featureIdea?: string;
  screenshot?: FeedbackScreenshotPayload;
  contactOk: boolean;
  email?: string;
}
