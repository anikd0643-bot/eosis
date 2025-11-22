import { createServer } from "../../server";

const app = createServer();

export default async (req: any, context: any) => {
  return new Promise((resolve) => {
    const body: Buffer[] = [];
    const res = {
      statusCode: 200,
      headers: {} as any,
      write: (data: any) => body.push(Buffer.from(data)),
      end: (data?: any) => {
        if (data) body.push(Buffer.from(data));
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(body).toString(),
        });
      },
      json: (data: any) => {
        res.headers["Content-Type"] = "application/json";
        res.end(JSON.stringify(data));
      },
      status: (code: number) => {
        res.statusCode = code;
        return res;
      },
      setHeader: (key: string, val: string) => {
        res.headers[key] = val;
      },
    };

    app(req, res, (err: any) => {
      if (err) {
        res.statusCode = 500;
        res.json({ error: err.message });
      }
    });
  });
};
