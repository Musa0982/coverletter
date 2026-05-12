async function generate() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const linkedin = document.getElementById("linkedin").value.trim();
  const jobtitle = document.getElementById("jobtitle").value.trim();
  const company = document.getElementById("company").value.trim();
  const manager = document.getElementById("manager").value.trim();
  const jobdesc = document.getElementById("jobdesc").value.trim();
  const experience = document.getElementById("experience").value.trim();
  const achievements = document.getElementById("achievements").value.trim();
  const tone = document.getElementById("tone").value;
  const length = document.getElementById("length").value;

  if (!name || !jobtitle || !company || !jobdesc || !experience) {
    alert("Please fill in: Name, Job Title, Company, Job Description, and Your Experience.");
    return;
  }

  const btn = document.getElementById("generate-btn");
  const btnText = document.getElementById("btn-text");
  const btnLoader = document.getElementById("btn-loader");
  btn.disabled = true;
  btnText.classList.add("hidden");
  btnLoader.classList.remove("hidden");
  btnLoader.classList.add("loading");

  const toneMap = {
    professional: "professional, confident, and polished",
    enthusiastic: "enthusiastic, energetic, and genuinely excited",
    concise: "sharp, direct, and concise — every word earns its place",
    storytelling: "warm, personal, and storytelling-driven"
  };

  const lengthMap = {
    standard: "3 paragraphs (opening, body, closing)",
    detailed: "4 paragraphs (opening, experience, achievements/fit, closing)",
    brief: "2 tight paragraphs"
  };

  const prompt = `You are an elite career coach and professional writer. You have studied cover letters that got candidates hired at Google, Microsoft, Amazon, Meta, and other top companies. Your task is to write the BEST possible cover letter.

PRINCIPLES FROM TOP COMPANIES:
- Address hiring manager by name if provided (shows extra effort)
- Link experience DIRECTLY to the job description keywords
- Lead with a hook that immediately grabs attention — not "I am writing to apply"
- Show passion for THIS specific company, not just any company
- Include specific achievements with metrics when possible
- Tell a story arc: who you are → what you've done → why this company
- Use ATS-friendly keywords from the job description naturally
- Keep it to one page, every sentence must earn its place
- End with a confident (not arrogant) call to action
- Tone must feel human, not like a template

CANDIDATE INFO:
Name: ${name}
Email: ${email}
Phone: ${phone}
LinkedIn/Portfolio: ${linkedin || "not provided"}

JOB INFO:
Title: ${jobtitle}
Company: ${company}
Hiring Manager: ${manager || "not provided (use 'Dear Hiring Team' or 'Dear [Company] Recruiting Team')"}
Job Description: ${jobdesc}

CANDIDATE BACKGROUND:
Experience & Skills: ${experience}
Achievements: ${achievements || "not provided"}

INSTRUCTIONS:
- Tone: ${toneMap[tone]}
- Length: ${lengthMap[length]}
- DO NOT start with "I am writing to apply"
- DO NOT use generic filler phrases
- DO NOT include the header/contact info — just the letter body starting from the greeting
- Make the opening line UNFORGETTABLE
- Naturally incorporate keywords from the job description
- Return ONLY the letter body — no extra commentary, no subject line, just the letter from greeting to sign-off word (do not include "Sincerely" or the name at the end, I'll add those)`;

  try {
    const res = await fetch("/.netlify/functions/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    const data = await res.json();
    const letter = data.letter;

    if (!letter) throw new Error("No response");

    renderLetter({ name, email, phone, linkedin, jobtitle, company, manager, letter });

  } catch (err) {
    alert("Error generating letter. Please try again.");
    console.error(err);
  } finally {
    btn.disabled = false;
    btnText.classList.remove("hidden");
    btnLoader.classList.add("hidden");
    btnLoader.classList.remove("loading");
  }
}

function renderLetter({ name, email, phone, linkedin, jobtitle, company, manager, letter }) {
  const contactParts = [email, phone, linkedin].filter(Boolean);
  document.getElementById("out-name").textContent = name;
  document.getElementById("out-contact").textContent = contactParts.join(" · ");

  const now = new Date();
  document.getElementById("out-date").textContent = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const toLines = manager ? `${manager}\n${company}` : company;
  document.getElementById("out-to").textContent = toLines;

  document.getElementById("out-body").textContent = letter;
  document.getElementById("out-signname").textContent = name;

  document.getElementById("empty-state").classList.add("hidden");
  document.getElementById("letter-output").classList.remove("hidden");
  document.getElementById("preview-actions").style.display = "flex";

  renderScore(letter, document.getElementById("jobdesc").value);
}

function renderScore(letter, jobdesc) {
  const checks = [
    { label: "Personalized opening", pass: !letter.toLowerCase().startsWith("i am writing") && !letter.toLowerCase().startsWith("i am excited to apply for") },
    { label: "Hiring manager addressed", pass: letter.toLowerCase().includes("dear") },
    { label: "Company name mentioned", pass: letter.toLowerCase().includes(document.getElementById("company").value.toLowerCase()) },
    { label: "Keywords from JD", pass: checkKeywords(letter, jobdesc) },
    { label: "Strong closing", pass: letter.toLowerCase().includes("interview") || letter.toLowerCase().includes("discuss") || letter.toLowerCase().includes("connect") },
  ];

  const bar = document.getElementById("score-bar");
  bar.innerHTML = checks.map(c => `
    <div class="score-item">
      <div class="score-dot ${c.pass ? "green" : "amber"}"></div>
      <span>${c.label}</span>
    </div>
  `).join("");
}

function checkKeywords(letter, jobdesc) {
  const words = jobdesc.toLowerCase().split(/\W+/).filter(w => w.length > 5);
  const unique = [...new Set(words)].slice(0, 10);
  const hits = unique.filter(w => letter.toLowerCase().includes(w));
  return hits.length >= 3;
}

function copyText() {
  const body = document.getElementById("out-body").textContent;
  const name = document.getElementById("out-name").textContent;
  const contact = document.getElementById("out-contact").textContent;
  const date = document.getElementById("out-date").textContent;
  const to = document.getElementById("out-to").textContent;
  const full = `${name}\n${contact}\n\n${date}\n\n${to}\n\n${body}\n\nSincerely,\n${name}`;
  navigator.clipboard.writeText(full).then(() => {
    const btn = document.querySelector(".action-btn:not(.primary)");
    btn.textContent = "Copied!";
    setTimeout(() => btn.textContent = "Copy Text", 2000);
  });
}

function downloadPDF() {
  const element = document.getElementById("pdf-content");
  const name = document.getElementById("name").value.trim().replace(/\s+/g, "_");
  const company = document.getElementById("company").value.trim().replace(/\s+/g, "_");
  const filename = `CoverLetter_${name}_${company}.pdf`;

  const opt = {
    margin: [0.75, 0.75, 0.75, 0.75],
    filename,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "in", format: "letter", orientation: "portrait" }
  };

  const btn = document.querySelector(".action-btn.primary");
  btn.textContent = "Generating PDF...";
  btn.disabled = true;

  html2pdf().set(opt).from(element).save().then(() => {
    btn.textContent = "Download PDF";
    btn.disabled = false;
  });
}
