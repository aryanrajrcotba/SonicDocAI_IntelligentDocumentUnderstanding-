import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io
import time
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline

# Dummy Triage Classifier Construction Engine A
_dummy_data = [
    ("This is a standard vendor profile form.", "Standard Form"),
    ("Non-disclosure agreement and liability clauses.", "Unstructured Contract"),
    ("Compliance manual regarding ethics and safety.", "Compliance Manual"),
    ("Invoice number 12345 total amount due.", "Standard Form")
]

triage_pipeline = Pipeline([
    ('tfidf', TfidfVectorizer()),
    ('clf', RandomForestClassifier(n_estimators=10, random_state=42))
])

# Train on dummy data instantly on module load ($0 Cost)
X_train = [text for text, label in _dummy_data]
y_train = [label for text, label in _dummy_data]
triage_pipeline.fit(X_train, y_train)

def categorize_document(first_page_text: str) -> str:
    """Classifies document based on text extracted from page 1."""
    if not first_page_text.strip():
        return "Unknown / Image-Heavy"
    # Predict
    pred = triage_pipeline.predict([first_page_text])[0]
    return pred

def extract_text_from_pdf(file_bytes: bytes) -> tuple[str, str, float]:
    """Extracts text and categorizes. Returns (text, category, extraction_time_sec)."""
    start_time = time.time()
    
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text_content = ""
    first_page_text = ""
    
    for i, page in enumerate(doc):
        text = page.get_text()
        if text.strip() == "":
            try:
                pix = page.get_pixmap()
                img = Image.open(io.BytesIO(pix.tobytes()))
                text = pytesseract.image_to_string(img)
            except Exception as e:
                print(f"OCR failed for page: {str(e)}")
        
        if i == 0:
            first_page_text = text
            
        text_content += text + "\n"
        
    doc_type = categorize_document(first_page_text)
    
    end_time = time.time()
    return text_content, doc_type, (end_time - start_time)

def extract_text_from_image(file_bytes: bytes) -> tuple[str, str, float]:
    start_time = time.time()
    img = Image.open(io.BytesIO(file_bytes))
    text = pytesseract.image_to_string(img)
    doc_type = categorize_document(text)
    end_time = time.time()
    return text, doc_type, (end_time - start_time)
