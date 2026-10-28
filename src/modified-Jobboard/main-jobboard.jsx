import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import sampleUsers from "../sample-data/sample-users.json";
import Footer from "../Footer/main-footer.jsx";
import MainHeader from "../modified-header/main-header.jsx";
import "./main-jobboard.css";


const jobsUrl = "http://localhost:3001/jobs";
const usersById = Object.fromEntries(sampleUsers.map((user) => [user.id, user]));
const sampleApplications = [
  { id: "sample-user-1-application", taskId: "3", applicantId: "user1", applicant: "User 1", message: "I am available to help with the yard cleanup.", status: "Pending" },
  { id: "sample-user-2-application", taskId: "1", applicantId: "user2", applicant: "User 2", message: "I can help with this task.", status: "Pending" },
];
const displayPrice = (price) => String(price)
  .replace(/\s+per\s+(?:\d+(?:\.\d+)?\s*)?hours?\b/gi, "")
  .trim()
  .replace(/(^|[–-])\s*₱?\s*(?=\d)/g, "$1₱");

const readStored = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const normalizeTask = (task) => ({
  ...task,
  category: task.category || task.title,
  location: task.location || task.address,
  schedule: task.schedule || "Schedule to be agreed",
  budget: task.budget || task.payment,
  status: task.status === "Close" ? "Closed" : task.status,
  host: task.host || "Local host",
});

function Marketplace() {
  const [currentUser, setCurrentUser] = useState("user1");
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [taskError, setTaskError] = useState("");
  const [viewingApplicantsFor, setViewingApplicantsFor] = useState(null);
  const [applications, setApplications] = useState(() => readStored("localApplications", [])
    .filter((item) => item.id !== "sample-application")
    .map((item) => ({
      ...item,
      taskId: item.id === "sample-user-1-application" ? "3" : String(item.taskId),
      applicantId: item.applicantId === "demo-user" || item.worker === "Demo worker" ? "user1" : item.applicantId === "sample-user-2" ? "user2" : item.applicantId,
      applicant: item.applicant || (item.worker === "Demo worker" ? "User 1" : "Applicant"),
      status: item.status === "Rejected" ? "Declined" : item.status,
    })));
  const [search, setSearch] = useState("");
  const [view, setView] = useState("board");
  const [applicationFilter, setApplicationFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [editingApplication, setEditingApplication] = useState(null);
  const [message, setMessage] = useState("");
  const [budgetError, setBudgetError] = useState("");
  const [budgetType, setBudgetType] = useState("fixed");
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    fetch(jobsUrl)
      .then((response) => {
        if (!response.ok) throw new Error("Could not load jobs.");
        return response.json();
      })
      .then((jobs) => {
        const loadedTasks = jobs.map(normalizeTask);
        setTasks(loadedTasks);
        if (loadedTasks.some((task) => task.id === "1") && loadedTasks.some((task) => task.id === "3")) {
          setApplications((current) => {
            const missing = sampleApplications.filter((sample) => !current.some((item) => item.id === sample.id));
            return missing.length ? [...current, ...missing] : current;
          });
        }
      })
      .catch(() => setTaskError("Could not connect to the jobs database. Start the JSON server and try again."))
      .finally(() => setTasksLoading(false));
  }, []);
  useEffect(() => localStorage.setItem("localApplications", JSON.stringify(applications)), [applications]);
  const location = useLocation();
  const navigate = useNavigate();
  const posting = location.pathname === "/job-posting";
  const showTaskForm = (posting && view !== "mine") || Boolean(editingTask);
  const myApplications = applications.filter((item) => item.applicantId === currentUser && !item.hidden && !item.archived);
  const postedTasks = tasks.filter((task) => task.ownerID === currentUser);
  const shownApplications = myApplications.filter((item) => applicationFilter === "All" || item.status === applicationFilter);
  const filtered = tasks.filter((task) => {
    const isOwner = task.ownerID === currentUser;
    const hasApplied = myApplications.some((item) => item.taskId === String(task.id));
    const visible = view === "mine" ? isOwner || hasApplied : task.status === "Open" || isOwner || hasApplied;
    return visible && `${task.title} ${task.description} ${task.location}`.toLowerCase().includes(search.toLowerCase());
  });
  const saveTask = async (event) => {
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
    try {
      setTaskError("");
      let id = editingTask?.id;
      if (!editingTask) {
        const jobsResponse = await fetch(jobsUrl);
        if (!jobsResponse.ok) throw new Error("Could not load jobs.");
        const jobs = await jobsResponse.json();
        id = String(Math.max(0, ...jobs.map((task) => Number(task.id) || 0)) + 1);
      }
      const updatedTask = {
        id: String(id),
        title: data.get("title").trim(),
        category: data.get("category").trim(),
        description: data.get("description").trim(),
        address: data.get("location").trim(),
        schedule: data.get("schedule").trim(),
        payment: budget || "₱",
        budgetType,
        budgetMin: minimum,
        budgetMax: maximum,
        status: editingTask ? data.get("status") : "Open",
        ownerID: currentUser,
        contactNo: data.get("contact").trim(),
        email: data.get("email").trim(),
      };
      const response = await fetch(editingTask ? `${jobsUrl}/${editingTask.id}` : jobsUrl, {
        method: editingTask ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTask),
      });
      if (!response.ok) throw new Error("Could not save the job.");
      const savedTask = normalizeTask(await response.json());
      setTasks((current) => editingTask
        ? current.map((task) => task.id === savedTask.id ? savedTask : task)
        : [savedTask, ...current]);
      setEditingTask(null);
      if (posting) window.location.href = "/job-board";
    } catch {
      setTaskError("Could not save the job. Check that the JSON server is running.");
    }
  };
  const editTask = (task) => {
    setBudgetType(task.budgetType || (task.budgetRange ? "range" : "fixed"));
    setBudgetError("");
    setEditingTask(task);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const deleteTask = async (task) => {
    if (!window.confirm(`Delete “${task.title}” and its applications?`)) return;
    try {
      setTaskError("");
      const response = await fetch(`${jobsUrl}/${task.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not delete the job.");
      setTasks((current) => current.filter((item) => item.id !== task.id));
      setApplications((current) => current.filter((item) => item.taskId !== String(task.id)));
    } catch {
      setTaskError("Could not delete the job. Check that the JSON server is running.");
    }
  };
  const apply = (event, task) => {
    event.preventDefault();
    if (task.ownerID === currentUser || task.status !== "Open" || applications.some((item) => item.taskId === String(task.id) && item.applicantId === currentUser)) return;
    setApplications((current) => [...current, { id: Date.now(), taskId: String(task.id), applicantId: currentUser, applicant: usersById[currentUser]?.name || currentUser, message: message.trim(), status: "Pending" }]);
    setMessage("");
  };
  const review = (application, status) => {
    setApplications((current) => current.map((item) => item.id === application.id ? { ...item, status } : item));
  };
  const cancelApplication = (application) => {
    setApplications((current) => current.filter((item) => item.id !== application.id));
  };
  const saveApplication = (event) => {
    event.preventDefault();
    setApplications((current) => current.map((item) => item.id === editingApplication.id ? { ...item, message: message.trim() } : item));
    setEditingApplication(null);
    setSelected(null);
    setMessage("");
  };
  const viewApplication = (application) => {
    const task = tasks.find((item) => String(item.id) === String(application.taskId));
    if (!task) return;
    setSelected(task);
    setEditingApplication(application);
    setMessage(application.message || "");
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
    <MainHeader
      view={view}
      posting={posting}
      editingTask={editingTask}
      onBack={() => { setView("board"); navigate("/job-board"); }}
      onBoard={() => setView("board")}
    />
    <main className="container">
      {taskError && <p className="form-error" role="alert">{taskError}</p>}
      {tasksLoading && <p className="empty-state">Loading jobs…</p>}
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
          <label>Phone / contact number<input name="contact" type="text" required placeholder="e.g. 09xx xxx xxxx" defaultValue={editingTask?.contactNo || ""} /></label>
          <label>Email<input name="email" type="email" placeholder="name@example.com" defaultValue={editingTask?.email || ""} /></label>
          {budgetError && <p className="form-error wide" role="alert">{budgetError}</p>}
          <div className="form-actions wide"><button className="button" type="submit">{editingTask ? "Save changes" : "Publish task"}</button>{editingTask && <button className="button secondary-button" type="button" onClick={() => setEditingTask(null)}>Cancel</button>}</div>
        </form></section> : <>
        <section className="page-heading"><div><h1>{view === "mine" ? "My activity" : "Local Job Board"}</h1><p>{view === "mine" ? "Jobs you posted and applications you sent." : "Short-term work and errands in your community."}</p></div>{view !== "mine" && <div className="heading-actions"><button className="nav-activity" onClick={() => setCurrentUser(currentUser === "user1" ? "user2" : "user1")}>{currentUser === "user1" ? "Switch User 2" : "Switch User 1"}</button><button className="nav-activity" onClick={() => setView("mine")}>My Activity{applications.some((item) => item.status === "Pending" && tasks.some((task) => String(task.id) === String(item.taskId) && task.ownerID === currentUser)) ? " •" : ""}</button></div>}</section>
        {view === "mine" ? <>
          <section className="panel activity-section posted-jobs-section"><div className="board-toolbar"><div><h2>Posted Jobs ({postedTasks.length})</h2><p>Manage jobs you posted.</p></div></div><div className="activity-list">{postedTasks.map((task) => {
            const taskApplications = applications.filter((item) => String(item.taskId) === String(task.id));
            return <article className="activity-row" key={task.id}><div className="posted-job-info"><h3>{task.title}</h3><p>{task.category} · {task.status} · Applicants: {taskApplications.length}</p>
              <button className="view-applicants-button" onClick={() => setViewingApplicantsFor(viewingApplicantsFor === task.id ? null : task.id)}>{viewingApplicantsFor === task.id ? "Hide Applicants" : "View Applicants"}</button>
              {viewingApplicantsFor === task.id && <div className="posted-applicants">{taskApplications.length === 0 ? <p>No applicants yet.</p> : <div className="application-list">{taskApplications.map((application) => <div className="application" key={application.id}><span><b>{application.applicant || "Applicant"}</b> · {application.message || "No message"} · <span className={`status status-${application.status.toLowerCase()}`}>{application.status}</span></span>{application.status === "Pending" && <span><button onClick={() => review(application, "Accepted")}>Accept</button> <button onClick={() => review(application, "Declined")}>Reject</button></span>}</div>)}</div>}</div>}
            </div><div className="owner-actions"><button onClick={() => editTask(task)}>Edit</button><button onClick={() => deleteTask(task)}>Delete</button></div></article>;
          })}{!tasksLoading && !taskError && postedTasks.length === 0 && <p className="empty-state">You have not posted any jobs yet.</p>}</div></section>
          <section className="panel activity-section applications-section"><div className="board-toolbar"><div><h2>My Applications</h2><p>Track jobs you applied for.</p></div><div className="application-filters">{["All", "Pending", "Accepted", "Declined"].map((status) => <button className={applicationFilter === status ? "filter-active" : ""} key={status} onClick={() => setApplicationFilter(status)}>{status}</button>)}</div></div><div className="activity-list">{shownApplications.map((application) => {
            const task = tasks.find((item) => String(item.id) === String(application.taskId));
            if (!task) return null;
            return <article className="activity-row" key={application.id}><div><h3>{task.title}</h3><p>{application.message || "No message"}</p><span className={`status status-${application.status.toLowerCase()}`}>{application.status}</span></div><div className="activity-actions"><button onClick={() => viewApplication(application)}>View</button>{application.status === "Accepted" && <button onClick={() => rateApplication(application)}>{application.rating ? `Rated ${application.rating}/5` : "Rate"}</button>}{application.status === "Pending" && <button onClick={() => cancelApplication(application)}>Cancel Application</button>}{application.status === "Declined" && <><button onClick={() => hideApplication(application)}>Hide</button><button onClick={() => archiveApplication(application)}>Archive</button><button onClick={() => cancelApplication(application)}>Delete</button></>}</div></article>;
          })}{shownApplications.length === 0 && <p className="empty-state">No {applicationFilter.toLowerCase()} applications.</p>}</div></section>
        </> : <section className="panel"><div className="board-toolbar"><div><h2>Available Jobs</h2><p>{filtered.length} job{filtered.length === 1 ? "" : "s"} shown</p></div>
          <label className="search-field"><span className="search-icon" aria-hidden="true">⌕</span><input aria-label="Search jobs" placeholder="Search jobs" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        </div><div className="task-list">{filtered.map((task) => {
          const ownTask = task.ownerID === currentUser;
          const taskApplications = applications.filter((item) => String(item.taskId) === String(task.id));
          const owner = usersById[task.ownerID];
          const posterEmail = task.email || owner?.email || (task.contactNo?.includes("@") ? task.contactNo : "Not provided");
          const posterContact = task.contactNo || owner?.contactNumber || "Not provided";
          return <article className="task-card" key={task.id}><h3>{task.title}</h3><span className="category-tag">Wanted: {task.category}</span><p className="task-description">{task.description}</p><div className="task-divider"/><div className="task-meta"><span className="location-meta">📍 {task.location}</span><span><i>◷</i>{task.schedule}</span>{(task.budgetRange || task.budget || task.payment) && <strong>{displayPrice(task.budgetRange || task.budget || task.payment)}</strong>}<span className={`status status-${task.status.toLowerCase()}`}>{task.status}</span></div>
            <p className="task-email">Email: {posterEmail.includes("@") ? <a href={`mailto:${posterEmail}`}>{posterEmail}</a> : posterEmail}</p>
            <p className="task-email">Contact Number: {posterContact}</p>
            {ownTask && taskApplications.some((item) => item.status === "Pending") && <p className="pending-note">New pending applicants</p>}
            <button className="button" onClick={() => { setSelected(task); setEditingApplication(null); setMessage(""); }}>View details &amp; apply</button>
          </article>;
        })}{!tasksLoading && !taskError && filtered.length === 0 && <p className="empty-state">No matching jobs found.</p>}</div></section>}
        </>}
    </main>
    {selected && <div className="modal-backdrop" onClick={() => { setSelected(null); setEditingApplication(null); }}><section className="modal panel" role="dialog" aria-modal="true" aria-labelledby="detail-title" onClick={(event) => event.stopPropagation()}><button className="close-button" onClick={() => { setSelected(null); setEditingApplication(null); }} aria-label="Close">×</button><h2 id="detail-title">{editingApplication ? `Application: ${selected.title}` : selected.title}</h2><span className="category-tag">Wanted: {selected.category}</span><p className="task-description">{selected.description}</p><div className="task-divider"/><div className="task-meta"><span><i>⌖</i>{selected.location}</span><span><i>◷</i>{selected.schedule}</span>{(selected.budgetRange || selected.budget || selected.payment) && <strong>{displayPrice(selected.budgetRange || selected.budget || selected.payment)}</strong>}<span className={`status status-${selected.status.toLowerCase()}`}>{selected.status}</span></div><p><b>Host contact:</b> {selected.contactNo || usersById[selected.ownerID]?.contactNumber || "Not provided"}</p>
      {!editingApplication && selected.ownerID !== currentUser && selected.status === "Open" && <form onSubmit={(event) => apply(event, selected)}><label>Message to the host<textarea rows="3" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Briefly introduce yourself" /></label><button className="button" disabled={applications.some((item) => String(item.taskId) === String(selected.id) && item.applicantId === currentUser)}> {applications.some((item) => String(item.taskId) === String(selected.id) && item.applicantId === currentUser) ? "Application sent" : "Apply for task"}</button></form>}
      {editingApplication && <form onSubmit={saveApplication}><label>Your application message<textarea rows="3" value={message} onChange={(event) => setMessage(event.target.value)} /></label><p>Status: {editingApplication.status}</p><div className="form-actions"><button className="button" type="submit">Save changes</button><button className="button secondary-button" type="button" onClick={() => { setEditingApplication(null); setSelected(null); }}>Cancel</button></div></form>}
      {selected.ownerID === currentUser && <p>You posted this job. Review applicants in My Activity.</p>}
      {selected.status !== "Open" && <p>This job is no longer accepting applications.</p>}</section></div>}
    <Footer />
  </>;
}

function App() { return <BrowserRouter><Routes><Route path="*" element={<Marketplace />} /></Routes></BrowserRouter>; }
export default App;
