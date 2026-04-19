import json
import re
import tempfile
from pathlib import Path

try:
    from pypdf import PdfReader
except ImportError as exc:
    raise SystemExit("Falta dependencia pypdf. Instala con: pip install pypdf") from exc

try:
    import fitz
except ImportError as exc:
    raise SystemExit("Falta dependencia PyMuPDF. Instala con: pip install PyMuPDF") from exc

try:
    import cv2
except ImportError as exc:
    raise SystemExit("Falta dependencia opencv-python. Instala con: pip install opencv-python") from exc

try:
    from rapidocr_onnxruntime import RapidOCR
except ImportError as exc:
    raise SystemExit("Falta dependencia rapidocr-onnxruntime. Instala con: pip install rapidocr-onnxruntime") from exc


ROOT = Path(__file__).resolve().parents[1]
TEMARIO_DIR = ROOT.parent / "temario"
DATA_DIR = ROOT / "data"


def clean_line(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def extract_pdf_text(pdf_path: Path) -> str:
    reader = PdfReader(str(pdf_path))
    return "\n".join((page.extract_text() or "") for page in reader.pages)


def parse_answer_key(text: str) -> dict[int, str]:
    matches = re.findall(r"\b(\d{1,4})\s*[-.:]?\s*([A-Da-d])\b", text)
    answers: dict[int, str] = {}
    for num, letter in matches:
        answers[int(num)] = letter.upper()
    return answers


def extract_answers_from_tokens(tokens: list[dict]) -> dict[int, str]:
    if not tokens:
        return {}

    tokens.sort(key=lambda token: token["y"])
    rows: list[list[dict]] = []
    row_threshold = 12.0

    for token in tokens:
        if not rows:
            rows.append([token])
            continue

        last_row = rows[-1]
        row_y = sum(item["y"] for item in last_row) / len(last_row)
        if abs(token["y"] - row_y) <= row_threshold:
            last_row.append(token)
        else:
            rows.append([token])

    answers: dict[int, str] = {}
    for row in rows:
        row_sorted = sorted(row, key=lambda token: token["x"])
        numeric_count = sum(1 for token in row_sorted if re.fullmatch(r"\d{1,4}", token["text"]))
        if numeric_count < 2:
            continue

        for idx, token in enumerate(row_sorted):
            if not re.fullmatch(r"\d{1,4}", token["text"]):
                continue

            number = int(token["text"])
            answer = None

            for candidate in row_sorted[idx + 1 :]:
                if re.fullmatch(r"\d{1,4}", candidate["text"]):
                    break

                if candidate["text"] in {"A", "B", "C", "D", "NULA"}:
                    delta_x = candidate["x"] - token["x"]
                    if 20 <= delta_x <= 240:
                        answer = candidate["text"]
                        break

            if answer and answer != "NULA":
                answers[number] = answer

    return answers


def normalize_ocr_tokens(result: list) -> list[dict]:
    tokens = []
    for item in result:
        bbox, raw_text, score = item
        if score < 0.45:
            continue

        text = clean_line(str(raw_text).upper())
        if text in {"A", "B", "C", "D", "NULA"} or re.fullmatch(r"\d{1,4}", text):
            x_center = sum(point[0] for point in bbox) / 4.0
            y_center = sum(point[1] for point in bbox) / 4.0
            tokens.append({"x": x_center, "y": y_center, "text": text})
    return tokens


def preprocess_for_ocr(source_image: Path, target_image: Path) -> None:
    image = cv2.imread(str(source_image))
    if image is None:
        raise SystemExit(f"No se pudo leer imagen para OCR: {source_image}")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    processed = cv2.adaptiveThreshold(
        gray,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        35,
        11,
    )
    cv2.imwrite(str(target_image), processed)


def parse_answer_key_from_ocr(pdf_path: Path) -> dict[int, str]:
    doc = fitz.open(str(pdf_path))
    if doc.page_count == 0:
        return {}

    ocr = RapidOCR()
    merged_answers: dict[int, str] = {}

    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_dir_path = Path(tmp_dir)

        for page_index in range(doc.page_count):
            page = doc[page_index]
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
            image_path = tmp_dir_path / f"answers_page_{page_index + 1}.png"
            processed_image_path = tmp_dir_path / f"answers_page_{page_index + 1}_bw.png"
            pix.save(str(image_path))
            preprocess_for_ocr(image_path, processed_image_path)

            raw_result, _ = ocr(str(image_path))
            bw_result, _ = ocr(str(processed_image_path))

            raw_tokens = normalize_ocr_tokens(raw_result or [])
            bw_tokens = normalize_ocr_tokens(bw_result or [])

            raw_page_answers = extract_answers_from_tokens(raw_tokens)
            bw_page_answers = extract_answers_from_tokens(bw_tokens)
            page_answers = bw_page_answers if len(bw_page_answers) >= len(raw_page_answers) else raw_page_answers
            merged_answers.update(page_answers)

    return merged_answers


def parse_questions(text: str) -> list[dict]:
    lines = [clean_line(line) for line in text.splitlines() if clean_line(line)]
    questions: list[dict] = []
    i = 0

    def repair_options(options: list[str]) -> list[str]:
        fixed = [option.strip() for option in options]
        empty_indices = [idx for idx, option in enumerate(fixed) if not option]
        if not empty_indices:
            return fixed

        donor_index = max((idx for idx, option in enumerate(fixed) if option), default=-1)
        if donor_index < 0:
            return fixed

        start = min(empty_indices)
        if donor_index < start:
            return fixed

        chunk_count = donor_index - start + 1
        donor_text = fixed[donor_index]
        parts = [
            clean_line(part)
            for part in re.split(r"(?<=[\.!?])\s+(?=[A-ZÁÉÍÓÚÜÑ¿])", donor_text)
            if clean_line(part)
        ]

        if len(parts) < chunk_count:
            return fixed

        if len(parts) > chunk_count:
            head = parts[: chunk_count - 1]
            tail = [clean_line(" ".join(parts[chunk_count - 1 :]))]
            parts = head + tail

        for offset, part in enumerate(parts):
            fixed[start + offset] = part

        return fixed

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

        # Caso especial detectado en algunos PDFs: a), b), c), d) vacios y
        # todas las opciones vienen seguidas despues de d).
        if all(letter in options_map for letter in ["A", "B", "C", "D"]):
            if not options_map["A"] and not options_map["B"] and not options_map["C"] and len(options_map["D"]) >= 4:
                raw_lines = [line for line in options_map["D"] if line.strip()]
                grouped_lines = []
                for line in raw_lines:
                    if not grouped_lines:
                        grouped_lines.append(line)
                        continue

                    if re.match(r"^[a-záéíóúüñ]", line):
                        grouped_lines[-1] = f"{grouped_lines[-1]} {line}"
                    else:
                        grouped_lines.append(line)

                if len(grouped_lines) >= 4:
                    options_map["A"] = [grouped_lines[0]]
                    options_map["B"] = [grouped_lines[1]]
                    options_map["C"] = [grouped_lines[2]]
                    options_map["D"] = [" ".join(grouped_lines[3:])]

        if "A" in options_map and "B" in options_map:
            ordered = []
            for letter in ["A", "B", "C", "D"]:
                if letter in options_map:
                    ordered.append(clean_line(" ".join(options_map[letter])))

            ordered = repair_options(ordered)

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
    if not parsed_answers:
        parsed_answers = parse_answer_key_from_ocr(answers_pdf)

    merged = []
    missing_numbers = []

    for item in parsed_questions:
        number = item["number"]
        answer_letter = parsed_answers.get(number)
        correct_index = None

        if answer_letter:
            candidate_index = ord(answer_letter) - ord("A")
            if 0 <= candidate_index < len(item["options"]):
                correct_index = candidate_index

        if correct_index is None:
            missing_numbers.append(number)

        merged.append(
            {
                "block": block_name,
                "number": number,
                "question": item["question"],
                "options": item["options"],
                "correctIndex": correct_index,
            }
        )

    found = len(parsed_questions) - len(missing_numbers)
    print(f"{block_name}: {len(parsed_questions)} preguntas leidas, {len(parsed_answers)} respuestas, {found} con respuesta, {len(missing_numbers)} sin respuesta")
    if missing_numbers:
        print(f"  FALTAN respuestas para las preguntas: {sorted(missing_numbers)}")
    return merged


def find_pair_for_topic(topic_dir: Path) -> tuple[Path, Path] | None:
    question_pdf = topic_dir / "Preguntas.pdf"
    if not question_pdf.exists():
        return None

    candidates = [
        topic_dir / "Respuestas.pdf",
        topic_dir / "Repuestas.pdf",  # typo detectado en una carpeta
    ]

    answers_pdf = next((candidate for candidate in candidates if candidate.exists()), None)
    if not answers_pdf:
        return None

    return question_pdf, answers_pdf


def export_topic_questions(topic_name: str, merged_items: list[dict]) -> None:
    target_dir = DATA_DIR / topic_name
    target_dir.mkdir(parents=True, exist_ok=True)
    output_file = target_dir / "questions.json"

    output = []
    for idx, item in enumerate(merged_items, start=1):
        output.append(
            {
                "id": f"{topic_name}_{idx}",
                "question": item["question"],
                "options": item["options"],
                "correctIndex": item["correctIndex"],
                "source": f"{topic_name}/Preguntas.pdf#{item['number']}",
            }
        )

    output_file.write_text(json.dumps(output, ensure_ascii=True, indent=2) + "\n", encoding="utf8")
    print(f"{topic_name}: {len(output)} preguntas exportadas -> {output_file}")


def main():
    topic_dirs = sorted(path for path in TEMARIO_DIR.iterdir() if path.is_dir())
    if not topic_dirs:
        raise SystemExit(f"No hay carpetas de temario en: {TEMARIO_DIR}")

    exported_topics = 0
    total_questions = 0

    for topic_dir in topic_dirs:
        pair = find_pair_for_topic(topic_dir)
        if not pair:
            print(f"{topic_dir.name}: se omite (faltan Preguntas.pdf o Respuestas/Repuestas.pdf)")
            continue

        q_path, a_path = pair
        merged = build_from_pair(q_path, a_path, topic_dir.name)

        if not merged:
            print(f"{topic_dir.name}: sin preguntas, no se genera archivo")
            continue

        export_topic_questions(topic_dir.name, merged)
        exported_topics += 1
        total_questions += len(merged)

    if exported_topics == 0:
        raise SystemExit("No se pudo exportar ningun tema.")

    print(f"Temas exportados: {exported_topics}")
    print(f"Total preguntas exportadas: {total_questions}")


if __name__ == "__main__":
    main()
