import express, { type Request, Response } from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { ExtractionService } from "./extraction-service";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function registerRoutes(app: express.Application) {
  const server = createServer(app);
  
  // Health check endpoint
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Product extraction endpoint (new)
  app.post("/api/extract", async (req: Request, res: Response) => {
    try {
      const { imageData } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ 
          success: false, 
          error: "Image data is required" 
        });
      }

      const extractionService = new ExtractionService();
      const result = await extractionService.extractProductInfo(imageData);
      
      res.json(result);
      
    } catch (error) {
      console.error("Extraction error:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Internal server error" 
      });
    }
  });

  // OCR endpoint (for frontend compatibility)
  app.post("/api/ocr", async (req: Request, res: Response) => {
    try {
      const { imageData } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ 
          success: false, 
          error: "Image data is required" 
        });
      }

      const extractionService = new ExtractionService();
      const result = await extractionService.extractProductInfo(imageData);
      
      res.json(result);
      
    } catch (error) {
      console.error("OCR error:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Internal server error" 
      });
    }
  });

  // Backend info endpoint
  app.get("/api/backend", (req: Request, res: Response) => {
    try {
      const extractionService = new ExtractionService();
      const info = extractionService.getBackendInfo();
      res.json(info);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Internal server error" 
      });
    }
  });

  // Serve static files (CSS, JS, etc.)
  const staticPath = path.resolve(__dirname, "..", "dist", "public");
  app.use(express.static(staticPath));

  // Serve index.html for all other routes (SPA fallback)
  app.get("*", (req: Request, res: Response) => {
    res.sendFile("index.html", { root: staticPath });
  });

  return server;
} 