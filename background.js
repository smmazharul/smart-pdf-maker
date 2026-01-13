chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "add-note",
    title: "Add to Study Notes",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "add-note") {
    chrome.storage.local.get(
      ["notes", "undoStack"],
      (data) => {
        const notes = data.notes || "";
        const undoStack = data.undoStack || [];

        if (notes) undoStack.push(notes);

        const updatedNotes = notes
          ? notes + "\n\n" + info.selectionText
          : info.selectionText;

        chrome.storage.local.set({
          notes: updatedNotes,
          undoStack,
          redoStack: []
        });
      }
    );
  }
});
