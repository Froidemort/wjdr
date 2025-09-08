import easyocr
from pdf2image import convert_from_path
from io import BytesIO
import argparse
import logging

def pdf_to_png_pages(pdf_path):
    images = convert_from_path(pdf_path, dpi=300, fmt='png', thread_count=2)
    for idx, img in enumerate(images):
        buf = BytesIO()
        img.save(buf, format='PNG')
        buf.seek(0)
        logging.info(f"Converted page {idx + 1} to PNG.")
        yield buf.getvalue()


def extract_text_from_pdf(pdf_path):
    full_text = []
    for idx, page_buf in enumerate(pdf_to_png_pages(pdf_path)):
        logging.info(f"Processing page {idx + 1} with OCR.")
        logging.debug(f"Page {idx + 1} image size: {len(page_buf)} bytes")
        logging.debug("Initializing EasyOCR reader.")
        boxes = reader.detect(page_buf)
        logging.debug(f"Page {idx + 1} detected boxes: {boxes}")
        result = reader.recognize(page_buf, boxes)
        result = [text for (_, text, _) in result]
        logging.debug(f"Page {idx + 1} OCR result: {result}")
        full_text.append(" ".join(result))
    return "\n".join(full_text)


if __name__ == "__main__":
    # Logger setup
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s"
    )
    logger = logging.getLogger(__name__)

    parser = argparse.ArgumentParser(description="Extract text from a PDF using OCR.")
    parser.add_argument("pdf_file", help="Path to the PDF file")
    parser.add_argument("--debug", action="store_true", help="Enable debug output")
    parser.add_argument("--pages", nargs="+", default=["all"], help="Pages to process (e.g., 1 2 3 or 'all')")

    args = parser.parse_args()
    logger.info(f"Starting OCR extraction for {args.pdf_file}")
    if args.debug:
        logger.setLevel(logging.DEBUG)
        logger.debug("Debug mode is enabled.")
    reader = easyocr.Reader(['fr'], gpu=False)
    if args.pages == ["all"]:
        logger.info("Processing all pages.")
        text = extract_text_from_pdf(args.pdf_file)
    else:
        # Convert page numbers to zero-based indices
        page_indices = [int(p) - 1 for p in args.pages]
        full_text = []
        for i, page_buf in enumerate(pdf_to_png_pages(args.pdf_file)):
            if i in page_indices:
                result = reader.readtext(page_buf, detail=0)
                full_text.append(" ".join(result))
                logger.info(f"Processed page {i + 1}")
                logger.debug(f"Page {i + 1} text: {' '.join(result)}")
        text = "\n".join(full_text)
        logger.info(f"Processed pages: {', '.join(str(p + 1) for p in page_indices)}")
        logger.debug(f"Extracted text: {text}")
        with open("/workspaces/wjdr/tools/output/extracted_text.txt", "w", encoding="utf-8") as f:
            f.write(text)
        logger.info("Extracted text written to /workspaces/wjdr/tools/output/extracted_text.txt")
