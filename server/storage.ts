import { type User, type InsertUser, type Settings, type InsertSettings, type TemporaryAccess, type InsertTemporaryAccess, type Video, type InsertVideo } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Settings management
  getSettings(userId: string): Promise<Settings | undefined>;
  createSettings(settings: InsertSettings): Promise<Settings>;
  updateSettings(userId: string, settings: Partial<InsertSettings>): Promise<Settings | undefined>;
  
  // Temporary access management
  createTemporaryAccess(access: InsertTemporaryAccess): Promise<TemporaryAccess>;
  getActiveTemporaryAccess(userId: string): Promise<TemporaryAccess | undefined>;
  expireTemporaryAccess(userId: string): Promise<void>;
  
  // Video management
  getVideos(channelId: string): Promise<Video[]>;
  saveVideos(videos: InsertVideo[]): Promise<void>;
  clearVideos(channelId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private settings: Map<string, Settings>;
  private temporaryAccess: Map<string, TemporaryAccess>;
  private videos: Map<string, Video>;

  constructor() {
    this.users = new Map();
    this.settings = new Map();
    this.temporaryAccess = new Map();
    this.videos = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = { ...insertUser, id, password: hashedPassword };
    this.users.set(id, user);
    return user;
  }

  async getSettings(userId: string): Promise<Settings | undefined> {
    return Array.from(this.settings.values()).find(
      (setting) => setting.userId === userId,
    );
  }

  async createSettings(insertSettings: InsertSettings): Promise<Settings> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertSettings.securityPassword, 10);
    const settings: Settings = {
      ...insertSettings,
      id,
      securityPassword: hashedPassword,
      voiceVerificationEnabled: insertSettings.voiceVerificationEnabled ?? true,
      temporaryAccessDuration: insertSettings.temporaryAccessDuration ?? 30,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.settings.set(id, settings);
    return settings;
  }

  async updateSettings(userId: string, updateData: Partial<InsertSettings>): Promise<Settings | undefined> {
    const existing = await this.getSettings(userId);
    if (!existing) return undefined;

    const updates: any = { ...updateData, updatedAt: new Date() };
    if (updateData.securityPassword) {
      updates.securityPassword = await bcrypt.hash(updateData.securityPassword, 10);
    }

    const updated: Settings = { ...existing, ...updates };
    this.settings.set(existing.id, updated);
    return updated;
  }

  async createTemporaryAccess(insertAccess: InsertTemporaryAccess): Promise<TemporaryAccess> {
    const id = randomUUID();
    const access: TemporaryAccess = {
      ...insertAccess,
      id,
      isActive: insertAccess.isActive ?? true,
      createdAt: new Date(),
    };
    this.temporaryAccess.set(id, access);
    return access;
  }

  async getActiveTemporaryAccess(userId: string): Promise<TemporaryAccess | undefined> {
    return Array.from(this.temporaryAccess.values()).find(
      (access) => access.userId === userId && access.isActive && access.expiresAt > new Date(),
    );
  }

  async expireTemporaryAccess(userId: string): Promise<void> {
    const access = await this.getActiveTemporaryAccess(userId);
    if (access) {
      access.isActive = false;
      this.temporaryAccess.set(access.id, access);
    }
  }

  async getVideos(channelId: string): Promise<Video[]> {
    return Array.from(this.videos.values()).filter(
      (video) => video.channelId === channelId,
    );
  }

  async saveVideos(videos: InsertVideo[]): Promise<void> {
    videos.forEach(video => {
      const videoWithTimestamp: Video = { 
        ...video, 
        duration: video.duration ?? null,
        description: video.description ?? null,
        thumbnailUrl: video.thumbnailUrl ?? null,
        viewCount: video.viewCount ?? null,
        publishedAt: video.publishedAt ?? null,
        createdAt: new Date() 
      };
      this.videos.set(video.id, videoWithTimestamp);
    });
  }

  async clearVideos(channelId: string): Promise<void> {
    const videosToDelete = Array.from(this.videos.entries()).filter(
      ([, video]) => video.channelId === channelId,
    );
    videosToDelete.forEach(([id]) => this.videos.delete(id));
  }
}

export const storage = new MemStorage();
