'use client';

import { useState, useEffect, use } from 'react';
import { Header } from '../../../../components/ui/Header';
import { QuestionForm } from '../../../../components/questions/QuestionForm';
import type { QuestionDetail } from '@interviewos/shared';
import { fetchQuestion, updateQuestion } from '../../../../lib/questions';

export default function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetchQuestion(id, controller.signal)
      .then(setQuestion)
      .catch((err) => {
        if ((err as Error).name !== 'AbortError') {
          setError('Failed to load question');
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [id]);

  if (loading) {
    return (
      <>
        <Header subTitle="Question Library" />
        <main id="main-content" className="flex-1 w-full max-w-[900px] mx-auto px-6 py-8">
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-white/[0.02] border border-white/[0.06] animate-pulse" />
            ))}
          </div>
        </main>
      </>
    );
  }

  if (error || !question) {
    return (
      <>
        <Header subTitle="Question Library" />
        <main id="main-content" className="flex-1 w-full max-w-[900px] mx-auto px-6 py-8">
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-[13px] text-red-400">
            {error || 'Question not found'}
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header subTitle="Question Library" />
      <main id="main-content" className="flex-1 w-full max-w-[900px] mx-auto px-6 py-8">
        <QuestionForm
          mode="edit"
          questionId={id}
          initialData={question}
          onSubmit={async (data) => {
            const updated = await updateQuestion(id, data);
            return { id: updated.id };
          }}
        />
      </main>
    </>
  );
}
