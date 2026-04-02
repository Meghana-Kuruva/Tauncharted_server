const Groq = require("groq-sdk");
const { Exhibitor, TradeShow } = require('../models');
const puppeteer = require('puppeteer');
const Tesseract = require('tesseract.js');
// Initialize Groq client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * POST /api/extractor/extract
 * Extracts exhibitor data from text, image, or PDF content using Groq + Llama AI.
 */
exports.extract = async (req, res) => {
  try {
    const { inputType, content, mimeType } = req.body;

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "Groq API Key is missing. Please add GROQ_API_KEY to your .env file." });
    }

    if (!content) {
      return res.status(400).json({ error: "Content is required for extraction." });
    }

    if (!inputType) {
      return res.status(400).json({ error: "inputType is required. Supported: 'text', 'image', 'pdf', 'url'." });
    }

    const systemPrompt = `You are a specialized Data Extraction Engine for Trade Show and Event Exhibitors.

Analyze the provided input and extract EVERY SINGLE exhibitor mention found. Your goal is 100% recall. Do not skip any names.

Data Fields to Extract:
- exhibitor: The full legal name of the company/exhibitor.
- boothNumber: The specific alphanumeric code for the booth (e.g., '61214', 'CP-15').
- boothSize: The dimensions or square footage (e.g., '4,800 sq. ft.', '10x10').
- companyUrl: The official external website of the exhibitor (not the event floorplan link).

Rules:
1. If a piece of information is missing (like booth number), use null.
2. Look specifically for labels like 'Booth:', 'Stand:', or 'Space #' for booth numbers.
3. If the input contains a URL like selectedBooth=61214, extract that as the booth number.
4. Return ONLY a valid JSON object with a single key "exhibitors" containing an array of objects.
5. Extract ALL companies mentioned, even if they are listed in a dense table or long list.
6. Do not include any explanation or extra text outside the JSON.

Output format (strict):
{
  "exhibitors": [
    {
      "exhibitor": "string or null",
      "boothNumber": "string or null",
      "boothSize": "string or null",
      "companyUrl": "string or null"
    }
  ]
}`;

    let userMessage = '';

    if (inputType === 'text') {
      userMessage = `Extract exhibitor data from this content:\n\n${content}`;

    } else if (inputType === 'pdf') {
      // Groq/Llama doesn't support binary PDF — extract text first and send as text
      // content should be the extracted text from the PDF (handle on frontend or use pdf-parse)
      userMessage = `Extract exhibitor data from this PDF text content:\n\n${content}`;

    } else if (inputType === 'image') {
      // Groq supports vision via llama-3.2-11b-vision-preview for images
      // content should be base64 encoded image
      const base64Data = content.includes(',') ? content.split(',')[1] : content;
      const imageMimeType = mimeType || 'image/jpeg';

      const visionCompletion = await groq.chat.completions.create({
        model: "llama-3.2-11b-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${imageMimeType};base64,${base64Data}`
                }
              },
              {
                type: "text",
                text: systemPrompt + "\n\nExtract ALL exhibitors from this image. Format as JSON."
              }
            ]
          }
        ],
        temperature: 0,
        max_tokens: 1024
      });

      const rawVision = visionCompletion.choices[0].message.content.trim();
      const cleanedVision = rawVision
        .replace(/^```json\s*/gi, '')
        .replace(/^```\s*/gi, '')
        .replace(/\s*```$/gi, '')
        .trim();

      let parsedVision;
      try {
        parsedVision = JSON.parse(cleanedVision);
      } catch (e) {
        console.error('Vision JSON parse error. Raw:', rawVision);
        return res.status(500).json({ error: "AI returned invalid JSON for image.", raw: rawVision });
      }

      const visionData = parsedVision.exhibitors || (Array.isArray(parsedVision) ? parsedVision : [parsedVision]);
      return res.json({ success: true, data: visionData });

    } else if (inputType === 'url') {
      try {
        console.log(`Starting to scrape URL: ${content}`);
        const browser = await puppeteer.launch({ 
          headless: "new", 
          args: ['--no-sandbox', '--disable-setuid-sandbox'] 
        });
        const page = await browser.newPage();
        
        // Go to URL and wait until dom is loaded
        await page.goto(content, { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        // Scroll to the bottom to trigger lazy loading
        await page.evaluate(async () => {
          await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
              const scrollHeight = document.body.scrollHeight;
              window.scrollBy(0, distance);
              totalHeight += distance;
              
              if(totalHeight >= scrollHeight - window.innerHeight){
                clearInterval(timer);
                resolve();
              }
            }, 100);
          });
        });
        
        // Wait a bit more for any lazy render
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Extract visible text
        const pageText = await page.evaluate(() => document.body.innerText);
        
        // Take a full-page screenshot
        const screenshotBuffer = await page.screenshot({ fullPage: true });
        await browser.close();
        
        console.log('Scraped text extracted. Running OCR on screenshot...');
        
        // Run OCR on the screenshot using Tesseract.js
        const { data: { text: ocrText } } = await Tesseract.recognize(
          screenshotBuffer,
          'eng',
          { logger: m => {} } 
        );
        
        // Combine and truncate to avoid huge LLM prompt size and hit Groq limit
        const safePageText = pageText.substring(0, 20000);
        const safeOcrText = ocrText.substring(0, 20000);
        
        const combinedText = `DOM Text:\n${safePageText}\n\nOCR Text:\n${safeOcrText}`;
        console.log(`Completed scraping and OCR for ${content}. Total characters: ${combinedText.length}`);
        
        userMessage = `Extract exhibitor data from this website content (DOM + OCR text):\n\n${combinedText}`;
        
      } catch (scrapeErr) {
        console.error('URL Scraping error:', scrapeErr);
        return res.status(500).json({ error: "Failed to scrape the URL or perform OCR.", details: scrapeErr.message });
      }

    } else {
      return res.status(400).json({ error: "Invalid inputType. Supported: 'text', 'image', 'pdf', 'url'." });
    }

    // Text / PDF path
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage + "\n\nCRITICAL: Ensure you extract EVERY exhibitor found. Do not summarize." }
      ],
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: 4096
    });

    const responseText = completion.choices[0].message.content.trim();

    let extractedData;
    try {
      const parsed = JSON.parse(responseText);
      // Handle both { exhibitors: [...] } and direct array responses
      extractedData = parsed.exhibitors || (Array.isArray(parsed) ? parsed : [parsed]);
    } catch (parseErr) {
      console.error('JSON Parse Error. Raw response:', responseText);
      return res.status(500).json({
        error: "AI returned invalid JSON.",
        raw: responseText
      });
    }

    return res.json({ success: true, data: extractedData });

  } catch (err) {
    console.error('AI Extraction Error:', err.stack || err);
    return res.status(500).json({
      error: "Failed to extract data using AI.",
      details: err.message
    });
  }
};

/**
 * POST /api/extractor/save
 * Bulk saves extracted exhibitors to a specific Trade Show.
 */
exports.save = async (req, res) => {
  try {
    const { tradeShowId, exhibitors } = req.body;

    if (!tradeShowId || !exhibitors || !Array.isArray(exhibitors)) {
      return res.status(400).json({ error: "Trade Show ID and list of exhibitors are required." });
    }

    if (exhibitors.length === 0) {
      return res.status(400).json({ error: "Exhibitors array cannot be empty." });
    }

    const tradeShow = await TradeShow.findByPk(tradeShowId);
    if (!tradeShow) {
      return res.status(404).json({ error: "Trade Show not found." });
    }

    const cleanExhibitors = exhibitors.map(ex => ({
      tradeShowId,
      exhibitorName: ex.exhibitor || 'Unknown Exhibitor',
      boothNumber: ex.boothNumber || null,
      boothSize: ex.boothSize || null,
      companyUrl: ex.companyUrl || null,
      extraFields: {}
    }));

    const created = await Exhibitor.bulkCreate(cleanExhibitors);

    return res.status(201).json({
      message: `Successfully saved ${created.length} exhibitors to ${tradeShow.name}.`,
      count: created.length
    });

  } catch (err) {
    console.error('Save Extracted Data Error:', err.stack || err);
    return res.status(500).json({ error: err.message });
  }
};