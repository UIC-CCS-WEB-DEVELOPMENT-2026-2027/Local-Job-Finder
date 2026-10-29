import { Link } from "react-router-dom";
import "./main-header.css";

export default function MainHeader({ view, posting, editingTask, onBack, onBoard }) {
  return <header className="navbar">
    <Link className="brand" to="/job-board"><img src="/src/assets/placeholder.png" /></Link>
    <nav className="nav-links">{view === "mine" ? !editingTask && <button className="nav-activity nav-current" onClick={onBack}>Go Back</button> : <><Link className={!posting ? "nav-current" : "nav-muted"} to="/job-board" onClick={onBoard}>Job Board</Link><Link className={posting ? "nav-current" : "nav-muted"} to="/job-posting" onClick={onBoard}>Post a Job</Link></>}</nav>
  </header>;
}
