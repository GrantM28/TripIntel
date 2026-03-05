import { Navigate, Route, Routes } from "react-router-dom";
import { PlannerPage } from "./pages/PlannerPage";
import { TripPage } from "./pages/TripPage";

export const App = () => {
  return (
    <Routes>
      <Route path="/" element={<PlannerPage />} />
      <Route path="/trip/:id" element={<TripPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};