const fs = require("fs");
const path = require("path");

const INPUT_FILE = path.resolve(process.cwd(), "data/questions_raw.txt");
const OUTPUT_FILE = path.resolve(process.cwd(), "data/questions.json");

function parseQuestions(content) {
  const normalized = content.replace(/\r/g, "").trim();
  const blocks = normalized.split(/\n\s*\n+/);
  const questions = [];

  blocks.forEach((block, idx) => {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 6) {
      return;
    }

    const questionLine = lines[0].replace(/^\d+[\).\-\s]*/, "");

    const optionLines = lines.filter((line) => /^[a-dA-D][\).\-\s]/.test(line));
    if (optionLines.length < 2) {
      return;
    }

    const options = optionLines.map((line) => line.replace(/^[a-dA-D][\).\-\s]*/, "").trim());

    const answerLine = lines.find((line) => /^respuesta\s*[:\-]/i.test(line));
    if (!answerLine) {
      return;
    }

    const letterMatch = answerLine.match(/[a-dA-D]/);
    if (!letterMatch) {
      return;
    }

    const correctIndex = letterMatch[0].toUpperCase().charCodeAt(0) - 65;

    if (correctIndex < 0 || correctIndex >= options.length) {
      return;
    }

    const explanationLine = lines.find((line) => /^explicacion\s*[:\-]/i.test(line));
    const explanation = explanationLine
      ? explanationLine.replace(/^explicacion\s*[:\-]\s*/i, "")
      : undefined;

    questions.push({
      id: `Q${idx + 1}`,
      question: questionLine,
      options,
      correctIndex,
      ...(explanation ? { explanation } : {}),
    });
  });

  return questions;
}

function run() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`No existe el archivo de entrada: ${INPUT_FILE}`);
    console.error("Crea data/questions_raw.txt con el formato indicado en README.md.");
    process.exit(1);
  }

  const raw = fs.readFileSync(INPUT_FILE, "utf8");
  const questions = parseQuestions(raw);

  if (!questions.length) {
    console.error("No se pudo parsear ninguna pregunta.");
    process.exit(1);
  }

  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(questions, null, 2)}\n`, "utf8");
  console.log(`Preguntas convertidas: ${questions.length}`);
  console.log(`Archivo generado: ${OUTPUT_FILE}`);
}

run();
