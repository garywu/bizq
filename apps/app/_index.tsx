import { Hono } from "hono";

const app = new Hono();

const routes = app.get("/api/clock", (c) => {
  return c.json({
    time: new Date().toLocaleTimeString(),
  });
});

export type AppType = typeof routes;

app.get("/", (c) => {
  return c.html(
    `<html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Served by Hono</title>        
      </head>
      <body>
        <div id="root"/>
        <script type="module" src="/src/react-app/main.tsx"></script>
      </body>
    </html>`
  );
});

export default app;
