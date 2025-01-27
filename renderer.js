const { ipcRenderer } = require('electron');

const webview = document.getElementById('webview');
const themeToggle = document.getElementById('theme-toggle');
const bookmarksToggle = document.getElementById('bookmarks-toggle');
const bookmarkPanel = document.getElementById('bookmark-panel');
const bookmarksList = document.getElementById('bookmarks-list');
const addBookmarkBtn = document.getElementById('add-bookmark');
const notification = document.getElementById('notification');
const notesToggle = document.getElementById('notes-toggle');
const notesPanel = document.getElementById('notes-panel');
const noteTitle = document.getElementById('note-title');
const noteContent = document.getElementById('note-content');
const saveNoteBtn = document.getElementById('save-note');
const cancelNoteBtn = document.getElementById('cancel-note');
const notesList = document.getElementById('notes-list');
const loadingError = document.getElementById('loading-error');
const errorMessage = document.getElementById('error-message');
const retryButton = document.getElementById('retry-button');

let notes = JSON.parse(localStorage.getItem('notes') || '[]');
let isNotesPanelOpen = false;
let editingNoteIndex = -1;
let bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
let isBookmarksPanelOpen = false;
let isDarkTheme = localStorage.getItem('darkTheme') === 'true';

function updateNotesList() {
    notesList.innerHTML = notes.map((note, index) => `
        <div class="note-item">
            <div class="note-item-title">${note.title}</div>
            <div class="note-buttons">
                <button class="edit-btn" onclick="editNote(${index})">✎</button>
                <button class="delete-btn" onclick="deleteNote(${index})">✕</button>
            </div>
        </div>
    `).join('');
}

notesToggle.addEventListener('click', () => {
    isNotesPanelOpen = !isNotesPanelOpen;
    notesPanel.classList.toggle('open', isNotesPanelOpen);
    if (!isNotesPanelOpen) {
        clearNoteEditor();
    }
});

function clearNoteEditor() {
    noteTitle.value = '';
    noteContent.value = '';
    editingNoteIndex = -1;
}

saveNoteBtn.addEventListener('click', () => {
    const title = noteTitle.value.trim();
    const content = noteContent.value.trim();
    
    if (!title) {
        showNotification('Введите заголовок заметки');
        return;
    }

    if (editingNoteIndex >= 0) {
        notes[editingNoteIndex] = { title, content };
    } else {
        notes.push({ title, content });
    }

    localStorage.setItem('notes', JSON.stringify(notes));
    updateNotesList();
    clearNoteEditor();
    showNotification('Заметка сохранена');
});

cancelNoteBtn.addEventListener('click', clearNoteEditor);

window.editNote = (index) => {
    const note = notes[index];
    noteTitle.value = note.title;
    noteContent.value = note.content;
    editingNoteIndex = index;
};

window.deleteNote = (index) => {
    notes.splice(index, 1);
    localStorage.setItem('notes', JSON.stringify(notes));
    updateNotesList();
    clearNoteEditor();
    showNotification('Заметка удалена');
};

function updateBookmarksList() {
    bookmarksList.innerHTML = bookmarks.map((bookmark, index) => `
        <div class="bookmark-item">
            <a href="#" onclick="loadBookmark(${index})">${bookmark.title}</a>
            <button class="delete-btn" onclick="removeBookmark(${index})">✕</button>
        </div>
    `).join('');
}

bookmarksToggle.addEventListener('click', () => {
    isBookmarksPanelOpen = !isBookmarksPanelOpen;
    bookmarkPanel.classList.toggle('open', isBookmarksPanelOpen);
});

addBookmarkBtn.addEventListener('click', async () => {
    const title = await webview.getTitle();
    const url = await webview.getURL();
    bookmarks.push({ title, url });
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    updateBookmarksList();
    showNotification('Закладка добавлена');
});

window.loadBookmark = (index) => {
    webview.loadURL(bookmarks[index].url);
};

window.removeBookmark = (index) => {
    bookmarks.splice(index, 1);
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    updateBookmarksList();
    showNotification('Закладка удалена');
};

function showNotification(message) {
    notification.textContent = message;
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

document.getElementById('home').addEventListener('click', () => {
    webview.loadURL('https://yougame.biz');
});

document.getElementById('market').addEventListener('click', () => {
    webview.loadURL('https://yougame.biz/market');
});

document.getElementById('forum').addEventListener('click', () => {
    webview.loadURL('https://yougame.biz/forums');
});

document.getElementById('profile').addEventListener('click', () => {
    webview.loadURL('https://yougame.biz/account');
});

document.getElementById('sources').addEventListener('click', () => {
    webview.loadURL('https://yougame.biz/forums/794/');
});

document.getElementById('refresh').addEventListener('click', () => {
    webview.reload();
});

themeToggle.addEventListener('click', () => {
    isDarkTheme = !isDarkTheme;
    document.body.classList.toggle('dark-theme', isDarkTheme);
    localStorage.setItem('darkTheme', isDarkTheme);
});

webview.addEventListener('did-fail-load', (event) => {
    const { errorCode, errorDescription, validatedURL } = event;
    console.error('Ошибка загрузки:', errorCode, errorDescription, validatedURL);
    errorMessage.textContent = `Не удалось загрузить страницу: ${errorDescription}`;
    loadingError.style.display = 'block';
});

webview.addEventListener('did-start-loading', () => {
    loadingError.style.display = 'none';
});

retryButton.addEventListener('click', () => {
    loadingError.style.display = 'none';
    webview.reload();
});

setInterval(() => {
    webview.reload();
}, 5 * 60 * 1000);

webview.addEventListener('dom-ready', () => {
    webview.executeJavaScript(`
        setInterval(() => {
            const unreadCount = document.querySelectorAll('.message-unread').length;
            if (unreadCount > 0) {
                window.postMessage({ type: 'unread-messages', count: unreadCount }, '*');
            }
        }, 30000);
    `);
});

webview.addEventListener('ipc-message', (event) => {
    if (event.channel === 'unread-messages') {
        showNotification(`У вас ${event.args[0]} непрочитанных сообщений`);
    }
});

updateNotesList();
updateBookmarksList();

if (isDarkTheme) {
    document.body.classList.add('dark-theme');
} 