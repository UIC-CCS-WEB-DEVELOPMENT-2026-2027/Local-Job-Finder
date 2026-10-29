import { Link } from "react-router-dom";
import { useAuth } from "../Auth/AuthContext";
import logo from "../assets/Localified.png";
import "./main-header.css";

export default function MainHeader({
  view,
  posting,
  editingTask,
  onBack,
  onBoard,
}) {
  const { user, openAuth, displayName } = useAuth();

  return (
    <header className="navbar">
      <Link className="brand" to="/job-board">
        <img className="brand-logo" src={logo} alt="" />
        <span>Localified</span>
      </Link>
      <nav className="nav-links">
        {view === "mine" ? (
          !editingTask && (
            <button className="nav-activity" onClick={onBack}>
              Go Back
            </button>
          )
        ) : (
          <>
            <Link
              className={!posting ? "nav-current" : "nav-muted"}
              to="/job-board"
              onClick={onBoard}
            >
              Task Board
            </Link>
            <Link
              className={posting ? "nav-current" : "nav-muted"}
              to="/job-posting"
              onClick={onBoard}
            >
              Post a Task
            </Link>
          </>
        )}
        <button
          type="button"
          className="nav-activity nav-auth"
          onClick={openAuth}
          aria-label={user ? "Open account" : "Log in"}
        >
          {user ? displayName || "Account" : "Log in"}
        </button>
      </nav>
    </header>
  );
}
