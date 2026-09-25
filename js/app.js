// ==========================================
// COALITION TECHNOLOGIES PATIENT DASHBOARD
// ==========================================

// API
const API_URL =
    "https://fedskillstest.coalitiontechnologies.workers.dev";

const API_USERNAME = "coalition";
const API_PASSWORD = "skills-test";

let bloodPressureChart = null;
let allPatients = [];
let selectedPatient = null;


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

        if (!Array.isArray(patients) || patients.length === 0) {
            throw new Error(
                "No patient data was returned from the API."
            );
        }

        allPatients = patients;

        populatePatientsSidebar(patients);

        const jessica = patients.find(
            patient =>
                patient.name &&
                patient.name.toLowerCase() === "jessica taylor"
        );

        const initialPatient =
            jessica || patients[0];

        console.log(
            "Initial patient:",
            initialPatient
        );

        selectPatient(initialPatient);

    } catch (error) {

        console.error(
            "Unable to load patient data:",
            error
        );

        showError(
            "Unable to load patient information. Please refresh the page."
        );
    }
}


// ==========================================
// SELECT PATIENT
// ==========================================

function selectPatient(patient) {

    if (!patient) {
        return;
    }

    selectedPatient = patient;

    console.log(
        "Selected patient:",
        patient.name
    );

    setActivePatient(patient);

    populatePatient(patient);
}


// ==========================================
// POPULATE PATIENT
// ==========================================

function populatePatient(patient) {

    if (!patient) {
        return;
    }

    populatePatientProfile(patient);

    populateVitals(patient);

    populateDiagnosisHistory(patient);

    populateDiagnosticList(patient);

    populateLabResults(patient);
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

    const photo =
        document.querySelector("#patient-photo img");

    if (photo) {

        if (patient.profile_picture) {

            photo.src =
                patient.profile_picture;

            photo.alt =
                patient.name || "Patient";

        } else {

            photo.removeAttribute("src");

            photo.alt = "Patient";
        }
    }
}


// ==========================================
// VITAL SIGNS
// ==========================================

function populateVitals(patient) {

    const history =
        patient.diagnosis_history || [];

    if (history.length === 0) {

        setText("systolic-value", "--");
        setText("diastolic-value", "--");
        setText("respiratory-rate", "--");
        setText("temperature", "--");
        setText("heart-rate", "--");

        return;
    }

    const latest =
        getLatestDiagnosis(history);


    // ======================================
    // BLOOD PRESSURE
    // ======================================

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


    // ======================================
    // RESPIRATORY RATE
    // ======================================

    const respiratoryRate =
        latest.respiratory_rate?.value ??
        latest.respiratory_rate ??
        "--";


    setText(
        "respiratory-rate",
        respiratoryRate === "--"
            ? "--"
            : `${respiratoryRate} bpm`
    );


    // ======================================
    // TEMPERATURE
    // ======================================

    const temperature =
        latest.temperature?.value ??
        latest.temperature ??
        "--";


    setText(
        "temperature",
        temperature === "--"
            ? "--"
            : `${temperature}°F`
    );


    // ======================================
    // HEART RATE
    // ======================================

    const heartRate =
        latest.heart_rate?.value ??
        latest.heart_rate ??
        "--";


    setText(
    "respiratory-rate",
    respiratoryRate === "--"
        ? "--"
        : `${respiratoryRate} breaths/min`
);
}


// ==========================================
// GET LATEST DIAGNOSIS
// ==========================================

function getLatestDiagnosis(history) {

    if (!Array.isArray(history) || history.length === 0) {
        return {};
    }

    const sorted =
        [...history].sort(
            (a, b) => {

                const dateA =
                    getDiagnosisDate(a);

                const dateB =
                    getDiagnosisDate(b);

                return dateA - dateB;
            }
        );

    return sorted[sorted.length - 1] || {};
}


// ==========================================
// GET DIAGNOSIS DATE
// ==========================================

function getDiagnosisDate(record) {

    if (!record) {
        return new Date(0);
    }

    const monthNumber =
        getMonthNumber(record.month);

    if (!record.year || !monthNumber) {
        return new Date(0);
    }

    return new Date(
        Number(record.year),
        monthNumber - 1,
        1
    );
}


// ==========================================
// MONTH NUMBER
// ==========================================

function getMonthNumber(month) {

    if (!month) {
        return 0;
    }

    const months = {

        january: 1,
        february: 2,
        march: 3,
        april: 4,
        may: 5,
        june: 6,
        july: 7,
        august: 8,
        september: 9,
        october: 10,
        november: 11,
        december: 12

    };

    return (
        months[
            String(month).toLowerCase()
        ] || 0
    );
}


// ==========================================
// DIAGNOSIS HISTORY
// ==========================================

function populateDiagnosisHistory(patient) {

    const history =
        patient.diagnosis_history || [];

    if (history.length === 0) {

        destroyBloodPressureChart();

        return;
    }

    createBloodPressureChart(history);
}


// ==========================================
// GET SELECTED CHART PERIOD
// ==========================================

function getSelectedPeriod() {

    const select =
        document.getElementById(
            "period-select"
        );

    if (!select) {
        return 6;
    }

    const value =
        select.value.toLowerCase();

    if (value.includes("12")) {
        return 12;
    }

    if (value.includes("all")) {
        return null;
    }

    return 6;
}


// ==========================================
// FILTER DIAGNOSIS HISTORY
// ==========================================

function getFilteredHistory(history) {

    if (!Array.isArray(history)) {
        return [];
    }

    const sortedHistory =
        [...history].sort(
            (a, b) =>
                getDiagnosisDate(a) -
                getDiagnosisDate(b)
        );

    const period =
        getSelectedPeriod();

    if (period === null) {
        return sortedHistory;
    }

    return sortedHistory.slice(
        Math.max(
            0,
            sortedHistory.length - period
        )
    );
}


// ==========================================
// DIAGNOSTIC LIST
// ==========================================

function populateDiagnosticList(patient) {

    const container =
        document.getElementById(
            "diagnostic-list"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    const diagnostics =
        patient.diagnostic_list || [];

    if (diagnostics.length === 0) {

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td colspan="3">
                No diagnostic information available.
            </td>
        `;

        container.appendChild(row);

        return;
    }

    diagnostics.forEach(
        diagnostic => {

            const row =
                document.createElement("tr");

            const name =
                escapeHTML(
                    diagnostic.name || "--"
                );

            const description =
                escapeHTML(
                    diagnostic.description || "--"
                );

            const status =
                escapeHTML(
                    diagnostic.status || "--"
                );

            row.innerHTML = `
                <td>${name}</td>
                <td>${description}</td>
                <td>${status}</td>
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
        document.getElementById(
            "lab-results"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    const labs =
        patient.lab_results || [];

    if (labs.length === 0) {

        const item =
            document.createElement("div");

        item.className =
            "lab-result";

        item.textContent =
            "No lab results available.";

        container.appendChild(item);

        return;
    }

    labs.forEach(
        lab => {

            const item =
                document.createElement("div");

            item.className =
                "lab-result";

            const labName =
                typeof lab === "string"
                    ? lab
                    : lab.name ||
                      lab.result ||
                      "--";

            item.textContent =
                labName;

            container.appendChild(item);
        }
    );
}


// ==========================================
// PATIENT SIDEBAR
// ==========================================

function populatePatientsSidebar(patients) {

    const container =
        document.getElementById(
            "patients-list"
        );

    if (!container) {

        console.error(
            "Patient sidebar container #patients-list was not found."
        );

        return;
    }

    container.innerHTML = "";

    patients.forEach(
        patient => {

            const patientItem =
                document.createElement("div");

            patientItem.className =
                "patient-item";

            patientItem.dataset.patientName =
                patient.name || "";

            patientItem.innerHTML = `

                <img
                    src="${patient.profile_picture || ""}"
                    alt="${escapeHTML(patient.name || "Patient")}"
                    class="patient-avatar"
                >

                <div class="patient-details">

                    <strong>
                        ${escapeHTML(patient.name || "--")}
                    </strong>

                    <span>
                        ${escapeHTML(patient.gender || "--")},
                        ${patient.age ?? "--"}
                    </span>

                </div>

                <div class="patient-more">
                    ⋮
                </div>

            `;

            patientItem.addEventListener(
                "click",
                () => {

                    selectPatient(patient);

                }
            );

            container.appendChild(
                patientItem
            );
        }
    );
}


// ==========================================
// SET ACTIVE PATIENT
// ==========================================

function setActivePatient(patient) {

    const items =
        document.querySelectorAll(
            ".patient-item"
        );

    items.forEach(
        item => {

            item.classList.remove(
                "active"
            );

            const itemName =
                item.dataset.patientName;

            if (
                itemName &&
                patient.name &&
                itemName.toLowerCase() ===
                    patient.name.toLowerCase()
            ) {

                item.classList.add(
                    "active"
                );
            }
        }
    );
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


    // Get history according to selected period
    const filteredHistory =
        getFilteredHistory(history);


    // Chart labels
    const labels =
        filteredHistory.map(
            record =>
                `${record.month || "--"} ${record.year || ""}`
        );


    // Systolic values
    const systolicData =
        filteredHistory.map(
            record => {

                const value =
                    record.blood_pressure?.systolic?.value ??
                    record.blood_pressure?.systolic;

                return value !== undefined &&
                       value !== null
                    ? Number(value)
                    : null;
            }
        );


    // Diastolic values
    const diastolicData =
        filteredHistory.map(
            record => {

                const value =
                    record.blood_pressure?.diastolic?.value ??
                    record.blood_pressure?.diastolic;

                return value !== undefined &&
                       value !== null
                    ? Number(value)
                    : null;
            }
        );


    // Destroy previous chart
    destroyBloodPressureChart();


    // Create new chart
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

                        pointRadius: 3,

                        pointHoverRadius: 5
                    },

                    {
                        label: "Diastolic",

                        data: diastolicData,

                        borderWidth: 2,

                        tension: 0.4,

                        fill: false,

                        pointRadius: 3,

                        pointHoverRadius: 5
                    }

                ]
            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                interaction: {

                    mode: "index",

                    intersect: false

                },

                plugins: {

                    legend: {

                        display: true

                    },

                    tooltip: {

                        enabled: true

                    }

                },

                scales: {

                    x: {

                        ticks: {

                            maxRotation: 0,

                            autoSkip: true

                        }

                    },

                    y: {

                        beginAtZero: false,

                        suggestedMin: 50,

                        suggestedMax: 180

                    }

                }

            }

        });
}


// ==========================================
// DESTROY BLOOD PRESSURE CHART
// ==========================================

function destroyBloodPressureChart() {

    if (bloodPressureChart) {

        bloodPressureChart.destroy();

        bloodPressureChart = null;
    }
}


// ==========================================
// PERIOD SELECTOR
// ==========================================

function setupPeriodSelector() {

    const select =
        document.getElementById(
            "period-select"
        );

    if (!select) {
        return;
    }


    // Add the available options
    select.innerHTML = `

        <option value="Last 6 months">
            Last 6 months
        </option>

        <option value="Last 12 months">
            Last 12 months
        </option>

        <option value="All history">
            All history
        </option>

    `;


    // Update chart when selection changes
    select.addEventListener(
        "change",
        () => {

            if (
                selectedPatient &&
                selectedPatient.diagnosis_history
            ) {

                createBloodPressureChart(
                    selectedPatient.diagnosis_history
                );
            }

        }
    );
}


// ==========================================
// SET TEXT
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
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ==========================================
// ERROR MESSAGE
// ==========================================

function showError(message) {

    console.error(message);

    const existing =
        document.getElementById(
            "dashboard-error"
        );

    if (existing) {

        existing.textContent =
            message;

        return;
    }

    const error =
        document.createElement("div");

    error.id =
        "dashboard-error";

    error.textContent =
        message;

    error.style.padding =
        "15px";

    error.style.margin =
        "15px";

    error.style.background =
        "#ffe5e5";

    error.style.color =
        "#b00020";

    error.style.borderRadius =
        "8px";

    document.body.prepend(error);
}


// ==========================================
// START APPLICATION
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        // Setup chart period selector
        setupPeriodSelector();

        // Fetch patients
        fetchPatients();

    }
);