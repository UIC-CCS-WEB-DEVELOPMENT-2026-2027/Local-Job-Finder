import { useEffect, useState } from "react";
import { BrowserRouter, Link, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import initialTasks from "../modified-Jobboard/job-data.json";
import Footer from "../Footer/main-footer.jsx";
import "./my-activity.css";

const currentUser = "demo-user";

const readStored = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const loadTasks = () => {
  const saved = readStored("localTasks", null);
  const loaded = saved || [...initialTasks];
  if (!localStorage.getItem("cleanObsoleteJobSamples")) {
    for (let index = loaded.length - 1; index >= 0; index -= 1) {
      if (["Cook", "Help move furniture"].includes(loaded[index].title)) loaded.splice(index, 1);
    }
    initialTasks.forEach((sample) => {
      if (!loaded.some((task) => task.title === sample.title)) {
        const id = loaded.some((task) => task.id === sample.id)
          ? Math.max(0, ...loaded.map((task) => Number(task.id) || 0)) + 1
          : sample.id;
        loaded.push({ ...sample, id });
      }
    });
    localStorage.setItem("cleanObsoleteJobSamples", "true");
  }
  return loaded.map((task) => ({
    ...task,
    category: task.category || task.title,
    location: task.location || task.address,
    schedule: task.schedule || "Schedule to be agreed",
    budget: task.budget || task.payment,
    status: task.status === "Close" ? "Closed" : task.status,
    host: task.host || "Local host",
    ownerId: task.ownerId || (task.host === "Demo host" || initialTasks.some((sample) => sample.id === task.id) || (task.id === 1 && task.title === "Remove Grass Weeds") ? currentUser : undefined),
  }));
};

function Marketplace() {
  const [tasks, setTasks] = useState(loadTasks);
  const [applications, setApplications] = useState(() => {
    const saved = readStored("localApplications", []);
    if (!localStorage.getItem("demoApplicantSeeded")) {
      localStorage.setItem("demoApplicantSeeded", "true");
      const sampleTask = tasks.find((task) => task.ownerId === currentUser && ["Gardener", "Cleaner"].includes(task.title));
      if (sampleTask && !saved.some((item) => item.applicantId === "demo-applicant" && item.taskId === sampleTask.id)) {
        saved.push({ id: "sample-application", taskId: sampleTask.id, applicantId: "demo-applicant", applicant: "Demo Applicant", message: "I have experience and am available to help.", status: "Pending" });
        localStorage.setItem("localApplications", JSON.stringify(saved));
      }
    }
    return saved.map((item) => ({
      ...item,
      applicantId: item.applicantId || (item.worker === "Demo worker" ? currentUser : undefined),
      applicant: item.applicant || (item.worker === "Demo worker" ? "You" : "Applicant"),
      status: item.status === "Rejected" ? "Declined" : item.status,
    }));
  });
  const [search, setSearch] = useState("");
  const [view, setView] = useState("board");
  const [applicationFilter, setApplicationFilter] = useState("All");
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
  const myApplications = applications.filter((item) => item.applicantId === currentUser && !item.hidden && !item.archived);
  const postedTasks = tasks.filter((task) => task.ownerId === currentUser);
  const shownApplications = myApplications.filter((item) => applicationFilter === "All" || item.status === applicationFilter);
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
      contactNo: data.get("contact").trim(), status: editingTask ? data.get("status") : "Open", ownerId: currentUser,
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
  const hideApplication = (application) => {
    setApplications((current) => current.map((item) => item.id === application.id ? { ...item, hidden: true } : item));
  };
  const archiveApplication = (application) => {
    setApplications((current) => current.map((item) => item.id === application.id ? { ...item, archived: true } : item));
  };
  const rateApplication = (application) => {
    const rating = Number(window.prompt("Rate this task from 1 to 5:"));
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) return;
    setApplications((current) => current.map((item) => item.id === application.id ? { ...item, rating } : item));
  };

  return <>
    <header className="navbar">
      <Link className="brand" to="/job-board">Local Job Finder</Link>
      <nav className="nav-links">{view === "mine" ? !editingTask && <button className="nav-activity" onClick={() => { setView("board"); navigate("/job-board"); }}>Go Back</button> : <><Link className={!posting ? "nav-current" : "nav-muted"} to="/job-board" onClick={() => setView("board")}>Job Board</Link><Link className={posting ? "nav-current" : "nav-muted"} to="/job-posting" onClick={() => setView("board")}>Post a Job</Link><button className="nav-activity" onClick={() => setView("mine")}>My Activity{applications.some((item) => item.status === "Pending" && tasks.some((task) => task.id === item.taskId && task.ownerId === currentUser)) ? " •" : ""}</button></>}</nav>
    </header>
    <main className="container">
      {showTaskForm ? <section className="panel form-panel"><h1>{editingTask ? "Edit Job" : "Post a local Job"}</h1><p>Find a hand for a one-day job or local errand.</p>
        <form className="task-form" onSubmit={saveTask}>
          <label>Task title<input name="title" required maxLength="80" placeholder="e.g. Garden cleanup" defaultValue={editingTask?.title || ""} /></label>
          <label>Category<input name="category" required placeholder="e.g. Gardening" defaultValue={editingTask?.category || ""} /></label>
          <label className="wide">Description<textarea name="description" required rows="4" defaultValue={editingTask?.description || ""} /></label>
          <label>General location<input name="location" required placeholder="e.g. Bankerohan, Davao City" defaultValue={editingTask?.location || ""} /></label>
          <label>Schedule<input name="schedule" required placeholder="e.g. Oct 28, 8 AM–12 PM" defaultValue={editingTask?.schedule || ""} /></label>
          {editingTask && <label>Task status<select name="status" defaultValue={editingTask.status}><option>Open</option><option>Closed</option></select></label>}
          <fieldset className="budget-choice wide"><legend>Budget (optional)</legend><div className="budget-options"><label><input type="radio" name="budgetType" checked={budgetType === "fixed"} onChange={() => setBudgetType("fixed")} /> Fixed budget</label><label><input type="radio" name="budgetType" checked={budgetType === "range"} onChange={() => setBudgetType("range")} /> Budget range</label></div>
            {budgetType === "fixed" ? <label>Amount (PHP)<input name="budget" type="number" min="0" step="1" placeholder="e.g. 300" defaultValue={editingTask?.budgetType === "fixed" || (editingTask && !editingTask.budgetType && !editingTask.budgetRange) ? String(editingTask?.budget || "").replace(/[^\d.]/g, "") : ""} /></label> : <div className="budget-range-field"><input name="budgetMin" type="number" min="0" step="1" placeholder="Minimum ₱" aria-label="Minimum budget range in pesos" defaultValue={editingTask?.budgetMin || String(editingTask?.budgetRange || "").split(/[–-]/)[0]?.replace(/[^\d.]/g, "") || ""} /><span>to</span><input name="budgetMax" type="number" min="0" step="1" placeholder="Maximum ₱" aria-label="Maximum budget range in pesos" defaultValue={editingTask?.budgetMax || String(editingTask?.budgetRange || "").split(/[–-]/)[1]?.replace(/[^\d.]/g, "") || ""} /></div>}
          </fieldset>
          <label>Contact details<input name="contact" type="text" required placeholder="Phone or email" defaultValue={editingTask?.contactNo || ""} /></label>
          {budgetError && <p className="form-error wide" role="alert">{budgetError}</p>}
          <div className="form-actions wide"><button className="button" type="submit">{editingTask ? "Save changes" : "Publish task"}</button>{editingTask && <button className="button secondary-button" type="button" onClick={() => setEditingTask(null)}>Cancel</button>}</div>
        </form></section> : <>
        <section className="page-heading"><div><h1>{view === "mine" ? "My activity" : "Local Job Board"}</h1><p>{view === "mine" ? "Jobs you posted and applications you sent." : "Short-term work and errands in your community."}</p></div></section>
        {view === "mine" ? <>
          <section className="panel activity-section"><div className="board-toolbar"><div><h2>Posted Jobs ({postedTasks.length})</h2><p>Manage jobs you posted.</p></div></div><div className="activity-list">{postedTasks.map((task) => <article className="activity-row" key={task.id}><div><h3>{task.title}</h3><p>{task.category} · {task.status}</p></div><div className="owner-actions"><button onClick={() => editTask(task)}>Edit</button><button onClick={() => deleteTask(task)}>Delete</button></div></article>)}{postedTasks.length === 0 && <p className="empty-state">You have not posted any jobs yet.</p>}</div></section>
          <section className="panel activity-section"><div className="board-toolbar"><div><h2>My applications</h2><p>Track jobs you applied for.</p></div><div className="application-filters">{["All", "Pending", "Accepted", "Declined"].map((status) => <button className={applicationFilter === status ? "filter-active" : ""} key={status} onClick={() => setApplicationFilter(status)}>{status}</button>)}</div></div><div className="activity-list">{shownApplications.map((application) => {
            const task = tasks.find((item) => item.id === application.taskId);
            if (!task) return null;
            return <article className="activity-row" key={application.id}><div><h3>{task.title}</h3><p>{application.message || "No message"}</p><span className={`status status-${application.status.toLowerCase()}`}>{application.status}</span></div><div className="activity-actions">{application.status === "Accepted" && <button onClick={() => rateApplication(application)}>{application.rating ? `Rated ${application.rating}/5` : "Rate"}</button>}{application.status === "Pending" && <button onClick={() => cancelApplication(application)}>Cancel application</button>}{application.status === "Declined" && <><button onClick={() => hideApplication(application)}>Hide</button><button onClick={() => archiveApplication(application)}>Archive</button><button onClick={() => cancelApplication(application)}>Delete</button></>}</div></article>;
          })}{shownApplications.length === 0 && <p className="empty-state">No {applicationFilter.toLowerCase()} applications.</p>}</div></section>
        </> : <section className="panel"><div className="board-toolbar"><div><h2>Available Jobs</h2><p>{filtered.length} job{filtered.length === 1 ? "" : "s"} shown</p></div>
          <label className="search-field"><span className="search-icon" aria-hidden="true">⌕</span><input aria-label="Search jobs" placeholder="Search jobs" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        </div><div className="task-list">{filtered.map((task) => {
          const ownTask = task.ownerId === currentUser;
          const taskApplications = applications.filter((item) => item.taskId === task.id);
          return <article className="task-card" key={task.id}><h3>{task.title}</h3><span className="category-tag">Wanted: {task.category}</span><p className="task-description">{task.description}</p><div className="task-divider"/><div className="task-meta"><span className="location-meta">📍 {task.location}</span><span><i>◷</i>{task.schedule}</span>{(task.budgetRange || task.budget || task.payment) && <strong><i>₱</i>{String(task.budgetRange || task.budget || task.payment).replace(/^₱/, "")}</strong>}<span className={`status status-${task.status.toLowerCase()}`}>{task.status}</span></div>
            {ownTask && taskApplications.some((item) => item.status === "Pending") && <p className="pending-note">New pending applicants: {taskApplications.filter((item) => item.status === "Pending").length}</p>}
            <button className="button" onClick={() => { setSelected(task); setMessage(""); }}>View details &amp; apply</button>
            {ownTask && taskApplications.length > 0 && <details className="applications"><summary>Applicants ({taskApplications.length})</summary><div className="application-list">{taskApplications.map((application) => <div className="application" key={application.id}><span><b>{application.applicant || "Applicant"}</b> · {application.message || "No message"} · {application.status}</span>{application.status === "Pending" && <span><button onClick={() => review(application, "Accepted")}>Accept</button> <button onClick={() => review(application, "Declined")}>Reject</button></span>}</div>)}</div></details>}
          </article>;
        })}{filtered.length === 0 && <p className="empty-state">No matching jobs found.</p>}</div></section>}
        </>}
    </main>
    {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><section className="modal panel" role="dialog" aria-modal="true" aria-labelledby="detail-title" onClick={(event) => event.stopPropagation()}><button className="close-button" onClick={() => setSelected(null)} aria-label="Close">×</button><h2 id="detail-title">{selected.title}</h2><span className="category-tag">Wanted: {selected.category}</span><p className="task-description">{selected.description}</p><div className="task-divider"/><div className="task-meta"><span><i>⌖</i>{selected.location}</span><span><i>◷</i>{selected.schedule}</span>{(selected.budgetRange || selected.budget || selected.payment) && <strong><i>₱</i>{String(selected.budgetRange || selected.budget || selected.payment).replace(/^₱/, "")}</strong>}<span className={`status status-${selected.status.toLowerCase()}`}>{selected.status}</span></div>{selected.contactNo && <p><b>Host contact:</b> {selected.contactNo}</p>}
      {selected.ownerId !== currentUser && selected.status === "Open" && <form onSubmit={(event) => apply(event, selected)}><label>Message to the host<textarea rows="3" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Briefly introduce yourself" /></label><button className="button" disabled={applications.some((item) => item.taskId === selected.id && item.applicantId === currentUser)}> {applications.some((item) => item.taskId === selected.id && item.applicantId === currentUser) ? "Application sent" : "Apply for task"}</button></form>}
      {selected.ownerId === currentUser && <p>You posted this job. Review applicants in My Activity.</p>}
      {selected.status !== "Open" && <p>This job is no longer accepting applications.</p>}</section></div>}
    <Footer />
  </>;
}

function App() { return <BrowserRouter><Routes><Route path="*" element={<Marketplace />} /></Routes></BrowserRouter>; }
export default App;
