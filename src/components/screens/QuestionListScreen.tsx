import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText as Text } from "../AppText";
import { Asset } from "expo-asset";
import { Question, QuestionStat } from "../../types";
import { openPdfUri } from "../../utils/openPdf";
import { styles, theme } from "../../styles/appStyles";

type SortKey = "default" | "timesShown" | "accuracy" | "timesFailed" | "alphabetical";
type FilterMode = "all" | "enabled" | "disabled" | "never-shown" | "failed" | "favorites" | "hard";
type GroupMode = "all" | "common" | "specific" | "other";
type AppearanceRange = "all" | "zero" | "1-5" | "6-15" | "15+";
type AccuracyRange = "all" | "nodata" | "low" | "mid" | "high";
const PAGE_SIZE = 50;

type QuestionListScreenProps = {
  questions: Question[];
  questionStats: Record<string, QuestionStat>;
  disabledIds: string[];
  favoriteIds: string[];
  failedIds: string[];
  onSaveDisabled: (ids: string[]) => Promise<void>;
  onGoHome: () => void;
};

export function QuestionListScreen({
  questions,
  questionStats,
  disabledIds,
  favoriteIds,
  failedIds,
  onSaveDisabled,
  onGoHome,
}: QuestionListScreenProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [groupFilter, setGroupFilter] = useState<GroupMode>("all");
  const [appearanceFilter, setAppearanceFilter] = useState<AppearanceRange>("all");
  const [accuracyFilter, setAccuracyFilter] = useState<AccuracyRange>("all");
  const [localDisabled, setLocalDisabled] = useState<Set<string>>(new Set(disabledIds));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(0);
  const [showAnswers, setShowAnswers] = useState(false);
  const [highlightCorrect, setHighlightCorrect] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const { width } = useWindowDimensions();
  const isCompact = width < 390;

  // ── derived list ─────────────────────────────────────────────────────────
  const displayList = useMemo(() => {
    let list = [...questions];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((item) => {
        const source = (item.source ?? "").toLowerCase();
        const indexLabel = (item.id + ' ' + formatId(item.id)).toLowerCase();
        const positionLabel = String(questions.findIndex((question) => question.id === item.id) + 1);

        return (
          item.question.toLowerCase().includes(q) ||
          source.includes(q) ||
          indexLabel.includes(q) ||
          positionLabel.includes(q)
        );
      });
    }

    if (filterMode === "enabled") {
      list = list.filter((item) => !localDisabled.has(item.id));
    } else if (filterMode === "disabled") {
      list = list.filter((item) => localDisabled.has(item.id));
    } else if (filterMode === "never-shown") {
      list = list.filter((item) => !questionStats[item.id] || questionStats[item.id].timesShown === 0);
    } else if (filterMode === "failed") {
      list = list.filter((item) => failedIds.includes(item.id));
    } else if (filterMode === "favorites") {
      list = list.filter((item) => favoriteIds.includes(item.id));
    } else if (filterMode === "hard") {
      list = list.filter((item) => {
        const s = questionStats[item.id];
        return s && s.timesShown >= 2 && s.timesCorrect / s.timesShown < 0.5;
      });
    }

    if (groupFilter !== "all") {
      list = list.filter((item) => {
        const group = getQuestionGroup(item);
        if (groupFilter === "common") return group === "common";
        if (groupFilter === "specific") return group === "specific";
        return group === "other";
      });
    }

    if (appearanceFilter !== "all") {
      list = list.filter((item) => {
        const shown = questionStats[item.id]?.timesShown ?? 0;
        if (appearanceFilter === "zero") return shown === 0;
        if (appearanceFilter === "1-5") return shown >= 1 && shown <= 5;
        if (appearanceFilter === "6-15") return shown >= 6 && shown <= 15;
        if (appearanceFilter === "15+") return shown > 15;
        return true;
      });
    }

    if (accuracyFilter !== "all") {
      list = list.filter((item) => {
        const stat = questionStats[item.id];
        if (!stat || stat.timesShown === 0) return accuracyFilter === "nodata";
        const pct = (stat.timesCorrect / stat.timesShown) * 100;
        if (accuracyFilter === "low") return pct < 40;
        if (accuracyFilter === "mid") return pct >= 40 && pct < 75;
        if (accuracyFilter === "high") return pct >= 75;
        return false;
      });
    }

    list.sort((a, b) => {
      const sa = questionStats[a.id];
      const sb = questionStats[b.id];
      let diff = 0;
      if (sortKey === "timesShown") diff = (sa?.timesShown ?? 0) - (sb?.timesShown ?? 0);
      else if (sortKey === "timesFailed") diff = (sa?.timesFailed ?? 0) - (sb?.timesFailed ?? 0);
      else if (sortKey === "accuracy") {
        const accA = sa && sa.timesShown > 0 ? sa.timesCorrect / sa.timesShown : -1;
        const accB = sb && sb.timesShown > 0 ? sb.timesCorrect / sb.timesShown : -1;
        diff = accA - accB;
      } else if (sortKey === "alphabetical") {
        diff = a.question.localeCompare(b.question, "es");
      }
      return sortAsc ? diff : -diff;
    });

    return list;
  }, [questions, search, filterMode, groupFilter, sortKey, sortAsc, appearanceFilter, accuracyFilter, localDisabled, questionStats, failedIds, favoriteIds]);

  // ── summary stats ────────────────────────────────────────────────────────
  const totalActive = questions.length - localDisabled.size;
  const totalSeen = questions.filter((q) => (questionStats[q.id]?.timesShown ?? 0) > 0).length;
  const totalPages = Math.max(1, Math.ceil(displayList.length / PAGE_SIZE));
  const pageItems = displayList.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [search, filterMode, groupFilter, appearanceFilter, accuracyFilter, sortKey, sortAsc]);

  useEffect(() => {
    if (page > totalPages - 1) {
      setPage(totalPages - 1);
    }
  }, [page, totalPages]);

  // ── helpers ──────────────────────────────────────────────────────────────
  function toggle(id: string) {
    setLocalDisabled((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setDirty(true);
  }

  function enableAll() { setLocalDisabled(new Set()); setDirty(true); }
  function disableAll() { setLocalDisabled(new Set(questions.map((q) => q.id))); setDirty(true); }
  function enableFiltered() {
    setLocalDisabled((prev) => { const next = new Set(prev); displayList.forEach((q) => next.delete(q.id)); return next; });
    setDirty(true);
  }
  function disableFiltered() {
    setLocalDisabled((prev) => { const next = new Set(prev); displayList.forEach((q) => next.add(q.id)); return next; });
    setDirty(true);
  }

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function saveChanges() {
    setSaving(true);
    await onSaveDisabled(Array.from(localDisabled));
    setSaving(false);
    setDirty(false);
  }

  function getAccPct(stat: QuestionStat | undefined): number | null {
    if (!stat || stat.timesShown === 0) return null;
    return Math.round((stat.timesCorrect / stat.timesShown) * 100);
  }

  // "C12" → "Común #12", "E34" → "Específico #34"
  function formatId(id: string): string {
    const mc = id.match(/^C(\d+)$/);
    if (mc) return `Común #${mc[1]}`;
    const me = id.match(/^E(\d+)$/);
    if (me) return `Específico #${me[1]}`;
    return id;
  }

  function getQuestionGroup(question: Question): GroupMode {
    if (/^C/.test(question.id)) return "common";
    if (/^E/.test(question.id)) return "specific";
    return "other";
  }

  // filename → readable label
  function formatSource(src: string): string {
    if (src.includes("comun")) return "Temario Común – Preguntas";
    if (src.includes("enfermeria_500") || src.includes("enfermero_500")) return "Temario Enfermería – Preguntas";
    return src;
  }

  function getSourcePdfModule(question: Question): number | null {
    const src = question.source ?? "";
    if (src.includes("comun")) return require("../../../assets/temario/temario_comun_200_preguntas_cas.pdf") as number;
    if (src.includes("enfermeria") || src.includes("enfermero_500")) return require("../../../assets/temario/temario_enfermeria_500_preguntas_cas.pdf") as number;
    return null;
  }

  async function openSourcePdf(question: Question) {
    const mod = getSourcePdfModule(question);
    if (!mod) return;
    try {
      const asset = Asset.fromModule(mod);
      if (!asset.downloaded) await asset.downloadAsync();
      const uri = asset.localUri ?? asset.uri;
      await openPdfUri(uri);
    } catch {
      Alert.alert("Error", "No se pudo abrir el temario.");
    }
  }

  function accColor(pct: number | null): string {
    if (pct === null) return theme.textMuted;
    if (pct >= 75) return theme.success;
    if (pct >= 40) return theme.warning;
    return theme.danger;
  }

  function cycleSortKey(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(false); }
  }

  const FILTERS: { key: FilterMode; label: string; emoji: string }[] = [
    { key: "all", label: "Todas", emoji: "📋" },
    { key: "enabled", label: "Activas", emoji: "✅" },
    { key: "disabled", label: "Excluidas", emoji: "🚫" },
    { key: "never-shown", label: "Sin ver", emoji: "👁" },
    { key: "failed", label: "Falladas", emoji: "❌" },
    { key: "hard", label: "Difíciles", emoji: "🔥" },
    { key: "favorites", label: "Favoritas", emoji: "⭐" },
  ];

  const APPEARANCE_FILTERS: { key: AppearanceRange; label: string }[] = [
    { key: "all", label: "Todas" },
    { key: "zero", label: "0 veces" },
    { key: "1-5", label: "1–5" },
    { key: "6-15", label: "6–15" },
    { key: "15+", label: "15+" },
  ];

  const ACCURACY_FILTERS: { key: AccuracyRange; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "nodata", label: "Sin datos" },
    { key: "low", label: "< 40%" },
    { key: "mid", label: "40–74%" },
    { key: "high", label: "≥ 75%" },
  ];

  const SORTS: { key: SortKey; label: string }[] = [
    { key: "default", label: "Original" },
    { key: "timesShown", label: "Apariciones" },
    { key: "timesFailed", label: "Fallos" },
    { key: "accuracy", label: "Acierto %" },
    { key: "alphabetical", label: "A–Z" },
  ];

  const GROUP_FILTERS: { key: GroupMode; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "common", label: "Común" },
    { key: "specific", label: "Específico" },
    { key: "other", label: "Otros" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topHeaderRow}>
        <Pressable style={styles.headerHomeButton} onPress={onGoHome}>
          <Text style={styles.headerHomeButtonText}>⌂ Inicio</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Banco de Preguntas</Text>
        <Text style={styles.subtitle}>
          Filtra, ordena y decide qué preguntas entran en examen y práctica.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumen del banco</Text>
          <Text style={styles.cardNumber}>{totalActive} activas</Text>
          <Text style={styles.cardDescription}>
            Total: {questions.length} · Excluidas: {localDisabled.size} · Vistas: {totalSeen} · Falladas: {failedIds.length}
          </Text>
        </View>

        {/* ── Controls ── */}
        <View style={styles.card}>

          {/* Search */}
          <TextInput
            style={{
              ...styles.input,
              marginBottom: 10,
              marginTop: 0,
            }}
            placeholder="🔍 Buscar pregunta..."
            placeholderTextColor={theme.textMuted}
            value={search}
            onChangeText={setSearch}
          />

          {/* Status filter */}
          <Text style={{ fontSize: 11, fontWeight: "700", color: "#8fa8bc", marginBottom: 5, letterSpacing: 0.5 }}>ESTADO</Text>
          <ScrollView horizontal={!isCompact} showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: "row", flexWrap: isCompact ? "wrap" : "nowrap", gap: 6, paddingRight: 8 }}>
              {FILTERS.map((f) => {
                const active = filterMode === f.key;
                return (
                  <Pressable
                    key={f.key}
                    onPress={() => setFilterMode(f.key)}
                    style={{
                      flexDirection: "row", alignItems: "center", gap: 4,
                      paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20,
                      backgroundColor: active ? "#0a9396" : "#fff",
                      borderWidth: 1.5, borderColor: active ? "#0a9396" : "#c8dce8",
                    }}
                  >
                    <Text style={{ fontSize: 12 }}>{f.emoji}</Text>
                    <Text style={{ fontSize: 12, color: active ? "#fff" : "#2c6e8a", fontWeight: "600" }}>{f.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Group filter */}
          <Text style={{ fontSize: 11, fontWeight: "700", color: "#8fa8bc", marginBottom: 5, letterSpacing: 0.5 }}>GRUPO</Text>
          <ScrollView horizontal={!isCompact} showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: "row", flexWrap: isCompact ? "wrap" : "nowrap", gap: 6, paddingRight: 8 }}>
              {GROUP_FILTERS.map((f) => {
                const active = groupFilter === f.key;
                return (
                  <Pressable
                    key={f.key}
                    onPress={() => setGroupFilter(f.key)}
                    style={{
                      paddingHorizontal: 11,
                      paddingVertical: 6,
                      borderRadius: 20,
                      backgroundColor: active ? "#0f766e" : "#fff",
                      borderWidth: 1.5,
                      borderColor: active ? "#0f766e" : "#c8dce8",
                    }}
                  >
                    <Text style={{ fontSize: 12, color: active ? "#fff" : "#2c6e8a", fontWeight: "600" }}>{f.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Appearance range */}
          <Text style={{ fontSize: 11, fontWeight: "700", color: "#8fa8bc", marginBottom: 5, letterSpacing: 0.5 }}>APARICIONES</Text>
          <ScrollView horizontal={!isCompact} showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: "row", flexWrap: isCompact ? "wrap" : "nowrap", gap: 6, paddingRight: 8 }}>
              {APPEARANCE_FILTERS.map((f) => {
                const active = appearanceFilter === f.key;
                return (
                  <Pressable
                    key={f.key}
                    onPress={() => setAppearanceFilter(f.key)}
                    style={{
                      paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20,
                      backgroundColor: active ? "#1b4965" : "#fff",
                      borderWidth: 1.5, borderColor: active ? "#1b4965" : "#c8dce8",
                    }}
                  >
                    <Text style={{ fontSize: 12, color: active ? "#fff" : "#2c6e8a", fontWeight: "600" }}>{f.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Accuracy range */}
          <Text style={{ fontSize: 11, fontWeight: "700", color: "#8fa8bc", marginBottom: 5, letterSpacing: 0.5 }}>% ACIERTO</Text>
          <ScrollView horizontal={!isCompact} showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: "row", flexWrap: isCompact ? "wrap" : "nowrap", gap: 6, paddingRight: 8 }}>
              {ACCURACY_FILTERS.map((f) => {
                const active = accuracyFilter === f.key;
                const accentColor = f.key === "high" ? theme.success : f.key === "mid" ? theme.warning : f.key === "low" ? theme.danger : theme.primaryDark;
                return (
                  <Pressable
                    key={f.key}
                    onPress={() => setAccuracyFilter(f.key)}
                    style={{
                      paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20,
                      backgroundColor: active ? accentColor : "#fff",
                      borderWidth: 1.5, borderColor: active ? accentColor : "#c8dce8",
                    }}
                  >
                    <Text style={{ fontSize: 12, color: active ? "#fff" : "#2c6e8a", fontWeight: "600" }}>{f.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Sort */}
          <Text style={{ fontSize: 11, fontWeight: "700", color: "#8fa8bc", marginBottom: 5, letterSpacing: 0.5 }}>ORDENAR</Text>
          <ScrollView horizontal={!isCompact} showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: "row", flexWrap: isCompact ? "wrap" : "nowrap", gap: 6, paddingRight: 8 }}>
              {SORTS.map((s) => {
                const active = sortKey === s.key;
                return (
                  <Pressable
                    key={s.key}
                    onPress={() => cycleSortKey(s.key)}
                    style={{
                      flexDirection: "row", alignItems: "center", gap: 4,
                      paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20,
                      backgroundColor: active ? theme.primaryDark : "#fff",
                      borderWidth: 1.5, borderColor: active ? theme.primaryDark : "#c8dce8",
                    }}
                  >
                    <Text style={{ fontSize: 12, color: active ? "#fff" : "#2c6e8a", fontWeight: "600" }}>{s.label}</Text>
                    {active && <Text style={{ fontSize: 11, color: "#d9ecf0" }}>{sortAsc ? "↑" : "↓"}</Text>}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Result count + bulk actions */}
          <View style={{ marginBottom: 8 }}>
            <ScrollView horizontal={!isCompact} showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", flexWrap: isCompact ? "wrap" : "nowrap", gap: 6 }}>
                <BulkBtn label="✓ Todo" color={theme.success} onPress={enableAll} />
                <BulkBtn label="✗ Todo" color={theme.danger} onPress={disableAll} />
                <BulkBtn label={`✓ Filtradas (${displayList.length})`} color={theme.primary} onPress={enableFiltered} />
                <BulkBtn label={`✗ Filtradas (${displayList.length})`} color={theme.warning} onPress={disableFiltered} />
              </View>
            </ScrollView>

            <Text style={{ fontSize: 13, color: "#57788f", fontWeight: "600", marginTop: 8 }}>
              {displayList.length} pregunta{displayList.length !== 1 ? "s" : ""} · Página {page + 1}/{totalPages}
            </Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              <Pressable
                onPress={() => setShowAnswers((prev) => !prev)}
                style={{
                  backgroundColor: showAnswers ? "#0a9396" : "#ffffff",
                  borderColor: showAnswers ? "#0a9396" : "#c8dce8",
                  borderWidth: 1.5,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ fontSize: 12, color: showAnswers ? "#ffffff" : "#2c6e8a", fontWeight: "700" }}>
                  {showAnswers ? "👁 Respuestas visibles" : "👁 Mostrar respuestas"}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setHighlightCorrect((prev) => !prev)}
                style={{
                  backgroundColor: highlightCorrect ? "#1a7a4a" : "#ffffff",
                  borderColor: highlightCorrect ? "#1a7a4a" : "#c8dce8",
                  borderWidth: 1.5,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ fontSize: 12, color: highlightCorrect ? "#ffffff" : "#2c6e8a", fontWeight: "700" }}>
                  {highlightCorrect ? "✅ Correcta resaltada" : "✅ Resaltar correcta"}
                </Text>
              </Pressable>
            </View>
          </View>

        </View>

        {/* ── Question list ── */}
        <View>
          {displayList.length === 0 && (
            <View style={{ alignItems: "center", marginTop: 20 }}>
              <Text style={{ fontSize: 32, marginBottom: 12 }}>🔍</Text>
              <Text style={{ fontSize: 15, color: "#8fa8bc", textAlign: "center" }}>No hay preguntas con esos filtros.</Text>
            </View>
          )}

          {pageItems.map((item, idx) => {
            const stat = questionStats[item.id];
            const acc = getAccPct(stat);
            const isDisabled = localDisabled.has(item.id);
            const isFav = favoriteIds.includes(item.id);
            const isFailed = failedIds.includes(item.id);
            const shown = stat?.timesShown ?? 0;
            const correct = stat?.timesCorrect ?? 0;
            const failed = stat?.timesFailed ?? 0;
            const absoluteIndex = page * PAGE_SIZE + idx;

            const isExpanded = expandedIds.has(item.id);

            return (
              <View
                key={item.id}
                style={{
                  ...styles.card,
                  backgroundColor: isDisabled ? "#f7f7f7" : theme.surface,
                  borderWidth: 1.5,
                  borderColor: isDisabled ? "#d8d8d8" : "#c2dfe9",
                  marginBottom: 10,
                  opacity: isDisabled ? 0.7 : 1,
                  shadowColor: "#1b4965",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: isDisabled ? 0 : 0.06,
                  shadowRadius: 4,
                  elevation: isDisabled ? 0 : 2,
                }}
              >
                {/* Top row */}
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 7, gap: 6 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#8fa8bc", minWidth: 30 }}>#{absoluteIndex + 1}</Text>
                  <View style={{
                    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5,
                    backgroundColor: isDisabled ? "#f0e6e6" : "#e6f6f0",
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: isDisabled ? "#c0392b" : "#1a7a4a" }}>
                      {isDisabled ? "EXCLUIDA" : "ACTIVA"}
                    </Text>
                  </View>
                  {isFav && <Text style={{ fontSize: 13 }}>⭐</Text>}
                  {isFailed && (
                    <View style={{ backgroundColor: "#fde8e8", borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 11, color: "#c0392b", fontWeight: "700" }}>❌ Fallada</Text>
                    </View>
                  )}
                  <View style={{ flex: 1, alignItems: "flex-end" }}>
                    <Pressable
                      onPress={() => toggle(item.id)}
                      style={{
                        borderWidth: 1.2,
                        borderColor: isDisabled ? "#1a7a4a" : "#c0392b",
                        borderRadius: 6,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        backgroundColor: "#ffffff",
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: "700", color: isDisabled ? "#1a7a4a" : "#c0392b" }}>
                        {isDisabled ? "Activar" : "Excluir"}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* Question text */}
                <Text style={{ fontSize: 13, color: "#1b3a50", lineHeight: 19, marginBottom: 10 }}>
                  {item.question}
                </Text>

                {showAnswers && (
                  <View style={{ marginBottom: 10 }}>
                    <Pressable
                      onPress={() => toggleExpanded(item.id)}
                      style={{
                        borderWidth: 1.2,
                        borderColor: "#c8dce8",
                        backgroundColor: "#f8fbff",
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 7,
                        alignSelf: "flex-start",
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: "700", color: "#2c6e8a" }}>
                        {isExpanded ? "Ocultar respuestas" : "Ver respuestas"}
                      </Text>
                    </Pressable>

                    {isExpanded && (
                      <View style={{ marginTop: 8, gap: 6 }}>
                        {item.options.map((option, optionIndex) => {
                          const isCorrectOption = optionIndex === item.correctIndex;
                          return (
                            <View
                              key={`${item.id}-option-${optionIndex}`}
                              style={{
                                borderWidth: 1,
                                borderColor: highlightCorrect && isCorrectOption ? "#1a7a4a" : "#dbe4ef",
                                backgroundColor: highlightCorrect && isCorrectOption ? "#e8f7ef" : "#ffffff",
                                borderRadius: 8,
                                paddingHorizontal: 10,
                                paddingVertical: 8,
                              }}
                            >
                              <Text style={{ fontSize: 12, color: "#234", fontWeight: highlightCorrect && isCorrectOption ? "700" : "500" }}>
                                {optionIndex + 1}. {option}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                )}

                {/* Question meta */}
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {/* ID chip */}
                  <View style={{ backgroundColor: "#d8edf8", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 11, color: "#1b4965", fontWeight: "700" }}>{item.id}</Text>
                  </View>
                  {/* Fuente chip — opens the PDF */}
                  <Pressable
                    onPress={() => openSourcePdf(item)}
                    style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#eef5fb", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: theme.primary }}
                  >
                    <Text style={{ fontSize: 11 }}>📄</Text>
                    <Text style={{ fontSize: 11, color: theme.primary, fontWeight: "600" }}>
                      {formatSource(item.source ?? "")}
                    </Text>
                  </Pressable>
                </View>

                {/* Stats row */}
                <View style={{ flexDirection: "row", gap: 6, marginBottom: shown > 0 ? 8 : 0 }}>
                  <StatChip icon="👁" value={shown} label="vistas" color="#1b4965" />
                  <StatChip icon="✅" value={correct} label="aciertos" color="#28a745" />
                  <StatChip icon="❌" value={failed} label="fallos" color="#dc3545" />
                  <StatChip icon="🎯" value={acc !== null ? `${acc}%` : "—"} label="acierto" color={accColor(acc)} />
                </View>

                {/* Accuracy bar */}
                {shown > 0 && (
                  <View style={{ height: 5, backgroundColor: "#eef3f7", borderRadius: 3, overflow: "hidden" }}>
                    <View style={{ height: "100%", width: `${acc ?? 0}%`, backgroundColor: accColor(acc), borderRadius: 3 }} />
                  </View>
                )}
              </View>
            );
          })}

          {displayList.length > 0 && totalPages > 1 && (
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
              <Pressable
                onPress={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                style={[styles.secondaryButton, { flex: 1, marginTop: 0 }, page === 0 && styles.disabledButton]}
              >
                <Text style={styles.secondaryButtonText}>← Anterior</Text>
              </Pressable>

              <Text style={{ color: theme.textMuted, fontSize: 13, marginHorizontal: 10 }}>
                {page + 1} / {totalPages}
              </Text>

              <Pressable
                onPress={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                style={[styles.secondaryButton, { flex: 1, marginTop: 0 }, page >= totalPages - 1 && styles.disabledButton]}
              >
                <Text style={styles.secondaryButtonText}>Siguiente →</Text>
              </Pressable>
            </View>
          )}
        </View>

        {dirty && (
          <Pressable
            style={{ backgroundColor: saving ? "#8fa8bc" : theme.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}
            onPress={saveChanges}
            disabled={saving}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
              {saving ? "Guardando..." : `💾 Guardar cambios (${localDisabled.size} excluidas)`}
            </Text>
          </Pressable>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatChip({ icon, value, label, color }: { icon: string; value: number | string; label: string; color: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center", backgroundColor: "#f4f9ff", borderRadius: 8, paddingVertical: 5, paddingHorizontal: 4, borderWidth: 1, borderColor: "#e0ecf5" }}>
      <Text style={{ fontSize: 11 }}>{icon}</Text>
      <Text style={{ fontSize: 13, fontWeight: "800", color, marginTop: 1 }}>{value}</Text>
      <Text style={{ fontSize: 9, color: "#9ab5c7", marginTop: 1 }}>{label}</Text>
    </View>
  );
}

function BulkBtn({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ backgroundColor: color + "18", borderWidth: 1, borderColor: color + "55", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}
    >
      <Text style={{ fontSize: 11, color, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}
