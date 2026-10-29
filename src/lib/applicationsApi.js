import { isSupabaseConfigured, supabase } from "./supabase";

const STORAGE_KEY = "localApplications";

const readLocal = () => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
};

const writeLocal = (items) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

const toAppApplication = (row) => ({
  id: row.id,
  taskId: String(row.task_id ?? row.taskId),
  applicantId: row.applicant_id ?? row.applicantId,
  applicant: row.applicant || "Applicant",
  message: row.message || "",
  status: row.status === "Rejected" ? "Declined" : row.status || "Pending",
  rating: row.rating ?? null,
  hidden: Boolean(row.hidden),
  archived: Boolean(row.archived),
});

const toDbApplication = (item) => ({
  task_id: item.taskId,
  applicant_id: item.applicantId,
  applicant: item.applicant,
  message: item.message || "",
  status: item.status || "Pending",
  rating: item.rating ?? null,
  hidden: Boolean(item.hidden),
  archived: Boolean(item.archived),
});

export async function fetchApplications() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(toAppApplication);
  }
  return readLocal().map(toAppApplication);
}

export async function createApplication(item) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("applications")
      .insert(toDbApplication(item))
      .select()
      .single();
    if (error) throw error;
    return toAppApplication(data);
  }

  const next = { ...item, id: item.id || Date.now() };
  const all = [...readLocal(), next];
  writeLocal(all);
  return toAppApplication(next);
}

export async function updateApplication(id, patch) {
  if (isSupabaseConfigured) {
    const dbPatch = {};
    if (patch.message !== undefined) dbPatch.message = patch.message;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.rating !== undefined) dbPatch.rating = patch.rating;
    if (patch.hidden !== undefined) dbPatch.hidden = patch.hidden;
    if (patch.archived !== undefined) dbPatch.archived = patch.archived;
    if (patch.applicant !== undefined) dbPatch.applicant = patch.applicant;

    const { data, error } = await supabase
      .from("applications")
      .update(dbPatch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return toAppApplication(data);
  }

  const all = readLocal().map((item) =>
    String(item.id) === String(id) ? { ...item, ...patch } : item,
  );
  writeLocal(all);
  return toAppApplication(all.find((item) => String(item.id) === String(id)));
}

export async function deleteApplication(id) {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from("applications").delete().eq("id", id);
    if (error) throw error;
    return;
  }

  writeLocal(readLocal().filter((item) => String(item.id) !== String(id)));
}

export async function deleteApplicationsForTask(taskId) {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from("applications")
      .delete()
      .eq("task_id", taskId);
    if (error) throw error;
    return;
  }

  writeLocal(
    readLocal().filter((item) => String(item.taskId) !== String(taskId)),
  );
}
