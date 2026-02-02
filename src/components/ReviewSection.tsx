"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Star, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface Review {
    id: string;
    user_name: string;
    rating: number;
    comment: string;
    created_at: string;
}

interface ReviewSectionProps {
    coffeeId: string;
}

export default function ReviewSection({ coffeeId }: ReviewSectionProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [userName, setUserName] = useState("");
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchReviews();
    }, [coffeeId]);

    const fetchReviews = async () => {
        try {
            const { data, error } = await supabase
                .from("reviews")
                .select("*")
                .eq("coffee_id", coffeeId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setReviews(data || []);
        } catch (error) {
            console.error("Error fetching reviews:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userName.trim() || !comment.trim()) return;

        setSubmitting(true);
        try {
            const { error } = await supabase.from("reviews").insert([
                {
                    coffee_id: coffeeId,
                    user_name: userName,
                    rating,
                    comment,
                },
            ]);

            if (error) throw error;

            // Reset form and reload
            setUserName("");
            setComment("");
            setRating(5);
            setShowForm(false);
            fetchReviews();
        } catch (error) {
            alert("提交評價失敗，請稍後再試。");
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mt-6 border-t border-gray-100 pt-6 text-left">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-900 tracking-wider flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                    評價 ({reviews.length})
                </h4>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="text-xs text-gray-500 hover:text-gray-900 underline underline-offset-2"
                >
                    {showForm ? "取消評價" : "撰寫評價"}
                </button>
            </div>

            {/* Review Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 p-4 rounded-sm space-y-3">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">評分</label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="focus:outline-none"
                                >
                                    <Star
                                        className={cn(
                                            "w-5 h-5 transition-colors",
                                            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                        )}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-500 mb-1">暱稱</label>
                        <input
                            type="text"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            className="w-full text-sm p-2 border border-gray-200 rounded-sm focus:border-gray-900 outline-none"
                            placeholder="您的稱呼"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-500 mb-1">留言</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full text-sm p-2 border border-gray-200 rounded-sm focus:border-gray-900 outline-none resize-none h-20"
                            placeholder="分享您的品飲心得..."
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-2 bg-gray-900 text-white text-xs tracking-widest hover:bg-gray-800 disabled:bg-gray-300 transition-colors"
                    >
                        {submitting ? "提交中..." : "送出評價"}
                    </button>
                </form>
            )}

            {/* Review List */}
            <div className="space-y-4 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                {loading ? (
                    <p className="text-xs text-center text-gray-400 py-4">載入中...</p>
                ) : reviews.length === 0 ? (
                    <p className="text-xs text-center text-gray-400 py-4">暫無評價，成為第一個評論者吧！</p>
                ) : (
                    reviews.map((review) => (
                        <div key={review.id} className="bg-gray-50 p-3 rounded-sm">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-medium text-gray-900">{review.user_name}</span>
                                <div className="flex">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={cn(
                                                "w-3 h-3",
                                                i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">{review.comment}</p>
                            <span className="text-[10px] text-gray-400 mt-2 block">
                                {new Date(review.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
