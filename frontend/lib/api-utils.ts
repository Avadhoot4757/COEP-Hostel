import api from "@/lib/api";

export async function fetchStudentsByYear(year: string, status: "pending" | "verified" | "rejected") {
  let endpoint = "";
  
  switch (status) {
    case "pending":
      endpoint = `/adminrole/students/pending/?class_name=${year}`;
      break;
    case "verified":
      endpoint = `/adminrole/students/verified/?class_name=${year}`;
      break;
    case "rejected":
      endpoint = `/adminrole/students/rejected/?class_name=${year}`;
      break;
  }
  
  try {
    const response = await api.get(endpoint);
    return response.data.data;
  } catch (error) {
    throw new Error(`Failed to fetch ${status} students`);
  }
}

export async function fetchStudentDetails(rollNo: string) {
  try {
    const response = await api.get(`/adminrole/students/${rollNo}/`);
    return response.data.data;
  } catch (error) {
    throw new Error("Failed to fetch student details");
  }
}

export async function updateStudentStatus(
  rollNo: string,
  verified: boolean,
  currentStatus: boolean | null,
  reason?: string,
) {
  let endpoint = "";
  
  if (currentStatus === null) {
    endpoint = "/adminrole/students/pending/";
  } else if (currentStatus === true && !verified) {
    endpoint = "/adminrole/students/verified/";
  } else if (currentStatus === false && verified) {
    endpoint = "/adminrole/students/rejected/";
  } else {
    throw new Error("Invalid status transition");
  }
  
  try {
    const response = await api.post(endpoint, {
      roll_no: rollNo,
      verified,
      reason,
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to ${verified ? "verify" : "reject"} student`);
  }
}
