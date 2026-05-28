import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { Toaster } from "@/components/ui/toaster";
import Portfolio from "./pages/Portfolio";

export default function App() {
  return (
    <>
      <Router hook={useHashLocation}>
        <Switch>
          <Route path="/" component={Portfolio} />
          <Route component={Portfolio} />
        </Switch>
      </Router>
      <Toaster />
    </>
  );
}
