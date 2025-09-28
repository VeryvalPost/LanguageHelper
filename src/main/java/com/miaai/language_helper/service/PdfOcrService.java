package com.miaai.language_helper.service;  // ← Укажи свой пакет, если другой

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.awt.image.BufferedImage;
import java.io.IOException;


@Service
@RequiredArgsConstructor
@Slf4j
public class PdfOcrService {

    @Value("${tesseract.datapath:C:\\tessdata}")  // ← Вот оно! Конфигурируемый путь с дефолтом
    private String tessdataPath;

    public String extractText(MultipartFile file) {
        if (file == null || file.isEmpty()) {  // ← Улучшил: проверка на null + empty
            log.warn("Empty or null PDF file provided");
            return "";
        }

        StringBuilder result = new StringBuilder();
        try (PDDocument document = PDDocument.load(file.getInputStream())) {
            if (document.getNumberOfPages() == 0) {
                log.warn("PDF has no pages");
                return "";
            }

            PDFRenderer pdfRenderer = new PDFRenderer(document);
            Tesseract tesseract = new Tesseract();
            tesseract.setLanguage("eng+rus");
            tesseract.setDatapath(tessdataPath);
            log.info("Starting OCR for {} pages", document.getNumberOfPages());

            for (int page = 0; page < document.getNumberOfPages(); ++page) {
                BufferedImage bim = pdfRenderer.renderImageWithDPI(page, 450);  // DPI 450 — баланс скорости/качества
                String text = tesseract.doOCR(bim);
                result.append(text).append("\n--- Page ").append(page + 1).append(" ---\n");  // Разделитель для удобства
                log.debug("Extracted {} chars from page {}", text.length(), page + 1);
            }
            log.info("OCR completed: total {} chars extracted", result.length());
        } catch (IOException e) {
            log.error("IO error during PDF processing: {}", e.getMessage());
            throw new RuntimeException("Ошибка при загрузке PDF: " + e.getMessage(), e);
        } catch (TesseractException e) {
            log.error("Tesseract OCR error: {}", e.getMessage());
            throw new RuntimeException("Ошибка Tesseract: " + e.getMessage(), e);
        }
        return result.toString().trim();  // Убираем лишние пробелы/переносы в конце
    }
}
