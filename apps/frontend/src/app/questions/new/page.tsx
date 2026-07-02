'use client';

import { Header } from '../../../components/ui/Header';
import { QuestionForm } from '../../../components/questions/QuestionForm';
import { createQuestion } from '../../../lib/questions';

export default function NewQuestionPage() {
  return (
    <>
      <Header subTitle="Question Library" />
      <main id="main-content" className="flex-1 w-full max-w-[900px] mx-auto px-6 py-8">
        <QuestionForm
          mode="create"
          onSubmit={async (data) => {
            const question = await createQuestion(data);
            return { id: question.id };
          }}
        />
      </main>
    </>
  );
}
