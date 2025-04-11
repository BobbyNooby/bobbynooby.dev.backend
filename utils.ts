
import express from "express";
export function consoleBob(...args: any[]) {
  console.log(`[${new Date().toLocaleString()}] `, ...args);
}

export function secondsToTimeString(seconds: number): string {
  const minutes = Math.floor(Math.abs(seconds / 60));
  const hours = Math.floor(Math.abs(seconds / 3600));
  const days = Math.floor(Math.abs(seconds / 86400));
  const weeks = Math.floor(Math.abs(seconds / 604800));
  const years = Math.floor(Math.abs(seconds / 31536000));

  if (seconds < 60) {
    return `${seconds} seconds`;
  } else if (seconds < 3600) {
    return `${minutes} minutes`;
  } else if (seconds < 86400) {
    return `${hours} hours`;
  } else if (seconds < 604800) {
    return `${days} days`;
  } else if (seconds < 31536000) {
    return `${weeks} weeks`;
  } else {
    return `${years} years`;
  }
}

export function convertReq(wsReq, app): express.Request {
  const req = wsReq;

  // Add properties that Express expects
  req.app = app;
  req.baseUrl = "";
  req.body = {};
  req.cookies = {};
  req.fresh = true;
  req.hostname = wsReq.headers.host?.split(":")[0] || "";
  req.ip = wsReq.socket.remoteAddress || "";
  req.ips = [req.ip];
  req.method = "GET"; // WebSocket connections start with HTTP GET
  req.originalUrl = wsReq.url || "";
  req.params = {};
  req.path = wsReq.url || "";
  req.protocol = wsReq.socket.encrypted ? "https" : "http";
  req.query = {};
  req.route = { path: wsReq.url || "" };
  req.secure = req.protocol === "https";
  req.signedCookies = {};
  req.stale = !req.fresh;
  req.subdomains = [];
  req.xhr = false;

  // Add get method for headers
  req.get = (header: string) => {
    const value = wsReq.headers[header.toLowerCase()];
    return Array.isArray(value) ? value[0] : value;
  };

  return req;
}
