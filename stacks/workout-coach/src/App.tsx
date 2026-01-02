import { Router, Route } from "@solidjs/router";
import Home from "./pages/Home";
import WorkoutLibrary from "./pages/WorkoutLibrary";
import GuidedSession from "./pages/GuidedSession";
import Stats from "./pages/Stats";
import Debug from "./pages/Debug";
import Settings from "./pages/Settings";

export default function App() {
  console.log("App component rendering");
  return (
    <Router>
      <Route path="/" component={Home} />
      <Route path="/library" component={WorkoutLibrary} />
      <Route path="/session/*id" component={GuidedSession} />
      <Route path="/stats" component={Stats} />
      <Route path="/debug" component={Debug} />
      <Route path="/settings" component={Settings} />
    </Router>
  );
}
