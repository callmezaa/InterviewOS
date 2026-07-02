'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ThumbsUp, MessageCircle, Award, Star, User, Sparkles, Pin, TrendingUp } from 'lucide-react';
import { Card } from '../../../components/ui/Card';

interface Post {
  id: number;
  author: string;
  role: string;
  avatar: string;
  title: string;
  content: string;
  upvotes: number;
  replies: number;
  pinned?: boolean;
  tags: string[];
}

const posts: Post[] = [
  {
    id: 1,
    author: 'Sarah Chen',
    role: 'Senior Engineer at Stripe',
    avatar: 'SC',
    title: 'My framework for system design interviews',
    content: 'After conducting 200+ interviews, here is my structured approach: start with requirements, define data model, then scale incrementally. The AI Copilot has been a game-changer for keeping me on track.',
    upvotes: 47,
    replies: 23,
    pinned: true,
    tags: ['System Design', 'Framework'],
  },
  {
    id: 2,
    author: 'Marcus Johnson',
    role: 'Engineering Manager at Airbnb',
    avatar: 'MJ',
    title: 'Reducing bias with Blind Interview Mode',
    content: 'We switched to blind mode 3 months ago. Our diverse hire rate went from 18% to 41%. The data speaks for itself — removing identity from the equation lets skills shine.',
    upvotes: 38,
    replies: 19,
    pinned: true,
    tags: ['DEI', 'Best Practices'],
  },
  {
    id: 3,
    author: 'Priya Patel',
    role: 'Tech Lead at Google',
    avatar: 'PP',
    title: 'Quick tip: Use the progress bar to pace yourself',
    content: 'I tell all candidates to glance at the progress bar periodically. It helps them calibrate how much time to spend on each section. Interviewers, enable it!',
    upvotes: 29,
    replies: 12,
    tags: ['Tips', 'Candidate Experience'],
  },
  {
    id: 4,
    author: 'Alex Rivera',
    role: 'CTO at HealthTech Startup',
    avatar: 'AR',
    title: 'We cut time-to-hire by 60% using AI evaluation',
    content: 'The instant AI feedback after each interview means we can make decisions in hours, not days. Our engineering team is now at full capacity because the hiring bottleneck is gone.',
    upvotes: 24,
    replies: 15,
    tags: ['AI', 'Efficiency'],
  },
  {
    id: 5,
    author: 'Emily Watson',
    role: 'Staff Engineer at Spotify',
    avatar: 'EW',
    title: 'Whiteboard auto-beautify is underrated',
    content: 'I was skeptical, but the AI diagram cleanup actually saves me minutes per interview. My hand-drawn chaos turns into clean architecture diagrams that I can paste into feedback reports.',
    upvotes: 18,
    replies: 8,
    tags: ['Whiteboard', 'AI'],
  },
];

const topContributors = [
  { name: 'Sarah Chen', posts: 12, upvotes: 203, avatar: 'SC' },
  { name: 'Marcus Johnson', posts: 9, upvotes: 167, avatar: 'MJ' },
  { name: 'Priya Patel', posts: 7, upvotes: 142, avatar: 'PP' },
  { name: 'Alex Rivera', posts: 6, upvotes: 98, avatar: 'AR' },
];

export function CommunityHub() {
  const [upvotedPosts, setUpvotedPosts] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<'trending' | 'recent'>('trending');

  const handleUpvote = (postId: number) => {
    setUpvotedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const sortedPosts = [...posts].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    if (sortBy === 'trending') return b.upvotes - a.upvotes;
    return b.id - a.id;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-h1 font-display font-semibold text-white">
          Community Hub
        </h1>
        <p className="text-[13px] text-body-muted/60 mt-1">
          Tips, templates, and discussions from interviewers like you
        </p>
      </div>

      {/* Highlight: Interviewer of the Month */}
      <Card variant="ghost" padding="md">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-amber-400/10 border-2 border-amber-400/30 flex items-center justify-center text-[18px] font-semibold text-amber-400">
              SC
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center">
              <Star className="w-3 h-3 text-amber-950" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-pill">
                Interviewer of the Month — June
              </span>
            </div>
            <h3 className="text-[15px] font-semibold text-white mt-1">Sarah Chen</h3>
            <p className="text-[12px] text-body-muted/50">Senior Engineer at Stripe · 12 posts · 203 upvotes</p>
            <p className="text-[12px] text-body-muted/60 mt-1 italic">
              &ldquo;The best interview is one where the candidate forgets they&apos;re being evaluated. Focus on collaboration, not interrogation.&rdquo;
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
          </div>
        </div>
      </Card>

      {/* Sort tabs + new post */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSortBy('trending')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${
              sortBy === 'trending'
                ? 'bg-primary/10 text-primary-on-dark border border-primary/20'
                : 'bg-white/[0.04] text-body-muted/50 hover:text-white border border-transparent hover:border-white/[0.12]'
            }`}
          >
            Trending
          </button>
          <button
            onClick={() => setSortBy('recent')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${
              sortBy === 'recent'
                ? 'bg-primary/10 text-primary-on-dark border border-primary/20'
                : 'bg-white/[0.04] text-body-muted/50 hover:text-white border border-transparent hover:border-white/[0.12]'
            }`}
          >
            Recent
          </button>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary-on-dark text-[11px] font-medium hover:bg-primary/20 transition-colors">
          <Sparkles className="w-3 h-3" />
          New Post
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Posts feed */}
        <div className="flex-1 space-y-3">
          {sortedPosts.map((post, index) => {
            const isUpvoted = upvotedPosts.has(post.id);
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card variant="interactive" padding="md">
                  {post.pinned && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <Pin className="w-3 h-3 text-primary-on-dark" />
                      <span className="text-[9px] font-mono font-semibold text-primary-on-dark">Pinned</span>
                    </div>
                  )}
                  <div className="flex gap-3">
                    {/* Upvote column */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleUpvote(post.id)}
                        aria-label="Upvote post"
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
                          isUpvoted
                            ? 'bg-primary/10 text-primary-on-dark border border-primary/20'
                            : 'bg-white/[0.02] text-body-muted/50 hover:text-white border border-transparent hover:border-white/[0.12]'
                        }`}
                      >
                        <ThumbsUp className={`w-3 h-3 ${isUpvoted ? 'fill-primary-on-dark' : ''}`} />
                      </button>
                      <span className={`text-[11px] font-mono font-semibold ${isUpvoted ? 'text-primary-on-dark' : 'text-body-muted/55'}`}>
                        {post.upvotes + (isUpvoted ? 1 : 0)}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[9px] font-semibold text-body-muted/70">
                          {post.avatar}
                        </div>
                        <span className="text-[11px] font-medium text-white">{post.author}</span>
                        <span className="text-[10px] text-body-muted/50">{post.role}</span>
                      </div>

                      <h3 className="text-[13px] font-medium text-white group-hover:text-primary-on-dark transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-[12px] text-body-muted/50 mt-1 leading-relaxed line-clamp-2">
                        {post.content}
                      </p>

                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex flex-wrap gap-1.5">
                          {post.tags.map((tag) => (
                            <span key={tag} className="text-[9px] font-mono text-body-muted/50 bg-white/[0.03] px-1.5 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <span className="flex items-center gap-1 text-[10px] text-body-muted/50">
                          <MessageCircle className="w-3 h-3" />
                          {post.replies} replies
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Sidebar: Top Contributors */}
        <div className="w-full lg:w-[220px] shrink-0">
          <Card variant="default" padding="md">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary-on-dark" />
              <span className="text-[12px] font-medium text-white">Top Contributors</span>
            </div>
            <div className="space-y-3">
              {topContributors.map((contributor, index) => (
                <div key={contributor.name} className="flex items-center gap-2.5">
                  <span className="text-[10px] font-mono text-body-muted/50 w-3">{index + 1}</span>
                  <div className="w-7 h-7 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[9px] font-semibold text-body-muted/70 shrink-0">
                    {contributor.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium text-white truncate">{contributor.name}</div>
                    <div className="text-[9px] text-body-muted/50">{contributor.upvotes} upvotes</div>
                  </div>
                  <Award className="w-3 h-3 text-amber-400/50" />
                </div>
              ))}
            </div>
          </Card>

          {/* Quick stats */}
          <Card variant="default" padding="md" className="mt-3">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-body-muted/50">Community members</span>
                <span className="text-white font-semibold">2,847</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-body-muted/50">Total posts</span>
                <span className="text-white font-semibold">486</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-body-muted/50">Tips shared</span>
                <span className="text-white font-semibold">1,203</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
