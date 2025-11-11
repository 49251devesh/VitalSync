import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import HomePage from "./components/HomePage.jsx";
import ErrorPage from "./components/ErrorPage.jsx";
import Sos from "./components/Sos.jsx"
import Near from "./components/Near.jsx"
import Scan from './components/Scan.jsx';
import HospitalDashboard from "./components/HospitalDashBoard.jsx";
import PatientDashboard from "./components/PatientDashboard.jsx";
import DoctorDetailsModal from './components/DoctorDetailsModal.jsx';
import HospitalRegister from './components/HospitalRegister.jsx';
import AddDoc from './components/AddDoc.jsx';
import DoctorLanding from './components/DoctorLanding.jsx';
import PatientLogin from "./components/PatientLogin.jsx";
import PatientRegister from "./components/PatientRegister.jsx";
import RoleSelection from './components/RoleSelection.jsx';
import AppointmentBooking from './components/AppointmentBooking.jsx';
import Appointments from './components/Appointments.jsx';

const router=createBrowserRouter([
  {
    path:"/",
    element:<HomePage/>,
    errorElement:<ErrorPage/>,
  },
  {
    path:"/sos",
    element:<Sos/>,
    errorElement:<ErrorPage/>,
  },
    {
    path:"/available",
    element:<Near/>,
    errorElement:<ErrorPage/>,
  },
  {
    path:"/scan",
    element:<Scan/>,
    errorElement:<ErrorPage/>,
  },
  {
    path:"/hospital-register",
    element:<HospitalRegister/>,
    errorElement:<ErrorPage/>,
  },
  { path: "/hospital-dashboard", 
    element: <HospitalDashboard /> 
  },
  {
    path:"/hospital-login",
    element:<HospitalRegister/>
  },
    {
    path:"/hospital",
    element:<DoctorLanding/>
  },
  {
    path: "/patient-dashboard", 
    element: <PatientDashboard />
   },
   
    {
    path: "/doc-details", 
    element: <DoctorDetailsModal/>
   },
   {
  path: "/dashboard/:id",
  element: <PatientDashboard />,
  errorElement: <ErrorPage />,
  },

    {
    path: "/addDoc", 
    element: <AddDoc/>
   },
     {
    path: "/patient-login",
    element: <PatientLogin />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/patient-register",
    element: <PatientRegister />,
    errorElement: <ErrorPage />,
  },
  {
    path:"/log",
    element:<RoleSelection/>,
    errorElement:<ErrorPage/>
  },
    {
    path:"/booking",
    element:<AppointmentBooking/>,
    errorElement:<ErrorPage/>
  },
  {
    path:"/appointments",
    element:<Appointments/>,
    errorElement:<ErrorPage/>
  },
  {
  path: "/appointments/:id",   // ✅ dynamic route for patientID
  element: <Appointments />,
  errorElement: <ErrorPage />,
}

])

createRoot(document.getElementById('root')).render(
  <RouterProvider router={router}/>
)
