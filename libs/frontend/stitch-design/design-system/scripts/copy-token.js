window.showCopyToast = function (msg) {
  var toast = document.getElementById('copy-toast');
  var label = document.getElementById('toast-text');
  if (!toast || !label) return;
  label.innerText = msg;
  toast.classList.remove('translate-y-12', 'opacity-0', 'pointer-events-none');
  toast.classList.add('translate-y-0', 'opacity-100');
  setTimeout(function () {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-12', 'opacity-0', 'pointer-events-none');
  }, 2200);
};

window.copyToken = function (hex, tokenKey) {
  var textToCopy = hex;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(textToCopy).then(function () {
      window.showCopyToast('Copied: ' + textToCopy + ' (' + tokenKey + ')');
    });
  } else {
    window.showCopyToast(textToCopy);
  }
};
