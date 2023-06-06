import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";

// ==== For ES6 modules ====
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// =========================
export function toJson(
  scrapedData,
  fileName = "data.json",
  folderName = "database"
) {
  try {
    if (scrapedData) {
      const filePath = path.join(__dirname, "..", folderName, fileName);
      const callBack = (error) => {
        if (error) {
          throw error;
        }
        console.log(`Data written to ${folderName}.`);
      };
      fs.writeFile(filePath, JSON.stringify(scrapedData, null, 4), callBack);
    }
  } catch (error) {
    console.log(error);
  }
}

export function toPDF(
  scrapedData,
  fileName = "data.pdf",
  folderName = "database"
) {
  try {
    const doc = new PDFDocument();
    const filePath = path.join(__dirname, "..", folderName, fileName);
    if (scrapedData) {
      doc.pipe(fs.createWriteStream(fileName));
      doc
        .fontSize(12)
        .fillColor("black")
        .text(JSON.stringify(scrapedData, null, 2), 100, 100);
      doc.end();
    }
  } catch (error) {
    console.log(error);
  }
}
