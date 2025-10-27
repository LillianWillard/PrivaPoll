"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePrivaPoll, PollWithQuestions } from "@/hooks/usePrivaPoll";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useApp } from "@/app/providers";

interface DecryptedResponse {
  respondent: string;
  answers: number[];
}

export default function PollResultsPage() {
  const router = useRouter();
  const params = useParams();
  const pollId = BigInt(params.id as string);
  
  const { wallet } = useApp();
  const { getPollWithQuestions, getPollResponses, decryptResponses, isReady } = usePrivaPoll();

  const [poll, setPoll] = useState<PollWithQuestions | null>(null);
  const [respondents, setRespondents] = useState<string[]>([]);
  const [decryptedResponses, setDecryptedResponses] = useState<DecryptedResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState("");
  const [canView, setCanView] = useState(false);

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

      // Check if user can view results (creator or respondent)
      const addresses = await getPollResponses(pollId);
      setRespondents(addresses);

      const userCanView =
        !!wallet.account &&
        (pollData.creator.toLowerCase() === wallet.account.toLowerCase() ||
          addresses.some((addr) => addr.toLowerCase() === wallet.account?.toLowerCase()));

      setCanView(userCanView);
    } catch (err: any) {
      console.error("Failed to load poll:", err);
      setError(err.message || "Failed to load poll");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecrypt = async () => {
    if (!poll || respondents.length === 0 || !wallet.account) return;

    try {
      setIsDecrypting(true);
      setError("");

      const responses: DecryptedResponse[] = [];

      // Check if current user is the creator
      const isCreator = poll.creator.toLowerCase() === wallet.account.toLowerCase();

      if (isCreator) {
        // Creator can decrypt all responses
        for (const respondent of respondents) {
          try {
            const answers = await decryptResponses(pollId, respondent);
            responses.push({ respondent, answers });
          } catch (err) {
            console.error(`Failed to decrypt response from ${respondent}:`, err);
            // Continue with other responses
          }
        }
      } else {
        // Participant can only decrypt their own response
        try {
          const answers = await decryptResponses(pollId, wallet.account);
          responses.push({ respondent: wallet.account, answers });
        } catch (err) {
          console.error(`Failed to decrypt own response:`, err);
          setError("Failed to decrypt your response");
        }
      }

      setDecryptedResponses(responses);
    } catch (err: any) {
      console.error("Failed to decrypt responses:", err);
      setError(err.message || "Failed to decrypt responses");
    } finally {
      setIsDecrypting(false);
    }
  };

  const getQuestionStats = (questionIndex: number) => {
    if (!poll || decryptedResponses.length === 0) return null;

    const question = poll.questions[questionIndex];
    const counts: Record<number, number> = {};

    // Initialize counts
    for (let i = 0; i < question.options.length; i++) {
      counts[i] = 0;
    }

    // Count responses
    for (const response of decryptedResponses) {
      const answer = response.answers[questionIndex];
      
      if (question.type === "single") {
        counts[answer] = (counts[answer] || 0) + 1;
      } else {
        // Multiple choice: decode bitmask
        for (let i = 0; i < question.options.length; i++) {
          if (answer & (1 << i)) {
            counts[i] = (counts[i] || 0) + 1;
          }
        }
      }
    }

    // Convert to chart data
    const data = question.options.map((option, index) => ({
      name: option,
      value: counts[index] || 0,
    }));

    return { question, data, totalResponses: decryptedResponses.length };
  };

  const COLORS = ["#9333EA", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#14B8A6", "#F97316"];

  if (!isReady || isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="glass rounded-xl p-8 text-center">
          <div className="text-lg">⏳ Loading results...</div>
        </div>
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="glass rounded-xl p-8 text-center space-y-4">
          <div className="text-lg text-red-600">❌ {error}</div>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!poll) return null;

  if (!canView) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="glass rounded-xl p-8 text-center space-y-4">
          <div className="text-5xl">🔒</div>
          <h2 className="text-2xl font-bold text-primary">Access Denied</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Only the poll creator and respondents can view the results.
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass rounded-xl p-6 md:p-8">
        <h1 className="text-3xl font-bold text-primary mb-2">{poll.title}</h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
          {poll.description}
        </p>
        
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Total Responses:</span>{" "}
            <span className="font-semibold">{respondents.length}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Questions:</span>{" "}
            <span className="font-semibold">{poll.questionCount}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Decrypted:</span>{" "}
            <span className="font-semibold">
              {decryptedResponses.length}/{respondents.length}
            </span>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Decrypt Button */}
      {decryptedResponses.length === 0 && respondents.length > 0 && wallet.account && (
        <div className="glass rounded-xl p-6 text-center">
          {poll.creator.toLowerCase() === wallet.account.toLowerCase() ? (
            <>
              <p className="text-lg mb-2">
                As the poll creator, you can decrypt and view all responses.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Total responses: {respondents.length}
              </p>
            </>
          ) : (
            <>
              <p className="text-lg mb-2">
                As a participant, you can decrypt and view your own response.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                You cannot view other participants' responses due to privacy protection.
              </p>
            </>
          )}
          <button
            onClick={handleDecrypt}
            disabled={isDecrypting}
            className="px-8 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDecrypting ? "Decrypting... (this may take a while)" : "Decrypt Results"}
          </button>
        </div>
      )}

      {/* No Responses */}
      {respondents.length === 0 && (
        <div className="glass rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            No responses yet
          </p>
        </div>
      )}

      {/* Charts */}
      {decryptedResponses.length > 0 && (
        <div className="space-y-6">
          {poll.questions.map((question, index) => {
            const stats = getQuestionStats(index);
            if (!stats) return null;

            return (
              <div key={question.id} className="glass rounded-xl p-6">
                <h2 className="text-xl font-bold mb-2">
                  {index + 1}. {question.text}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Type: {question.type === "single" ? "Single Choice" : "Multiple Choice"} •{" "}
                  Responses: {stats.totalResponses}
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Bar Chart */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Bar Chart</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats.data}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#9333EA" name="Responses" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Pie Chart */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Pie Chart</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={stats.data}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {stats.data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Data Table */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Response Breakdown</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-300 dark:border-gray-700">
                          <th className="text-left py-2 px-3">Option</th>
                          <th className="text-right py-2 px-3">Count</th>
                          <th className="text-right py-2 px-3">Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.data.map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-200 dark:border-gray-800">
                            <td className="py-2 px-3">{item.name}</td>
                            <td className="text-right py-2 px-3 font-semibold">{item.value}</td>
                            <td className="text-right py-2 px-3">
                              {((item.value / stats.totalResponses) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Back Button */}
      <div className="text-center">
        <button
          onClick={() => router.back()}
          className="px-6 py-3 glass hover:bg-white/30 rounded-lg font-semibold transition-all"
        >
          Back to Poll
        </button>
      </div>
    </div>
  );
}

