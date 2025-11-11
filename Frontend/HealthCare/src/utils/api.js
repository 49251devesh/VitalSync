import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/patient",   // your backend
});

export default API;
