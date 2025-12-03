const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const PDFMerger = require("pdf-merger-js");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("."));

// Upload folder
const upload = multer({ dest: "uploads/" });

// Ensure output folder exists
if (!fs.existsSync("output")) fs.mkdirSync("output");

// Convert Excel → PDF using LibreOffice
app.post("/convert", upload.array("excelFiles"), async (req, res) => {
    const pdfs = [];

    try {
        for (let file of req.files) {
            const ext = path.extname(file.originalname) || ".xlsx"; // preserve extension
            const inputFile = path.join("uploads", file.filename + ext);

            // Rename temp file to include proper extension
            fs.renameSync(file.path, inputFile);

            const outputDir = path.join(__dirname, "output");

            await new Promise((resolve, reject) => {
                exec(`soffice --headless --convert-to pdf --outdir "${outputDir}" "${inputFile}"`, (err, stdout, stderr) => {
                    if (err) {
                        console.error("LibreOffice conversion error:", err);
                        return reject(err);
                    }
                    resolve();
                });
            });

            const pdfName = path.basename(file.filename + ext, ext) + ".pdf";
            pdfs.push(pdfName);
        }

        res.json({ pdfs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to convert Excel to PDF" });
    }
});

// Merge PDFs
app.post("/merge", async (req, res) => {
    const { pdfs, mergedName } = req.body;
    if (!pdfs || !pdfs.length || !mergedName) {
        return res.status(400).json({ error: "Invalid request" });
    }

    try {
        const merger = new PDFMerger();

        for (let pdf of pdfs) {
            const pdfPath = path.join("output", pdf);
            if (fs.existsSync(pdfPath)) {
                await merger.add(pdfPath);
            }
        }

        const mergedFile = path.join("output", mergedName + ".pdf");
        await merger.save(mergedFile);

        res.json({ success: true, file: `/output/${mergedName}.pdf` });
    } catch (err) {
        console.error("Merge error:", err);
        res.status(500).json({ error: "Failed to merge PDFs" });
    }
});

// Default route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(3000, () => console.log("Server running on port 3000"));
