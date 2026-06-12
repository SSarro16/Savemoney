import "react-native-gesture-handler";

import AppRoot from "./app/AppRoot";
import { initMonitoring } from "./util/monitoring";

initMonitoring();

export default function App() {
  return <AppRoot />;
}
