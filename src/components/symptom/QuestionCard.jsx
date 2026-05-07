import { useState } from 'react';
import { Send } from 'lucide-react';
import './question-card.css';

export default function QuestionCard({ question, options, allowFreeText, inputPlaceholder, onAnswer, isLatest }) {
  const [text, setText] = useState('');
  const [answered, setAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  function handleChipClick(option) {
    if (answered) return;
    setSelectedOption(option);
    setAnswered(true);
    onAnswer(option);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || answered) return;
    setAnswered(true);
    onAnswer(text.trim());
  }

  return (
    <div className={`question-card${answered ? ' question-card--answered' : ''}${isLatest ? ' question-card--latest' : ''}`}>
      <p className="question-card__question">{question}</p>

      {options && options.length > 0 && (
        <div className="question-card__chips">
          {options.map((option, i) => (
            <button
              key={i}
              className={`question-card__chip${selectedOption === option ? ' question-card__chip--selected' : ''}`}
              onClick={() => handleChipClick(option)}
              disabled={answered}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {(allowFreeText !== false) && !answered && (
        <form className="question-card__input-row" onSubmit={handleSubmit}>
          <input
            className="question-card__input"
            type="text"
            placeholder={inputPlaceholder || 'Type your answer...'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus={isLatest}
          />
          <button
            className="question-card__send"
            type="submit"
            disabled={!text.trim()}
          >
            <Send size={16} strokeWidth={2.2} />
          </button>
        </form>
      )}

      {answered && !selectedOption && text && (
        <p className="question-card__answer">{text}</p>
      )}
    </div>
  );
}
