export async function fetchStudentsByYear(year: string, status: "pending" | "verified" | "rejected") {
    let endpoint = ""
      
    switch (status) {
      case "pending":
        endpoint = `/adminrole/students/pending?class_name=${year}`
        break
      case "verified":
        endpoint = `/adminrole/students/verified?class_name=${year}`
        break
      case "rejected":
        endpoint = `/adminrole/students/rejected?class_name=${year}`
        break
    }
      
    const response = await fetch(endpoint)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${status} students`)
    }
      
    return await response.json()
  }
  
  export async function fetchStudentDetails(rollNo: string) {
    const response = await fetch(`/adminrole/students/${rollNo}/`)
    if (!response.ok) {
      throw new Error("Failed to fetch student details")
    }
      
    return await response.json()
  }
  
  export async function updateStudentStatus(
    rollNo: string,
    verified: boolean,
    currentStatus: boolean | null,
    reason?: string,
  ) {
    let endpoint = ""
      
    if (currentStatus === null) {
      endpoint = "/adminrole/students/pending/"
    } else if (currentStatus === true && !verified) {
      endpoint = "/adminrole/students/verified/"
    } else if (currentStatus === false && verified) {
      endpoint = "/adminrole/students/rejected/"
    } else {
      throw new Error("Invalid status transition")
    }
      
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roll_no: rollNo,
        verified,
        reason,
      }),
    })
      
    if (!response.ok) {
      throw new Error(`Failed to ${verified ? "verify" : "reject"} student`)
    }
      
    return await response.json()
  }