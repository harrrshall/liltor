(function () {
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".site-nav");
  var overlay = document.querySelector(".nav-overlay");
  var form = document.querySelector("#lot-form");
  var success = document.querySelector("#form-success");
  var sampleButton = document.querySelector("[data-sample-play]");
  var sampleStatus = document.querySelector("[data-sample-status]");
  var sampleLines = document.querySelectorAll("[data-sample-line]");
  var audioContext = null;
  var sampleTimer = null;
  var oscillators = [];
  var samplePlaying = false;

  function closeNav() {
    if (!nav || !toggle) return;
    nav.classList.remove("is-open");
    document.body.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
  }

  function openNav() {
    if (!nav || !toggle) return;
    nav.classList.add("is-open");
    document.body.classList.add("nav-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      if (nav.classList.contains("is-open")) {
        closeNav();
      } else {
        openNav();
      }
    });
  }

  if (overlay) {
    overlay.addEventListener("click", closeNav);
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeNav();
      stopSample();
    }
  });

  if (nav) {
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeNav);
    });
  }

  window.addEventListener("scroll", function () {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  });

  function stopSample() {
    samplePlaying = false;
    if (sampleTimer) {
      window.clearTimeout(sampleTimer);
      sampleTimer = null;
    }
    oscillators.forEach(function (node) {
      try {
        node.stop();
      } catch (err) {
        /* already stopped */
      }
    });
    oscillators = [];
    sampleLines.forEach(function (line) {
      line.classList.remove("is-live");
    });
    if (sampleButton) {
      sampleButton.textContent = "Play 20s demo";
      sampleButton.setAttribute("aria-pressed", "false");
    }
    if (sampleStatus) {
      sampleStatus.textContent = "Demo idle. Labeled sample, synthesized cadence.";
    }
  }

  function playLiltTone() {
    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    audioContext = audioContext || new AudioCtx();
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
    var now = audioContext.currentTime;
    var master = audioContext.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.05, now + 0.4);
    master.gain.exponentialRampToValueAtTime(0.08, now + 10);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 20);
    master.connect(audioContext.destination);

    function tone(freq, start, dur, type) {
      var osc = audioContext.createOscillator();
      var gain = audioContext.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + start);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.18, now + start + dur);
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.7, now + start + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.05);
      oscillators.push(osc);
    }

    tone(196, 0, 3.8, "sine");
    tone(247, 3.6, 3.4, "triangle");
    tone(294, 6.8, 4.2, "sine");
    tone(330, 10.6, 4.6, "triangle");
    tone(392, 14.8, 5.0, "sine");
  }

  function runSample() {
    if (samplePlaying) {
      stopSample();
      return;
    }
    if (!sampleLines.length) return;
    samplePlaying = true;
    if (sampleButton) {
      sampleButton.textContent = "Stop demo";
      sampleButton.setAttribute("aria-pressed", "true");
    }
    playLiltTone();
    var schedule = [];
    sampleLines.forEach(function (line) {
      schedule.push({
        el: line,
        at: Number(line.getAttribute("data-at") || 0),
      });
    });
    schedule.sort(function (a, b) {
      return a.at - b.at;
    });

    function tick(fromMs) {
      if (!samplePlaying) return;
      schedule.forEach(function (item) {
        if (fromMs >= item.at && fromMs < item.at + 3500) {
          item.el.classList.add("is-live");
        } else if (fromMs >= item.at + 3500) {
          item.el.classList.remove("is-live");
        }
      });
      var live = schedule.find(function (item) {
        return fromMs >= item.at && fromMs < item.at + 3500;
      });
      if (sampleStatus && live) {
        sampleStatus.textContent = live.el.textContent.trim();
      }
      if (fromMs >= 20000) {
        stopSample();
        if (sampleStatus) {
          sampleStatus.textContent = "Demo finished. Book a walkthrough to hear a rooftop-trained agent.";
        }
        return;
      }
      sampleTimer = window.setTimeout(function () {
        tick(fromMs + 200);
      }, 200);
    }

    tick(0);
  }

  if (sampleButton) {
    sampleButton.addEventListener("click", runSample);
  }

  if (form && success) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var required = form.querySelectorAll("[required]");
      var valid = true;
      required.forEach(function (field) {
        if (!field.value.trim()) {
          valid = false;
          field.classList.add("is-invalid");
        } else {
          field.classList.remove("is-invalid");
        }
      });
      if (!valid) {
        success.hidden = true;
        return;
      }
      form.hidden = true;
      success.hidden = false;
      success.focus();
    });
  }
})();
