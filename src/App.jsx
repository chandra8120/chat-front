import { CallProvider } from "./Context";
import CallsHome from "./Home";
import IncomingCall from "./IncomingCall";
import CallScreen from "./CallScreen";
import "./whatsapp.css";

export default function App() {
  return (
    <CallProvider>
      <CallsHome />
      <IncomingCall />
      <CallScreen />
    </CallProvider>
  );
}
