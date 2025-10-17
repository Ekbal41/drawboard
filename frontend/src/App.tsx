import { BrowserRouter, Routes, Route } from "react-router";
import { Toaster } from "sonner";
import RootRouter from "./routers/RootRouter";
import AuthRouter from "./routers/AuthRouter";

function App() {
  return (
    <>
      <BrowserRouter>
        <Toaster position="top-center" richColors />
        <Routes>
          <Route path="/*" element={<RootRouter />} />
          <Route path="/auth/*" element={<AuthRouter />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
