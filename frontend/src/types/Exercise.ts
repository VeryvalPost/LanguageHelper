/**
 * type: может быть одним из:
 *  - 'True/False'
 *  - 'ABCD'
 *  - 'Open Questions'
 *  - 'Dialogue'
 *  - 'Fill The Gaps'
 *  - 'Match The Sentence'
 */
export interface Exercise {
  type: string;
  questions: string[];
  answers: string[];
  dictionary: Array<{
    question: number;
    answer: number;
  }>;
  createdText?: string;
}

export interface DroppedAnswer {
  questionIndex: number;
  answerIndex: number;
  answerText: string;
}