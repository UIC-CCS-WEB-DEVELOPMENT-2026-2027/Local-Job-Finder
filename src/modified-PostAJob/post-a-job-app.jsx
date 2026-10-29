import { useEffect, useState } from "react";
import { BrowserRouter, Link, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import initialTasks from "../modified-Jobboard/job-data.json";
import Footer from "../Footer/main-footer.jsx";
import "./post-a-job.css";

const currentUser = "demo-user";

const readStored = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

function Marketplace() {
  const [tasks, setTasks] = useState(() => readStored("localTasks", initialTasks.map((task) => ({
    ...task,
    category: task.category || task.title,
    location: task.location || task.address,
    schedule: task.schedule || "Schedule to be agreed",
    budget: task.budget || task.payment,
    status: task.status === "Close" ? "Closed" : task.status,
    host: task.host || "Local host",
    ownerId: task.ownerId || (task.host === "Demo host" || initialTasks.some((sample) => sample.id === task.id && sample.title === task.title) ? currentUser : undefined),
  }))));
  const [applications, setApplications] = useState(() => readStored("localApplications", []).map((item) => ({
    ...item,
    applicantId: item.applicantId || (item.worker === "Demo worker" ? currentUser : undefined),
    applicant: item.applicant || (item.worker === "Demo worker" ? "You" : "Applicant"),
  })));
  const [search, setSearch] = useState("");
  const [view, setView] = useState("board");
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const [budgetError, setBudgetError] = useState("");
  const [budgetType, setBudgetType] = useState("fixed");
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => localStorage.setItem("localTasks", JSON.stringify(tasks)), [tasks]);
  useEffect(() => localStorage.setItem("localApplications", JSON.stringify(applications)), [applications]);
  const location = useLocation();
  const navigate = useNavigate();
  const posting = location.pathname === "/job-posting";
  const showTaskForm = (posting && view !== "mine") || Boolean(editingTask);
  const myApplications = applications.filter((item) => item.applicantId === currentUser);
  const filtered = tasks.filter((task) => {
    const isOwner = task.ownerId === currentUser;
    const hasApplied = myApplications.some((item) => item.taskId === task.id);
    const visible = view === "mine" ? isOwner || hasApplied : task.status === "Open" || isOwner || hasApplied;
    return visible && `${task.title} ${task.description} ${task.location}`.toLowerCase().includes(search.toLowerCase());
  });
  const saveTask = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const minimum = budgetType === "range" ? data.get("budgetMin") : "";
    const maximum = budgetType === "range" ? data.get("budgetMax") : "";
    if (budgetType === "range" && ((minimum && !maximum) || (!minimum && maximum))) {
      setBudgetError("Enter both the minimum and maximum budget, or leave both blank.");
      return;
    }
    if (minimum && Number(minimum) > Number(maximum)) {
      setBudgetError("Minimum budget must not exceed the maximum.");
      return;
    }
    setBudgetError("");
    const formatPeso = (amount) => `₱${Number(amount).toLocaleString("en-PH")}`;
    const budget = budgetType === "range" && minimum
      ? `${formatPeso(minimum)}–${formatPeso(maximum)}`
      : data.get("budget") ? formatPeso(data.get("budget")) : "";
    const updatedTask = {
      ...(editingTask || {}), id: editingTask?.id || Date.now(), title: data.get("title").trim(), category: data.get("category").trim(),
      description: data.get("description").trim(), location: data.get("location").trim(),
      schedule: data.get("schedule").trim(), budget, budgetType,
      budgetMin: minimum, budgetMax: maximum,
      contactNo: data.get("contact").trim(), status: editingTask?.status || "Open", ownerId: currentUser,
    };
    setTasks((current) => editingTask
      ? current.map((task) => task.id === editingTask.id ? updatedTask : task)
      : [updatedTask, ...current]);
    setEditingTask(null);
    if (posting) window.location.href = "/job-board";
  };
  const editTask = (task) => {
    setBudgetType(task.budgetType || (task.budgetRange ? "range" : "fixed"));
    setBudgetError("");
    setEditingTask(task);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const deleteTask = (task) => {
    if (!window.confirm(`Delete “${task.title}” and its applications?`)) return;
    setTasks((current) => current.filter((item) => item.id !== task.id));
    setApplications((current) => current.filter((item) => item.taskId !== task.id));
  };
  const apply = (event, task) => {
    event.preventDefault();
    if (task.ownerId === currentUser || task.status !== "Open" || applications.some((item) => item.taskId === task.id && item.applicantId === currentUser)) return;
    setApplications((current) => [...current, { id: Date.now(), taskId: task.id, applicantId: currentUser, applicant: "You", message: message.trim(), status: "Pending" }]);
    setMessage("");
  };
  const review = (application, status) => {
    setApplications((current) => current.map((item) => item.id === application.id ? { ...item, status } : item));
  };
  const cancelApplication = (application) => {
    setApplications((current) => current.filter((item) => item.id !== application.id));
  };

  return <>
    <header className="navbar">
      <Link className="brand" to="/job-board">Local Task Finder</Link>
      <nav className="nav-links">{view === "mine" ? <button className="nav-activity" onClick={() => { setView("board"); navigate("/job-board"); }}>Go Back</button> : <><Link className={!posting ? "nav-current" : "nav-muted"} to="/job-board" onClick={() => setView("board")}>Task Board</Link><Link className={posting ? "nav-current" : "nav-muted"} to="/job-posting" onClick={() => setView("board")}>Post a Task</Link><button className="nav-activity" onClick={() => setView("mine")}>My Activity{applications.some((item) => item.status === "Pending" && tasks.some((task) => task.id === item.taskId && task.ownerId === currentUser)) ? " •" : ""}</button></>}</nav>
    </header>
    <main className="container">
      {showTaskForm ? <section className="panel form-panel"><h1>{editingTask ? "Edit task" : "Post a local task"}</h1><p>Find a hand for a one-day job or local errand.</p>
        <form className="task-form" onSubmit={saveTask}>
          <label>Job title<input name="title" required maxLength="80" placeholder="e.g. Garden cleanup" defaultValue={editingTask?.title || ""} /></label>
          <label>Category<input name="category" required placeholder="e.g. Gardening" defaultValue={editingTask?.category || ""} /></label>
          <label className="wide">Description<textarea name="description" required rows="4" defaultValue={editingTask?.description || ""} /></label>
          <label>General location<input name="location" required placeholder="e.g. Bankerohan, Davao City" defaultValue={editingTask?.location || ""} /></label>
          <label>Schedule<input name="schedule" required placeholder="e.g. Oct 28, 8 AM–12 PM" defaultValue={editingTask?.schedule || ""} /></label>
          <fieldset className="budget-choice wide"><legend>Budget (optional)</legend><div className="budget-options"><label><input type="radio" name="budgetType" checked={budgetType === "fixed"} onChange={() => setBudgetType("fixed")} /> Fixed budget</label><label><input type="radio" name="budgetType" checked={budgetType === "range"} onChange={() => setBudgetType("range")} /> Budget range</label></div>
            {budgetType === "fixed" ? <label>Amount (PHP)<input name="budget" type="number" min="0" step="1" placeholder="e.g. 300" defaultValue={editingTask?.budgetType === "fixed" || (editingTask && !editingTask.budgetType && !editingTask.budgetRange) ? String(editingTask?.budget || "").replace(/[^\d.]/g, "") : ""} /></label> : <div className="budget-range-field"><input name="budgetMin" type="number" min="0" step="1" placeholder="Minimum ₱" aria-label="Minimum budget range in pesos" defaultValue={editingTask?.budgetMin || String(editingTask?.budgetRange || "").split(/[–-]/)[0]?.replace(/[^\d.]/g, "") || ""} /><span>to</span><input name="budgetMax" type="number" min="0" step="1" placeholder="Maximum ₱" aria-label="Maximum budget range in pesos" defaultValue={editingTask?.budgetMax || String(editingTask?.budgetRange || "").split(/[–-]/)[1]?.replace(/[^\d.]/g, "") || ""} /></div>}
          </fieldset>
          <label>Contact details<input name="contact" type="text" required placeholder="Phone or email" defaultValue={editingTask?.contactNo || ""} /></label>
          {budgetError && <p className="form-error wide" role="alert">{budgetError}</p>}
          <div className="form-actions wide"><button className="button" type="submit">{editingTask ? "Save changes" : "Publish task"}</button>{editingTask && <button className="button secondary-button" type="button" onClick={() => setEditingTask(null)}>Cancel</button>}</div>
        </form></section> : <>
        <section className="page-heading"><div><h1>{view === "mine" ? "My activity" : "Local task board"}</h1><p>{view === "mine" ? "Tasks you posted and applications you sent." : "Short-term work and errands in your community."}</p></div></section>
        <section className="panel"><div className="board-toolbar"><div><h2>Available tasks</h2><p>{filtered.length} task{filtered.length === 1 ? "" : "s"} shown</p></div>
          <div className="filters"><span className="search-icon" aria-hidden="true">⌕</span><input aria-label="Search tasks" placeholder="Search tasks" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        </div><div className="task-list">{filtered.map((task) => {
          const ownTask = task.ownerId === currentUser;
          const taskApplications = applications.filter((item) => item.taskId === task.id);
          return <article className="task-card" key={task.id}><h3>{task.title}</h3><span className="category-tag">Wanted: {task.category}</span><p className="task-description">{task.description}</p><div className="task-divider"/><div className="task-meta"><span className="location-meta">📍 {task.location}</span><span><i>◷</i>{task.schedule}</span>{(task.budgetRange || task.budget || task.payment) && <strong><i>₱</i>{String(task.budgetRange || task.budget || task.payment).replace(/^₱/, "")}</strong>}<span className={`status status-${task.status.toLowerCase()}`}>{task.status}</span></div>
            {ownTask && taskApplications.some((item) => item.status === "Pending") && <p className="pending-note">New pending applicants: {taskApplications.filter((item) => item.status === "Pending").length}</p>}
            {view === "mine" && !ownTask && <p className="my-app-status">Your application: {myApplications.find((item) => item.taskId === task.id)?.status} {myApplications.find((item) => item.taskId === task.id)?.status === "Pending" && <button className="cancel-application" onClick={() => cancelApplication(myApplications.find((item) => item.taskId === task.id))}>Cancel application</button>}</p>}
            <button className="button" onClick={() => { setSelected(task); setMessage(""); }}>View details &amp; apply</button>
            {ownTask && <div className="owner-actions"><button onClick={() => editTask(task)}>Edit</button><button onClick={() => deleteTask(task)}>Delete</button></div>}
            {ownTask && taskApplications.length > 0 && <div className="applications"><h4>Applicants</h4>{taskApplications.map((application) => <div className="application" key={application.id}><span><b>{application.applicant || "Applicant"}</b> · {application.message || "No message"} · {application.status}</span>{application.status === "Pending" && <span><button onClick={() => review(application, "Accepted")}>Accept</button> <button onClick={() => review(application, "Rejected")}>Reject</button></span>}</div>)}</div>}
          </article>;
        })}{filtered.length === 0 && <p className="empty-state">No matching tasks found.</p>}</div></section>
        </>}
    </main>
    {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><section className="modal panel" role="dialog" aria-modal="true" aria-labelledby="detail-title" onClick={(event) => event.stopPropagation()}><button className="close-button" onClick={() => setSelected(null)} aria-label="Close">×</button><h2 id="detail-title">{selected.title}</h2><span className="category-tag">Wanted: {selected.category}</span><p className="task-description">{selected.description}</p><div className="task-divider"/><div className="task-meta"><span><i>⌖</i>{selected.location}</span><span><i>◷</i>{selected.schedule}</span>{(selected.budgetRange || selected.budget || selected.payment) && <strong><i>₱</i>{String(selected.budgetRange || selected.budget || selected.payment).replace(/^₱/, "")}</strong>}<span className={`status status-${selected.status.toLowerCase()}`}>{selected.status}</span></div>{selected.contactNo && <p><b>Host contact:</b> {selected.contactNo}</p>}
      {selected.ownerId !== currentUser && selected.status === "Open" && <form onSubmit={(event) => apply(event, selected)}><label>Message to the host<textarea rows="3" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Briefly introduce yourself" /></label><button className="button" disabled={applications.some((item) => item.taskId === selected.id && item.applicantId === currentUser)}> {applications.some((item) => item.taskId === selected.id && item.applicantId === currentUser) ? "Application sent" : "Apply for task"}</button></form>}
      {selected.ownerId === currentUser && <p>You posted this task. Review applicants in My activity.</p>}
      {selected.status !== "Open" && <p>This task is no longer accepting applications.</p>}</section></div>}
    <Footer />
  </>;
}

function App() { return <BrowserRouter><Routes><Route path="*" element={<Marketplace />} /></Routes></BrowserRouter>; }
export default App;
