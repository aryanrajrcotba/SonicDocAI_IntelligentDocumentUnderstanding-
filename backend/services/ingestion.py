import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extracts text from PDF. Falls back to OCR if scanned."""
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text_content = ""
    for page in doc:
        text = page.get_text()
        if text.strip() == "":
            # Execute OCR fallback for image-heavy pages
            try:
                pix = page.get_pixmap()
                img = Image.open(io.BytesIO(pix.tobytes()))
                text = pytesseract.image_to_string(img)
            except Exception as e:
                print(f"OCR failed for page: {str(e)}")
        text_content += text + "\n"
    return text_content

def extract_text_from_image(file_bytes: bytes) -> str:
    img = Image.open(io.BytesIO(file_bytes))
    return pytesseract.image_to_string(img)
