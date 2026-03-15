import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Hero from "./pages/Hero";
import { useUser } from "@clerk/clerk-react";
import DashboardPage from "./components/DashboardPage"; // ✅ IMPORTANT
import Add from "./pages/Add";
import List from "./pages/List";
import Appointments from "./pages/Appointments";
import SerDashboard from "./pages/SerDashboard";
import AddSer from "./pages/AddSer";
import ListService from "./pages/ListService";
import ServiceAppointments from "./pages/ServiceAppointments";

function RequireAuth({ children }) {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold mb-4">
            Please sign in to view this page
          </p>
          <Link
            to="/"
            className="px-4 py-2 rounded bg-emerald-600 text-white"
          >
            Home
          </Link>
        </div>
      </div>
    );
  }

  return children;
}

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Hero />} />

      {/* ✅ Dashboard Route */}
      <Route
        path="/h"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />

      <Route
      path="/add"
      element={
        <RequireAuth>
          <Add/>
        </RequireAuth>
      }
      />

      <Route
      path="/list"
      element={
        <RequireAuth>
          <List/>
        </RequireAuth>
      }
      />

      <Route
      path="/appointments"
      element={
        <RequireAuth>
          <Appointments/>
        </RequireAuth>
      }
      />

      <Route
      path="/service-dashboard"
      element={
        <RequireAuth>
          <SerDashboard/>
        </RequireAuth>
      }
      />

       <Route
      path="/add-service"
      element={
        <RequireAuth>
         <AddSer/>
        </RequireAuth>
      }
      />

      <Route
      path="/list-service"
      element={
        <RequireAuth>
         <ListService/>

        </RequireAuth>
      }
      />

      <Route
      path="/service-appointments"
      element={
        <RequireAuth>
         <ServiceAppointments/>

         
        </RequireAuth>
      }
      />

    </Routes>
  );
};

export default App;