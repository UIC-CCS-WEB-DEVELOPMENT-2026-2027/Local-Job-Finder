import { Link } from "react-router-dom";
import "./main-footer.css";

export default function Footer() {
  return <footer className="site-footer">
    <nav className="footer-links" aria-label="Footer navigation">
      <Link to="/job-board">Home</Link>
      <a href="mailto:hello@localtaskfinder.example">Contact</a>
      <a href="#about">About Us</a>
      <a href="#privacy">Privacy Policy</a>
    </nav>
    <div className="footer-social" aria-label="Social media">
      <a href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook">f</a>
      <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram">◎</a>
    </div>
    <p>© 2026 Local Task Finder. All rights reserved.</p>
  </footer>;
}
