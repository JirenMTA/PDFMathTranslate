from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.responses import FileResponse
import shutil
import uuid
import sys
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
import os

PROJECT_ROOT = Path(__file__).parent.parent.resolve()
sys.path.insert(0, str(PROJECT_ROOT))

from main import translate

UPLOAD_DIR = Path("files")
TRANSLATED_DIR = Path("translated_files")
UPLOAD_DIR.mkdir(exist_ok=True)
TRANSLATED_DIR.mkdir(exist_ok=True)

app = FastAPI(
    title="PDF Service",
    description="API for uploading, downloading, and translating PDF files",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  # hoặc ["*"] cho dev, nhưng production nên cụ thể
    allow_credentials=True,
    allow_methods=["*"],   # GET, POST, PUT, DELETE...
    allow_headers=["*"],   # Authorization, Content-Type…
)

app.mount(
    "/files",
    StaticFiles(directory=str(UPLOAD_DIR), html=False),
    name="public_files"
)
app.mount(
    "/translated_files",
    StaticFiles(directory=str(TRANSLATED_DIR), html=False),
)


@app.post(
    "/upload",
    status_code=201,
    summary="Upload a PDF file to the server",
    tags=["File"],
)
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only .pdf files are allowed")

    file_id = f"{uuid.uuid4()}.pdf"
    dest = UPLOAD_DIR / file_id
    with dest.open("wb") as buf:
        shutil.copyfileobj(file.file, buf)

    return {
        "filename": file_id,
        "original_name": file.filename
    }

@app.get(
    "/translate",
    summary="(Test) Copy the original PDF to translated_files and return it",
    tags=["Translate"],
)
async def translate_pdf(
    filename: str = Query(..., description="Name of the uploaded PDF file (UUID)."),
    target_lang: str = Query(..., description="Target language code, for testing only."),
):
    src_path = UPLOAD_DIR / filename
    if not src_path.exists() or not src_path.is_file():
        print("[DEBUG] Source file not found", flush=True)
        raise HTTPException(status_code=404, detail="Original file not found")

    result_files = translate(
        files=[str(src_path)],
        output="./translated_files",
        thread=4,
        lang_out="vi",
    )
    return {
        "translated_url": f"{Path(result_files[0][0]).name}"
    }
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "api.main_api:app",  # <— module:attribute
        host="127.0.0.1",
        port=8000,
        reload=True,
    )