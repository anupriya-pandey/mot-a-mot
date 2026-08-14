import { MessageCircle, LogOut } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AUTH_SIGN_OUT } from '../constants/authMicrocopy';
import { FEEDBACK_BUTTON } from '../constants/feedbackMicrocopy';
import { useAuth } from '../contexts/AuthContext';
import type { FeedbackArea } from '../types/feedback';
import type { AppTab } from '../types/history';
import { AppTabs } from './AppTabs';
import { FeedbackModal } from './FeedbackModal';

interface AppHeaderProps {
  active: AppTab;
  onChange: (tab: AppTab) => void;
}

function tabToFeedbackArea(tab: AppTab): FeedbackArea {
  if (tab === 'check' || tab === 'toolbox' || tab === 'practice' || tab === 'history') {
    return tab;
  }
  return 'general';
}

export function AppHeader({ active, onChange }: AppHeaderProps) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const { authEnabled, signOut } = useAuth();
  const defaultArea = useMemo(() => tabToFeedbackArea(active), [active]);

  return (
    <>
      <div className="mx-auto w-full max-w-content px-m pt-m">
        <div className="mb-s flex justify-end gap-s">
          {authEnabled && (
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex items-center gap-xs rounded-button border border-border bg-surface px-m py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-primary-light hover:text-primary"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              {AUTH_SIGN_OUT}
            </button>
          )}
          <button
            type="button"
            onClick={() => setFeedbackOpen(true)}
            className="inline-flex items-center gap-xs rounded-button border border-border bg-surface px-m py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-primary-light hover:text-primary"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            {FEEDBACK_BUTTON}
          </button>
        </div>
        <AppTabs active={active} onChange={onChange} />
      </div>

      {feedbackOpen && (
        <FeedbackModal defaultArea={defaultArea} onClose={() => setFeedbackOpen(false)} />
      )}
    </>
  );
}
