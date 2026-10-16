import jobs from "./TableData.json";
import "./App.css";

function App() {
  const openJobs = jobs.filter((job) => job.status === "Open").length;

  return (
    <main className="container">
      <header className="page-header">
        <h1>Local Job Finder</h1>
        <p>Browse job opportunities available in your area.</p>
      </header>

      <section className="table-card">
        <div className="table-toolbar">
          <h2>Available Jobs</h2>
          <p>
            {jobs.length} job{jobs.length === 1 ? "" : "s"} listed, {openJobs}{" "}
            open
          </p>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Company</th>
                <th>Location</th>
                <th>Job Type</th>
                <th>Salary</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length > 0 ? (
                jobs.map((job) => (
                  <tr key={job.id}>
                    <td className="cell-title">{job.title}</td>
                    <td>{job.company}</td>
                    <td>{job.location}</td>
                    <td>{job.jobType}</td>
                    <td className="cell-salary">{job.salary}</td>
                    <td>
                      <span
                        className={`status status-${job.status.toLowerCase()}`}
                      >
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="empty-state" colSpan="6">
                    No jobs listed yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default App;
