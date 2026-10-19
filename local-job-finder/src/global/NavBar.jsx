import { StrictMode } from 'react'
import { Link } from "react-router-dom";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './NavBar.css'
import '/src/assets/placeholder.png'

export default function NavBar({active}) {
    let current = false
    if (active === "Hunter") {  
        current = true
    }
        return (
            <>
                <div className = "navbar">
                    <div className = "logo">
                        <img src = "src/assets/placeholder.png"></img>
                    </div>
                    <div className = "buttons">
                        <Link id = "job-board" to="/job-board" className = {current ? "current nav-button" : "not-current nav-button"}>Job Board</Link>
                        <Link id = "job-posting" to="/job-posting" className = {!current ? "current nav-button" : "not-current nav-button"}>Post a Job</Link>
                    </div>
                </div>
            </>
        )
    
}