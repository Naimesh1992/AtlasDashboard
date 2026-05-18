from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pypdf import PdfReader, PdfWriter
from PIL import Image
import pytesseract
import os
import shutil
import uuid
import zipfile
import json
import urllib.request
import urllib.error
import subprocess

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

TESSERACT_PATH = r"E:\atlas project\Tesseract-OCR\tesseract.exe"
GHOSTSCRIPT_PATH = r"E:\atlas project\ghost script\gs10.07.0\bin\gswin64c.exe"

if os.path.exists(TESSERACT_PATH):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
OLLAMA_MODEL = "gemma:2b"


def save_upload(file: UploadFile):
    saved_name = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, saved_name)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return file_path


def extract_pdf_text(file_path):
    reader = PdfReader(file_path)
    text = ""

    for page in reader.pages:
        page_text = page.extract_text()

        if page_text:
            text += page_text + "\n"

    return text[:15000]


def ask_ollama(prompt):
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
    }

    data = json.dumps(payload).encode("utf-8")

    request = urllib.request.Request(
        OLLAMA_URL,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            result = json.loads(response.read().decode("utf-8"))
            return result.get("response", "").strip()

    except urllib.error.URLError:
        raise HTTPException(
            status_code=500,
            detail="Ollama not running. Run: ollama run gemma:2b"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
def home():
    return {
        "message": "Atlas Backend Running with Ollama AI + OCR + Ghostscript"
    }


@app.post("/merge-pdf")
async def merge_pdf(files: list[UploadFile] = File(...)):
    writer = PdfWriter()

    for file in files:
        reader = PdfReader(save_upload(file))

        for page in reader.pages:
            writer.add_page(page)

    output_path = os.path.join(OUTPUT_DIR, f"merged_{uuid.uuid4()}.pdf")

    with open(output_path, "wb") as output_file:
        writer.write(output_file)

    return FileResponse(
        output_path,
        media_type="application/pdf",
        filename="merged_output.pdf"
    )


@app.post("/split-pdf")
async def split_pdf(file: UploadFile = File(...)):
    reader = PdfReader(save_upload(file))
    zip_path = os.path.join(OUTPUT_DIR, f"split_{uuid.uuid4()}.zip")

    with zipfile.ZipFile(zip_path, "w") as zipf:
        for i, page in enumerate(reader.pages):
            writer = PdfWriter()
            writer.add_page(page)

            name = f"page_{i + 1}.pdf"
            path = os.path.join(OUTPUT_DIR, name)

            with open(path, "wb") as output_pdf:
                writer.write(output_pdf)

            zipf.write(path, name)

    return FileResponse(
        zip_path,
        media_type="application/zip",
        filename="split_pages.zip"
    )


@app.post("/jpg-to-pdf")
async def jpg_to_pdf(files: list[UploadFile] = File(...)):
    images = []

    for file in files:
        img = Image.open(save_upload(file)).convert("RGB")
        images.append(img)

    if not images:
        raise HTTPException(status_code=400, detail="No images uploaded")

    output_path = os.path.join(OUTPUT_DIR, f"images_{uuid.uuid4()}.pdf")

    images[0].save(
        output_path,
        "PDF",
        save_all=True,
        append_images=images[1:]
    )

    return FileResponse(
        output_path,
        media_type="application/pdf",
        filename="images_to_pdf.pdf"
    )


@app.post("/compress-pdf")
async def compress_pdf(file: UploadFile = File(...)):
    reader = PdfReader(save_upload(file))
    writer = PdfWriter()

    for page in reader.pages:
        try:
            page.compress_content_streams()
        except Exception:
            pass

        writer.add_page(page)

    output_path = os.path.join(OUTPUT_DIR, f"compressed_{uuid.uuid4()}.pdf")

    with open(output_path, "wb") as output_file:
        writer.write(output_file)

    return FileResponse(
        output_path,
        media_type="application/pdf",
        filename="compressed.pdf"
    )


@app.post("/extreme-compress-pdf")
async def extreme_compress_pdf(
    file: UploadFile = File(...),
    quality: str = Form("screen")
):
    if not os.path.exists(GHOSTSCRIPT_PATH):
        raise HTTPException(
            status_code=500,
            detail=f"Ghostscript not found at {GHOSTSCRIPT_PATH}"
        )

    allowed_quality = ["screen", "ebook", "printer", "prepress"]

    if quality not in allowed_quality:
        quality = "screen"

    input_path = save_upload(file)
    output_path = os.path.join(OUTPUT_DIR, f"extreme_compressed_{uuid.uuid4()}.pdf")

    command = [
        GHOSTSCRIPT_PATH,
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        f"-dPDFSETTINGS=/{quality}",
        "-dNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        f"-sOutputFile={output_path}",
        input_path,
    ]

    try:
        subprocess.run(command, check=True)

        return FileResponse(
            output_path,
            media_type="application/pdf",
            filename=f"extreme_compressed_{quality}.pdf"
        )

    except subprocess.CalledProcessError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ghostscript compression failed: {str(e)}"
        )


@app.post("/rotate-pdf")
async def rotate_pdf(
    file: UploadFile = File(...),
    angle: int = Form(90)
):
    reader = PdfReader(save_upload(file))
    writer = PdfWriter()

    for page in reader.pages:
        page.rotate(angle)
        writer.add_page(page)

    output_path = os.path.join(OUTPUT_DIR, f"rotated_{uuid.uuid4()}.pdf")

    with open(output_path, "wb") as output_file:
        writer.write(output_file)

    return FileResponse(
        output_path,
        media_type="application/pdf",
        filename="rotated.pdf"
    )


@app.post("/delete-pages")
async def delete_pages(
    file: UploadFile = File(...),
    pages: str = Form(...)
):
    delete_numbers = [
        int(x.strip())
        for x in pages.split(",")
        if x.strip().isdigit()
    ]

    reader = PdfReader(save_upload(file))
    writer = PdfWriter()

    for index, page in enumerate(reader.pages):
        if index + 1 not in delete_numbers:
            writer.add_page(page)

    output_path = os.path.join(OUTPUT_DIR, f"deleted_pages_{uuid.uuid4()}.pdf")

    with open(output_path, "wb") as output_file:
        writer.write(output_file)

    return FileResponse(
        output_path,
        media_type="application/pdf",
        filename="pages_deleted.pdf"
    )


@app.post("/ai-summary")
async def ai_summary(file: UploadFile = File(...)):
    file_path = save_upload(file)
    extracted_text = extract_pdf_text(file_path)

    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="No readable text found")

    prompt = f"""
Summarize this PDF clearly in professional bullet points.

PDF Content:
{extracted_text}
"""

    summary = ask_ollama(prompt)

    return JSONResponse({"summary": summary})


@app.post("/chat-pdf")
async def chat_pdf(
    file: UploadFile = File(...),
    question: str = Form(...)
):
    file_path = save_upload(file)
    extracted_text = extract_pdf_text(file_path)

    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="No readable text found")

    prompt = f"""
Answer only from this PDF content.

PDF:
{extracted_text}

Question:
{question}
"""

    answer = ask_ollama(prompt)

    return JSONResponse({"answer": answer})


@app.post("/ocr-image")
async def ocr_image(file: UploadFile = File(...)):
    try:
        file_path = save_upload(file)
        image = Image.open(file_path)

        text = pytesseract.image_to_string(image)

        if not text.strip():
            raise HTTPException(status_code=400, detail="No text detected")

        return JSONResponse({"text": text})

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ai-ocr-summary")
async def ai_ocr_summary(file: UploadFile = File(...)):
    try:
        file_path = save_upload(file)
        image = Image.open(file_path)

        text = pytesseract.image_to_string(image)

        if not text.strip():
            raise HTTPException(status_code=400, detail="No text detected")

        prompt = f"""
Summarize this OCR extracted text clearly.

OCR Text:
{text[:12000]}
"""

        summary = ask_ollama(prompt)

        return JSONResponse({
            "ocr_text": text,
            "summary": summary
        })

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))