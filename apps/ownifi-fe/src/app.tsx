import "./input.css";
import { MetaProvider } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import Layout from "./components/Layout";

export default function App() {
  return (
    <MetaProvider>
      <Router
        root={(props) => (
          <Layout>
            <Suspense>
              {props.children}
            </Suspense>
          </Layout>
        )}
      >
        <FileRoutes />
      </Router>
    </MetaProvider>
  );
}
