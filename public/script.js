
  function previewImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    const preview = document.getElementById("preview");
    const text = document.getElementById("uploadText");

    preview.src = URL.createObjectURL(file);
    preview.classList.remove("hidden");

    text.classList.add("hidden");
  }
