import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TradingDashboard } from "./components/TradingDashboard";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground">
        <TradingDashboard />
      </div>
    </QueryClientProvider>
  );
}

export default App;
