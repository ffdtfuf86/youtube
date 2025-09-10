import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { insertSettingsSchema, insertTemporaryAccessSchema } from "@shared/schema";
import { z } from "zod";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY || "";
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || "";

const verificationWords = [
  "SUNSHINE", "RAINBOW", "BUTTERFLY", "MOUNTAIN", "OCEAN", "FLOWER", 
  "DIAMOND", "CRYSTAL", "MELODY", "HARMONY", "ADVENTURE", "FREEDOM",
  "MAGICAL", "GOLDEN", "SILVER", "PEACEFUL", "JOYFUL", "BRILLIANT"
];

function generateVerificationWord(): string {
  return verificationWords[Math.floor(Math.random() * verificationWords.length)];
}

async function fetchYouTubeChannelVideos(channelId: string) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${channelId}&part=snippet&order=date&maxResults=50&type=video`
    );
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.items?.map((item: any) => ({
      id: item.id.videoId,
      channelId: channelId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      publishedAt: item.snippet.publishedAt,
      viewCount: "0", // Would need additional API call to get view count
      duration: "0:00", // Would need additional API call to get duration
    })) || [];
  } catch (error) {
    console.error("Error fetching YouTube videos:", error);
    return [];
  }
}

async function getChannelIdFromUrl(channelUrl: string): Promise<string | null> {
  try {
    // Extract channel ID from various YouTube URL formats
    const patterns = [
      /youtube\.com\/channel\/([^\/\?]+)/,
      /youtube\.com\/c\/([^\/\?]+)/,
      /youtube\.com\/user\/([^\/\?]+)/,
      /youtube\.com\/@([^\/\?]+)/,
    ];

    for (const pattern of patterns) {
      const match = channelUrl.match(pattern);
      if (match) {
        const identifier = match[1];
        
        // If it's already a channel ID (starts with UC), return it
        if (identifier.startsWith('UC')) {
          return identifier;
        }
        
        // Otherwise, try to resolve it via YouTube API
        const searchResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&q=${identifier}&type=channel&part=id&maxResults=1`
        );
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.items?.[0]?.id?.channelId) {
            return searchData.items[0].id.channelId;
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error resolving channel ID:", error);
    return null;
  }
}

async function makePhoneCall(phoneNumber: string, verificationWord: string): Promise<boolean> {
  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      console.log(`Mock phone call to ${phoneNumber} with word: ${verificationWord}`);
      return true; // Mock success for development
    }

    // Real Twilio implementation would go here
    const twilio = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    
    await twilio.calls.create({
      twiml: `<Response><Say>Your SecureYT verification word is: ${verificationWord.split('').join(' ')}</Say></Response>`,
      to: phoneNumber,
      from: TWILIO_PHONE_NUMBER,
    });
    
    return true;
  } catch (error) {
    console.error("Error making phone call:", error);
    return false;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get user settings
  app.get("/api/settings/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const settings = await storage.getSettings(userId);
      
      if (!settings) {
        return res.status(404).json({ message: "Settings not found" });
      }
      
      // Don't return the hashed password
      const { securityPassword, ...safeSettings } = settings;
      res.json(safeSettings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get settings" });
    }
  });

  // Create or update settings
  app.post("/api/settings", async (req, res) => {
    try {
      const validatedData = insertSettingsSchema.parse(req.body);
      
      // Validate channel URL and get channel ID
      const channelId = await getChannelIdFromUrl(validatedData.allowedChannelUrl);
      if (!channelId) {
        return res.status(400).json({ message: "Invalid YouTube channel URL" });
      }

      const existing = await storage.getSettings(validatedData.userId);
      
      let settings;
      if (existing) {
        settings = await storage.updateSettings(validatedData.userId, {
          ...validatedData,
          allowedChannelId: channelId,
        });
      } else {
        settings = await storage.createSettings({
          ...validatedData,
          allowedChannelId: channelId,
        });
      }
      
      if (!settings) {
        return res.status(500).json({ message: "Failed to save settings" });
      }
      
      const { securityPassword, ...safeSettings } = settings;
      res.json(safeSettings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save settings" });
    }
  });

  // Get videos for allowed channel
  app.get("/api/videos/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const settings = await storage.getSettings(userId);
      
      if (!settings) {
        return res.status(404).json({ message: "Settings not found" });
      }

      // Check for temporary access to other channels
      const temporaryAccess = await storage.getActiveTemporaryAccess(userId);
      const allowFullAccess = !!temporaryAccess;

      let videos = await storage.getVideos(settings.allowedChannelId);
      
      // If no cached videos or they're old, fetch fresh ones
      if (videos.length === 0) {
        const freshVideos = await fetchYouTubeChannelVideos(settings.allowedChannelId);
        if (freshVideos.length > 0) {
          await storage.clearVideos(settings.allowedChannelId);
          await storage.saveVideos(freshVideos);
          videos = freshVideos.map(v => ({ ...v, createdAt: new Date() }));
        }
      }

      res.json({ 
        videos, 
        allowedChannel: {
          id: settings.allowedChannelId,
          name: settings.allowedChannelName,
          url: settings.allowedChannelUrl,
        },
        hasTemporaryAccess: allowFullAccess,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get videos" });
    }
  });

  // Verify password (first security layer)
  app.post("/api/verify-password", async (req, res) => {
    try {
      const { userId, password } = req.body;
      
      if (!userId || !password) {
        return res.status(400).json({ message: "User ID and password required" });
      }

      const settings = await storage.getSettings(userId);
      if (!settings) {
        return res.status(404).json({ message: "Settings not found" });
      }

      const isValid = await bcrypt.compare(password, settings.securityPassword);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid password" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Password verification failed" });
    }
  });

  // Initiate phone verification (second security layer)
  app.post("/api/verify-phone", async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }

      const settings = await storage.getSettings(userId);
      if (!settings) {
        return res.status(404).json({ message: "Settings not found" });
      }

      const verificationWord = generateVerificationWord();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Create temporary access record
      await storage.createTemporaryAccess({
        userId,
        verificationWord,
        expiresAt,
        isActive: false, // Will be activated after voice verification
      });

      // Make phone call
      const callSuccess = await makePhoneCall(settings.phoneNumber, verificationWord);
      
      if (!callSuccess) {
        return res.status(500).json({ message: "Failed to make phone call" });
      }

      res.json({ 
        success: true, 
        verificationWord,
        phoneNumber: settings.phoneNumber.replace(/(\d{3})\d{3}(\d{4})/, '$1***$2'),
      });
    } catch (error) {
      res.status(500).json({ message: "Phone verification failed" });
    }
  });

  // Verify voice recording (third security layer)
  app.post("/api/verify-voice", async (req, res) => {
    try {
      const { userId, spokenWord } = req.body;
      
      if (!userId || !spokenWord) {
        return res.status(400).json({ message: "User ID and spoken word required" });
      }

      const temporaryAccess = await storage.getActiveTemporaryAccess(userId);
      if (!temporaryAccess) {
        return res.status(404).json({ message: "No active verification session" });
      }

      // Simple word matching (in production, would use speech recognition)
      const isMatch = spokenWord.toUpperCase().trim() === temporaryAccess.verificationWord.toUpperCase().trim();
      
      if (!isMatch) {
        return res.status(401).json({ message: "Voice verification failed" });
      }

      // Activate temporary access
      const settings = await storage.getSettings(userId);
      const durationMinutes = settings?.temporaryAccessDuration || 30;
      const newExpiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

      await storage.createTemporaryAccess({
        userId,
        verificationWord: temporaryAccess.verificationWord,
        expiresAt: newExpiresAt,
        isActive: true,
      });

      res.json({ 
        success: true, 
        expiresAt: newExpiresAt,
        duration: durationMinutes,
      });
    } catch (error) {
      res.status(500).json({ message: "Voice verification failed" });
    }
  });

  // End temporary access
  app.post("/api/end-temporary-access", async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }

      await storage.expireTemporaryAccess(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to end temporary access" });
    }
  });

  // Refresh videos from YouTube
  app.post("/api/refresh-videos", async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }

      const settings = await storage.getSettings(userId);
      if (!settings) {
        return res.status(404).json({ message: "Settings not found" });
      }

      await storage.clearVideos(settings.allowedChannelId);
      const freshVideos = await fetchYouTubeChannelVideos(settings.allowedChannelId);
      
      if (freshVideos.length > 0) {
        await storage.saveVideos(freshVideos);
      }

      res.json({ success: true, count: freshVideos.length });
    } catch (error) {
      res.status(500).json({ message: "Failed to refresh videos" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
