export function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type SemiRandomStat = {
  timesShown?: number;
  timesCorrect?: number;
  timesFailed?: number;
};

type SemiRandomQuestion = {
  id: string;
};

export function pickSemiRandomQuestions<T extends SemiRandomQuestion>(
  pool: T[],
  count: number,
  statsById: Record<string, SemiRandomStat>,
  failedIds: string[] = [],
): T[] {
  if (count >= pool.length) {
    return shuffleArray(pool);
  }

  const failedSet = new Set(failedIds);
  const source = [...pool];
  const result: T[] = [];

  function weightOf(item: T): number {
    const stat = statsById[item.id];
    const shown = stat?.timesShown ?? 0;
    const correct = stat?.timesCorrect ?? 0;
    const failed = stat?.timesFailed ?? 0;
    const accuracy = shown > 0 ? correct / shown : 0.5;

    const unseenBonus = shown === 0 ? 2.2 : 0;
    const lowExposureBonus = shown > 0 ? 1 / (1 + shown * 0.45) : 0;
    const weaknessBonus = shown > 0 ? (1 - accuracy) * 1.6 : 0;
    const failedBonus = Math.min(failed, 6) * 0.25;
    const pendingFailedBonus = failedSet.has(item.id) ? 1.0 : 0;
    const jitter = Math.random() * 0.25;

    return 1 + unseenBonus + lowExposureBonus + weaknessBonus + failedBonus + pendingFailedBonus + jitter;
  }

  while (result.length < count && source.length > 0) {
    const weights = source.map(weightOf);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    let target = Math.random() * totalWeight;
    let pickedIndex = 0;

    for (let i = 0; i < source.length; i += 1) {
      target -= weights[i];
      if (target <= 0) {
        pickedIndex = i;
        break;
      }
    }

    const [picked] = source.splice(pickedIndex, 1);
    result.push(picked);
  }

  return shuffleArray(result);
}
