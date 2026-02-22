import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardCtx() {
    const reviews = await prisma.review.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
            repository: true,
            pullRequest: true,
        },
    });

    const totalReviews = await prisma.review.count();
    const issuesFound = await prisma.review.aggregate({
        _sum: { issuesFound: true },
    });

    // Calculate average duration
    const avgDuration = await prisma.review.aggregate({
        _avg: { duration: true },
    });

    // Format duration: "1.2s" or "N/A"
    const avgTimeSeconds = avgDuration._avg.duration
        ? (avgDuration._avg.duration / 1000).toFixed(1) + "s"
        : "N/A";

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col p-8">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500">Overview of AI Code Reviews</p>
                </div>
                <Link
                    href="/"
                    className="bg-zinc-900 text-white px-4 py-2 rounded shadow hover:bg-zinc-700 transition"
                >
                    Back Home
                </Link>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500">Total Reviews</h3>
                    <p className="text-3xl font-bold mt-2 text-gray-900">{totalReviews ?? 0}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500">Issues Caught</h3>
                    <p className="text-3xl font-bold mt-2 text-red-500">
                        {issuesFound._sum.issuesFound || 0}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500">Avg. Review Time</h3>
                    <p className="text-3xl font-bold mt-2 text-green-600">{avgTimeSeconds}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold">Recent Activity</h2>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                        <tr>
                            <th className="px-6 py-3 font-medium">Repository</th>
                            <th className="px-6 py-3 font-medium">PR #</th>
                            <th className="px-6 py-3 font-medium">Status</th>
                            <th className="px-6 py-3 font-medium">Issues</th>
                            <th className="px-6 py-3 font-medium">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {reviews.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                    No reviews yet. Configure the GitHub App to start.
                                </td>
                            </tr>
                        ) : (
                            reviews.map((review) => {
                                const issues = review.issues ? JSON.parse(review.issues as string) : [];
                                const quotaError = issues.find((i: any) => i.message?.toLowerCase().includes("quota") || i.category === "System");

                                return (
                                    <tr key={review.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {review.repository?.owner}/{review.repository?.name || "Unknown"}
                                        </td>
                                        <td className="px-6 py-4 text-blue-600">
                                            #{review.pullRequest?.number || "?"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${review.status === "APPROVED"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-red-100 text-red-800"
                                                }`}>
                                                {quotaError ? "QUOTA EXCEEDED" : review.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {quotaError ? (
                                                <span className="text-red-600 text-xs font-mono">{quotaError.message}</span>
                                            ) : (
                                                <div className="space-y-2 max-w-xl">
                                                    {issues.map((issue: any, idx: number) => (
                                                        <div key={idx} className="text-xs border-l-2 border-red-200 pl-2">
                                                            <div className="font-semibold">
                                                                <span className={
                                                                    issue.severity === 'CRITICAL' ? 'text-red-700' :
                                                                        issue.severity === 'HIGH' ? 'text-orange-600' :
                                                                            'text-yellow-600'
                                                                }>
                                                                    [{issue.severity}]
                                                                </span>
                                                                <span className="text-gray-600 ml-1">in {issue.file}</span>
                                                            </div>
                                                            <div className="text-gray-800">{issue.message}</div>
                                                            <div className="mt-1 bg-gray-50 p-1 rounded font-mono text-gray-600 truncate">
                                                                {issue.fix_code}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {issues.length === 0 && <span className="text-green-600 text-xs">No issues found ✨</span>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500" suppressHydrationWarning>
                                            {new Date(review.createdAt).toISOString().split('T')[0]}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
