/**
 * LUMOCASE - Arsip Forensik & Genetika Sejarah
 * Interactive Engine, Audio Synthesizer, & State Controller
 */

(function () {
  'use strict';

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const state = {
    detectiveName: 'Detektif Medis',
    currentScreen: 'screen-cover',
    currentStage: 1,
    audioEnabled: false,
    sfxEnabled: true,
    dialogueIndex: 0,
    isTyping: false,
    typewriterTimer: null,
    answers: { 1: null, 2: null, 3: null, 4: null, 5: null },
    finalVerdict: null,
    furthestStage: 1
  };

  // Load persisted state if exists
  try {
    const savedName = localStorage.getItem('lumocase_detective_name');
    if (savedName) state.detectiveName = savedName;

    const savedEvidence = localStorage.getItem('lumocase_evidence_board');
    if (savedEvidence) {
      const evidence = JSON.parse(savedEvidence);
      state.answers = Object.assign(state.answers, evidence.answers || {});
      state.finalVerdict = evidence.finalVerdict || null;
    } else {
      const savedNotes = localStorage.getItem('lumocase_notes');
      if (savedNotes) {
        const legacyNotes = JSON.parse(savedNotes);
        Object.keys(state.answers).forEach(stage => {
          if (legacyNotes[stage]) {
            state.answers[stage] = {
              question: '',
              answer: legacyNotes[stage],
              updatedAt: new Date().toISOString()
            };
          }
        });
      }
    }
  } catch (e) {
    console.error('Unable to load saved investigation:', e);
  }

  for (let stage = 1; stage <= 5; stage++) {
    const entry = state.answers[stage];
    if (entry && entry.answer && entry.answer.trim()) {
      state.furthestStage = Math.min(stage + 1, 6);
    } else {
      break;
    }
  }

  // ==========================================
  // AUDIO SYNTHESIZER (WEB AUDIO API)
  // Noir Ambient Jazz & Procedural Sound Effects
  // ==========================================
  let audioCtx = null;
  let bgmGainNode = null;
  let isBgmRunning = false;
  let bgmIntervalId = null;

  function initAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        bgmGainNode = audioCtx.createGain();
        bgmGainNode.gain.setValueAtTime(0.18, audioCtx.currentTime);
        bgmGainNode.connect(audioCtx.destination);
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Procedural Sound Effects (SFX)
  const soundFX = {
    click: function () {
      if (!state.sfxEnabled || !audioCtx) return;
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(420, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(140, audioCtx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.04);
      } catch (e) {}
    },

    typeKey: function () {
      if (!state.sfxEnabled || !audioCtx) return;
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800 + Math.random() * 400, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.03);
      } catch (e) {}
    },

    saveStamp: function () {
      if (!state.sfxEnabled || !audioCtx) return;
      try {
        // Deep thud
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } catch (e) {}
    },

    gavelBang: function () {
      if (!state.sfxEnabled || !audioCtx) return;
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(90, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);

        // Filter for wooden hollow resonance
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(240, audioCtx.currentTime);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } catch (e) {}
    },

    awardFanfare: function () {
      if (!state.sfxEnabled || !audioCtx) return;
      try {
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C E G C E G
        notes.forEach((freq, idx) => {
          setTimeout(() => {
            if (!audioCtx) return;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.6);
          }, idx * 120);
        });
      } catch (e) {}
    }
  };

  // Procedural Noir Jazz Ambient Music Generator
  // Generates warm moody 1920s detective minor chords (Dm9, Gm7, A7alt, Bbmaj7)
  const noirChords = [
    [146.83, 220.00, 261.63, 311.13, 349.23], // Dm9
    [196.00, 233.08, 293.66, 349.23],         // Gm7
    [110.00, 164.81, 220.00, 277.18, 329.63], // A7b9
    [116.54, 174.61, 233.08, 293.66, 349.23]  // Bbmaj7
  ];
  let chordIndex = 0;

  function playNoirChord() {
    if (!audioCtx || !state.audioEnabled || !isBgmRunning) return;
    try {
      const chord = noirChords[chordIndex % noirChords.length];
      chordIndex++;

      chord.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = i === 0 ? 'triangle' : 'sine'; // Deep bass on root
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

        const startTime = audioCtx.currentTime + (i * 0.05);
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.04, startTime + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 4.8);

        osc.connect(gain);
        gain.connect(bgmGainNode);
        osc.start(startTime);
        osc.stop(startTime + 5.0);
      });
    } catch (e) {}
  }

  function startBgm() {
    initAudioContext();
    if (!audioCtx) return;
    isBgmRunning = true;
    playNoirChord();
    if (bgmIntervalId) clearInterval(bgmIntervalId);
    bgmIntervalId = setInterval(() => {
      if (state.audioEnabled && isBgmRunning) {
        playNoirChord();
      }
    }, 4500);
  }

  function stopBgm() {
    isBgmRunning = false;
    if (bgmIntervalId) {
      clearInterval(bgmIntervalId);
      bgmIntervalId = null;
    }
  }

  // ==========================================
  // DIALOGUE SCRIPT (PROMPT REQUIREMENTS)
  // ==========================================
  const dialogues = [
    {
      text: "Halo, selamat datang di Lumocase!",
      tip: "Saya adalah rekan penyelidik Anda. Mari kita selidiki arsip bersejarah ini bersama!"
    },
    {
      text: "Kamu diajak untuk memecahkan kasus berikut!",
      tip: "Gunakan ketajaman analisis forensik dan hukum genetika pewarisan sifat."
    },
    {
      text: "Pada suatu malam yang dingin di tahun 1920, polisi Berlin menyelamatkan seorang wanita muda yang mencoba melompat dari jembatan ke Sungai Spree. Wanita tersebut tidak membawa identitas, trauma berat, dan menolak bicara. Ia kemudian dibawa ke Rumah Sakit Jiwa Dalldorf di Berlin.",
      tip: "Catat tahun 1920 dan lokasi penemuan di Sungai Spree Berlin."
    },
    {
      text: "Dua tahun kemudian, wanita yang menggunakan nama Anna Anderson tersebut membuat pengakuan mengejutkan kepada publik Jerman: ia mengklaim dirinya adalah Putri Anastasia, anak kandung Tsar Nicholas II dari Rusia yang dirumorkan berhasil selamat dari eksekusi mati tahun 1918. Jika klaimnya benar, ia berhak atas jutaan Rubel milik kekaisaran Rusia yang disimpan di bank-bank Eropa.",
      tip: "Klaim Putri Anastasia melibatkan hak waris kekayaan raksasa kekaisaran Rusia!"
    },
    {
      text: "Anda adalah Tim Detektif Medis Kepolisian Berlin yang ditugaskan oleh pengadilan Jerman untuk membuktikan kebenaran klaim ini menggunakan ilmu pewarisan sifat.",
      tip: "Sekarang, mari masuki ruang penyelidikan bukti-bukti forensik!"
    }
  ];

  // Helper hints per stage for floating mascot
  const stageHints = {
    1: "Bandingkan data darah kedua orang tua dengan hasil pemeriksaan Anna. Catat kemungkinan yang kamu lihat.",
    2: "Periksa silsilah dan catatan medis. Pertimbangkan juga informasi apa yang belum tersedia.",
    3: "Gunakan genotipe dan ciri fisik dalam arsip untuk menyusun dugaanmu sendiri.",
    4: "Bandingkan sekuens dengan teliti. Bukti garis maternal dapat membantu menguji hubungan keluarga.",
    5: "Amati catatan radiografi dan rumuskan petunjuk yang menurutmu paling relevan.",
    6: "Tinjau Evidence Board, lalu sampaikan keputusan dan alasanmu dengan Claim, Evidence, Reasoning."
  };

  // ==========================================
  // UI & NAVIGATION CONTROLLER
  // ==========================================
  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.add('hidden');
    }, 3200);
  }

  function switchScreen(screenId) {
    document.querySelectorAll('.screen-view').forEach(s => {
      s.classList.remove('active-screen');
    });
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active-screen');
      state.currentScreen = screenId;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    soundFX.click();
  }

  function updateDetectiveNameUI() {
    const name = state.detectiveName || 'Detektif Medis';
    const headerName = document.getElementById('header-user-name');
    const reviewName = document.getElementById('review-user-name');
    const certName = document.getElementById('cert-user-name');
    const inputName = document.getElementById('detective-name-input');

    if (headerName) headerName.textContent = name;
    if (reviewName) reviewName.textContent = name;
    if (certName) certName.textContent = name.toUpperCase();
    if (inputName) inputName.value = name;
  }

  // Cover Screen to Loading Sequence to Beranda
  function handleCoverStart() {
    initAudioContext();
    soundFX.click();
    const actionBox = document.getElementById('cover-actions');
    const loadingBox = document.getElementById('cover-loading-container');
    const bar = document.getElementById('loading-bar');
    const statusText = document.getElementById('loading-status-text');

    actionBox.classList.add('hidden');
    loadingBox.classList.remove('hidden');

    const steps = [
      { pct: '25%', text: 'Membuka lemari arsip Dalldorf 1920...' },
      { pct: '55%', text: 'Menyiapkan mikroskop dan spesimen darah...' },
      { pct: '85%', text: 'Mengumpulkan berkas silsilah dinasti Romanov...' },
      { pct: '100%', text: 'Penyelidikan Forensik Siap!' }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        bar.style.width = steps[currentStep].pct;
        statusText.textContent = steps[currentStep].text;
        soundFX.typeKey();
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          switchScreen('screen-beranda');
          showToast(`Selamat datang di Kriminalpolizei Berlin, ${state.detectiveName}!`);
        }, 500);
      }
    }, 550);
  }

  // Typewriter Dialogue Effect
  function showDialogue(index) {
    if (index < 0 || index >= dialogues.length) return;
    state.dialogueIndex = index;
    const data = dialogues[index];

    const dialogueText = document.getElementById('dialogue-text');
    const counter = document.getElementById('dialogue-counter');
    const btnPrev = document.getElementById('btn-dialogue-prev');
    const btnNext = document.getElementById('btn-dialogue-next');
    const btnStartStages = document.getElementById('btn-start-stages');

    counter.textContent = `Langkah ${index + 1} dari ${dialogues.length}`;

    btnPrev.disabled = (index === 0);
    btnPrev.classList.toggle('disabled', index === 0);

    if (index === dialogues.length - 1) {
      btnNext.classList.add('hidden');
      btnStartStages.classList.remove('hidden');
    } else {
      btnNext.classList.remove('hidden');
      btnStartStages.classList.add('hidden');
    }

    // Typewriter effect
    if (state.typewriterTimer) clearInterval(state.typewriterTimer);
    dialogueText.textContent = '';
    state.isTyping = true;
    let charIndex = 0;
    const fullText = data.text;

    state.typewriterTimer = setInterval(() => {
      if (charIndex < fullText.length) {
        dialogueText.textContent += fullText.charAt(charIndex);
        if (charIndex % 3 === 0) soundFX.typeKey();
        charIndex++;
      } else {
        clearInterval(state.typewriterTimer);
        state.isTyping = false;
      }
    }, 22);

    // Update floating helper preview
    updateFloatingHelperTip(data.tip);
  }

  function completeTypingInstantly() {
    if (state.isTyping && state.typewriterTimer) {
      clearInterval(state.typewriterTimer);
      state.isTyping = false;
      const dialogueText = document.getElementById('dialogue-text');
      dialogueText.textContent = dialogues[state.dialogueIndex].text;
    }
  }

  // Stage Switcher
  function goToStage(stageNum) {
    const num = parseInt(stageNum, 10);
    if (isNaN(num) || num < 1 || num > 6) return;
    if (num > state.furthestStage) {
      showToast('Selesaikan catatan tahap sebelumnya terlebih dahulu.');
      return;
    }

    state.currentStage = num;

    // Update tab bar
    document.querySelectorAll('.stage-nav-btn').forEach(btn => {
      const btnStage = parseInt(btn.getAttribute('data-stage'), 10);
      btn.classList.toggle('active', btnStage === num);
    });

    // Update panels
    for (let i = 1; i <= 6; i++) {
      const panel = document.getElementById(`stage-panel-${i}`);
      if (panel) {
        panel.classList.toggle('hidden', i !== num);
        panel.classList.toggle('active', i === num);
      }
    }

    renderEvidenceBoard();

    // Update helper hint
    if (stageHints[num]) {
      updateFloatingHelperTip(stageHints[num]);
    }

    const statStage = document.getElementById('stat-stage');
    if (statStage) statStage.textContent = `Tahap ${num}`;

    soundFX.click();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function persistEvidenceBoard() {
    try {
      localStorage.setItem('lumocase_evidence_board', JSON.stringify({
        answers: state.answers,
        finalVerdict: state.finalVerdict
      }));
      return true;
    } catch (e) {
      console.error('Unable to save the evidence board:', e);
      return false;
    }
  }

  function saveStageAnswer(stageNum, notify) {
    const textarea = document.getElementById(`input-stage-${stageNum}`);
    const prompt = document.querySelector(`label[for="input-stage-${stageNum}"]`);
    if (!textarea || !prompt) return false;

    const answer = textarea.value.trim();
    const status = document.getElementById(`status-stage-${stageNum}`);
    if (notify && !answer) {
      textarea.focus();
      showToast('Tuliskan jawaban singkat sebelum melanjutkan.');
      return false;
    }

    state.answers[stageNum] = {
      question: prompt.textContent.trim(),
      answer: textarea.value,
      updatedAt: new Date().toISOString()
    };

    if (!persistEvidenceBoard()) {
      if (status) status.textContent = 'Gagal menyimpan. Periksa penyimpanan browser.';
      return false;
    }

    if (status) status.textContent = answer ? 'Petunjuk berhasil dicatat.' : 'Jawaban belum ditulis.';
    renderEvidenceBoard();
    if (notify) {
      state.furthestStage = Math.max(state.furthestStage, stageNum + 1);
      soundFX.saveStamp();
      showToast('Hasil pengamatan telah ditambahkan ke Evidence Board.');
    }
    return true;
  }

  function appendEvidenceText(parent, tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    element.textContent = text;
    parent.appendChild(element);
    return element;
  }

  function renderEvidenceBoard() {
    const board = document.getElementById('evidence-board-entries');
    if (!board) return;
    board.textContent = '';

    const stageTitles = [
      'Tahap 1 — Spesimen Darah',
      'Tahap 2 — Penyakit Kerajaan',
      'Tahap 3 — Identitas dan Sifat Fisik',
      'Tahap 4 — DNA Mitokondria',
      'Tahap 5 — Forensik Dental',
      'Tahap 6 — Keputusan Akhir'
    ];

    stageTitles.forEach((title, index) => {
      const stage = index + 1;
      const card = document.createElement('article');
      card.className = 'review-note-item evidence-pin-card';
      card.dataset.stage = String(stage);
      const pin = document.createElement('span');
      pin.className = 'evidence-pin';
      pin.setAttribute('aria-hidden', 'true');
      card.appendChild(pin);
      appendEvidenceText(card, 'span', 'rn-label', title);

      if (stage < 6) {
        const prompt = document.querySelector(`label[for="input-stage-${stage}"]`);
        const entry = state.answers[stage];
        appendEvidenceText(card, 'p', 'rn-question', entry && entry.question
          ? entry.question
          : (prompt ? prompt.textContent.trim() : 'Pertanyaan investigasi'));
        appendEvidenceText(card, 'p', 'rn-content', entry && entry.answer && entry.answer.trim()
          ? entry.answer.trim()
          : 'Belum ada jawaban yang dicatat.');
      } else {
        const finalQuestion = document.querySelector('.final-verdict-heading h3');
        appendEvidenceText(card, 'p', 'rn-question', finalQuestion ? finalQuestion.textContent.trim() : '');
        if (state.finalVerdict) {
          appendEvidenceText(card, 'p', 'rn-content', `Claim: ${state.finalVerdict.claimText}\nEvidence: ${state.finalVerdict.evidence}\nReasoning: ${state.finalVerdict.reasoning}`);
        } else {
          appendEvidenceText(card, 'p', 'rn-content', 'Belum ada keputusan akhir.');
        }
      }

      board.appendChild(card);
    });
  }

  function evaluateFinalVerdict(claim, evidence, reasoning) {
    const normalizedEvidence = evidence.toLocaleLowerCase('id');
    const normalizedReasoning = reasoning.toLocaleLowerCase('id');
    const relevantEvidence = /(golongan darah|abo|hemofilia|dihibrid|genotipe|dna|mtdna|mitokond|maternal|schanzkowska|romanov|alexandra|geraham|rontgen|dental)/i.test(normalizedEvidence);
    const strongEvidence = /(mtdna|mitokond|dna)/i.test(normalizedEvidence)
      && /(schanzkowska|romanov|alexandra|sekuens|urutan)/i.test(normalizedEvidence);
    const reasoningMechanism = /(maternal|garis ibu|diwariskan|pewarisan|keturunan|genetik|sekuens|urutan|alel|genotipe|persilangan|mtdna|mitokond)/i.test(normalizedReasoning);
    const reasoningConnection = /(karena|sebab|sehingga|maka|menunjukkan|berarti|tidak cocok|tidak sesuai|berbeda|identik|cocok|sama|bukan|membandingkan|mendukung)/i.test(normalizedReasoning);
    const claimCorrect = claim === 'not-anastasia';

    return {
      claimCorrect,
      relevantEvidence,
      strongEvidence,
      reasoningAccurate: reasoningMechanism && reasoningConnection,
      claimText: claim === 'anastasia'
        ? 'Anna Anderson benar merupakan Anastasia Romanov.'
        : 'Anna Anderson bukan Anastasia Romanov.'
    };
  }

  function presentFinalEvaluation(evaluation) {
    const feedback = document.getElementById('final-verdict-feedback');
    const form = document.getElementById('final-verdict-form');
    const ceremony = document.getElementById('final-court-ceremony');
    const ceremonyAction = document.getElementById('court-gavel-action');
    const gavelBox = document.getElementById('gavel-knock-box');
    const gavelIcon = document.getElementById('gavel-icon');
    const decree = document.getElementById('judge-decree');
    const award = document.getElementById('btn-claim-award');
    if (!feedback || !form) return;

    document.getElementById('final-feedback-title').textContent = evaluation.claimCorrect
      ? 'Keputusanmu tepat.'
      : 'Keputusanmu belum sesuai dengan bukti.';
    document.getElementById('final-feedback-claim').textContent = evaluation.claimCorrect
      ? 'Anna Anderson bukan Anastasia Romanov.'
      : 'Bukti yang tersedia mendukung bahwa Anna Anderson bukan Anastasia Romanov.';
    document.getElementById('final-feedback-evidence').textContent = evaluation.relevantEvidence
      ? (evaluation.strongEvidence
        ? 'Kamu menggunakan perbandingan DNA sebagai bukti utama. Pada Tahap 4, sekuens Anna sesuai dengan sampel keluarga Schanzkowska dan berbeda dari garis maternal Romanov.'
        : 'Bukti yang kamu sebutkan berkaitan dengan penyelidikan. Perkuat argumen dengan membandingkan sekuens mtDNA Anna, keluarga Schanzkowska, dan garis Romanov di Tahap 4.')
      : 'Alasanmu belum menunjuk bukti spesifik. Gunakan catatan tahap, terutama perbandingan mtDNA di Tahap 4, dan jelaskan sumber petunjuknya.';
    document.getElementById('final-feedback-reasoning').textContent = evaluation.reasoningAccurate
      ? 'Kamu menghubungkan bukti dengan prinsip pewarisan. mtDNA diwariskan melalui garis ibu, sehingga perbedaan sekuens menunjukkan bahwa garis maternal Anna tidak sesuai dengan Romanov.'
      : 'Jelaskan hubungan ilmiahnya dengan lebih jelas: mtDNA diwariskan melalui garis ibu; bandingkan sampel Anna dengan keluarga Schanzkowska dan garis maternal Romanov.';

    feedback.classList.remove('hidden');
    form.querySelectorAll('input, textarea, button').forEach(control => {
      control.disabled = true;
    });
    if (ceremony) ceremony.classList.remove('hidden');
    if (state.finalVerdict && state.finalVerdict.ceremonyComplete) {
      if (ceremonyAction) ceremonyAction.classList.add('hidden');
      if (gavelBox) gavelBox.classList.remove('hidden');
      if (gavelIcon) gavelIcon.classList.add('gavel-striking');
      if (decree) decree.classList.add('visible');
      if (award) award.classList.remove('hidden');
      document.querySelectorAll('.knock-word').forEach(word => word.classList.add('visible'));
    } else {
      if (ceremonyAction) ceremonyAction.classList.remove('hidden');
      if (gavelBox) gavelBox.classList.add('hidden');
      if (award) award.classList.add('hidden');
    }
    renderEvidenceBoard();
  }

  function handleAnnounceFinalVerdict() {
    if (!state.finalVerdict || state.finalVerdict.ceremonyComplete) return;

    soundFX.click();
    const action = document.getElementById('court-gavel-action');
    const gavelBox = document.getElementById('gavel-knock-box');
    const gavelIcon = document.getElementById('gavel-icon');
    const gavelWords = document.getElementById('gavel-words');
    const decree = document.getElementById('judge-decree');
    const award = document.getElementById('btn-claim-award');

    if (action) action.classList.add('hidden');
    if (gavelBox) gavelBox.classList.remove('hidden');
    if (gavelIcon) gavelIcon.classList.add('gavel-striking');

    const knocks = gavelWords ? gavelWords.querySelectorAll('.knock-word') : [];
    knocks.forEach((word, index) => {
      setTimeout(() => {
        word.classList.add('visible');
        soundFX.gavelBang();
      }, (index + 1) * 550);
    });

    setTimeout(() => {
      if (decree) decree.classList.add('visible');
      if (award) award.classList.remove('hidden');
      state.finalVerdict.ceremonyComplete = true;
      if (!persistEvidenceBoard()) {
        showToast('Putusan dibacakan, tetapi status upacara gagal disimpan.');
        return;
      }
      showToast('⚖️ Putusan akhir telah dibacakan.');
    }, 2400);
  }

  // Floating helper bubble controller
  function updateFloatingHelperTip(tipText) {
    const bubble = document.getElementById('helper-bubble');
    const bubbleText = document.getElementById('helper-bubble-text');
    if (bubbleText) bubbleText.textContent = tipText;
    if (bubble) bubble.classList.remove('hidden');
  }

  // Claim Award & Show Certificate
  function handleClaimAward() {
    if (!state.finalVerdict || !state.finalVerdict.ceremonyComplete) return;
    soundFX.awardFanfare();
    const certWrap = document.getElementById('award-certificate-container');
    if (certWrap) {
      certWrap.classList.remove('hidden');
      certWrap.scrollIntoView({ behavior: 'smooth' });
    }
    showToast('🏆 Selamat! Anda meraih gelar MASTER OF DETECTIVE!');
  }

  // ==========================================
  // EVENT LISTENERS INITIALIZATION
  // ==========================================
  function initEvents() {
    // Audio toggles
    const btnMusic = document.getElementById('btn-toggle-music');
    const musicIcon = document.getElementById('music-icon');
    const musicLabel = document.getElementById('music-label');
    const audioWave = document.getElementById('audio-wave');

    if (btnMusic) {
      btnMusic.addEventListener('click', () => {
        initAudioContext();
        state.audioEnabled = !state.audioEnabled;
        btnMusic.classList.toggle('active', state.audioEnabled);
        if (state.audioEnabled) {
          startBgm();
          musicLabel.textContent = 'Musik: HIDUP';
          musicIcon.textContent = '🎶';
          audioWave.classList.remove('hidden');
          showToast('🎵 Musik latar jazz noir 1920 aktif');
        } else {
          stopBgm();
          musicLabel.textContent = 'Musik: MATI';
          musicIcon.textContent = '🎵';
          audioWave.classList.add('hidden');
          showToast('Musik latar dinonaktifkan');
        }
      });
    }

    const btnSfx = document.getElementById('btn-toggle-sfx');
    const sfxLabel = document.getElementById('sfx-label');
    if (btnSfx) {
      btnSfx.addEventListener('click', () => {
        initAudioContext();
        state.sfxEnabled = !state.sfxEnabled;
        btnSfx.classList.toggle('active', state.sfxEnabled);
        sfxLabel.textContent = state.sfxEnabled ? 'SFX: AKTIF' : 'SFX: MATI';
        showToast(state.sfxEnabled ? '🔊 Efek suara aktif' : 'Efek suara dimatikan');
        soundFX.click();
      });
    }

    // Cover Start Button
    const btnStart = document.getElementById('btn-start-investigation');
    if (btnStart) {
      btnStart.addEventListener('click', handleCoverStart);
    }

    // Profile Save Button
    const btnSaveProfile = document.getElementById('btn-save-profile');
    const inputName = document.getElementById('detective-name-input');
    if (btnSaveProfile && inputName) {
      btnSaveProfile.addEventListener('click', () => {
        const val = inputName.value.trim();
        if (val) {
          state.detectiveName = val;
          try {
            localStorage.setItem('lumocase_detective_name', val);
          } catch (e) {}
          updateDetectiveNameUI();
          soundFX.saveStamp();
          showToast(`Lencana diperbarui: ${val}`);
        }
      });
    }

    // Play button in Dashboard & Open Case 1
    const btnPlayNow = document.getElementById('btn-play-now');
    const btnOpenCase1 = document.getElementById('btn-open-case-1');
    const startCaseFlow = () => {
      initAudioContext();
      soundFX.click();
      switchScreen('screen-briefing');
      showDialogue(0);
    };

    if (btnPlayNow) btnPlayNow.addEventListener('click', startCaseFlow);
    if (btnOpenCase1) btnOpenCase1.addEventListener('click', startCaseFlow);

    // Locked Case 2 Click
    const btnLockedCase = document.getElementById('btn-locked-case-2');
    const cardCase2 = document.getElementById('card-case-2');
    const lockedModal = document.getElementById('locked-case-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');

    const triggerLockedModal = () => {
      soundFX.click();
      if (lockedModal) lockedModal.classList.remove('hidden');
    };

    if (btnLockedCase) btnLockedCase.addEventListener('click', triggerLockedModal);
    if (cardCase2) cardCase2.addEventListener('click', triggerLockedModal);
    if (btnCloseModal) {
      btnCloseModal.addEventListener('click', () => {
        soundFX.click();
        if (lockedModal) lockedModal.classList.add('hidden');
      });
    }

    // Back to Beranda Button
    const btnBackBeranda = document.getElementById('btn-back-to-beranda');
    if (btnBackBeranda) {
      btnBackBeranda.addEventListener('click', () => {
        switchScreen('screen-beranda');
      });
    }

    // Dialogue Navigation
    const btnDiagNext = document.getElementById('btn-dialogue-next');
    const btnDiagPrev = document.getElementById('btn-dialogue-prev');
    const btnDiagSkip = document.getElementById('btn-dialogue-skip');
    const btnStartStages = document.getElementById('btn-start-stages');

    if (btnDiagNext) {
      btnDiagNext.addEventListener('click', () => {
        if (state.isTyping) {
          completeTypingInstantly();
        } else {
          showDialogue(state.dialogueIndex + 1);
        }
      });
    }

    if (btnDiagPrev) {
      btnDiagPrev.addEventListener('click', () => {
        showDialogue(state.dialogueIndex - 1);
      });
    }

    if (btnDiagSkip) {
      btnDiagSkip.addEventListener('click', () => {
        soundFX.click();
        switchScreen('screen-investigation');
        goToStage(1);
      });
    }

    if (btnStartStages) {
      btnStartStages.addEventListener('click', () => {
        soundFX.click();
        switchScreen('screen-investigation');
        goToStage(1);
      });
    }

    // Stage Tab Navigation
    document.querySelectorAll('.stage-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const stageNum = btn.getAttribute('data-stage');
        goToStage(stageNum);
      });
    });

    const boardPanel = document.getElementById('evidence-board-panel');
    const boardToggle = document.getElementById('btn-toggle-evidence-board');
    const setEvidenceBoardOpen = isOpen => {
      if (!boardPanel || !boardToggle) return;
      boardPanel.classList.toggle('hidden', !isOpen);
      boardToggle.setAttribute('aria-expanded', String(isOpen));
      document.body.classList.toggle('evidence-board-open', isOpen);
      if (isOpen) {
        renderEvidenceBoard();
        boardPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    if (boardToggle) {
      boardToggle.addEventListener('click', () => {
        setEvidenceBoardOpen(boardPanel.classList.contains('hidden'));
      });
    }

    const closeBoard = document.getElementById('btn-close-evidence-board');
    if (closeBoard) closeBoard.addEventListener('click', () => setEvidenceBoardOpen(false));

    const openBoardFromCourt = document.getElementById('btn-open-evidence-from-court');
    if (openBoardFromCourt) openBoardFromCourt.addEventListener('click', () => setEvidenceBoardOpen(true));

    // Save each stage answer without evaluating it.
    for (let i = 1; i <= 5; i++) {
      const btnSave = document.getElementById(`btn-save-stage-${i}`);
      if (btnSave) {
        btnSave.addEventListener('click', () => {
          if (!saveStageAnswer(i, true)) return;
          const nextStage = btnSave.getAttribute('data-next-stage');
          if (nextStage) {
            goToStage(nextStage);
          }
        });
      }

      const textarea = document.getElementById(`input-stage-${i}`);
      if (textarea) {
        const entry = state.answers[i];
        if (entry && entry.answer) textarea.value = entry.answer;
        if (entry && entry.answer && entry.answer.trim()) {
          const status = document.getElementById(`status-stage-${i}`);
          if (status) status.textContent = 'Petunjuk berhasil dicatat.';
        }
        textarea.addEventListener('input', () => saveStageAnswer(i, false));
      }
    }

    const finalForm = document.getElementById('final-verdict-form');
    if (finalForm) {
      finalForm.addEventListener('submit', event => {
        event.preventDefault();
        if (!finalForm.reportValidity()) return;

        const claimInput = finalForm.querySelector('input[name="final-claim"]:checked');
        if (!claimInput) {
          showToast('Pilih salah satu keputusan sebelum mengirim.');
          return;
        }

        const answer = {
          claim: claimInput.value,
          evidence: document.getElementById('final-evidence').value.trim(),
          reasoning: document.getElementById('final-reasoning').value.trim()
        };
        const evaluation = evaluateFinalVerdict(answer.claim, answer.evidence, answer.reasoning);
        state.finalVerdict = Object.assign({}, answer, {
          claimText: evaluation.claimText,
          evaluation: evaluation,
          ceremonyComplete: false
        });

        if (!persistEvidenceBoard()) {
          state.finalVerdict = null;
          showToast('Keputusan belum tersimpan. Periksa penyimpanan browser lalu coba lagi.');
          return;
        }

        presentFinalEvaluation(evaluation);
        showToast(evaluation.claimCorrect
          ? 'Keputusan akhir telah dinilai.'
          : 'Putusan telah dikirim dan dievaluasi berdasarkan bukti.');
      });
    }

    const btnAnnounceVerdict = document.getElementById('btn-announce-final-verdict');
    if (btnAnnounceVerdict) {
      btnAnnounceVerdict.addEventListener('click', handleAnnounceFinalVerdict);
    }

    // Claim Award Button
    const btnAward = document.getElementById('btn-claim-award');
    if (btnAward) {
      btnAward.addEventListener('click', handleClaimAward);
    }

    // Certificate Print & Restart
    const btnPrint = document.getElementById('btn-print-certificate');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => {
        window.print();
      });
    }

    const btnRestart = document.getElementById('btn-restart-investigation');
    if (btnRestart) {
      btnRestart.addEventListener('click', () => {
        soundFX.click();
        switchScreen('screen-beranda');
      });
    }

    const btnReviewCase = document.getElementById('btn-review-case');
    if (btnReviewCase) {
      btnReviewCase.addEventListener('click', () => {
        soundFX.click();
        goToStage(1);
      });
    }

    // Floating helper widget
    const btnHelperMascot = document.getElementById('btn-helper-mascot');
    const helperBubble = document.getElementById('helper-bubble');
    const btnCloseHelper = document.getElementById('btn-close-helper');

    if (btnHelperMascot && helperBubble) {
      btnHelperMascot.addEventListener('click', () => {
        soundFX.click();
        helperBubble.classList.toggle('hidden');
      });
    }

    if (btnCloseHelper && helperBubble) {
      btnCloseHelper.addEventListener('click', () => {
        helperBubble.classList.add('hidden');
      });
    }

    // Initial UI Setup
    updateDetectiveNameUI();
    renderEvidenceBoard();
    if (state.finalVerdict && state.finalVerdict.evaluation) {
      const savedVerdict = state.finalVerdict;
      const claimInput = document.querySelector(`input[name="final-claim"][value="${savedVerdict.claim}"]`);
      if (claimInput) claimInput.checked = true;
      document.getElementById('final-evidence').value = savedVerdict.evidence || '';
      document.getElementById('final-reasoning').value = savedVerdict.reasoning || '';
      presentFinalEvaluation(savedVerdict.evaluation);
    }
  }

  // DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEvents);
  } else {
    initEvents();
  }

})();
