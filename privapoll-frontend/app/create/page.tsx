"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivaPoll, QuestionData } from "@/hooks/usePrivaPoll";

export default function CreatePollPage() {
  const router = useRouter();
  const { createPoll, isReady } = usePrivaPoll();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [questions, setQuestions] = useState<QuestionData[]>([
    { id: 1, text: "", type: "single", options: ["", ""] },
  ]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const addQuestion = () => {
    const newId = questions.length > 0 ? Math.max(...questions.map((q) => q.id)) + 1 : 1;
    setQuestions([
      ...questions,
      { id: newId, text: "", type: "single", options: ["", ""] },
    ]);
  };

  const removeQuestion = (id: number) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const updateQuestion = (id: number, field: keyof QuestionData, value: any) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const addOption = (questionId: number) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId ? { ...q, options: [...q.options, ""] } : q
      )
    );
  };

  const removeOption = (questionId: number, optionIndex: number) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? { ...q, options: q.options.filter((_, i) => i !== optionIndex) }
          : q
      )
    );
  };

  const updateOption = (questionId: number, optionIndex: number, value: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt, i) => (i === optionIndex ? value : opt)),
            }
          : q
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (!description.trim()) {
      setError("Description is required");
      return;
    }

    if (!startTime || !endTime) {
      setError("Start and end times are required");
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      setError("End time must be after start time");
      return;
    }

    if (questions.length === 0) {
      setError("At least one question is required");
      return;
    }

    for (const q of questions) {
      if (!q.text.trim()) {
        setError("All questions must have text");
        return;
      }
      if (q.options.length < 2) {
        setError("All questions must have at least 2 options");
        return;
      }
      if (q.options.some((opt) => !opt.trim())) {
        setError("All options must have text");
        return;
      }
    }

    try {
      setIsCreating(true);

      const pollId = await createPoll({
        title,
        description,
        startTime: start,
        endTime: end,
        questions,
        isPublic,
      });

      console.log("Poll created with ID:", pollId.toString());
      router.push(`/poll/${pollId}`);
    } catch (err: any) {
      console.error("Failed to create poll:", err);
      setError(err.message || "Failed to create poll");
      setIsCreating(false);
    }
  };

  if (!isReady) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="glass rounded-xl p-8 text-center">
          <div className="text-lg">
            ⏳ Initializing FHEVM... Please wait.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="glass rounded-xl p-6 md:p-8">
        <h1 className="text-3xl font-bold text-primary mb-6">Create New Poll</h1>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Poll Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter poll title"
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                placeholder="Describe your poll"
                maxLength={1000}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-2 glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-2 glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="isPublic" className="text-sm font-semibold">
                Public Poll (visible to everyone)
              </label>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Questions</h2>
              <button
                type="button"
                onClick={addQuestion}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold transition-all"
              >
                + Add Question
              </button>
            </div>

            {questions.map((question, qIndex) => (
              <div key={question.id} className="glass rounded-lg p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold mb-2">
                      Question {qIndex + 1} *
                    </label>
                    <input
                      type="text"
                      value={question.text}
                      onChange={(e) =>
                        updateQuestion(question.id, "text", e.target.value)
                      }
                      className="w-full px-4 py-2 glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter question"
                      maxLength={500}
                    />
                  </div>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(question.id)}
                      className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Type
                  </label>
                  <select
                    value={question.type}
                    onChange={(e) =>
                      updateQuestion(question.id, "type", e.target.value as "single" | "multiple")
                    }
                    className="px-4 py-2 glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="single">Single Choice</option>
                    <option value="multiple">Multiple Choice</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold">
                      Options (min 2, max 10)
                    </label>
                    {question.options.length < 10 && (
                      <button
                        type="button"
                        onClick={() => addOption(question.id)}
                        className="px-3 py-1 bg-secondary hover:bg-accent text-white rounded text-sm transition-all"
                      >
                        + Add Option
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) =>
                            updateOption(question.id, optIndex, e.target.value)
                          }
                          className="flex-1 px-4 py-2 glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder={`Option ${optIndex + 1}`}
                          maxLength={200}
                        />
                        {question.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(question.id, optIndex)}
                            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isCreating}
              className="flex-1 px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? "Creating..." : "Create Poll"}
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
      </div>
    </div>
  );
}

