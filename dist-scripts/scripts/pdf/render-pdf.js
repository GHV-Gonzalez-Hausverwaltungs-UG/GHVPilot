"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBesichtigungPDF = generateBesichtigungPDF;
// scripts/pdf/render-pdf.ts
const puppeteer_core_1 = __importDefault(require("puppeteer-core"));
const chromium_min_1 = __importDefault(require("@sparticuz/chromium-min"));
const react_1 = __importDefault(require("react"));
const server_1 = require("react-dom/server");
const BesichtigungPDF_1 = require("@/lib/pdf/BesichtigungPDF");
// PDF-Renderer wird in "normalem" Node-Kontext ausgeführt
async function generateBesichtigungPDF(data) {
    const html = (0, server_1.renderToStaticMarkup)(react_1.default.createElement("html", null, react_1.default.createElement("body", null, react_1.default.createElement(BesichtigungPDF_1.BesichtigungPDF, { data }))));
    const executablePath = process.env.AWS_EXECUTION_ENV
        ? await chromium_min_1.default.executablePath()
        : undefined;
    const browser = await puppeteer_core_1.default.launch({
        args: chromium_min_1.default.args,
        executablePath,
        headless: true,
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();
    return pdfBuffer;
}
