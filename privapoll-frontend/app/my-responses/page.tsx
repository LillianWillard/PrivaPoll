"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePrivaPoll, PollInfo } from "@/hooks/usePrivaPoll";

export default function MyResponsesPage() {
  const { getMyResponses, getPollInfo, isReady } = usePrivaPoll();

  const [pollIds, setPollIds] = useState<bigint[]>([]);
  const [polls, setPolls] = useState<Record<string, PollInfo>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isReady) {
      loadResponses();
    }
  }, [isReady]);

  const loadResponses = async () => {
    try {
      setIsLoading(true);
      const ids = await getMyResponses();
      setPollIds(ids);

      // Load info for each poll
      const pollsData: Record<string, PollInfo> = {};
      for (const id of ids) {
        const info = await getPollInfo(id);
        pollsData[id.toString()] = info;
      }
      setPolls(pollsData);
    } catch (err: any) {
      console.error("Failed to load responses:", err);
      setError(err.message || "Failed to load responses");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isReady || isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="glass rounded-xl p-8 text-center">
          <div className="text-lg">⏳ Loading your responses...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="glass rounded-xl p-8 text-center">
          <div className="text-lg text-red-600">❌ {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="glass rounded-xl p-6 md:p-8">
        <h1 className="text-3xl font-bold text-primary mb-6">My Responses</h1>

        {pollIds.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
              You haven't responded to any polls yet
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold transition-all"
            >
              Explore Polls
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {pollIds.map((pollId) => {
              const poll = polls[pollId.toString()];
              if (!poll) return null;

              const now = new Date();
              const endTime = new Date(Number(poll.endTime) * 1000);
              const isEnded = now > endTime || !poll.isActive;

              return (
                <div key={pollId.toString()} className="glass rounded-lg p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-primary mb-2">
                        {poll.title}
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {poll.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Status:</span>{" "}
                          <span
                            className={`font-semibold ${
                              isEnded
                                ? "text-gray-600 dark:text-gray-400"
                                : "text-green-600 dark:text-green-400"
                            }`}
                          >
                            {isEnded ? "🔴 Ended" : "🟢 Active"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Total Responses:</span>{" "}
                          <span className="font-semibold">{poll.responseCount.toString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Questions:</span>{" "}
                          <span className="font-semibold">{poll.questionCount}</span>
                        </div>
                      </div>

                      <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg text-sm">
                        ✅ You responded to this poll
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/poll/${pollId}`}
                        className="px-4 py-2 bg-secondary hover:bg-accent text-white rounded-lg font-semibold transition-all text-center whitespace-nowrap"
                      >
                        View Poll
                      </Link>
                      {isEnded && (
                        <Link
                          href={`/poll/${pollId}/results`}
                          className="px-4 py-2 glass hover:bg-white/30 rounded-lg font-semibold transition-all text-center whitespace-nowrap"
                        >
                          View Results
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 border-t pt-3">
                    <div>End Time: {endTime.toLocaleString()}</div>
                    <div>Creator: {poll.creator.slice(0, 10)}...{poll.creator.slice(-8)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

