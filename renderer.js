// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.


// IPC imports
const {remote, ipcRenderer} = require('electron');
const ipc = ipcRenderer;
const path = require('path');
const fs = require('fs');

// Global variables
let INPUT_DIR = null;
let OUTPUT_DIR = null;
const BASE_IMG_PATH = './public/images/nodir.jpg';
let SELECTED_PICTURE_ROTATION = 0;
let LIST_OF_PICTURES = [];
const EXTENSIONS = ['.jpg', '.png', '.jpeg', '.JPG', '.PNG', '.JPEG'];

// Contextual Menu Event Handler -----------------------------------------------
window.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  ipc.send('show-context-menu');
})

// Select File Dialogs and Callbacks -------------------------------------------

// button variables
const selectFrom = document.getElementById('dirFrom');
const selectedFrom = document.getElementById('selectedDirFrom');
const selectTo = document.getElementById('dirTo');
const selectedTo = document.getElementById('selectedDirTo');
const picture = document.getElementById('picture');
const previous = document.getElementById('previous');
const next = document.getElementById('next');
const clickado = document.getElementById('clickado');
const success = document.getElementById('success');

// event listeners
selectFrom.addEventListener('click', (event) => {
  LIST_OF_PICTURES = []
  ipc.send('openDir', true);
});
selectTo.addEventListener('click', (event) => {
  ipc.send('openDir', false);
});
previous.addEventListener('click', () => {
  nextOrPreviousPicture(false);
});
next.addEventListener('click', () => {
  nextOrPreviousPicture(true);
});
clickado.addEventListener('click', () => {
  copyPictureToOutputDir();
});

// callback
ipc.on('openDir', (event, isInputDir) => {
  console.log(isInputDir);
  ipc.send('openDir', isInputDir);
});
ipc.on('selectedDir', function(event, isInputDir, dirPath) {
  const dirBasename = path.basename(dirPath) || null;
  if (isInputDir) {
    INPUT_DIR = dirPath;
    selectedFrom.innerHTML = dirBasename;
    if (dirPath) {
      fs.readdir(dirPath, function(err, files) {
        if (err) {
          console.error('FS.readdir error: ' + err);
          return
        }
        files.map((file) => {
          if (EXTENSIONS.indexOf(path.extname(file)) >= 0) {
            LIST_OF_PICTURES.push(path.join(dirPath, file);
          }
        })

        console.log(LIST_OF_PICTURES);
        displayPictureByIndex(0);
      })
    } else {
      picture.src = BASE_IMG_PATH;
    }
  } else {
    OUTPUT_DIR = dirPath;
    selectedTo.innerHTML = dirBasename;
  }

  chargeClickado();
});

ipc.on('prevPicture', () => nextOrPreviousPicture(false));
ipc.on('nextPicture', () => nextOrPreviousPicture(true));
ipc.on('rotate', (event, clockwise) => {rotatePicture(clockwise);});

ipc.on('execute', () => copyPictureToOutputDir());

// Helper Functions ---------------------------------------------------------
function displayPictureByIndex(index) {
  if (LIST_OF_PICTURES.length > 0) {
    if (LIST_OF_PICTURES[index]) {
      picture.src = LIST_OF_PICTURES[index];
    }
  }
}


function nextOrPreviousPicture(isNext) {
  SELECTED_PICTURE_ROTATION = 0
  picture.style.transform = 'none';
  const currentPicturePath = picture.src.slice(7).replace('%20', ' ');
  const indexOfCurrentPicture = LIST_OF_PICTURES.indexOf(currentPicturePath);
  if (isNext) {
    displayPictureByIndex(indexOfCurrentPicture + 1)
  } else {
    displayPictureByIndex(indexOfCurrentPicture - 1)
  }
}


function rotatePicture(clockwise) {
  if (clockwise) {
    SELECTED_PICTURE_ROTATION += 90;
    picture.style.transform = `rotate(${SELECTED_PICTURE_ROTATION}deg)`;
    picture.classList.toggle('rotated');
  } else {
    SELECTED_PICTURE_ROTATION -= 90;
    picture.style.transform = `rotate(${SELECTED_PICTURE_ROTATION}deg)`;
  }
}


function chargeClickado() {
  if (INPUT_DIR != null && OUTPUT_DIR != null) {
    clickado.disabled = false;
  } else {
    clickado.disabled = true;
  }
}

function getCurrentPicturePath() {
  const currentPicturePath = picture.src.slice(7).replace('%20', ' ');
  const indexOfCurrentPicture = LIST_OF_PICTURES.indexOf(currentPicturePath);
  return LIST_OF_PICTURES[indexOfCurrentPicture]
}

function copyPictureToOutputDir() {
  const currentPicturePath = getCurrentPicturePath()
  fs.copyFile(
    currentPicturePath, // source
    path.join(OUTPUT_DIR, path.basename(currentPicturePath)), // dest
    function(err) {
      if (err) {
        console.error("ERROR: ", err);
        return
      }
      success.classList.toggle('success');
      setTimeout(function() {
        success.classList.toggle('success');
      }, 1225);
    }
  );
}
