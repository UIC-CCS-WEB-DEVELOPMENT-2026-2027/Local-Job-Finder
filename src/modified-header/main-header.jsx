import { Link } from "react-router-dom";
import logo from "../assets/Localified.png";
import "./main-header.css";

export default function MainHeader({
  view,
  posting,
  editingTask,
  onBack,
  onBoard,
  user,
  onAccount,
}) {
  const displayName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : "";

  return (
    <header className="navbar">
      <Link className="brand" to="/job-board" onClick={onBoard}>
        <img src={logo} alt="Localified" />
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
        {user && (
          <button className="nav-account" onClick={onAccount} type="button">
            {displayName || "Account"}
          </button>
        )}
      </nav>
    </header>
  );
}
