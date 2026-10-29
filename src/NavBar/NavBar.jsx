import { Link } from "react-router-dom";
import logo from "../assets/Localified.png";
import "./NavBar.css";

export default function NavBar({ active }) {
  const current = active === "Hunter";

  return (
    <div className="navbar">
      <div className="logo">
        <img src={logo} alt="Localified" />
      </div>
      <div className="buttons">
        <Link
          id="job-board"
          to="/job-board"
          className={current ? "current nav-button" : "not-current nav-button"}
        >
          Job Board
        </Link>
        <Link
          id="job-posting"
          to="/job-posting"
          className={!current ? "current nav-button" : "not-current nav-button"}
        >
          Post a Job
        </Link>
      </div>
    </div>
  );
}
