const form = document.getElementById("search-form");
const input = document.getElementById("student-id-input");
const errorBox = document.getElementById("error-message");
const resultSection = document.getElementById("result-section");
const idEl = document.getElementById("display-student-id");
const cohortEl = document.getElementById("student-cohort");
const countEl = document.getElementById("exams-count");
const tbody = document.getElementById("schedule-body");
const printBtn = document.getElementById("print-btn");

const MSG = {
  notFound: "عذراً، الرقم الجامعي غير مسجل في قوائم اللجان. تأكد من الرقم وحاول مرة أخرى.",
  badFormat: "الرقم الجامعي يجب أن يتكون من 9 أرقام.",
  dataMissing: "تعذر تحميل بيانات الجداول. تأكد من وجود ملف data.js بجانب الصفحة.",
  noExams: "لا توجد امتحانات مدرجة في قوائم اللجان لهذا الرقم الجامعي.",
};

function normalizeId(value) {
  return value
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/\s+/g, "");
}

const dateFormatter = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return dateFormatter.format(new Date(y, m - 1, d));
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
  resultSection.classList.add("hidden");
}

function hideError() {
  errorBox.classList.add("hidden");
}

function renderStudent(studentId, rows, examsMap) {
  idEl.textContent = studentId;
  cohortEl.textContent = `دفعة ${studentId.slice(0, 4)}`;
  countEl.textContent = rows.length;

  tbody.replaceChildren();

  if (rows.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.textContent = MSG.noExams;
    td.style.textAlign = "center";
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    for (const [examId, room, seat] of rows) {
      const exam = examsMap[String(examId)];
      if (!exam) continue;
      const tr = document.createElement("tr");
      const cells = [
        exam.c,
        exam.t,
        formatDate(exam.d),
        `${exam.s} - ${exam.e}`,
        room,
        seat,
      ];
      for (const value of cells) {
        const td = document.createElement("td");
        td.textContent = value ?? "—";
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
  }

  hideError();
  resultSection.classList.remove("hidden");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const id = normalizeId(input.value);
  if (!/^[0-9]{9}$/.test(id)) {
    showError(MSG.badFormat);
    return;
  }

  const db = window.EXAM_DATA;
  if (!db || !db.students || !db.exams) {
    showError(MSG.dataMissing);
    return;
  }

  if (!Object.prototype.hasOwnProperty.call(db.students, id)) {
    showError(MSG.notFound);
    return;
  }

  renderStudent(id, db.students[id], db.exams);
});

input.addEventListener("input", hideError);
printBtn.addEventListener("click", () => window.print());
