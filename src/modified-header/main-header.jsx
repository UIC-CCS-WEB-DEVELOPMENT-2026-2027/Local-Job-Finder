import { Link } from "react-router-dom";
import "./main-header.css";

export default function MainHeader({ view, posting, editingTask, hasPending, onActivity, onBack, onBoard }) {
  return <header className="navbar">
    <Link className="brand" to="/job-board">Local Task Finder</Link>
    <nav className="nav-links">{view === "mine" ? !editingTask && <button className="nav-activity" onClick={onBack}>Go Back</button> : <><Link className={!posting ? "nav-current" : "nav-muted"} to="/job-board" onClick={onBoard}>Task Board</Link><Link className={posting ? "nav-current" : "nav-muted"} to="/job-posting" onClick={onBoard}>Post a Task</Link><button className="nav-activity" onClick={onActivity}>My Activity{hasPending ? " •" : ""}</button></>}</nav>
  </header>;
}
