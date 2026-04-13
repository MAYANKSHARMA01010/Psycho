import winston from "winston";
import { env } from "../config/env";

export class LoggerService {
  private static instance: winston.Logger;

  private static format = winston.format.printf(({ level, message, timestamp, stack, ...meta }: any) => {
    return `${timestamp} [${level}]: ${stack || message} ${Object.keys(meta).length ? JSON.stringify(meta) : ""}`;
  });

  public static getLogger(): winston.Logger {
    if (!this.instance) {
      const { combine, timestamp, errors, colorize, json } = winston.format;

      this.instance = winston.createLogger({
        level: env.NODE_ENV === "development" ? "debug" : "info",
        format: combine(
          timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
          errors({ stack: true }),
          env.NODE_ENV === "development" 
            ? combine(colorize(), this.format) 
            : json()
        ),
        transports: [
          new winston.transports.Console(),
          new winston.transports.File({ filename: "logs/error.log", level: "error" }),
          new winston.transports.File({ filename: "logs/combined.log" }),
        ],
      });
    }
    return this.instance;
  }

  public static info(message: string, meta: any = {}): void {
    this.getLogger().info(message, meta);
  }

  public static error(message: string, meta: any = {}): void {
    this.getLogger().error(message, meta);
  }

  public static warn(message: string, meta: any = {}): void {
    this.getLogger().warn(message, meta);
  }

  public static debug(message: string, meta: any = {}): void {
    this.getLogger().debug(message, meta);
  }
}

export const logger = LoggerService;
