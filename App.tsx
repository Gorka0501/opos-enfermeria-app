import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Platform, Text } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { NavigationContainer, useNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { FontScaleContext } from "./src/context/FontScaleContext";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { ExamResultScreen } from "./src/components/screens/ExamResultScreen";
import { ExamScreen } from "./src/components/screens/ExamScreen";
import { HomeScreen } from "./src/components/screens/HomeScreen";
import { OptionsScreen } from "./src/components/screens/OptionsScreen";
import { PracticeScreen } from "./src/components/screens/PracticeScreen";
import { CorrectionsScreen } from "./src/components/screens/CorrectionsScreen";
import { QuestionListScreen } from "./src/components/screens/QuestionListScreen";
import { StatsScreen } from "./src/components/screens/StatsScreen";
import { DEFAULT_EXAM_QUESTIONS, EMPTY_STATS } from "./src/constants/app";
import { QUESTION_POOL } from "./src/data/questions";
import { styles } from "./src/styles/appStyles";
import { AppStats, Question, QuestionStat } from "./src/types";
import { pickSemiRandomQuestions, shuffleArray } from "./src/utils/shuffle";
import {
  applyCorrectAnswerOverrides,
  buildExamStats,
  buildPracticeStats,
  calculateScore,
  clampQuestionCount,
  getAccuracy,
  mergeFailedQuestionIds,
  updateFailedIdsForPractice,
} from "./src/utils/quiz";
import {
  getCorrectAnswerOverrides,
  getFailedQuestionIds,
  getStats,
  saveFailedQuestionIds,
  saveStats,
  getFavoriteQuestionIds,
  toggleFavorite,
  getAllQuestionStats,
  recordQuestionAnswered,
  getDisabledQuestionIds,
  saveDisabledQuestionIds,
  saveAllQuestionStats,
  saveCorrectAnswerOverrides,
  getFontScale,
  saveFontScale,
  getCachedQuestions,
  saveCachedQuestions,
} from "./src/utils/storage";
import { buildRecordedExamSessionStats } from "./src/utils/sessionHistory";
import { submitCorrectionsToRepo } from "./src/utils/githubCorrections";

type PracticeMode = "random-list" | "failed-list" | "favorites" | "hard-list";
type RootStackParamList = {
  home: undefined;
  corrections: undefined;
  options: undefined;
  stats: undefined;
  questionList: undefined;
  exam: undefined;
  examResult: undefined;
  practice: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const QUESTIONS_REMOTE_URL =
  "https://raw.githubusercontent.com/Gorka0501/opos-enfermeria-app/main/data/questions.json";

/**
 * App root orchestrator.
 *
 * Responsibilities:
 * - Load persisted state (stats, failures, favorites, question counters, settings).
 * - Keep session state for current exam/practice run.
 * - Apply business rules when answering/finishing sessions.
 * - Wire navigation routes to screen components.
 */
export default function App() {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();

  // Persisted datasets
  const [loading, setLoading] = useState(true);
  const [baseQuestions, setBaseQuestions] = useState<Question[]>(QUESTION_POOL);
  const [failedIds, setFailedIds] = useState<string[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [disabledIds, setDisabledIds] = useState<string[]>([]);
  const [questionStats, setQuestionStats] = useState<Record<string, QuestionStat>>({});
  const [correctAnswerOverrides, setCorrectAnswerOverrides] = useState<Record<string, number>>({});
  const [stats, setStats] = useState<AppStats>(EMPTY_STATS);

  // Session/runtime state
  const [examCountInput, setExamCountInput] = useState(String(DEFAULT_EXAM_QUESTIONS));
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, number>>({});
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("random-list");
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [lastExamQuestions, setLastExamQuestions] = useState<Question[]>([]);
  const [fontScale, setFontScale] = useState(1);
  const [hardMaxAccuracy, setHardMaxAccuracy] = useState(50);
  const [hardMinShown, setHardMinShown] = useState(2);
  const questionPool = useMemo(
    () => applyCorrectAnswerOverrides(baseQuestions, correctAnswerOverrides),
    [baseQuestions, correctAnswerOverrides],
  );

  // Initial hydration from local storage.
  useEffect(() => {
    (async () => {
      try {
        const [ids, loadedStats, favs, qStats, disIds, loadedFontScale, loadedOverrides, cachedQuestions] = await Promise.all([
          getFailedQuestionIds(),
          getStats(),
          getFavoriteQuestionIds(),
          getAllQuestionStats(),
          getDisabledQuestionIds(),
          getFontScale(),
          getCorrectAnswerOverrides(),
          getCachedQuestions(),
        ]);
        setFailedIds(ids);
        setStats(loadedStats);
        setFavoriteIds(favs);
        setQuestionStats(qStats);
        setDisabledIds(disIds);
        setFontScale(loadedFontScale);
        setCorrectAnswerOverrides(loadedOverrides);
        if (cachedQuestions) setBaseQuestions(cachedQuestions);
      } catch (error) {
        // Keep app usable even if persistence init fails on some devices.
        console.error("Startup hydration failed", error);
      } finally {
        setLoading(false);
      }

      // Background fetch: silently update questions from GitHub if network is available.
      try {
        const response = await fetch(QUESTIONS_REMOTE_URL);
        if (response.ok) {
          const data = (await response.json()) as Question[];
          if (Array.isArray(data) && data.length > 0) {
            setBaseQuestions(data);
            void saveCachedQuestions(data);
          }
        }
      } catch {
        // No network — keep using cache or bundled questions.
      }
    })();
  }, []);

  async function updateFontScale(scale: number) {
    setFontScale(scale);
    await saveFontScale(scale);
  }

  const currentQuestion = questions[currentIndex];
  const score = useMemo(() => calculateScore(questions, answers), [answers, questions]);
  const practiceSelected = currentQuestion ? practiceAnswers[currentQuestion.id] ?? null : null;
  const practiceAnswered = practiceSelected !== null;
  const correctionCount = Object.keys(correctAnswerOverrides).length;

  async function persistStats(nextStats: AppStats) {
    // Keep UI state and storage fully synchronized.
    setStats(nextStats);
    await saveStats(nextStats);
  }

  function resetSession() {
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers({});
    setPracticeAnswers({});
    setAnsweredQuestions(new Set());
  }

  function goHome(navigation?: {
    reset?: (state: { index: number; routes: { name: keyof RootStackParamList }[] }) => void;
    popToTop?: () => void;
    navigate?: (screen: keyof RootStackParamList) => void;
  }) {
    resetSession();

    if (navigation?.reset) {
      navigation.reset({
        index: 0,
        routes: [{ name: "home" }],
      });
      return;
    }

    if (navigation?.popToTop) {
      navigation.popToTop();
      navigation.navigate?.("home");
      return;
    }

    if (navigationRef.isReady()) {
      navigationRef.resetRoot({
        index: 0,
        routes: [{ name: "home" }],
      });
    }
  }

  function startExam() {
    // Exam is always created from enabled questions only.
    const enabled = questionPool.filter((q) => !disabledIds.includes(q.id));
    const count = clampQuestionCount(examCountInput, enabled.length);
    setExamCountInput(String(count));
    const selected = pickSemiRandomQuestions(enabled, count, questionStats, failedIds);
    setQuestions(selected);
    setLastExamQuestions(selected);
    setCurrentIndex(0);
    setAnswers({});
    setAnsweredQuestions(new Set());
  }

  function repeatExam() {
    if (!lastExamQuestions.length) {
      startExam();
      return;
    }

    const repeated = shuffleArray(lastExamQuestions);
    setQuestions(repeated);
    setCurrentIndex(0);
    setAnswers({});
    setAnsweredQuestions(new Set());
  }

  function startAnotherExamSameCount() {
    // Reuse current exam size to make quick retries convenient.
    const enabled = questionPool.filter((q) => !disabledIds.includes(q.id));
    const targetCount = questions.length > 0 ? questions.length : clampQuestionCount(examCountInput, enabled.length);
    setExamCountInput(String(targetCount));

    const selected = pickSemiRandomQuestions(enabled, targetCount, questionStats, failedIds);
    setQuestions(selected);
    setLastExamQuestions(selected);
    setCurrentIndex(0);
    setAnswers({});
    setAnsweredQuestions(new Set());
  }

  // Dynamic difficult IDs based on per-question personal accuracy.
  const hardIds = Object.entries(questionStats)
    .filter(([, s]) => s.timesShown >= hardMinShown && s.timesCorrect / s.timesShown < hardMaxAccuracy / 100)
    .map(([id]) => id);

  function startPractice(mode: PracticeMode): boolean {
    let baseQuestions: Question[] = [];

    if (mode === "failed-list") {
      baseQuestions = questionPool.filter((question) => failedIds.includes(question.id));
    } else if (mode === "favorites") {
      baseQuestions = questionPool.filter((question) => favoriteIds.includes(question.id));
    } else if (mode === "hard-list") {
      baseQuestions = questionPool.filter((question) => hardIds.includes(question.id));
    } else {
      baseQuestions = questionPool.filter((q) => !disabledIds.includes(q.id));
    }

    if (!baseQuestions.length) {
      return false;
    }

    setPracticeMode(mode);
    if (mode === "random-list") {
      setQuestions(pickSemiRandomQuestions(baseQuestions, baseQuestions.length, questionStats, failedIds));
    } else {
      setQuestions(shuffleArray(baseQuestions));
    }
    setCurrentIndex(0);
    setPracticeAnswers({});
    setAnsweredQuestions(new Set());
    return true;
  }

  function answerExam(optionIndex: number) {
    if (!currentQuestion) {
      return;
    }

    setAnswers((prev: Record<string, number>) => ({
      ...prev,
      [currentQuestion.id]: optionIndex,
    }));
    setAnsweredQuestions((prev) => new Set(prev).add(currentIndex));
    // Question counters are updated immediately for adaptive features.
    void recordQuestionAnswered(currentQuestion.id, optionIndex === currentQuestion.correctIndex).then(() =>
      getAllQuestionStats().then(setQuestionStats)
    );
  }

  async function finishExam(onDone: () => void) {
    // Important: unanswered exam questions are ignored in mergeFailedQuestionIds
    // and therefore do not pollute failed list persistence.
    const answeredCount = answeredQuestions.size;
    const nextFailedIds = mergeFailedQuestionIds(failedIds, questions, answers);
    setFailedIds(nextFailedIds);
    await saveFailedQuestionIds(nextFailedIds);

    // First update cumulative stats, then append exam session history entry.
    const nextStats = buildExamStats(stats, answeredCount, score);
    const nextStatsWithSession = buildRecordedExamSessionStats(nextStats, score, questions.length, answeredCount);
    await persistStats(nextStatsWithSession);
    onDone();
  }

  function requestFinishExam(onDone: () => void) {
    const unanswered = questions.length - answeredQuestions.size;
    if (unanswered > 0) {
      const message = `Te faltan ${unanswered} pregunta${unanswered !== 1 ? "s" : ""} por responder. ¿Seguro que quieres terminar el examen?`;

      if (Platform.OS === "web" && typeof globalThis.confirm === "function") {
        if (globalThis.confirm(message)) {
          void finishExam(onDone);
        }
        return;
      }

      Alert.alert(
        "Faltan preguntas",
        message,
        [
          { text: "Seguir respondiendo", style: "cancel" },
          { text: "Terminar igualmente", style: "destructive", onPress: () => void finishExam(onDone) },
        ]
      );
      return;
    }

    void finishExam(onDone);
  }

  function nextExamQuestion() {
    setCurrentIndex((prev: number) => Math.min(questions.length - 1, prev + 1));
  }

  function prevExamQuestion() {
    setCurrentIndex((prev: number) => Math.max(0, prev - 1));
  }

  async function toggleQuestionFavorite() {
    if (!currentQuestion) return;
    const isFav = await toggleFavorite(currentQuestion.id);
    if (isFav) {
      setFavoriteIds((prev) => [...prev, currentQuestion.id]);
    } else {
      setFavoriteIds((prev) => prev.filter((id) => id !== currentQuestion.id));
    }
  }

  async function saveQuestionCorrection(questionId: string, optionIndex: number) {
    const originalQuestion = QUESTION_POOL.find((question) => question.id === questionId);
    if (!originalQuestion) {
      return;
    }

    const nextOverrides = { ...correctAnswerOverrides };
    if (optionIndex === originalQuestion.correctIndex) {
      delete nextOverrides[questionId];
    } else {
      nextOverrides[questionId] = optionIndex;
    }

    setCorrectAnswerOverrides(nextOverrides);
    await saveCorrectAnswerOverrides(nextOverrides);
  }

  async function resetQuestionCorrection(questionId: string) {
    if (!(questionId in correctAnswerOverrides)) {
      return;
    }

    const nextOverrides = { ...correctAnswerOverrides };
    delete nextOverrides[questionId];
    setCorrectAnswerOverrides(nextOverrides);
    await saveCorrectAnswerOverrides(nextOverrides);
  }

  async function resetAllCorrections() {
    setCorrectAnswerOverrides({});
    await saveCorrectAnswerOverrides({});
  }

  async function answerPractice(optionIndex: number) {
    if (!currentQuestion || practiceAnswered) {
      return;
    }

    setPracticeAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex,
    }));
    const isCorrect = optionIndex === currentQuestion.correctIndex;
    await Haptics.notificationAsync(
      isCorrect ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
    );

    // Practice mode affects failed list immediately per answered question.
    const nextFailedIds = updateFailedIdsForPractice(failedIds, currentQuestion, isCorrect);
    setFailedIds(nextFailedIds);
    await saveFailedQuestionIds(nextFailedIds);

    const nextStats = buildPracticeStats(stats, isCorrect);
    await persistStats(nextStats);
    await recordQuestionAnswered(currentQuestion.id, isCorrect);
    const updatedQStats = await getAllQuestionStats();
    setQuestionStats(updatedQStats);
  }

  function nextPracticeQuestion(): boolean {
    if (currentIndex >= questions.length - 1) {
      return false;
    }

    setCurrentIndex((prev: number) => prev + 1);
    return true;
  }

  function prevPracticeQuestion() {
    if (currentIndex <= 0) {
      return;
    }

    setCurrentIndex((prev: number) => prev - 1);
  }

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.centered}>
          <StatusBar style="dark" />
          <ActivityIndicator size="large" color="#1b4965" />
          <Text style={styles.info}>Cargando estadisticas...</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  const totalAccuracy = getAccuracy(stats.totalCorrect, stats.totalAnswered);
  const practiceAccuracy = getAccuracy(stats.practiceCorrect, stats.practiceAnswered);

  return (
    <SafeAreaProvider>
      <FontScaleContext.Provider value={fontScale}>
        <NavigationContainer ref={navigationRef}>
          <StatusBar style="dark" />
          <Stack.Navigator initialRouteName="home" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="home">
            {({ navigation }) => (
              <ErrorBoundary>
                <HomeScreen
                  totalQuestions={questionPool.length}
                  failedCount={failedIds.length}
                  correctionCount={correctionCount}
                  hardCount={hardIds.length}
                  totalAccuracy={totalAccuracy}
                  examCountInput={examCountInput}
                  onExamCountChange={setExamCountInput}
                  onStartExam={() => {
                    startExam();
                    navigation.navigate("exam");
                  }}
                  onStartRandomPractice={() => {
                    if (startPractice("random-list")) {
                      navigation.navigate("practice");
                    }
                  }}
                  onStartFailedPractice={() => {
                    if (startPractice("failed-list")) {
                      navigation.navigate("practice");
                    }
                  }}
                  onOpenCorrections={() => navigation.navigate("corrections")}
                  onStartHardPractice={() => {
                    if (startPractice("hard-list")) {
                      navigation.navigate("practice");
                    }
                  }}
                  onOpenStats={() => navigation.navigate("stats")}
                  onOpenQuestionList={() => navigation.navigate("questionList")}
                  onOpenOptions={() => navigation.navigate("options")}
                />
              </ErrorBoundary>
            )}
          </Stack.Screen>

          <Stack.Screen name="options">
            {({ navigation }) => (
              <ErrorBoundary>
                <OptionsScreen
                  onGoHome={() => goHome(navigation)}
                  onFontScaleChange={(scale) => void updateFontScale(scale)}
                  hardMaxAccuracy={hardMaxAccuracy}
                  hardMinShown={hardMinShown}
                  onHardMaxAccuracyChange={setHardMaxAccuracy}
                  onHardMinShownChange={setHardMinShown}
                />
              </ErrorBoundary>
            )}
          </Stack.Screen>

          <Stack.Screen name="corrections">
            {({ navigation }) => (
              <ErrorBoundary>
                <CorrectionsScreen
                  questions={questionPool}
                  originalQuestions={baseQuestions}
                  corrections={correctAnswerOverrides}
                  onSaveCorrection={(questionId, optionIndex) => void saveQuestionCorrection(questionId, optionIndex)}
                  onResetCorrection={(questionId) => void resetQuestionCorrection(questionId)}
                  onResetAllCorrections={() => void resetAllCorrections()}
                  onSubmitCorrections={async () => {
                    const originalIndexById = Object.fromEntries(
                      baseQuestions.map((q) => [q.id, q.correctIndex]),
                    );
                    await submitCorrectionsToRepo(correctAnswerOverrides, originalIndexById);
                  }}
                  onGoHome={() => goHome(navigation)}
                />
              </ErrorBoundary>
            )}
          </Stack.Screen>

          <Stack.Screen name="stats">
            {({ navigation }) => (
              <ErrorBoundary>
                <StatsScreen
                  stats={stats}
                  totalAccuracy={totalAccuracy}
                  practiceAccuracy={practiceAccuracy}
                  questionStats={questionStats}
                  totalQuestions={questionPool.length}
                  onResetAllStats={async () => {
                    setStats(EMPTY_STATS);
                    await saveStats(EMPTY_STATS);

                    setFailedIds([]);
                    await saveFailedQuestionIds([]);

                    setQuestionStats({});
                    await saveAllQuestionStats({});
                  }}
                  onGoHome={() => goHome(navigation)}
                />
              </ErrorBoundary>
            )}
          </Stack.Screen>

          <Stack.Screen name="questionList">
            {({ navigation }) => (
              <ErrorBoundary>
                <QuestionListScreen
                  questions={questionPool}
                  questionStats={questionStats}
                  disabledIds={disabledIds}
                  favoriteIds={favoriteIds}
                  failedIds={failedIds}
                  onSaveDisabled={async (ids) => {
                    setDisabledIds(ids);
                    await saveDisabledQuestionIds(ids);
                  }}
                  onGoHome={() => goHome(navigation)}
                />
              </ErrorBoundary>
            )}
          </Stack.Screen>

          <Stack.Screen name="examResult">
            {({ navigation }) => (
              <ErrorBoundary>
                <ExamResultScreen
                  score={score}
                  totalQuestions={questions.length}
                  questions={questions}
                  answers={answers}
                  onRepeatExam={() => {
                    repeatExam();
                    navigation.replace("exam");
                  }}
                  onStartAnotherExam={() => {
                    startAnotherExamSameCount();
                    navigation.replace("exam");
                  }}
                  onGoHome={() => goHome(navigation)}
                />
              </ErrorBoundary>
            )}
          </Stack.Screen>

          <Stack.Screen name="practice">
            {({ navigation }) => (
              <ErrorBoundary>
                {currentQuestion ? (
                  <PracticeScreen
                    question={currentQuestion}
                    currentIndex={currentIndex}
                    totalQuestions={questions.length}
                    practiceMode={practiceMode}
                    practiceSelected={practiceSelected}
                    practiceAnswered={practiceAnswered}
                    isFavorite={favoriteIds.includes(currentQuestion.id)}
                    onToggleFavorite={toggleQuestionFavorite}
                    onAnswer={answerPractice}
                    onNext={() => {
                      if (!nextPracticeQuestion()) {
                        goHome(navigation);
                      }
                    }}
                    onPrev={prevPracticeQuestion}
                    onGoHome={() => goHome(navigation)}
                  />
                ) : (
                  <HomeScreen
                    totalQuestions={questionPool.length}
                    failedCount={failedIds.length}
                    correctionCount={correctionCount}
                    hardCount={hardIds.length}
                    totalAccuracy={totalAccuracy}
                    examCountInput={examCountInput}
                    onExamCountChange={setExamCountInput}
                    onStartExam={() => {
                      startExam();
                      navigation.replace("exam");
                    }}
                    onStartRandomPractice={() => {
                      if (startPractice("random-list")) {
                        navigation.replace("practice");
                      }
                    }}
                    onStartFailedPractice={() => {
                      if (startPractice("failed-list")) {
                        navigation.replace("practice");
                      }
                    }}
                    onOpenCorrections={() => navigation.replace("corrections")}
                    onStartHardPractice={() => {
                      if (startPractice("hard-list")) {
                        navigation.replace("practice");
                      }
                    }}
                    onOpenStats={() => navigation.replace("stats")}
                    onOpenQuestionList={() => navigation.replace("questionList")}
                    onOpenOptions={() => navigation.replace("options")}
                  />
                )}
              </ErrorBoundary>
            )}
          </Stack.Screen>

          <Stack.Screen name="exam">
            {({ navigation }) => (
              <ErrorBoundary>
                {currentQuestion ? (
                  <ExamScreen
                    question={currentQuestion}
                    currentIndex={currentIndex}
                    totalQuestions={questions.length}
                    selectedAnswer={answers[currentQuestion.id]}
                    onAnswer={answerExam}
                    onNext={nextExamQuestion}
                    onPrev={prevExamQuestion}
                    onFinish={() => requestFinishExam(() => navigation.replace("examResult"))}
                    onGoHome={() => goHome(navigation)}
                    isFavorite={favoriteIds.includes(currentQuestion.id)}
                    onToggleFavorite={toggleQuestionFavorite}
                    answeredQuestions={answeredQuestions}
                    onNavigate={setCurrentIndex}
                  />
                ) : (
                  <HomeScreen
                    totalQuestions={questionPool.length}
                    failedCount={failedIds.length}
                    correctionCount={correctionCount}
                    hardCount={hardIds.length}
                    totalAccuracy={totalAccuracy}
                    examCountInput={examCountInput}
                    onExamCountChange={setExamCountInput}
                    onStartExam={() => {
                      startExam();
                      navigation.replace("exam");
                    }}
                    onStartRandomPractice={() => {
                      if (startPractice("random-list")) {
                        navigation.replace("practice");
                      }
                    }}
                    onStartFailedPractice={() => {
                      if (startPractice("failed-list")) {
                        navigation.replace("practice");
                      }
                    }}
                    onOpenCorrections={() => navigation.replace("corrections")}
                    onStartHardPractice={() => {
                      if (startPractice("hard-list")) {
                        navigation.replace("practice");
                      }
                    }}
                    onOpenStats={() => navigation.replace("stats")}
                    onOpenQuestionList={() => navigation.replace("questionList")}
                    onOpenOptions={() => navigation.replace("options")}
                  />
                )}
              </ErrorBoundary>
            )}
          </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      </FontScaleContext.Provider>
    </SafeAreaProvider>
  );
}