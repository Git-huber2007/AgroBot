import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';

export interface FeedbackWidgetProps {
  recordType: 'crop_advisory' | 'crop_recommendation' | 'pest_diagnosis' | 'fertilizer_plan';
  recordId: string;
}

export const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({
  recordType,
  recordId,
}) => {
  const [isHelpful, setIsHelpful] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (helpfulVal: boolean) => {
    setIsHelpful(helpfulVal);
    setIsSubmitting(true);
    try {
      await api.post('/feedback', {
        record_type: recordType,
        record_id: recordId,
        is_helpful: helpfulVal,
        comment: comment.trim() || undefined,
      });
      setIsSubmitted(true);
    } catch {
      // Allow retry
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl bg-leaf-50 border border-leaf-200 text-leaf-800 text-sm font-semibold">
        <CheckCircle2 className="w-5 h-5 text-leaf-600 shrink-0" />
        <span>Thank you! Your feedback helps train more accurate advisories.</span>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-stone-800">Was this advisory helpful?</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors min-h-[44px] ${
              isHelpful === true
                ? 'bg-leaf-100 border-leaf-300 text-leaf-800'
                : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <ThumbsUp className="w-4 h-4 text-leaf-600" />
            <span>Yes</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors min-h-[44px] ${
              isHelpful === false
                ? 'bg-red-100 border-red-300 text-red-800'
                : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <ThumbsDown className="w-4 h-4 text-red-600" />
            <span>No</span>
          </button>
        </div>
      </div>

      {isHelpful !== null && !isSubmitted && (
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-stone-200/60 animate-fadeIn">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional comment on accuracy or practical usefulness..."
            maxLength={500}
            className="flex-1 text-xs sm:text-sm px-3 py-2 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-leaf-500"
          />
          <Button
            size="sm"
            onClick={() => handleSubmit(isHelpful)}
            isLoading={isSubmitting}
          >
            Send Note
          </Button>
        </div>
      )}
    </div>
  );
};
