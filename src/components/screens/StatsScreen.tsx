import { useState } from "react";
import { Alert, Platform, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText as Text } from "../AppText";
import Svg, { Circle, G, Line, Polyline, Text as SvgText } from "react-native-svg";
import { AppStats, ProfileExamSessionRecord, QuestionStat } from "../../types";
import { styles, theme } from "../../styles/appStyles";

type StatsScreenProps = {
  stats: AppStats;
  totalAccuracy: string;
  practiceAccuracy: string;
  questionStats: Record<string, QuestionStat>;
  totalQuestions: number;
  examHistory: ProfileExamSessionRecord[];
  onOpenExamSession: (session: ProfileExamSessionRecord) => void;
  onResetAllStats: () => Promise<void>;
  onGoHome: () => void;
};

export function StatsScreen({
  stats,
  totalAccuracy,
  practiceAccuracy,
  questionStats,
  totalQuestions,
  examHistory,
  onOpenExamSession,
  onResetAllStats,
  onGoHome,
}: StatsScreenProps) {
  const [historyOpen, setHistoryOpen] = useState(false);

  const history = examHistory.slice(0, 5);
  const chartPoints = [...history].reverse().slice(-12);
  const seenCount = Object.values(questionStats).filter((s) => s.timesShown > 0).length;
  const seenPct = totalQuestions > 0 ? Math.round((seenCount / totalQuestions) * 100) : 0;

  function requestResetStats() {
    const message = "Se borrarán todas las estadísticas (globales, historial, falladas y por pregunta). ¿Seguro que quieres continuar?";

    if (Platform.OS === "web" && typeof globalThis.confirm === "function") {
      if (globalThis.confirm(message)) {
        void onResetAllStats();
      }
      return;
    }

    Alert.alert(
      "Reiniciar estadísticas",
      message,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, reiniciar",
          style: "destructive",
          onPress: () => {
            void onResetAllStats();
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topHeaderRow}>
        <Pressable style={styles.headerHomeButton} onPress={onGoHome}>
          <Text style={styles.headerHomeButtonText}>⌂ Inicio</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Estadisticas</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rendimiento global</Text>
          <Text style={styles.cardNumber}>{totalAccuracy}%</Text>
          <Text style={styles.cardDescription}>
            {stats.totalCorrect} aciertos de {stats.totalAnswered} respuestas
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Examenes completados</Text>
          <Text style={styles.cardNumber}>{stats.examsCompleted}</Text>
          {stats.lastExamDate && (
            <Text style={styles.cardDescription}>
              Último: {new Date(stats.lastExamDate).toLocaleDateString("es-ES")}
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Practica</Text>
          <Text style={styles.cardNumber}>{practiceAccuracy}%</Text>
          <Text style={styles.cardDescription}>
            {stats.practiceCorrect} aciertos de {stats.practiceAnswered} respuestas
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Progreso de cobertura del temario</Text>
          <Text style={styles.cardNumber}>{seenCount} / {totalQuestions}</Text>
          <Text style={styles.cardDescription}>Has visto el {seenPct}% del banco total.</Text>
          <View style={{ marginTop: 10, height: 10, borderRadius: 999, backgroundColor: "#e5edf7", overflow: "hidden" }}>
            <View style={{ height: "100%", width: `${seenPct}%`, backgroundColor: theme.primary }} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tendencia de acierto en exámenes</Text>
          <Text style={[styles.cardDescription, { marginTop: 4 }]}>
            Últimos {chartPoints.length} exámenes. Cada punto representa un examen.
          </Text>

          {chartPoints.length < 2 ? (
            <Text style={[styles.cardDescription, { marginTop: 12 }]}>Necesitas al menos 2 exámenes para ver la evolución.</Text>
          ) : (() => {
            const first = chartPoints[0].accuracy;
            const last = chartPoints[chartPoints.length - 1].accuracy;
            const best = Math.max(...chartPoints.map((p) => p.accuracy));
            const trend = last - first;
            const n = chartPoints.length;
            const GRID = [0, 25, 50, 75, 100];

            // chart area inside SVG
            const CHART_LEFT = 52;
            const CHART_RIGHT = 306;
            const CHART_TOP = 18;
            const CHART_BOTTOM = 170;
            const chartWidth = CHART_RIGHT - CHART_LEFT;
            const chartHeight = CHART_BOTTOM - CHART_TOP;

            const pctToY = (pct: number) => CHART_BOTTOM - (pct / 100) * chartHeight;
            const idxToX = (idx: number) => CHART_LEFT + idx * (chartWidth / Math.max(n - 1, 1));
            const lastX = idxToX(n - 1);
            const lastY = pctToY(last);

            const linePoints = chartPoints.map((s, idx) => `${idxToX(idx)},${pctToY(s.accuracy)}`).join(" ");
            const areaPoints = `${CHART_LEFT},${CHART_BOTTOM} ${linePoints} ${CHART_RIGHT},${CHART_BOTTOM}`;

            const formatDate = (ts: number) => {
              const d = new Date(ts);
              return `${d.getDate()}/${d.getMonth() + 1}`;
            };

            return (
              <>
                <View style={{ flexDirection: "row", marginTop: 14, gap: 8 }}>
                  {[
                    { label: "Inicio", value: `${first}%`, color: theme.textStrong },
                    { label: "Último", value: `${last}%`, color: theme.primary },
                    { label: "Mejor", value: `${best}%`, color: theme.success },
                    { label: "Cambio", value: `${trend >= 0 ? "+" : ""}${trend}%`, color: trend >= 0 ? theme.success : theme.danger },
                  ].map((item) => (
                    <View
                      key={item.label}
                      style={{
                        flex: 1,
                        borderWidth: 1,
                        borderColor: "#dbe4ef",
                        borderRadius: 10,
                        backgroundColor: "#f8fbff",
                        paddingVertical: 8,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 11, color: theme.textMuted }}>{item.label}</Text>
                      <Text style={{ fontSize: 16, fontWeight: "800", color: item.color, marginTop: 2 }}>{item.value}</Text>
                    </View>
                  ))}
                </View>

                <View style={{ marginTop: 10, borderWidth: 1, borderColor: "#dbe4ef", borderRadius: 12, backgroundColor: "#fafdff", paddingVertical: 8 }}>
                  <Svg width="100%" height={210} viewBox="0 0 320 210">
                    {GRID.map((pct) => {
                      const y = pctToY(pct);
                      return (
                        <G key={pct}>
                          <Line
                            x1={CHART_LEFT}
                            y1={y}
                            x2={CHART_RIGHT}
                            y2={y}
                            stroke={pct === 0 ? "#c8d4e3" : "#e8eef5"}
                            strokeWidth={pct === 0 ? 1.5 : 1}
                            strokeDasharray={pct === 0 ? undefined : "4,3"}
                          />
                          <SvgText x={CHART_LEFT - 4} y={y + 4} textAnchor="end" fontSize="10" fill={theme.textMuted}>
                            {pct}%
                          </SvgText>
                        </G>
                      );
                    })}

                    <Line x1={CHART_LEFT} y1={CHART_TOP} x2={CHART_LEFT} y2={CHART_BOTTOM} stroke="#c8d4e3" strokeWidth="1.5" />

                    <Polyline fill="rgba(15,118,110,0.10)" stroke="none" points={areaPoints} />
                    <Polyline fill="none" stroke={theme.primary} strokeWidth="2.6" points={linePoints} />

                    {chartPoints.map((s, idx) => (
                      <Circle
                        key={`${s.date}-${idx}`}
                        cx={idxToX(idx)}
                        cy={pctToY(s.accuracy)}
                        r={idx === n - 1 ? 4.3 : 3.3}
                        fill={idx === n - 1 ? theme.primary : theme.primaryDark}
                      />
                    ))}

                    <SvgText
                      x={lastX > CHART_RIGHT - 18 ? lastX - 8 : lastX}
                      y={lastY < CHART_TOP + 14 ? lastY + 16 : lastY - 8}
                      textAnchor={lastX > CHART_RIGHT - 18 ? "end" : "middle"}
                      fontSize="11"
                      fontWeight="bold"
                      fill={theme.primary}
                    >
                      {last}%
                    </SvgText>
                  </Svg>

                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 2, paddingHorizontal: CHART_LEFT }}>
                    <Text style={{ fontSize: 10, color: theme.textMuted }}>{formatDate(chartPoints[0].date)}</Text>
                    {n > 2 && (
                      <Text style={{ fontSize: 10, color: theme.textMuted }}>
                        {formatDate(chartPoints[Math.floor((n - 1) / 2)].date)}
                      </Text>
                    )}
                    <Text style={{ fontSize: 10, color: theme.textMuted }}>{formatDate(chartPoints[n - 1].date)}</Text>
                  </View>
                </View>
              </>
            );
          })()}
        </View>

        {/* Collapsible exam history */}
        {history.length > 0 && (
          <View style={styles.card}>
            <Pressable
              onPress={() => setHistoryOpen((o) => !o)}
              style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
            >
              <Text style={styles.cardTitle}>
                Historial de exámenes ({history.length})
              </Text>
              <Text style={{ fontSize: 18, color: theme.primary }}>{historyOpen ? "▲" : "▼"}</Text>
            </Pressable>

            {historyOpen && (
              <>
                {history.map((session, idx) => (
                  <Pressable
                    key={session.date}
                    onPress={() => onOpenExamSession(session)}
                    style={{
                      marginTop: 10,
                      borderTopWidth: idx === 0 ? 0 : 1,
                      borderTopColor: "#eee",
                      paddingTop: idx === 0 ? 10 : 10,
                    }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: 13, color: "#333", fontWeight: "600" }}>
                        {new Date(session.date).toLocaleDateString("es-ES")}
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "bold",
                          color: session.accuracy >= 70 ? theme.success : theme.danger,
                        }}
                      >
                        {session.accuracy}%
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                      {session.score} / {session.total} correctas
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.primary, marginTop: 3 }}>
                      Tocar para abrir el resumen
                    </Text>
                  </Pressable>
                ))}
              </>
            )}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mantenimiento</Text>
          <Text style={styles.cardDescription}>Borra todas las estadísticas guardadas de la app.</Text>
          <Pressable
            onPress={requestResetStats}
            style={[
              styles.secondaryButton,
              {
                marginTop: 10,
                borderColor: theme.danger,
                backgroundColor: "#fff5f5",
              },
            ]}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.danger }]}>
              Reiniciar todas las estadísticas
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
