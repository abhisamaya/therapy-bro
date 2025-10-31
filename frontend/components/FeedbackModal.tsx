"use client";
import { useState } from "react";
import { X } from "lucide-react";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSkip: () => void;
  onSubmit: (data: { rating: number; tags: string[]; comment: string }) => void;
  isSubmitting?: boolean;
}

const AVAILABLE_TAGS = ["Helpful", "Good Listener", "Empathetic", "Insightful"];

export default function FeedbackModal({
  isOpen,
  onClose,
  onSkip,
  onSubmit,
  isSubmitting = false,
}: FeedbackModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState<string>("");

  if (!isOpen) return null;

  const handleStarClick = (star: number) => {
    setRating(star);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }
    onSubmit({ rating, tags: selectedTags, comment });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Rate Your Session
          </h3>
          <button
            onClick={onClose}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Text */}
        <p className="text-base text-center text-gray-700 dark:text-gray-300">
          Your feedback helps us improve.
        </p>

        {/* Five-Star Rating */}
        <div className="flex justify-center gap-2 py-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleStarClick(star)}
              className="flex items-center justify-center p-2 rounded-full cursor-pointer transition-transform duration-200 hover:scale-110"
            >
              <svg
                className="w-9 h-9"
                viewBox="0 0 24 24"
                fill={star <= rating ? "#5DBA9D" : "none"}
                stroke={star <= rating ? "#5DBA9D" : "#D1D5DB"}
                strokeWidth="2"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          ))}
        </div>

        {/* Tags */}
        <div className="flex flex-col items-start gap-3">
          <p className="text-base font-medium text-gray-900 dark:text-gray-100">
            What went well?
          </p>
          <div className="flex gap-3 flex-wrap">
            {AVAILABLE_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 transition-colors ${
                  selectedTags.includes(tag)
                    ? "bg-primary/30 dark:bg-primary/40"
                    : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    selectedTags.includes(tag)
                      ? "text-primary dark:text-primary"
                      : "text-gray-900 dark:text-gray-100"
                  }`}
                >
                  {tag}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div className="flex flex-col w-full">
          <label className="text-base font-medium text-gray-900 dark:text-gray-100 pb-2">
            Anything else to add?
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-gray-900 dark:text-gray-100 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-primary/80 min-h-36 placeholder:text-gray-500 dark:placeholder:text-gray-400 p-[15px] text-base font-normal leading-normal"
            placeholder="Tell us more about your experience (optional)..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-4">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="w-full rounded-lg bg-primary px-4 py-3 text-center font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </button>

          <button
            onClick={onSkip}
            disabled={isSubmitting}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-600 dark:text-gray-300 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
