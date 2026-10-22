import JobBoard from "/src/JobBoard/JobBoard.jsx"
import NavBar from "/src/NavBar/NavBar.jsx"
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {

  return (
    <>
      <BrowserRouter>

          <Routes>
            <Route path = "/" element = {<JobBoard />} />
            <Route path = "/job-board" element = {<JobBoard />} />
            <Route path = "/job-posting" element = {<NavBar active = {"Poster"} />}/>
          </Routes>

        </BrowserRouter>
      </>
  );
}

export default App;
