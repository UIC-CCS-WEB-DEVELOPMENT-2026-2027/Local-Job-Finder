import jobs from "./TableData.json";
import "./JobBoard.css";
import NavBar from "/src/NavBar/NavBar.jsx"

function JobBoard() {
  const openJobs = jobs.filter((job) => job.status === "Open").length;

  return (
    <>
    <NavBar active = {"Hunter"} />

    <main className="container">

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
                <th>Contact No.</th>
                <th>Email</th>
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
                      <a
                        className="cell-link"
                        href={`tel:${job.contactNo.replace(/\s+/g, "")}`}
                      >
                        {job.contactNo}
                      </a>
                    </td>
                    <td>
                      <a className="cell-link" href={`mailto:${job.email}`}>
                        {job.email}
                      </a>
                    </td>
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
                  <td className="empty-state" colSpan="8">
                    No jobs listed yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
    </>
  );
}

export default JobBoard;
