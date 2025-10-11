package com.miaai.language_helper.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;

import javax.imageio.ImageIO;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PdfOcrService {

    @Value("${tesseract.datapath:/usr/share/tesseract-ocr/4.00/tessdata}")
    private String tessdataPath;

    // Конфигурируемые параметры
    @Value("${ocr.max-pages:10}")
    private int maxPages;

    @Value("${ocr.dpi:150}")
    private int dpi;

    @Value("${ocr.max-image-width:1600}")
    private int maxImageWidth;

    @Value("${ocr.max-image-height:1200}")
    private int maxImageHeight;

    // Поддерживаемые форматы изображений
    private static final List<String> SUPPORTED_IMAGE_FORMATS = Arrays.asList(
            "jpg", "jpeg", "png", "bmp", "gif", "tiff", "tif"
    );

    public String extractText(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            log.warn("Empty or null file provided");
            return "";
        }

        String filename = file.getOriginalFilename();
        log.info("Processing file: {} ({} bytes)", filename, file.getSize());

        File tempFile = null;
        try {
            // Создаем временный файл
            String extension = getFileExtension(filename);
            tempFile = File.createTempFile("ocr_", "." + extension);
            file.transferTo(tempFile);

            // Определяем тип файла и обрабатываем соответствующим образом
            if (isPdfFile(filename)) {
                return extractTextFromPdf(tempFile);
            } else if (isImageFile(filename)) {
                return extractTextFromImage(tempFile);
            } else {
                throw new IllegalArgumentException("Unsupported file format: " + filename);
            }

        } catch (IOException e) {
            log.error("IO error during file processing: {}", e.getMessage());
            throw new RuntimeException("Ошибка при загрузке файла: " + e.getMessage(), e);
        } finally {
            // Всегда удаляем временный файл
            if (tempFile != null && tempFile.exists()) {
                if (!tempFile.delete()) {
                    log.warn("Could not delete temporary file: {}", tempFile.getAbsolutePath());
                }
            }
        }
    }

    private String extractTextFromPdf(File pdfFile) {
        StringBuilder result = new StringBuilder();

        try (PDDocument document = PDDocument.load(pdfFile)) {
            int totalPages = document.getNumberOfPages();
            if (totalPages == 0) {
                log.warn("PDF has no pages");
                return "";
            }

            // Ограничиваем количество обрабатываемых страниц
            int pagesToProcess = Math.min(totalPages, maxPages);
            log.info("Starting OCR for {} of {} pages", pagesToProcess, totalPages);

            PDFRenderer pdfRenderer = new PDFRenderer(document);

            for (int page = 0; page < pagesToProcess; ++page) {
                try {
                    String pageText = processPdfPage(pdfRenderer, page);
                    result.append(pageText).append("\n\n--- Page ").append(page + 1).append(" ---\n\n");
                    log.debug("Extracted {} chars from page {}", pageText.length(), page + 1);

                    // Принудительная сборка мусора после каждой страницы для больших PDF
                    if (page % 3 == 0) {
                        System.gc();
                    }

                } catch (Exception e) {
                    log.error("Error processing page {}: {}", page + 1, e.getMessage());
                    result.append("\n[Error processing page ").append(page + 1).append("]\n");
                }
            }

            log.info("OCR completed: {} pages processed, total {} chars", pagesToProcess, result.length());

        } catch (IOException e) {
            log.error("Error loading PDF document: {}", e.getMessage());
            throw new RuntimeException("Ошибка при загрузке PDF документа", e);
        }

        return result.toString().trim();
    }

    private String extractTextFromImage(File imageFile) {
        try {
            log.info("Processing image file: {}", imageFile.getName());

            // Читаем изображение
            BufferedImage image = ImageIO.read(imageFile);
            if (image == null) {
                throw new IllegalArgumentException("Cannot read image file or unsupported format");
            }

            // Оптимизируем изображение
            BufferedImage optimizedImage = optimizeImageForOcr(image);

            // Выполняем OCR
            Tesseract tesseract = createTesseractInstance();
            String result = tesseract.doOCR(optimizedImage);

            log.info("Image OCR completed: {} chars extracted", result.length());

            // Освобождаем ресурсы
            image.flush();
            optimizedImage.flush();

            return result.trim();

        } catch (IOException e) {
            log.error("Error reading image file: {}", e.getMessage());
            throw new RuntimeException("Ошибка при чтении изображения", e);
        } catch (TesseractException e) {
            log.error("Tesseract OCR error on image: {}", e.getMessage());
            throw new RuntimeException("Ошибка OCR при обработке изображения", e);
        }
    }

    private String processPdfPage(PDFRenderer pdfRenderer, int pageNumber) {
        BufferedImage image = null;
        try {
            // Рендерим страницу с оптимизированным DPI
            image = pdfRenderer.renderImageWithDPI(pageNumber, dpi);

            // Уменьшаем изображение если оно слишком большое
            image = resizeImageIfNeeded(image);

            Tesseract tesseract = createTesseractInstance();
            return tesseract.doOCR(image);

        } catch (IOException e) {
            log.error("Error rendering page {}: {}", pageNumber + 1, e.getMessage());
            throw new RuntimeException("Ошибка рендеринга страницы", e);
        } catch (TesseractException e) {
            log.error("Tesseract OCR error on page {}: {}", pageNumber + 1, e.getMessage());
            throw new RuntimeException("Ошибка OCR на странице " + (pageNumber + 1), e);
        } finally {
            // Освобождаем память от изображения
            if (image != null) {
                image.flush();
            }
        }
    }

    private BufferedImage optimizeImageForOcr(BufferedImage originalImage) {
        BufferedImage resizedImage = resizeImageIfNeeded(originalImage);

        // Дополнительная оптимизация для улучшения качества OCR
        BufferedImage optimizedImage = new BufferedImage(
                resizedImage.getWidth(),
                resizedImage.getHeight(),
                BufferedImage.TYPE_BYTE_GRAY
        );

        Graphics2D g = optimizedImage.createGraphics();
        try {
            g.drawImage(resizedImage, 0, 0, null);
        } finally {
            g.dispose();
        }

        // Освобождаем промежуточное изображение
        if (resizedImage != originalImage) {
            resizedImage.flush();
        }

        return optimizedImage;
    }

    private Tesseract createTesseractInstance() {
        Tesseract tesseract = new Tesseract();
        tesseract.setDatapath(tessdataPath);
        tesseract.setLanguage("eng+rus");

        // Оптимизации для уменьшения использования памяти
        tesseract.setVariable("OMP_THREAD_LIMIT", "1"); // Ограничиваем потоки
        tesseract.setPageSegMode(6); // PSM_SINGLE_BLOCK - для сплошного текста
        tesseract.setOcrEngineMode(1); // OEM_LSTM_ONLY - используем только LSTM

        return tesseract;
    }

    private BufferedImage resizeImageIfNeeded(BufferedImage originalImage) {
        int width = originalImage.getWidth();
        int height = originalImage.getHeight();

        // Если изображение в пределах лимитов - возвращаем как есть
        if (width <= maxImageWidth && height <= maxImageHeight) {
            return originalImage;
        }

        log.debug("Resizing image from {}x{} to fit {}x{}", width, height, maxImageWidth, maxImageHeight);

        double ratio = Math.min((double) maxImageWidth / width, (double) maxImageHeight / height);
        int newWidth = (int) (width * ratio);
        int newHeight = (int) (height * ratio);

        BufferedImage resizedImage = new BufferedImage(newWidth, newHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = resizedImage.createGraphics();

        try {
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

            g.drawImage(originalImage, 0, 0, newWidth, newHeight, null);
        } finally {
            g.dispose();
        }

        return resizedImage;
    }

    // Вспомогательные методы для определения типа файла
    private boolean isPdfFile(String filename) {
        return filename != null && filename.toLowerCase().endsWith(".pdf");
    }

    private boolean isImageFile(String filename) {
        if (filename == null) return false;
        String extension = getFileExtension(filename).toLowerCase();
        return SUPPORTED_IMAGE_FORMATS.contains(extension);
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
    }

    // Дополнительный метод для проверки поддерживаемых форматов
    public List<String> getSupportedFormats() {
        return Arrays.asList("pdf", "jpg", "jpeg", "png", "bmp", "gif", "tiff", "tif");
    }
}