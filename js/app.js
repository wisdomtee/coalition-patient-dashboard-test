// Coalition Technologies Patient Data API

const API_URL =
    "https://fedskillstest.coalitiontechnologies.workers.dev";

const API_USERNAME = "coalition";
const API_PASSWORD = "skills-test";

let bloodPressureChart = null;


// ==========================================
// API AUTHENTICATION
// ==========================================

const authHeader =
    "Basic " + btoa(`${API_USERNAME}:${API_PASSWORD}`);


// ==========================================
// FETCH PATIENTS
// ==========================================

async function fetchPatients() {

    try {

        const response = await fetch(API_URL, {
            method: "GET",
            headers: {
                Authorization: authHeader,
                Accept: "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(
                `API request failed: ${response.status}`
            );
        }

        const patients = await response.json();

        console.log("Patients received:", patients);

        // Find Jessica Taylor
        const jessica = patients.find(
            patient =>
                patient.name &&
                patient.name.toLowerCase() === "jessica taylor"
        );

        if (!jessica) {
            throw new Error("Jessica Taylor was not found.");
        }

        console.log("Jessica Taylor:", jessica);

        // Populate dashboard
        populatePatient(jessica);

    } catch (error) {

        console.error(
            "Unable to load patient data:",
            error
        );

    }
}


// ==========================================
// POPULATE PATIENT
// ==========================================

function populatePatient(patient) {

    populatePatientProfile(patient);

    populateVitals(patient);

    populateDiagnosisHistory(patient);

    populateDiagnosticList(patient);

    populateLabResults(patient);

    populatePatientsSidebar(patient);
}


// ==========================================
// PATIENT PROFILE
// ==========================================

function populatePatientProfile(patient) {

    setText(
        "patient-name",
        patient.name
    );

    setText(
        "date-of-birth",
        patient.date_of_birth
    );

    setText(
        "gender",
        patient.gender
    );

    setText(
        "contact-info",
        patient.phone_number
    );

    setText(
        "emergency-contact",
        patient.emergency_contact
    );

    setText(
        "insurance-provider",
        patient.insurance_type
    );


    // Patient photo

    const photo = document.querySelector(
        "#patient-photo img"
    );

    if (photo && patient.profile_picture) {

        photo.src = patient.profile_picture;

        photo.alt = patient.name;

    }
}


// ==========================================
// VITAL SIGNS
// ==========================================

function populateVitals(patient) {

    if (
        !patient.diagnosis_history ||
        patient.diagnosis_history.length === 0
    ) {
        return;
    }


    // Latest record

    const latest =
        patient.diagnosis_history[
            patient.diagnosis_history.length - 1
        ];


    // Blood pressure

    const systolic =
        latest.blood_pressure?.systolic?.value ??
        latest.blood_pressure?.systolic ??
        "--";


    const diastolic =
        latest.blood_pressure?.diastolic?.value ??
        latest.blood_pressure?.diastolic ??
        "--";


    setText(
        "systolic-value",
        systolic
    );


    setText(
        "diastolic-value",
        diastolic
    );


    // Respiratory rate

    const respiratoryRate =
        latest.respiratory_rate?.value ??
        latest.respiratory_rate ??
        "--";


    setText(
        "respiratory-rate",
        `${respiratoryRate} bpm`
    );


    // Temperature

    const temperature =
        latest.temperature?.value ??
        latest.temperature ??
        "--";


    setText(
        "temperature",
        `${temperature}°F`
    );


    // Heart rate

    const heartRate =
        latest.heart_rate?.value ??
        latest.heart_rate ??
        "--";


    setText(
        "heart-rate",
        `${heartRate} bpm`
    );
}


// ==========================================
// DIAGNOSIS HISTORY
// ==========================================

function populateDiagnosisHistory(patient) {

    if (
        !patient.diagnosis_history ||
        patient.diagnosis_history.length === 0
    ) {
        return;
    }


    createBloodPressureChart(
        patient.diagnosis_history
    );
}


// ==========================================
// DIAGNOSTIC LIST
// ==========================================

function populateDiagnosticList(patient) {

    const container =
        document.getElementById("diagnostic-list");


    if (
        !container ||
        !patient.diagnostic_list
    ) {
        return;
    }


    container.innerHTML = "";


    patient.diagnostic_list.forEach(
        diagnostic => {

            const row =
                document.createElement("tr");


            row.innerHTML = `
                <td>${diagnostic.name || "--"}</td>
                <td>${diagnostic.description || "--"}</td>
                <td>${diagnostic.status || "--"}</td>
            `;


            container.appendChild(row);

        }
    );
}


// ==========================================
// LAB RESULTS
// ==========================================

function populateLabResults(patient) {

    const container =
        document.getElementById("lab-results");


    if (
        !container ||
        !patient.lab_results
    ) {
        return;
    }


    container.innerHTML = "";


    patient.lab_results.forEach(
        lab => {

            const item =
                document.createElement("div");


            item.className =
                "lab-result-item";


            const labName =
                typeof lab === "string"
                    ? lab
                    : lab.name || lab.result || "--";


            item.textContent = labName;


            container.appendChild(item);

        }
    );
}


// ==========================================
// PATIENT SIDEBAR
// ==========================================

function populatePatientsSidebar(patient) {

    const container =
        document.getElementById("patients-list");


    if (!container) {
        return;
    }


    // The FED test asks us to display Jessica Taylor.

    container.innerHTML = "";


    const patientItem =
        document.createElement("div");


    patientItem.className =
        "patient-item active";


    patientItem.innerHTML = `
        <img
            src="${patient.profile_picture || ""}"
            alt="${patient.name}"
        >

        <div class="patient-item-info">
            <strong>${patient.name}</strong>
            <span>
                ${patient.gender || ""}, ${patient.age || ""}
            </span>
        </div>
    `;


    container.appendChild(patientItem);
}


// ==========================================
// BLOOD PRESSURE CHART
// ==========================================

function createBloodPressureChart(history) {

    const canvas =
        document.getElementById(
            "bloodPressureChart"
        );


    if (!canvas) {

        console.error(
            "Blood pressure canvas was not found."
        );

        return;
    }


    if (!window.Chart) {

        console.error(
            "Chart.js has not loaded."
        );

        return;
    }


    const labels =
        history.map(
            record =>
                `${record.month} ${record.year}`
        );


    const systolicData =
        history.map(
            record =>
                record.blood_pressure
                    ?.systolic
                    ?.value ??
                record.blood_pressure
                    ?.systolic ??
                null
        );


    const diastolicData =
        history.map(
            record =>
                record.blood_pressure
                    ?.diastolic
                    ?.value ??
                record.blood_pressure
                    ?.diastolic ??
                null
        );


    // Destroy previous chart if one exists

    if (bloodPressureChart) {

        bloodPressureChart.destroy();

    }


    bloodPressureChart =
        new Chart(canvas, {

            type: "line",

            data: {

                labels: labels,

                datasets: [

                    {
                        label: "Systolic",

                        data: systolicData,

                        borderWidth: 2,

                        tension: 0.4,

                        fill: false,

                        pointRadius: 4
                    },

                    {
                        label: "Diastolic",

                        data: diastolicData,

                        borderWidth: 2,

                        tension: 0.4,

                        fill: false,

                        pointRadius: 4
                    }

                ]

            },


            options: {

                responsive: true,

                maintainAspectRatio: false,


                plugins: {

                    legend: {

                        display: true

                    }

                },


                scales: {

                    y: {

                        beginAtZero: false

                    }

                }

            }

        });
}


// ==========================================
// HELPER
// ==========================================

function setText(id, value) {

    const element =
        document.getElementById(id);


    if (!element) {
        return;
    }


    element.textContent =
        value !== undefined &&
        value !== null &&
        value !== ""
            ? value
            : "--";
}


// ==========================================
// START APPLICATION
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        fetchPatients();

    }
);