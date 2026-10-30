import { Link } from "react-router-dom";
import logo from "../assets/Localified.png";
import "./main-header.css";

<<<<<<< HEAD
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
=======
export default function MainHeader({ view, posting, editingTask, onBack, onBoard }) {
  return <header className="navbar">
    <Link className="brand" to="/job-board"><img src="/src/assets/placeholder.png" /></Link>
    <nav className="nav-links">{view === "mine" ? !editingTask && <button className="nav-activity nav-current" onClick={onBack}>Go Back</button> : <><Link className={!posting ? "nav-current" : "nav-muted"} to="/job-board" onClick={onBoard}>Job Board</Link><Link className={posting ? "nav-current" : "nav-muted"} to="/job-posting" onClick={onBoard}>Post a Job</Link></>}</nav>
  </header>;
>>>>>>> da8c89b9fa70321eb108c127976853f40058f905
}
