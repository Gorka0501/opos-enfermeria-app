import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, SafeAreaView, Text } from "react-native";
import { ExamResultScreen } from "./src/components/screens/ExamResultScreen";
import { ExamScreen } from "./src/components/screens/ExamScreen";
import { HomeScreen } from "./src/components/screens/HomeScreen";
import { PracticeScreen } from "./src/components/screens/PracticeScreen";
import { StatsScreen } from "./src/components/screens/StatsScreen";
import { DEFAULT_EXAM_QUESTIONS, EMPTY_STATS } from "./src/constants/app";
import { QUESTION_POOL } from "./src/data/questions";
import { styles } from "./src/styles/appStyles";
import { AppStats, Question } from "./src/types";
import { shuffleArray } from "./src/utils/shuffle";
import {
  buildExamStats,
  buildPracticeStats,
  calculateScore,
  clampQuestionCount,
  getAccuracy,
  mergeFailedQuestionIds,
  updateFailedIdsForPractice,
} from "./src/utils/quiz";
import {
  getFailedQuestionIds,
  getStats,
  saveFailedQuestionIds,
  saveStats,
} from "./src/utils/storage";

type ScreenState = "home" | "exam" | "examResult" | "practice" | "stats";
type PracticeMode = "random-list" | "failed-list";

export default function App() {
  const [screen, setScreen] = useState<ScreenState>("home");
  const [loading, setLoading] = useState(true);
  const [failedIds, setFailedIds] = useState<string[]>([]);
  const [stats, setStats] = useState<AppStats>(EMPTY_STATS);
  const [examCountInput, setExamCountInput] = useState(String(DEFAULT_EXAM_QUESTIONS));
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("random-list");
  const [practiceSelected, setPracticeSelected] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const [ids, loadedStats] = await Promise.all([getFailedQuestionIds(), getStats()]);
      setFailedIds(ids);
      setStats(loadedStats);
      setLoading(false);
    })();
  }, []);

  const currentQuestion = questions[currentIndex];
  const score = useMemo(() => calculateScore(questions, answers), [answers, questions]);
  const practiceAnswered = practiceSelected !== null;
  const practiceIsCorrect =
    currentQuestion && practiceSelected !== null
      ? practiceSelected === currentQuestion.correctIndex
      : false;

  async function persistStats(nextStats: AppStats) {
    setStats(nextStats);
    await saveStats(nextStats);
  }

  function resetSession() {
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers({});
    setPracticeSelected(null);
  }

  function goHome() {
    setScreen("home");
    resetSession();
  }

  function startExam() {
    const count = clampQuestionCount(examCountInput, QUESTION_POOL.length);
    setExamCountInput(String(count));
    setQuestions(shuffleArray(QUESTION_POOL).slice(0, count));
    setCurrentIndex(0);
    setAnswers({});
    setScreen("exam");
  }

  function startPractice(mode: PracticeMode) {
    const baseQuestions =
      mode === "failed-list"
        ? QUESTION_POOL.filter((question) => failedIds.includes(question.id))
        : QUESTION_POOL;

    if (!baseQuestions.length) {
      return;
    }

    setPracticeMode(mode);
    setQuestions(shuffleArray(baseQuestions));
    setCurrentIndex(0);
    setPracticeSelected(null);
    setScreen("practice");
  }

  function answerExam(optionIndex: number) {
    if (!currentQuestion) {
      return;
    }

    setAnswers((prev: Record<string, number>) => ({ ...prev, [currentQuestion.id]: optionIndex }));
  }

  async function finishExam() {
    const nextFailedIds = mergeFailedQuestionIds(failedIds, questions, answers);
    setFailedIds(nextFailedIds);
    await saveFailedQuestionIds(nextFailedIds);

    const nextStats = buildExamStats(stats, questions.length, score);
    await persistStats(nextStats);
    setScreen("examResult");
  }

  function nextExamQuestion() {
    if (currentIndex >= questions.length - 1) {
      void finishExam();
      return;
    }

    setCurrentIndex((prev: number) => prev + 1);
  }

  async function answerPractice(optionIndex: number) {
    if (!currentQuestion || practiceAnswered) {
      return;
    }

    setPracticeSelected(optionIndex);
    const isCorrect = optionIndex === currentQuestion.correctIndex;

    const nextFailedIds = updateFailedIdsForPractice(failedIds, currentQuestion, isCorrect);
    setFailedIds(nextFailedIds);
    await saveFailedQuestionIds(nextFailedIds);

    const nextStats = buildPracticeStats(stats, isCorrect);
    await persistStats(nextStats);
  }

  function nextPracticeQuestion() {
    if (currentIndex >= questions.length - 1) {
      goHome();
      return;
    }

    setCurrentIndex((prev: number) => prev + 1);
    setPracticeSelected(null);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#1b4965" />
        <Text style={styles.info}>Cargando estadisticas...</Text>
      </SafeAreaView>
    );
  }

  const totalAccuracy = getAccuracy(stats.totalCorrect, stats.totalAnswered);
  const practiceAccuracy = getAccuracy(stats.practiceCorrect, stats.practiceAnswered);

  return (
    <>
      <StatusBar style="dark" />

      {screen === "home" && (
        <HomeScreen
          totalQuestions={QUESTION_POOL.length}
          failedCount={failedIds.length}
          totalAccuracy={totalAccuracy}
          examCountInput={examCountInput}
          onExamCountChange={setExamCountInput}
          onStartExam={startExam}
          onStartRandomPractice={() => startPractice("random-list")}
          onStartFailedPractice={() => startPractice("failed-list")}
          onOpenStats={() => setScreen("stats")}
        />
      )}

      {screen === "stats" && (
        <StatsScreen
          stats={stats}
          totalAccuracy={totalAccuracy}
          practiceAccuracy={practiceAccuracy}
          onGoHome={goHome}
        />
      )}

      {screen === "examResult" && (
        <ExamResultScreen
          score={score}
          totalQuestions={questions.length}
          onRepeatExam={startExam}
          onGoHome={goHome}
        />
      )}

      {screen === "practice" && currentQuestion && (
        <PracticeScreen
          question={currentQuestion}
          currentIndex={currentIndex}
          totalQuestions={questions.length}
          practiceMode={practiceMode}
          practiceSelected={practiceSelected}
          practiceAnswered={practiceAnswered}
          practiceIsCorrect={practiceIsCorrect}
          onAnswer={answerPractice}
          onNext={nextPracticeQuestion}
          onGoHome={goHome}
        />
      )}

      {screen === "exam" && currentQuestion && (
        <ExamScreen
          question={currentQuestion}
          currentIndex={currentIndex}
          totalQuestions={questions.length}
          selectedAnswer={answers[currentQuestion.id]}
          onAnswer={answerExam}
          onNext={nextExamQuestion}
          onGoHome={goHome}
        />
      )}
    </>
  );
}