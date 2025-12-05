import { Router, Route } from "@solidjs/router";
import Home from "./pages/Home";
import WorkoutLibrary from "./pages/WorkoutLibrary";
import GuidedSession from "./pages/GuidedSession";
import Stats from "./pages/Stats";

export default function App() {
  return (
    <Router>
      <Route path="/" component={Home} />
      <Route path="/library" component={WorkoutLibrary} />
      <Route path="/session/:id" component={GuidedSession} />
      <Route path="/stats" component={Stats} />
    </Router>
  );
}
