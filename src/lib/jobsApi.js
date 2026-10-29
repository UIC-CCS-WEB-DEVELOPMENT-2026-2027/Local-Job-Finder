import { isSupabaseConfigured, supabase } from "./supabase";

const localJobsUrl =
  import.meta.env.VITE_JOBS_API_URL || "http://localhost:3001/jobs";

const toAppJob = (row) => ({
  id: String(row.id),
  title: row.title,
  category: row.category || row.title,
  description: row.description || "",
  address: row.address || "",
  location: row.address || row.location || "",
  schedule: row.schedule || "Schedule to be agreed",
  payment: row.payment || "",
  budget: row.payment || row.budget || "",
  budgetType: row.budget_type ?? row.budgetType ?? "fixed",
  budgetMin: row.budget_min ?? row.budgetMin ?? "",
  budgetMax: row.budget_max ?? row.budgetMax ?? "",
  status: row.status === "Close" ? "Closed" : row.status || "Open",
  ownerID: row.owner_id ?? row.ownerID ?? "",
  contactNo: row.contact_no ?? row.contactNo ?? "",
  email: row.email || "",
  host: row.host || "Local host",
});

const toDbJob = (job) => ({
  title: job.title,
  category: job.category,
  description: job.description,
  address: job.address,
  schedule: job.schedule,
  payment: job.payment,
  budget_type: job.budgetType,
  budget_min: job.budgetMin || null,
  budget_max: job.budgetMax || null,
  status: job.status,
  owner_id: job.ownerID || null,
  contact_no: job.contactNo,
  email: job.email || null,
});

export async function fetchJobs() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(toAppJob);
  }

  const response = await fetch(localJobsUrl);
  if (!response.ok) throw new Error("Could not load jobs.");
  return (await response.json()).map(toAppJob);
}

export async function createJob(job) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("jobs")
      .insert(toDbJob(job))
      .select()
      .single();
    if (error) throw error;
    return toAppJob(data);
  }

  const jobsResponse = await fetch(localJobsUrl);
  if (!jobsResponse.ok) throw new Error("Could not load jobs.");
  const jobs = await jobsResponse.json();
  const id =
    job.id ||
    String(Math.max(0, ...jobs.map((task) => Number(task.id) || 0)) + 1);

  const response = await fetch(localJobsUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: job.title,
      category: job.category,
      description: job.description,
      address: job.address,
      schedule: job.schedule,
      payment: job.payment,
      budgetType: job.budgetType,
      budgetMin: job.budgetMin,
      budgetMax: job.budgetMax,
      status: job.status,
      ownerID: job.ownerID,
      contactNo: job.contactNo,
      email: job.email,
      id: String(id),
    }),
  });
  if (!response.ok) throw new Error("Could not save the job.");
  return toAppJob(await response.json());
}

export async function updateJob(id, job) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("jobs")
      .update(toDbJob(job))
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return toAppJob(data);
  }

  const response = await fetch(`${localJobsUrl}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...job,
      id: String(id),
      ownerID: job.ownerID,
      contactNo: job.contactNo,
      budgetType: job.budgetType,
      budgetMin: job.budgetMin,
      budgetMax: job.budgetMax,
    }),
  });
  if (!response.ok) throw new Error("Could not save the job.");
  return toAppJob(await response.json());
}

export async function deleteJob(id) {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) throw error;
    return;
  }

  const response = await fetch(`${localJobsUrl}/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Could not delete the job.");
}
