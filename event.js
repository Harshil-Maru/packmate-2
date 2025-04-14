const defaultItems = {
  tech: ['Laptop', 'Charger', 'Headphones'],
  hygiene: ['Toothbrush', 'Toothpaste', 'Towel'],
  docs: ['ID Card', 'Tickets', 'Itinerary']
};

const checklistItems = {
  tech: [],
  hygiene: [],
  docs: []
};

document.body.classList.toggle('dark-mode');

let currentTab = "tech";
let lastMilestone = 0;

const members = [
  { name: "Diya", role: "Organizer" },
  { name: "Mahek", role: "Admin" },
  { name: "Ayush", role: "Member" }
];

const completionLog = [];

function renderChecklist() {
  const container = document.getElementById("checklist");
  container.innerHTML = "";

  const items = checklistItems[currentTab];
  const titleDiv = document.createElement("div");
  titleDiv.className = "category-title";

  const isCustom = isCustomCategory(currentTab);
  titleDiv.innerHTML = `
    <h2>${currentTab}</h2>
    ${isCustom ? `<button onclick="removeCategory('${currentTab}')">Remove</button>` : ""}
  `;
  container.appendChild(titleDiv);

  items.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <strong>${item.name}</strong><br>
      Assigned to:
      <select onchange="assignMember('${currentTab}', ${i}, this.value)">
        <option value="">Unassigned</option>
        ${members.map(m => `<option value="${m.name}" ${m.name === item.assignee ? "selected" : ""}>${m.name}</option>`).join("")}
      </select>
      <br>
      <label>Status:
        <select onchange="updateStatus('${currentTab}', ${i}, this.value)">
          <option ${item.status === "To Pack" ? "selected" : ""}>To Pack</option>
          <option ${item.status === "Packed" ? "selected" : ""}>Packed</option>
          <option ${item.status === "Delivered" ? "selected" : ""}>Delivered</option>
        </select>
      </label>
    `;
    container.appendChild(div);
  });

  const addItemBtn = document.createElement("button");
  addItemBtn.textContent = "➕ Add Item";
  addItemBtn.className = "add-item-btn";
  addItemBtn.onclick = () => addItem(currentTab);
  container.appendChild(addItemBtn);

  updateProgress();
}

function switchTab(tabName) {
  currentTab = tabName;
  const buttons = document.querySelectorAll("#tabButtons button");
  buttons.forEach(btn => btn.classList.remove("active"));

  const matchingButton = Array.from(buttons).find(btn => btn.textContent.toLowerCase().includes(tabName.toLowerCase()));
  if (matchingButton) matchingButton.classList.add("active");

  if (defaultItems[tabName] && checklistItems[tabName].length === 0) {
    checklistItems[tabName] = defaultItems[tabName].map(name => ({ name, assignee: "", status: "To Pack" }));
  }

  renderChecklist();
}

function updateStatus(tab, index, value) {
  const item = checklistItems[tab][index];
  const previous = item.status;
  item.status = value;
  updateProgress();

  if ((value === "Packed" || value === "Delivered") && previous !== value) {
    const entry = `${item.name} marked as ${value} by ${item.assignee || "Unassigned"} (${tab})`;
    completionLog.push(entry);
    const li = document.createElement("li");
    li.textContent = entry;
    document.getElementById("completionHistory").appendChild(li);
  }
}

function assignMember(tab, index, memberName) {
  checklistItems[tab][index].assignee = memberName;
  renderChecklist();
}

function updateProgress() {
  let total = 0, packed = 0;
  Object.values(checklistItems).forEach(list => {
    list.forEach(item => {
      total++;
      if (item.status === "Packed" || item.status === "Delivered") packed++;
    });
  });

  const percent = total === 0 ? 0 : Math.round((packed / total) * 100);
  document.getElementById("progressPercentage").textContent = `${percent}% Packed`;
  document.getElementById("totalItems").textContent = total;
  document.getElementById("packedItems").textContent = packed;
  document.getElementById("unpackedItems").textContent = total - packed;

  if (window.pieChartInstance) window.pieChartInstance.destroy();
  const ctx = document.getElementById('progressPieChart').getContext('2d');
  window.pieChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Packed', 'Unpacked'],
      datasets: [{
        data: [packed, total - packed],
        backgroundColor: ['#00A5CF', '#EE6C4D'],
        borderWidth: 0,
      }]
    },
    options: {
      cutout: '70%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context => `${context.label}: ${context.raw} items`
          }
        }
      }
    }
  });

  showMilestone(percent);
}

function showMilestone(percent) {
  const milestones = [25, 50, 75, 100];
  if (milestones.includes(percent) && percent !== lastMilestone) {
    lastMilestone = percent;
    showToast(`🎉 ${percent}% Packed!`);
    if (percent === 100) launchConfetti();
  }
}

function showToast(message) {
  alert(message);
}

// ... (everything else remains unchanged until exportPDF)

function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt' });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 40;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("PackMate - Event Summary", pageWidth / 2, y, { align: "center" });
  y += 30;

  // Event Info
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.line(40, y, pageWidth - 40, y);
  y += 20;
  doc.text(`Event Name: Hackathon Prep`, 40, y);
  doc.text(`Event Date: Apr 13–14`, 300, y);
  y += 25;

  // Donut Chart Snapshot
  const canvas = document.getElementById("progressPieChart");
  const chartDataUrl = canvas.toDataURL("image/png");
  doc.addImage(chartDataUrl, "PNG", 40, y, 140, 140);

  // Completion Stats Below
  const percentText = document.getElementById("progressPercentage").textContent;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(percentText, 60, y + 160);

  y += 180;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.line(40, y, pageWidth - 40, y);
  y += 20;

  // Checklist Section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Checklist Items:", 40, y);
  y += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);

  Object.keys(checklistItems).forEach(category => {
    const items = checklistItems[category];
    if (items.length > 0) {
      doc.text(`Category: ${category}`, 50, y);
      y += 15;

      items.forEach(item => {
        doc.text(`- ${item.name} | Assigned to: ${item.assignee || "Unassigned"} | Status: ${item.status}`, 60, y);
        y += 15;
        if (y > 550) {
          doc.addPage();
          y = 40;
        }
      });

      y += 10;
    }
  });

  y += 10;
  doc.line(40, y, pageWidth - 40, y);
  y += 20;

  // Completion History Section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Completion History:", 40, y);
  y += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);

  const historyItems = document.querySelectorAll("#completionHistory li");
  if (historyItems.length === 0) {
    doc.text("- No history recorded yet.", 50, y);
    y += 15;
  } else {
    historyItems.forEach(li => {
      const text = li.textContent.trim();
      doc.text(`- ${text}`, 50, y);
      y += 15;
      if (y > 550) {
        doc.addPage();
        y = 40;
      }
    });
  }

  doc.save("PackMate_Trip_Summary.pdf");
}


function launchConfetti() {
  alert("🎉 Confetti Time!");
}

function addCategory() {
  const newCat = prompt("Enter new category name:");
  if (!newCat || checklistItems[newCat]) return;

  checklistItems[newCat] = [];
  const tabsDiv = document.getElementById("tabButtons");
  const btn = document.createElement("button");
  btn.textContent = newCat;
  btn.onclick = () => switchTab(newCat);
  tabsDiv.insertBefore(btn, tabsDiv.lastElementChild);

  switchTab(newCat);
}

function removeCategory(cat) {
  if (!isCustomCategory(cat)) return;
  if (!confirm(`Remove category '${cat}'?`)) return;

  delete checklistItems[cat];
  const tabBtns = document.querySelectorAll("#tabButtons button");
  tabBtns.forEach(btn => {
    if (btn.textContent === cat) btn.remove();
  });

  switchTab("tech");
}

function isCustomCategory(cat) {
  return !["tech", "hygiene", "docs"].includes(cat);
}

function addItem(category) {
  const itemName = prompt(`Enter item name to add to "${category}" category:`)?.trim();
  if (!itemName) return;

  checklistItems[category].push({
    name: itemName,
    assignee: "",
    status: "To Pack"
  });

  renderChecklist();
}

function renderMembers() {
  const ul = document.getElementById("memberList");
  ul.innerHTML = "";
  members.forEach((member, index) => {
    const li = document.createElement("li");
    li.innerHTML = `${member.name} <span class="tag member">${member.role}</span>
      <button onclick="removeMember(${index})" style="float:right; background:none; border:none; color:red; cursor:pointer;">✖</button>`;
    ul.appendChild(li);
  });
}

function openMemberForm() {
  document.getElementById("memberFormModal").style.display = "block";
}

function closeMemberForm() {
  document.getElementById("memberFormModal").style.display = "none";
}

function addMember() {
  const name = document.getElementById("memberName").value.trim();
  const role = document.getElementById("memberRole").value;

  if (name) {
    members.push({ name, role });
    renderMembers();
    closeMemberForm();
    document.getElementById("memberName").value = "";
    document.getElementById("memberRole").value = "Member";
    renderChecklist();
  } else {
    alert("Please enter a name!");
  }
}

function removeMember(index) {
  if (confirm(`Remove ${members[index].name}?`)) {
    members.splice(index, 1);
    renderMembers();
    renderChecklist();
  }
}

window.onload = function () {
  renderMembers();
  switchTab(currentTab);
};
