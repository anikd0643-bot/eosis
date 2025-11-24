import { createServer } from "../../server";

const app = createServer();

export default async (req: any, context: any) => {
  return new Promise((resolve) => {
    // Handle request body
    let body = "";
    
    // For netlify functions, body comes as string
    if (req.body) {
      if (typeof req.body === "string") {
        body = req.body;
      } else {
        body = JSON.stringify(req.body);
      }
    }

    const chunks: Buffer[] = [];
    const res = {
      statusCode: 200,
      headers: {} as any,
      write: (data: any) => {
        if (data) chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data));
      },
      end: (data?: any) => {
        if (data) chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data));
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks).toString("utf-8"),
        });
      },
      json: (data: any) => {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(data));
      },
      status: (code: number) => {
        res.statusCode = code;
        return res;
      },
      setHeader: (key: string, val: string) => {
        res.headers[key] = val;
      },
      send: (data: any) => {
        if (typeof data === "object") {
          res.json(data);
        } else {
          res.end(data);
        }
      },
    };

    // Create a proper request object for Express
    const expressReq = {
      method: req.httpMethod || req.method || "GET",
      url: req.rawUrl || req.path || "/",
      headers: req.headers || {},
      body: body ? (typeof body === "string" ? JSON.parse(body) : body) : {},
      query: req.queryStringParameters || {},
      on: (event: string, handler: Function) => {
        if (event === "data") {
          if (body) handler(body);
        } else if (event === "end") {
          handler();
        }
      },
    };

    // Call Express app
    app(expressReq as any, res as any, (err: any) => {
      if (err) {
        console.error("API Error:", err);
        res.statusCode = 500;
        res.json({ error: err.message });
      }
    });
  });
};
