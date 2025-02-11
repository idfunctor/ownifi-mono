import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import { Router } from "@solidjs/router";
import "./styles/global.css";

export default function Root() {
  return (
    <html lang="en" data-theme="light">
      <head>
        // ... existing head content
      </head>
      <body>
        <Router
          root={(props) => (
            <Suspense>
              <div class="min-h-screen bg-base-100">
                {props.children}
              </div>
            </Suspense>
          )}
        >
          <FileRoutes />
        </Router>
      </body>
    </html>
  );
} 