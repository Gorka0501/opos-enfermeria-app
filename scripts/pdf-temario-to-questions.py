import json
import re
from pathlib import Path

try:
    from pypdf import PdfReader
except ImportError as exc:
    raise SystemExit("Falta dependencia pypdf. Instala con: pip install pypdf") from exc


ROOT = Path(__file__).resolve().parents[1]
TEMARIO_DIR = ROOT.parent / "temario"
OUTPUT_FILE = ROOT / "data" / "questions.json"

# (PDF con enunciados, PDF con plantilla de respuestas, prefijo informativo)
SOURCES = [
    ("200-Galdera-sorta_TEMARIO-COMUN_cas.pdf", "200 ENFERMERO G.pdf", "COMUN"),
    ("ENFERMERIA_500_preguntas_cas.pdf", "500 ENFERMERO C.pdf", "ESPECIFICO"),
]


def clean_line(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def extract_pdf_text(pdf_path: Path) -> str:
    reader = PdfReader(str(pdf_path))
    return "\n".join((page.extract_text() or "") for page in reader.pages)


def parse_answer_key(text: str) -> dict[int, str]:
    matches = re.findall(r"\b(\d{1,4})\s*-\s*([A-Da-d])\b", text)
    answers: dict[int, str] = {}
    for num, letter in matches:
        answers[int(num)] = letter.upper()
    return answers


def parse_questions(text: str) -> list[dict]:
    lines = [clean_line(line) for line in text.splitlines() if clean_line(line)]
    questions: list[dict] = []
    i = 0

    while i < len(lines):
        q_match = re.match(r"^(\d{1,4})\s*[\.-]+\s*(.+)$", lines[i])
        if not q_match:
            i += 1
            continue

        q_number = int(q_match.group(1))
        q_text_parts = [q_match.group(2)]
        i += 1

        # Continuacion del enunciado hasta detectar opcion a)
        while i < len(lines) and not re.match(r"^[a-dA-D]\)\s*", lines[i]):
            if re.match(r"^\d{1,4}\s*[\.-]+\s+", lines[i]):
                break
            q_text_parts.append(lines[i])
            i += 1

        options_map: dict[str, list[str]] = {}
        current_letter = None

        while i < len(lines):
            option_start = re.match(r"^([a-dA-D])\)\s*(.*)$", lines[i])
            if option_start:
                current_letter = option_start.group(1).upper()
                options_map[current_letter] = [option_start.group(2).strip()] if option_start.group(2).strip() else []
                i += 1
                continue

            if re.match(r"^\d{1,4}\s*[\.-]+\s+", lines[i]):
                break

            if current_letter is not None:
                options_map[current_letter].append(lines[i])

            i += 1

        if "A" in options_map and "B" in options_map:
            ordered = []
            for letter in ["A", "B", "C", "D"]:
                if letter in options_map:
                    ordered.append(clean_line(" ".join(options_map[letter])))

            questions.append(
                {
                    "number": q_number,
                    "question": clean_line(" ".join(q_text_parts)),
                    "options": ordered,
                }
            )

    return questions


def build_from_pair(question_pdf: Path, answers_pdf: Path, block_name: str) -> list[dict]:
    q_text = extract_pdf_text(question_pdf)
    a_text = extract_pdf_text(answers_pdf)

    parsed_questions = parse_questions(q_text)
    parsed_answers = parse_answer_key(a_text)

    merged = []
    missing_answers = 0

    for item in parsed_questions:
        number = item["number"]
        answer_letter = parsed_answers.get(number)
        if not answer_letter:
            missing_answers += 1
            continue

        correct_index = ord(answer_letter) - ord("A")
        if correct_index < 0 or correct_index >= len(item["options"]):
            missing_answers += 1
            continue

        merged.append(
            {
                "block": block_name,
                "number": number,
                "question": item["question"],
                "options": item["options"],
                "correctIndex": correct_index,
            }
        )

    print(f"{block_name}: {len(parsed_questions)} preguntas leidas, {len(parsed_answers)} respuestas, {len(merged)} unidas, {missing_answers} descartadas")
    return merged


def main():
    all_items = []

    for q_name, a_name, block in SOURCES:
        q_path = TEMARIO_DIR / q_name
        a_path = TEMARIO_DIR / a_name
        if not q_path.exists():
            raise SystemExit(f"No existe PDF de preguntas: {q_path}")
        if not a_path.exists():
            raise SystemExit(f"No existe PDF de respuestas: {a_path}")

        all_items.extend(build_from_pair(q_path, a_path, block))

    if not all_items:
        raise SystemExit("No se detectaron preguntas validas en los PDFs.")

    output = []
    for idx, item in enumerate(all_items, start=1):
        output.append(
            {
                "id": f"Q{idx}",
                "question": item["question"],
                "options": item["options"],
                "correctIndex": item["correctIndex"],
                "explanation": f"Fuente: {item['block']} #{item['number']}",
            }
        )

    OUTPUT_FILE.write_text(json.dumps(output, ensure_ascii=True, indent=2) + "\n", encoding="utf8")
    print(f"Total preguntas exportadas: {len(output)}")
    print(f"Archivo generado: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
