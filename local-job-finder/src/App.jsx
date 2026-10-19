import { StrictMode } from 'react'
import { Link } from "react-router-dom";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NavBar from '/src/global/NavBar.jsx'

function App() {

  return (
    <>
      <BrowserRouter>
      <nav>
        <NavBar active = {"Hunter"} />
      </nav>

        <Routes>
          <Route path = "/job-board" element = {<NavBar active = {"Hunter"} />}/>
          <Route path = "/job-posting" element = {<NavBar active = {"Poster"} />}/>
        </Routes>

      </BrowserRouter>
    </>
  )
}

export default App
