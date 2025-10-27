"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePrivaPoll, PollInfo } from "@/hooks/usePrivaPoll";

export default function AllPollsPage() {
  const { contract, isReady } = usePrivaPoll();

  const [pollIds, setPollIds] = useState<bigint[]>([]);
  const [polls, setPolls] = useState<Record<string, PollInfo>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isReady && contract) {
      loadAllPolls();
    }
  }, [isReady, contract]);

  const loadAllPolls = async () => {
    try {
      setIsLoading(true);
      
      // Query all PollCreated events
      const filter = contract!.filters.PollCreated();
      const events = await contract!.queryFilter(filter);

      const ids: bigint[] = [];
      const pollsData: Record<string, PollInfo> = {};

      for (const event of events) {
        try {
          const pollId = (event as any).args.pollId;
          ids.push(pollId);

          // Get poll info
          const info = await contract!.getPollInfo(pollId);
          pollsData[pollId.toString()] = {
            id: info.id,
            creator: info.creator,
            title: info.title,
            description: info.description,
            startTime: info.startTime,
            endTime: info.endTime,
            questionCount: Number(info.questionCount),
            isPublic: info.isPublic,
            responseCount: info.responseCount,
            isActive: info.isActive,
          };
        } catch (err) {
          console.error("Failed to load poll info:", err);
          // Continue with other polls
        }
      }

      // Sort by poll ID (newest first)
      ids.sort((a, b) => Number(b) - Number(a));

      setPollIds(ids);
      setPolls(pollsData);
    } catch (err: any) {
      console.error("Failed to load polls:", err);
      setError(err.message || "Failed to load polls");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isReady || isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="glass rounded-xl p-8 text-center">
          <div className="text-lg">⏳ Loading all polls...</div>
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary">All Polls</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Browse and participate in public polls
            </p>
          </div>
          <Link
            href="/create"
            className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
          >
            + Create Poll
          </Link>
        </div>

        {pollIds.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
              No polls created yet
            </p>
            <Link
              href="/create"
              className="inline-block px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold transition-all"
            >
              Create the First Poll
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {pollIds.map((pollId) => {
              const poll = polls[pollId.toString()];
              if (!poll) return null;

              // Only show public polls
              if (!poll.isPublic) return null;

              const now = new Date();
              const startTime = new Date(Number(poll.startTime) * 1000);
              const endTime = new Date(Number(poll.endTime) * 1000);
              const isActive = poll.isActive && now >= startTime && now <= endTime;
              const isPending = now < startTime;
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
                              isActive
                                ? "text-green-600 dark:text-green-400"
                                : isPending
                                ? "text-yellow-600 dark:text-yellow-400"
                                : "text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            {isActive && "🟢 Active"}
                            {isPending && "🟡 Pending"}
                            {isEnded && "🔴 Ended"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Responses:</span>{" "}
                          <span className="font-semibold">{poll.responseCount.toString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Questions:</span>{" "}
                          <span className="font-semibold">{poll.questionCount}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Creator:</span>{" "}
                          <span className="font-mono text-xs">
                            {poll.creator.slice(0, 6)}...{poll.creator.slice(-4)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/poll/${pollId}`}
                        className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold transition-all text-center whitespace-nowrap"
                      >
                        {isActive ? "Participate" : "View"}
                      </Link>
                      {isEnded && (
                        <Link
                          href={`/poll/${pollId}/results`}
                          className="px-4 py-2 glass hover:bg-white/30 rounded-lg font-semibold transition-all text-center whitespace-nowrap"
                        >
                          Results
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 border-t pt-3">
                    <div>Start: {startTime.toLocaleString()}</div>
                    <div>End: {endTime.toLocaleString()}</div>
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

