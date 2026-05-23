import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { AppError, createIncidentCenter } from "./incident-center.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createServer(options = {}) {
  const center = options.center ?? createIncidentCenter(options);

  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
        const html = await readFile(join(__dirname, "../public/index.html"), "utf8");
        send(res, 200, html, "text/html; charset=utf-8");
        return;
      }

      if (req.method === "GET" && url.pathname === "/health") {
        sendJson(res, 200, { ok: true, variant: "superpowers" });
        return;
      }

      if (url.pathname.startsWith("/api/")) {
        await handleApi(req, res, url, center);
        return;
      }

      sendJson(res, 404, { error: { code: "NOT_FOUND" } });
    } catch (error) {
      handleError(res, error);
    }
  });
}

async function handleApi(req, res, url, center) {
  const actor = center.authenticate(req.headers);
  const incidentMatch = url.pathname.match(/^\/api\/incidents\/([^/]+)(?:\/(status|assign))?$/);

  if (req.method === "POST" && url.pathname === "/api/incidents") {
    sendJson(res, 201, center.createIncident(actor, await readJson(req)));
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/incidents") {
    sendJson(res, 200, { incidents: center.listIncidents(actor) });
    return;
  }

  if (req.method === "GET" && incidentMatch && !incidentMatch[2]) {
    sendJson(res, 200, center.readIncident(actor, incidentMatch[1]));
    return;
  }

  if (req.method === "PATCH" && incidentMatch?.[2] === "status") {
    sendJson(res, 200, center.updateStatus(actor, incidentMatch[1], await readJson(req)));
    return;
  }

  if (req.method === "PATCH" && incidentMatch?.[2] === "assign") {
    sendJson(res, 200, center.assignIncident(actor, incidentMatch[1], await readJson(req)));
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/jobs/sla-reminders/run") {
    sendJson(res, 200, await center.runSlaReminderJob(actor));
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/audit-log") {
    sendJson(res, 200, { entries: center.listAuditLog(actor) });
    return;
  }

  sendJson(res, 404, { error: { code: "NOT_FOUND" } });
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new AppError(400, "INVALID_JSON", "request body must be valid JSON");
  }
}

function handleError(res, error) {
  if (error instanceof AppError) {
    sendJson(res, error.status, {
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    });
    return;
  }
  sendJson(res, 500, { error: { code: "INTERNAL_ERROR", message: "unexpected server error" } });
}

function sendJson(res, status, payload) {
  send(res, status, JSON.stringify(payload), "application/json; charset=utf-8");
}

function send(res, status, body, contentType) {
  res.writeHead(status, { "content-type": contentType });
  res.end(body);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createServer().listen(3000, () => console.log("superpowers listening on http://localhost:3000"));
}
