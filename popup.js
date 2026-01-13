const notesEl = document.getElementById("notes");
const exportBtn = document.getElementById("export");
const clearBtn = document.getElementById("clear");
const undoBtn = document.getElementById("undo");
const redoBtn = document.getElementById("redo");
const titleInput = document.getElementById("title");
const langPill = document.getElementById("langPill");

const EMPTY_TEXT = "Select text → Right click → Add to Study Notes";

// Load notes
chrome.storage.local.get("notes", (data) => {
  notesEl.textContent = data.notes || EMPTY_TEXT;
});

// -------- TRANSLATION FUNCTION --------
async function translateText(text, from, to) {
  const url =
    "https://translate.googleapis.com/translate_a/single" +
    `?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;

  const res = await fetch(url);
  const data = await res.json();
  return data[0].map(item => item[0]).join("");
}

// -------- TOGGLE PILL CLICK --------
langPill.addEventListener("click", async () => {
  chrome.storage.local.get(["notes", "undoStack"], async (data) => {
    const text = data.notes;
    if (!text) return alert("No text to translate");

    const undoStack = data.undoStack || [];
    undoStack.push(text);

    let from, to;
    if (langPill.textContent === "EN") {
      from = "en";
      to = "bn";
      langPill.textContent = "BN"; // Toggle text
    } else {
      from = "bn";
      to = "en";
      langPill.textContent = "EN"; // Toggle text
    }

    try {
      const translated = await translateText(text, from, to);
      chrome.storage.local.set({
        notes: translated,
        undoStack,
        redoStack: []
      });
      notesEl.textContent = translated;
    } catch {
      alert("Translation failed");
    }
  });
});

// -------- UNDO --------
undoBtn.onclick = () => {
  chrome.storage.local.get(["notes", "undoStack", "redoStack"], (data) => {
    const undoStack = data.undoStack || [];
    if (!undoStack.length) return;

    const redoStack = data.redoStack || [];
    redoStack.push(data.notes || "");

    const prev = undoStack.pop();

    chrome.storage.local.set({
      notes: prev,
      undoStack,
      redoStack
    });

    notesEl.textContent = prev;
  });
};

// -------- REDO --------
redoBtn.onclick = () => {
  chrome.storage.local.get(["notes", "undoStack", "redoStack"], (data) => {
    const redoStack = data.redoStack || [];
    if (!redoStack.length) return;

    const undoStack = data.undoStack || [];
    undoStack.push(data.notes || "");

    const next = redoStack.pop();

    chrome.storage.local.set({
      notes: next,
      undoStack,
      redoStack
    });

    notesEl.textContent = next;
  });
};

// -------- CLEAR --------
clearBtn.onclick = () => {
  chrome.storage.local.clear(() => {
    notesEl.textContent = EMPTY_TEXT;
    titleInput.value = "";
    langPill.textContent = "EN"; // Reset toggle
  });
};

// -------- EXPORT PDF --------
exportBtn.onclick = () => {
  chrome.storage.local.get("notes", (data) => {
    const text = data.notes;
    if (!text) return alert("No notes to export!");

    const title = titleInput.value.trim();

    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <title>${title || ""}</title>
          <style>
            body {
              font-family: Arial;
              padding: 30px;
              line-height: 1.8;
            }
            h1 {
              font-size: 26px;
              margin-bottom: 20px;
            }
            pre {
              white-space: pre-wrap;
              font-size: 18px;
            }
          </style>
        </head>
        <body>
          ${title ? `<h1>${title}</h1>` : ""}
          <pre>${text}</pre>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  });
};

