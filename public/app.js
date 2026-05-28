const plan = [
  {
    title: "Business Foundations",
    weeks: [
      ["Understanding business", "Business models", "Startups, MVPs, product-market fit", "Moats and network effects"],
      ["GDP", "Inflation", "Interest rates", "Fiscal and monetary policy", "Supply and demand"],
      ["Balance sheet", "Income statement", "Cash flow", "Assets, liabilities, depreciation"],
      ["Time value of money", "NPV and IRR", "Debt vs equity", "Valuation basics"]
    ]
  },
  {
    title: "Marketing Mastery",
    weeks: [
      ["Consumer psychology", "Emotional triggers", "Positioning and branding"],
      ["SEO", "Social media marketing", "Funnels", "Paid ads", "Email marketing"],
      ["Sales psychology", "Negotiation", "B2B sales", "Cold outreach"],
      ["Brand identity", "Storytelling", "Community building"]
    ]
  },
  {
    title: "Strategy & Decision Making",
    weeks: [
      ["SWOT analysis", "Porter's Five Forces", "Competitive analysis"],
      ["Market entry", "Pricing", "Expansion strategy"],
      ["Decision frameworks", "First principles", "Risk analysis"],
      ["Amazon, Netflix, Apple strategy reports"]
    ]
  },
  {
    title: "Operations & Systems",
    weeks: [["Supply chain", "Lean systems", "Process optimization", "Inventory", "SOPs", "Operations flow design"]]
  },
  {
    title: "Leadership & Communication",
    weeks: [
      ["Public speaking", "Executive communication", "Business writing"],
      ["Team management", "Delegation", "Conflict resolution"],
      ["Negotiation", "Persuasion", "Stakeholder management"],
      ["Mock presentations", "Interview simulations"]
    ]
  },
  {
    title: "Entrepreneurship",
    weeks: [
      ["Startup ideation", "Identifying problems"],
      ["MVP building", "Product validation"],
      ["Fundraising", "Pitch decks", "Investor thinking"],
      ["Startup plan", "Pitch presentation"]
    ]
  },
  {
    title: "Analytics & Data",
    weeks: [["Advanced Excel", "SQL basics", "Power BI or Tableau", "KPIs", "A/B testing", "Dashboards"]]
  },
  {
    title: "Product Management",
    weeks: [["Product lifecycle", "User research", "Wireframing", "Roadmaps", "Prioritization", "PRDs"]]
  },
  {
    title: "AI, Tech & Business",
    weeks: [["AI business models", "SaaS economics", "AI agents", "Automation", "API economy", "Platform businesses"]]
  },
  {
    title: "Real MBA Case Studies",
    weeks: [["Finance cases", "Marketing cases", "Startup cases", "Product cases", "Operations cases"]]
  },
  {
    title: "Real-World Execution",
    weeks: [["Build a startup, consulting service, SaaS product, AI tool, or agency"]]
  },
  {
    title: "Executive-Level Thinking",
    weeks: [["Global markets", "Leadership psychology", "Organizational behavior", "Corporate politics", "Scale management", "Hiring", "Vision and culture"]]
  }
];

const form = document.querySelector("#entryForm");
const entriesEl = document.querySelector("#entries");
const monthSelect = document.querySelector("#monthSelect");
const focusInput = document.querySelector("#focusInput");
const planDetails = document.querySelector("#planDetails");
const selectedPlan = document.querySelector("#selectedPlan");
const formMessage = document.querySelector("#formMessage");

function setToday() {
  form.elements.date.value = new Date().toISOString().slice(0, 10);
}

function populateMonths() {
  plan.forEach((month, index) => {
    const option = document.createElement("option");
    option.value = String(index + 1);
    option.textContent = `Month ${index + 1}: ${month.title}`;
    monthSelect.append(option);
  });
}

function renderPlan() {
  const monthIndex = Number(monthSelect.value) - 1;
  const month = plan[monthIndex];
  selectedPlan.textContent = `Month ${monthIndex + 1}`;
  focusInput.value = month.title;
  planDetails.innerHTML = month.weeks
    .map((items, index) => {
      const weekTitle = month.weeks.length === 1 ? "Core topics" : `Week ${index + 1}`;
      const list = items.map((item) => `<li>${item}</li>`).join("");
      return `<div class="plan-block"><h3>${weekTitle}</h3><ul>${list}</ul></div>`;
    })
    .join("");
}

function entryMeta(entry) {
  const hours = (entry.minutes / 60).toFixed(entry.minutes % 60 === 0 ? 0 : 1);
  return [
    entry.date,
    `Month ${entry.month}`,
    `Week ${entry.week}`,
    `${hours} hrs`,
    entry.source || "No source",
    entry.completed ? "Completed" : "In progress"
  ];
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderEntries(entries) {
  const totalMinutes = entries.reduce((sum, entry) => sum + entry.minutes, 0);
  document.querySelector("#totalEntries").textContent = entries.length;
  document.querySelector("#totalHours").textContent = (totalMinutes / 60).toFixed(totalMinutes % 60 === 0 ? 0 : 1);
  document.querySelector("#completedEntries").textContent = entries.filter((entry) => entry.completed).length;

  if (!entries.length) {
    entriesEl.innerHTML = "<p>No saved entries yet.</p>";
    return;
  }

  entriesEl.innerHTML = entries
    .map((entry) => {
      const meta = entryMeta(entry).map((item) => `<span>${escapeHtml(item)}</span>`).join("");
      return `
        <article class="entry">
          <div>
            <h3>${escapeHtml(entry.focus)}</h3>
            <p>${escapeHtml(entry.notes || "No notes added.")}</p>
            <div class="entry-meta">${meta}</div>
          </div>
          <div class="entry-actions">
            <button data-id="${entry._id}" data-completed="${!entry.completed}" class="toggle" type="button">
              ${entry.completed ? "Undo" : "Done"}
            </button>
            <button data-id="${entry._id}" class="delete" type="button">Delete</button>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadEntries() {
  const response = await fetch("/api/entries");
  const entries = await response.json();
  renderEntries(entries);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formMessage.textContent = "";

  const data = Object.fromEntries(new FormData(form).entries());
  data.completed = form.elements.completed.checked;

  const response = await fetch("/api/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    formMessage.textContent = error.message || "Could not save entry.";
    return;
  }

  form.reset();
  setToday();
  renderPlan();
  await loadEntries();
});

entriesEl.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.classList.contains("toggle")) {
    await fetch(`/api/entries/${button.dataset.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: button.dataset.completed === "true" })
    });
  }

  if (button.classList.contains("delete")) {
    await fetch(`/api/entries/${button.dataset.id}`, { method: "DELETE" });
  }

  await loadEntries();
});

document.querySelector("#refreshButton").addEventListener("click", loadEntries);
monthSelect.addEventListener("change", renderPlan);

populateMonths();
setToday();
renderPlan();
loadEntries().catch(() => {
  entriesEl.innerHTML = "<p>Start the server with MongoDB connected to load saved entries.</p>";
});
