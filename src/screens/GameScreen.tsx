import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Lottie from 'lottie-react';
import { SavannahBackground } from '../components/SavannahBackground';
import { getGameById } from '../modules/games/registry';
import type { GameResult, ScreenId } from '../types';
import './screens.css';

interface GameScreenProps {
  gameId: string;
  onCompleted: (result: GameResult) => void;
  onNavigate: (screen: ScreenId) => void;
}

interface QuizQuestion {
  id: string;
  category: string;
  prompt: string;
  image?: string;
  correctOptionId: 'A' | 'B' | 'C';
  options: { id: 'A' | 'B' | 'C'; label: string }[];
}

const QUESTION_TIME_SECONDS = 20;

const animationCache: Record<string, any> = {};

const useLottieAnimation = (src: string) => {
  const [data, setData] = useState<any | null>(() => animationCache[src] ?? null);

  useEffect(() => {
    if (!src) return;
    if (animationCache[src]) {
      setData(animationCache[src]);
      return;
    }
    let isMounted = true;
    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error('Animation failed to load');
        return res.json();
      })
      .then((json) => {
        animationCache[src] = json;
        if (isMounted) {
          setData(json);
        }
      })
      .catch(() => undefined);
    return () => {
      isMounted = false;
    };
  }, [src]);

  return data;
};

const CATEGORY_IMAGE_MAP: Record<string, string> = {
  'ARTS & LITERATURE': '/media/images/literature.png',
  ENTERTAINMENT: '/media/images/entertainment.png',
  GEOGRAPHY: '/media/images/geography.jpeg',
  HISTORY: '/media/images/history.png',
  MISCELLANEOUS: '/media/images/miscellaneous.png',
  SPORTS: '/media/images/sports.png'
};

export const GameScreen = ({ gameId, onCompleted, onNavigate }: GameScreenProps) => {
  const game = useMemo(() => getGameById(gameId), [gameId]);
  const streakPalette = ['#ffd046', '#0b3d2c', '#f26c22', '#b8d8ba'];
  const streakPaletteText = ['#000', '#fff', '#000', '#1c1c1c'];
  const [answered, setAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [stats, setStats] = useState<GameResult>({ correct: 0, incorrect: 0, streak: 0, totalTimeSeconds: 0 });
  const [streakBonusTotal, setStreakBonusTotal] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const correctSound = useRef<HTMLAudioElement | null>(null);
  const wrongSound = useRef<HTMLAudioElement | null>(null);
  const drumSound = useRef<HTMLAudioElement | null>(null);
  const needsAudioUnlock = useRef(false);
  const explosionTimer = useRef<number | null>(null);
  const [explodingOption, setExplodingOption] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(QUESTION_TIME_SECONDS);
  const timerRef = useRef<number | null>(null);
  const answeredRef = useRef(false);
  const successAnimation = useLottieAnimation('/assets/success.json');
  const failureAnimation = useLottieAnimation('/assets/Failed.json');
  const [bonusBursts, setBonusBursts] = useState<Array<{ id: number; value: number }>>([]);
  const bonusIdRef = useRef(0);
  const bonusTimeouts = useRef<Record<number, number>>({});
  const gameOverTriggeredRef = useRef(false);
  const warningShownRef = useRef(false);
  const [showDangerWarning, setShowDangerWarning] = useState(false);
  const warningTimeoutRef = useRef<number | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopDrumSound = useCallback(() => {
    if (!drumSound.current) return;
    drumSound.current.pause();
    drumSound.current.currentTime = 0;
  }, []);

  const playDrumSound = useCallback(() => {
    const audio = drumSound.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.volume = 0.65;
    const attempt = audio.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(() => {
        if (needsAudioUnlock.current) return;
        needsAudioUnlock.current = true;
        const unlock = () => {
          needsAudioUnlock.current = false;
          audio.currentTime = 0;
          audio.play().catch(() => undefined);
          window.removeEventListener('pointerdown', unlock);
        };
        window.addEventListener('pointerdown', unlock, { once: true });
      });
    }
  }, []);

  useEffect(() => {
    answeredRef.current = answered;
  }, [answered]);

  const handleTimeout = useCallback(() => {
    if (answeredRef.current) return;
    stopTimer();
    setStats((prev) => ({
      ...prev,
      incorrect: prev.incorrect + 1,
      streak: 0,
      totalTimeSeconds: prev.totalTimeSeconds + QUESTION_TIME_SECONDS
    }));
    setSelectedOption('timeout');
    setAnswered(true);
    setShowSolution(true);
    stopDrumSound();
    wrongSound.current?.play();
  }, [stopDrumSound, stopTimer]);

  const hydrateQuestions = useCallback(
    (raw: any[]): QuizQuestion[] =>
      raw
        .map((entry: any, index: number) => {
          const normalized = Object.keys(entry ?? {}).reduce<Record<string, any>>((acc, key) => {
            if (!key) return acc;
            acc[key.replace(/\s+/g, '_').toUpperCase()] = entry[key];
            return acc;
          }, {});
          const optionA = normalized.OPTION_A?.toString() ?? '';
          const optionB = normalized.OPTION_B?.toString() ?? '';
          const optionC = normalized.OPTION_C?.toString() ?? '';
          const answerUpper = normalized.ANSWER?.toString().trim().toUpperCase();
          const optionMap: Record<'A' | 'B' | 'C', { id: 'A' | 'B' | 'C'; label: string }> = {
            A: { id: 'A', label: optionA },
            B: { id: 'B', label: optionB },
            C: { id: 'C', label: optionC }
          };
          const correctEntry =
            (Object.values(optionMap).find((opt) => opt.label.trim().toUpperCase() === answerUpper) ?? optionMap.A).id;
          const categoryLabel = normalized.CATEGORY?.toString().trim() ?? '';
          const categoryImage =
            CATEGORY_IMAGE_MAP[categoryLabel.toUpperCase()] ?? CATEGORY_IMAGE_MAP.MISCELLANEOUS ?? '/media/images/miscellaneous.png';
          return {
            id: normalized.NUMBER ?? `q-${index}`,
            category: categoryLabel || game?.title || 'Afrika Trivia',
            prompt: normalized.QUESTION ?? 'Untitled question',
            image: categoryImage,
            correctOptionId: correctEntry,
            options: [optionMap.A, optionMap.B, optionMap.C]
          };
        })
        .filter((q) => q.options.every((opt) => opt.label.length)),
    [game?.title]
  );

  const startRound = useCallback(
    (question: QuizQuestion) => {
      setCurrentQuestion(question);
      setAnswered(false);
      setSelectedOption(null);
      setShowSolution(false);
      setExplodingOption(null);
      stopDrumSound();
      stopTimer();
      setRemaining(QUESTION_TIME_SECONDS);
      playDrumSound();
      const id = window.setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            window.clearInterval(id);
            timerRef.current = null;
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      timerRef.current = id;
    },
    [handleTimeout, playDrumSound, stopDrumSound, stopTimer]
  );

  const advanceQuestion = useCallback(() => {
    if (!questions.length) return;
    const next = questions[Math.floor(Math.random() * questions.length)];
    startRound(next);
  }, [questions, startRound]);

  useEffect(() => {
    correctSound.current = document.getElementById('correct-sound') as HTMLAudioElement;
    wrongSound.current = document.getElementById('wrong-sound') as HTMLAudioElement;
    drumSound.current = document.getElementById('drum-sound') as HTMLAudioElement;
    if (drumSound.current) {
      drumSound.current.loop = true;
    }
    return () => {
      if (explosionTimer.current) {
        window.clearTimeout(explosionTimer.current);
      }
      stopTimer();
      Object.values(bonusTimeouts.current).forEach((timeoutId) => window.clearTimeout(timeoutId));
      if (warningTimeoutRef.current) {
        window.clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [stopTimer]);

  useEffect(() => {
    let isMounted = true;
    fetch('/assets/questions.json')
      .then((res) => {
        if (!res.ok) throw new Error('Unable to load questions');
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        const sourceArray = Array.isArray(data)
          ? data
          : typeof data === 'object' && data !== null
            ? Object.values(data)
            : [];
        const list = hydrateQuestions(sourceArray);
        setQuestions(list);
        setIsLoadingQuestions(false);
        if (list.length) {
          startRound(list[Math.floor(Math.random() * list.length)]);
        } else {
          setQuestionError('No quiz questions available.');
        }
      })
      .catch((error: Error) => {
        if (!isMounted) return;
        setQuestionError(error.message);
        setIsLoadingQuestions(false);
      });
    return () => {
      isMounted = false;
    };
  }, [hydrateQuestions, startRound]);

  const score = useMemo(
    () => stats.correct * 500 - stats.incorrect * 500 + streakBonusTotal,
    [stats, streakBonusTotal]
  );

  const streakBonusIncrement = stats.streak >= 2 ? stats.streak * 100 : 0;

  useEffect(() => {
    if (!gameOverTriggeredRef.current && stats.incorrect >= 5) {
      gameOverTriggeredRef.current = true;
      onCompleted(stats);
      onNavigate('postGame');
      stopDrumSound();
      stopTimer();
    }
    if (!warningShownRef.current && stats.incorrect === 4) {
      warningShownRef.current = true;
      setShowDangerWarning(true);
      if (warningTimeoutRef.current) {
        window.clearTimeout(warningTimeoutRef.current);
      }
      warningTimeoutRef.current = window.setTimeout(() => {
        setShowDangerWarning(false);
        warningTimeoutRef.current = null;
      }, 4000);
    }
  }, [stats, onCompleted, onNavigate, stopDrumSound, stopTimer]);

  const handleAnswer = (optionId: string) => {
    if (answered || !currentQuestion) return;
    const isCorrect = optionId === currentQuestion.correctOptionId;
    const timeUsed = QUESTION_TIME_SECONDS - remaining;
    const nextStreak = isCorrect ? stats.streak + 1 : 0;
    const nextCorrect = stats.correct + (isCorrect ? 1 : 0);
    const nextIncorrect = stats.incorrect + (isCorrect ? 0 : 1);
    const nextTotal = stats.totalTimeSeconds + timeUsed;
    setStats({
      correct: nextCorrect,
      incorrect: nextIncorrect,
      streak: nextStreak,
      totalTimeSeconds: nextTotal
    });
    if (isCorrect && nextStreak >= 2) {
      const bonusValue = nextStreak * 100;
      setStreakBonusTotal((prev) => prev + bonusValue);
      const id = bonusIdRef.current++;
      setBonusBursts((prev) => [...prev, { id, value: bonusValue }]);
      const timeoutId = window.setTimeout(() => {
        setBonusBursts((prev) => prev.filter((burst) => burst.id !== id));
        delete bonusTimeouts.current[id];
      }, 1500);
      bonusTimeouts.current[id] = timeoutId;
    }
    if (explosionTimer.current) {
      window.clearTimeout(explosionTimer.current);
    }
    setExplodingOption(optionId);
    explosionTimer.current = window.setTimeout(() => setExplodingOption(null), 600);
    setSelectedOption(optionId);
    setAnswered(true);
    setShowSolution(true);
    stopTimer();
    stopDrumSound();
    if (isCorrect) {
      correctSound.current?.play();
    } else {
      wrongSound.current?.play();
    }
  };

  const handleNext = () => {
    advanceQuestion();
  };

  const handleEnd = () => {
    onCompleted(stats);
    onNavigate('postGame');
    stopDrumSound();
    stopTimer();
  };

  if (!game || isLoadingQuestions || !currentQuestion) {
    return (
      <SavannahBackground>
        <audio id="correct-sound" src="/media/audio/correcto.mp3" preload="auto" />
        <audio id="wrong-sound" src="/media/audio/wrong.mp3" preload="auto" />
        <audio id="drum-sound" src="/media/audio/drums.mp3" preload="auto" />
        <div className="quiz-hero">
          <div className="quiz-panel">
            <p>{questionError ?? 'Loading quiz module…'}</p>
          </div>
        </div>
      </SavannahBackground>
    );
  }

  return (
    <SavannahBackground>
      <audio id="correct-sound" src="/media/audio/correcto.mp3" preload="auto" />
      <audio id="wrong-sound" src="/media/audio/wrong.mp3" preload="auto" />
      <audio id="drum-sound" src="/media/audio/drums.mp3" preload="auto" />
      <div className="quiz-hero">
        <div className="quiz-panel animate-in">
              <div className="quiz-stats">
                <div className={`quiz-stats__card ${remaining < 10 ? 'is-danger' : ''}`}>
                  <span>{Math.max(0, remaining)}</span>
                </div>
                <div className="quiz-stats__card quiz-stats__card--success">
                  <span>{stats.correct}</span>
                  Correct
                </div>
                <div
                  className={`quiz-stats__card quiz-stats__card--error ${
                    stats.incorrect === 4 ? 'is-warning' : ''
                  }`}
                >
                  <span>{stats.incorrect}</span>
                  Incorrect
                </div>
            <div className="quiz-stats__card quiz-stats__card--score">
              <span>{score}</span>
              <strong>Score</strong>
              {bonusBursts.map((burst) => (
                <div key={burst.id} className="quiz-streak-confetti">
                  <span>+{burst.value}</span>
                  <i />
                  <i className="delay" />
                  <i className="fast" />
                </div>
              ))}
            </div>
          </div>

          <div className="quiz-body">
            <div className="quiz-media" aria-hidden>
              <div className="quiz-category-chip">{currentQuestion.category}</div>
              {currentQuestion.image ? (
                <div className="quiz-media__frame quiz-media__frame--image">
                  <img src={currentQuestion.image} alt={currentQuestion.category} />
                </div>
              ) : (
                <div className="quiz-media__frame">{game.icon}</div>
              )}
            </div>
            <div className="quiz-question">
              {showDangerWarning && (
                <div className="quiz-warning quiz-warning--inline">
                  <strong>4 Wrong answers.</strong> One more and your adventure is over!
                </div>
              )}
              {showSolution ? (
                <div
                  className={`quiz-question__result ${
                    selectedOption === currentQuestion.correctOptionId ? 'is-correct' : 'is-incorrect'
                  }`}
                  role="status"
                >
                  <div className="quiz-result__animation">
                    {(() => {
                      const isCorrect = selectedOption === currentQuestion.correctOptionId;
                      const animationData = isCorrect ? successAnimation : failureAnimation;
                      if (animationData) {
                        return (
                          <Lottie
                            key={`${currentQuestion.id}-${selectedOption}-${isCorrect ? 'success' : 'failure'}`}
                            animationData={animationData}
                            loop
                          />
                        );
                      }
                      return <span aria-hidden>{isCorrect ? '✔️' : '✖️'}</span>;
                    })()}
                  </div>
                  <p>{selectedOption === currentQuestion.correctOptionId ? 'Correct answer' : 'Incorrect answer'}</p>
                </div>
              ) : (
                <h2>{currentQuestion.prompt}</h2>
              )}
            </div>
          </div>

          <div className="quiz-options">
            <div className="quiz-options__row quiz-options__row--dual">
              {currentQuestion.options
                .filter((option) => option.id !== 'C')
                .map((option) => {
                  const isSelected = selectedOption === option.id;
                  const isCorrect = option.id === currentQuestion.correctOptionId;
                  const classes = [
                    'quiz-option',
                    explodingOption === option.id ? 'quiz-option--boom' : '',
                    isSelected && showSolution && isCorrect ? 'quiz-option--correct' : '',
                    isSelected && showSolution && !isCorrect ? 'quiz-option--incorrect' : '',
                    !isSelected && showSolution ? 'quiz-option--dim' : ''
                  ]
                    .filter(Boolean)
                    .join(' ');
                  return (
                    <button key={option.id} className={classes} disabled={answered} onClick={() => handleAnswer(option.id)}>
                      {option.id} · {option.label}
                    </button>
                  );
                })}
            </div>
            <div className="quiz-options__row quiz-options__row--split">
              {(() => {
                const option = currentQuestion.options.find((opt) => opt.id === 'C');
                const isSelected = selectedOption === 'C';
                const isCorrect = currentQuestion.correctOptionId === 'C';
                const classes = [
                  'quiz-option',
                  explodingOption === 'C' ? 'quiz-option--boom' : '',
                  isSelected && showSolution && isCorrect ? 'quiz-option--correct' : '',
                  isSelected && showSolution && !isCorrect ? 'quiz-option--incorrect' : '',
                  !isSelected && showSolution ? 'quiz-option--dim' : ''
                ]
                  .filter(Boolean)
                  .join(' ');
                return (
                  <button className={classes} disabled={answered} onClick={() => handleAnswer('C')}>
                    C · {option?.label}
                  </button>
                );
              })()}
              <div className={`quiz-controls ${showSolution ? 'is-active' : ''}`}>
                <button
                  className="quiz-action quiz-action--secondary quiz-action--compact"
                  onClick={handleEnd}
                  disabled={!showSolution}
                >
                  END GAME
                </button>
                <button className="quiz-action quiz-action--compact" onClick={handleNext} disabled={!showSolution}>
                  NEXT
                </button>
              </div>
            </div>
          </div>

          <footer className="quiz-footer">
            <img src="/media/images/ElebiLogoTransp2024.png" alt="Elebi logo" />
          </footer>
        </div>
      </div>
    </SavannahBackground>
  );
};
