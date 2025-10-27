"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePrivaPoll, PollWithQuestions } from "@/hooks/usePrivaPoll";
import Link from "next/link";

export default function PollPage() {
  const router = useRouter();
  const params = useParams();
  const pollId = BigInt(params.id as string);
  
  const { getPollWithQuestions, submitResponse, hasUserResponded, isReady } = usePrivaPoll();

  const [poll, setPoll] = useState<PollWithQuestions | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasResponded, setHasResponded] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isReady) {
      loadPoll();
    }
  }, [isReady, pollId]);

  const loadPoll = async () => {
    try {
      setIsLoading(true);
      const pollData = await getPollWithQuestions(pollId);
      if (!pollData) {
        setError("Poll not found");
        return;
      }
      setPoll(pollData);

      const responded = await hasUserResponded(pollId);
      setHasResponded(responded);
    } catch (err: any) {
      console.error("Failed to load poll:", err);
      setError(err.message || "Failed to load poll");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSingleChoiceAnswer = (questionId: number, optionIndex: number) => {
    setAnswers({ ...answers, [questionId]: optionIndex });
  };

  const handleMultipleChoiceAnswer = (questionId: number, optionIndex: number) => {
    const currentAnswer = answers[questionId] || 0;
    const newAnswer = currentAnswer ^ (1 << optionIndex); // Toggle bit
    setAnswers({ ...answers, [questionId]: newAnswer });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!poll) return;

    // Validate all questions answered
    for (const question of poll.questions) {
      if (!(question.id in answers)) {
        setError("Please answer all questions");
        return;
      }
    }

    try {
      setIsSubmitting(true);

      // Convert answers to array in question order
      const answerArray = poll.questions.map((q) => answers[q.id]);

      await submitResponse(pollId, answerArray);

      setSuccess(true);
      setTimeout(() => {
        router.push("/my-responses");
      }, 2000);
    } catch (err: any) {
      console.error("Failed to submit response:", err);
      setError(err.message || "Failed to submit response");
      setIsSubmitting(false);
    }
  };

  if (!isReady || isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="glass rounded-xl p-8 text-center">
          <div className="text-lg">⏳ Loading poll...</div>
        </div>
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="glass rounded-xl p-8 text-center space-y-4">
          <div className="text-lg text-red-600">❌ {error}</div>
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold transition-all"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (!poll) return null;

  const now = new Date();
  const startTime = new Date(Number(poll.startTime) * 1000);
  const endTime = new Date(Number(poll.endTime) * 1000);
  const isActive = poll.isActive && now >= startTime && now <= endTime;

  if (success) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="glass rounded-xl p-8 text-center space-y-4">
          <div className="text-5xl">✅</div>
          <div className="text-2xl font-bold text-primary">Response Submitted!</div>
          <p className="text-lg">Your encrypted response has been saved on-chain.</p>
          <div className="pt-4">
            <Link
              href="/my-responses"
              className="inline-block px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold transition-all"
            >
              View My Responses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="glass rounded-xl p-6 md:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-primary mb-2">{poll.title}</h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            {poll.description}
          </p>
          
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Start:</span>{" "}
              <span className="font-semibold">{startTime.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">End:</span>{" "}
              <span className="font-semibold">{endTime.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Responses:</span>{" "}
              <span className="font-semibold">{poll.responseCount.toString()}</span>
            </div>
          </div>

          {!isActive && (
            <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 p-3 rounded-lg">
              {now < startTime && "Poll has not started yet"}
              {now > endTime && "Poll has ended"}
              {!poll.isActive && "Poll has been closed by creator"}
            </div>
          )}

          {hasResponded && (
            <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 p-3 rounded-lg">
              You have already responded to this poll
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {isActive && !hasResponded && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {poll.questions.map((question, index) => (
              <div key={question.id} className="glass rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold">
                  {index + 1}. {question.text}
                  <span className="ml-2 text-sm text-gray-500">
                    ({question.type === "single" ? "Single Choice" : "Multiple Choice"})
                  </span>
                </h3>

                <div className="space-y-2">
                  {question.options.map((option, optIndex) => {
                    const isSelected =
                      question.type === "single"
                        ? answers[question.id] === optIndex
                        : !!(answers[question.id] && (answers[question.id] & (1 << optIndex)));

                    return (
                      <label
                        key={optIndex}
                        className={`flex items-center gap-3 p-4 glass rounded-lg cursor-pointer transition-all hover:bg-white/30 ${
                          isSelected ? "ring-2 ring-primary bg-white/20" : ""
                        }`}
                      >
                        <input
                          type={question.type === "single" ? "radio" : "checkbox"}
                          name={`question-${question.id}`}
                          checked={isSelected}
                          onChange={() =>
                            question.type === "single"
                              ? handleSingleChoiceAnswer(question.id, optIndex)
                              : handleMultipleChoiceAnswer(question.id, optIndex)
                          }
                          className="w-4 h-4"
                        />
                        <span>{option}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting (Encrypting)..." : "Submit Encrypted Response"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 glass hover:bg-white/30 rounded-lg font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {(hasResponded || !isActive) && (
          <div className="flex gap-4">
            <Link
              href={`/poll/${pollId}/results`}
              className="flex-1 text-center px-6 py-3 bg-secondary hover:bg-accent text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
            >
              View Results
            </Link>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 glass hover:bg-white/30 rounded-lg font-semibold transition-all"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

